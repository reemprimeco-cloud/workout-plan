/**
 * Health Router — Medical-aware fitness coaching
 * Procedures:
 *   uploadHealthReport   — store file in S3, save metadata to DB
 *   analyzeHealthReport  — LLM analysis of uploaded report/image
 *   getPersonalizedPlan  — fetch active personalized program for user
 *   generateProgram      — create personalized workout program from analysis
 *   getMyReports         — list user's uploaded health reports
 *   deleteReport         — delete a report
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM, type Message } from "../_core/llm";
import { storagePut } from "../storage";
import { getDb } from "../db";
import {
  healthReports,
  aiHealthAnalysis,
  personalizedPrograms,
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeJson(val: string | null | undefined): any[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

// ── Router ────────────────────────────────────────────────────────────────────
export const healthRouter = router({

  // Upload a health report file (image or PDF as base64)
  uploadReport: protectedProcedure
    .input(z.object({
      fileBase64: z.string(),
      mimeType:   z.string(),
      fileName:   z.string(),
      reportType: z.enum(["blood_test", "xray", "injury", "progress_photo", "body_scan", "other"]).default("other"),
      notes:      z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const buffer = Buffer.from(input.fileBase64, "base64");
      const ext    = input.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
      const key    = `health-reports/${userId}/${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      const drizzle = await getDb();
      if (!drizzle) throw new Error("DB unavailable");
      const [result] = await drizzle.insert(healthReports).values({
        userId,
        fileUrl:    url,
        fileKey:    key,
        fileName:   input.fileName,
        fileType:   input.mimeType,
        reportType: input.reportType,
        notes:      input.notes ?? null,
      });

      return { id: (result as any).insertId as number, fileUrl: url, key };
    }),

  // Analyze a health report using LLM vision (image) or text (PDF summary)
  analyzeReport: protectedProcedure
    .input(z.object({
      reportId:    z.number().optional(),
      fileBase64:  z.string().optional(),
      mimeType:    z.string().optional(),
      textContent: z.string().optional(),
      lang:        z.enum(["ar", "en"]).default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Build LLM messages
      const systemPrompt = `You are a medical-aware fitness coach AI assistant for Prime Fit.
Your role is to analyze health documents, medical reports, blood tests, X-rays, injury reports, and progress photos.
IMPORTANT SAFETY RULES:
- You do NOT provide medical diagnoses
- You do NOT replace professional medical advice
- Always recommend consulting a healthcare professional
- Focus only on fitness-related implications
- Be conservative and safe in your recommendations

Respond in JSON with this exact schema:
{
  "summaryEn": "Brief English summary of what was found (fitness-relevant only)",
  "summaryAr": "ملخص بالعربية",
  "conditionsFound": ["list of fitness-relevant conditions/findings"],
  "restrictions": ["exercises or movements to avoid"],
  "safeExercises": ["safe exercise types recommended"],
  "warningExercises": ["exercises that need caution or modification"],
  "recoveryTips": ["recovery and wellness tips"],
  "programTitle": "Short program name in English",
  "programTitleAr": "اسم البرنامج بالعربية",
  "weeklyPlan": {
    "monday": "description",
    "tuesday": "description",
    "wednesday": "description",
    "thursday": "description",
    "friday": "description",
    "saturday": "description",
    "sunday": "description"
  },
  "cardioGuidance": "Cardio intensity and type recommendations",
  "stretchingPlan": "Stretching routine recommendations"
}`;

       const userMsg: Message = input.fileBase64 && input.mimeType?.startsWith("image/")
        ? {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${input.fileBase64}`, detail: "high" as const } },
              { type: "text", text: `Please analyze this health document/image and provide fitness-relevant guidance. Language preference: ${input.lang}. Remember: do not diagnose, only provide fitness guidance.` },
            ],
          }
        : {
            role: "user",
            content: `Please analyze this health information and provide fitness-relevant guidance:\n\n${input.textContent ?? "No content provided"}\n\nLanguage preference: ${input.lang}. Remember: do not diagnose, only provide fitness guidance.`,
          };
      const llmRes = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          userMsg,
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "health_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summaryEn:        { type: "string" },
                summaryAr:        { type: "string" },
                conditionsFound:  { type: "array", items: { type: "string" } },
                restrictions:     { type: "array", items: { type: "string" } },
                safeExercises:    { type: "array", items: { type: "string" } },
                warningExercises: { type: "array", items: { type: "string" } },
                recoveryTips:     { type: "array", items: { type: "string" } },
                programTitle:     { type: "string" },
                programTitleAr:   { type: "string" },
                weeklyPlan: {
                  type: "object",
                  properties: {
                    monday: { type: "string" }, tuesday: { type: "string" },
                    wednesday: { type: "string" }, thursday: { type: "string" },
                    friday: { type: "string" }, saturday: { type: "string" },
                    sunday: { type: "string" },
                  },
                  required: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
                  additionalProperties: false,
                },
                cardioGuidance: { type: "string" },
                stretchingPlan: { type: "string" },
              },
              required: ["summaryEn","summaryAr","conditionsFound","restrictions","safeExercises","warningExercises","recoveryTips","programTitle","programTitleAr","weeklyPlan","cardioGuidance","stretchingPlan"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = llmRes.choices?.[0]?.message?.content ?? "{}";
      const raw = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      let analysis: any;
      try { analysis = JSON.parse(raw); } catch { analysis = {}; }

      // Save analysis to DB
      const drizzle = await getDb();
      if (!drizzle) throw new Error("DB unavailable");
      const [analysisResult] = await drizzle.insert(aiHealthAnalysis).values({
        userId,
        reportId:         input.reportId ?? null,
        summaryEn:        analysis.summaryEn ?? "Analysis complete.",
        summaryAr:        analysis.summaryAr ?? "تم التحليل.",
        conditionsFound:  JSON.stringify(analysis.conditionsFound ?? []),
        restrictions:     JSON.stringify(analysis.restrictions ?? []),
        safeExercises:    JSON.stringify(analysis.safeExercises ?? []),
        warningExercises: JSON.stringify(analysis.warningExercises ?? []),
        recoveryTips:     JSON.stringify(analysis.recoveryTips ?? []),
      });
      const analysisId = (analysisResult as any).insertId as number;

      // Auto-generate personalized program
      const weeklyPlan = analysis.weeklyPlan ?? {};
      await drizzle.insert(personalizedPrograms).values({
        userId,
        analysisId,
        titleEn:       analysis.programTitle     ?? "Personalized Health Plan",
        titleAr:       analysis.programTitleAr   ?? "برنامج صحي مخصص",
        descriptionEn: analysis.summaryEn        ?? "",
        descriptionAr: analysis.summaryAr        ?? "",
        weeklyPlan:    JSON.stringify(weeklyPlan),
        cardioGuidance:analysis.cardioGuidance   ?? null,
        stretchingPlan:analysis.stretchingPlan   ?? null,
        isActive:      true,
      });

      return {
        analysisId,
        summaryEn:        analysis.summaryEn        ?? "",
        summaryAr:        analysis.summaryAr        ?? "",
        conditionsFound:  analysis.conditionsFound  ?? [],
        restrictions:     analysis.restrictions     ?? [],
        safeExercises:    analysis.safeExercises     ?? [],
        warningExercises: analysis.warningExercises  ?? [],
        recoveryTips:     analysis.recoveryTips      ?? [],
        programTitle:     analysis.programTitle      ?? "Personalized Health Plan",
        programTitleAr:   analysis.programTitleAr    ?? "برنامج صحي مخصص",
        weeklyPlan,
        cardioGuidance:   analysis.cardioGuidance    ?? "",
        stretchingPlan:   analysis.stretchingPlan    ?? "",
      };
    }),

  // Get the user's active personalized program
  getPersonalizedPlan: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new Error("DB unavailable");
      const rows = await drizzle
        .select()
        .from(personalizedPrograms)
        .where(and(eq(personalizedPrograms.userId, ctx.user.id), eq(personalizedPrograms.isActive, true)))
        .orderBy(desc(personalizedPrograms.createdAt))
        .limit(1);
      if (!rows.length) return null;
      const p = rows[0];
      return {
        ...p,
        weeklyPlan: safeJson(p.weeklyPlan),
      };
    }),

  // List all health reports for user
  getMyReports: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new Error("DB unavailable");
      return drizzle
        .select()
        .from(healthReports)
        .where(eq(healthReports.userId, ctx.user.id))
        .orderBy(desc(healthReports.createdAt))
        .limit(20);
    }),

  // Get latest AI health analysis
  getLatestAnalysis: protectedProcedure
    .query(async ({ ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new Error("DB unavailable");
      const rows = await drizzle
        .select()
        .from(aiHealthAnalysis)
        .where(eq(aiHealthAnalysis.userId, ctx.user.id))
        .orderBy(desc(aiHealthAnalysis.createdAt))
        .limit(1);
      if (!rows.length) return null;
      const a = rows[0];
      return {
        ...a,
        conditionsFound:  safeJson(a.conditionsFound),
        restrictions:     safeJson(a.restrictions),
        safeExercises:    safeJson(a.safeExercises),
        warningExercises: safeJson(a.warningExercises),
        recoveryTips:     safeJson(a.recoveryTips),
      };
    }),

  // Delete a health report
  deleteReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new Error("DB unavailable");
      await drizzle.delete(healthReports).where(
        and(eq(healthReports.id, input.reportId), eq(healthReports.userId, ctx.user.id))
      );
      return { ok: true };
    }),
});
