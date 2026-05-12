/**
 * My Coach — AI Personal Trainer tRPC Router
 *
 * Procedures:
 *  - chat            : send a message, get AI response (uses LLM with full user context)
 *  - getHistory      : fetch recent chat messages
 *  - clearHistory    : wipe chat history for the user
 *  - checkin         : submit daily check-in (feeling/energy/sleep) + get AI response
 *  - getTodayCheckin : fetch today's check-in if it exists
 *  - generateInsights: ask the AI to analyse user data and store fresh insights
 *  - getInsights     : fetch stored insights
 *  - getMemory       : fetch coach memory for the user
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  getTodayCheckin,
  saveCheckin,
  getRecentCheckins,
  getInsights,
  saveInsight,
  getCoachMemory,
  upsertCoachMemory,
} from "../db";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a rich system prompt that injects the user's fitness context */
function buildSystemPrompt(
  lang: "ar" | "en",
  context: {
    name?: string;
    currentWeight?: number;
    targetWeight?: number;
    streak?: number;
    weeklyCompletion?: number;
    recentCheckins?: { feeling: number; energy: number; sleep: number; date: string }[];
    recentInsights?: string[];
  }
): string {
  const isAr = lang === "ar";

  const contextBlock = `
User profile:
- Name: ${context.name ?? "Unknown"}
- Current weight: ${context.currentWeight ?? "?"} kg
- Target weight: ${context.targetWeight ?? "?"} kg
- Current streak: ${context.streak ?? 0} days
- Weekly workout completion: ${context.weeklyCompletion ?? 0}%
- Recent check-ins (last 7 days): ${JSON.stringify(context.recentCheckins ?? [])}
- Recent AI insights: ${(context.recentInsights ?? []).join(" | ")}
`.trim();

  if (isAr) {
    return `أنت مدرب لياقة بدنية محترف داخل تطبيق Prime Fit.
مهمتك تحليل تقدم المستخدم وتقديم إرشادات تدريبية شخصية ومحفزة.
كن موجزاً، داعماً، ذكياً، وعملياً في ردودك.
استند دائماً إلى بيانات المستخدم الفعلية في نصائحك.
أجب دائماً باللغة العربية.

${contextBlock}`;
  }

  return `You are an elite fitness coach inside the Prime Fit app.
Your job is to analyse user progress and provide personalised, motivating fitness coaching.
Be concise, supportive, intelligent, and practical.
Always base your advice on the user's actual data.
Always respond in English.

${contextBlock}`;
}

/** Map a numeric rating (1-5) to an emoji */
function ratingEmoji(n: number) {
  return ["😞", "😕", "😐", "😊", "🤩"][Math.min(4, Math.max(0, n - 1))];
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const coachRouter = router({
  /** Send a user message and receive an AI coaching response */
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        lang: z.enum(["ar", "en"]).default("ar"),
        // Lightweight fitness context passed from the client (localStorage data)
        context: z.object({
          name: z.string().optional(),
          currentWeight: z.number().optional(),
          targetWeight: z.number().optional(),
          streak: z.number().optional(),
          weeklyCompletion: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Fetch stored context
      const [history, checkins, insights, memory] = await Promise.all([
        getChatHistory(userId, 20),
        getRecentCheckins(userId, 7),
        getInsights(userId, 5),
        getCoachMemory(userId),
      ]);

      const recentCheckins = checkins.map(c => ({
        date: c.date,
        feeling: c.feeling,
        energy: c.energy,
        sleep: c.sleep,
      }));

      const recentInsights = insights.map(i => i.content);

      const systemPrompt = buildSystemPrompt(input.lang, {
        name: input.context?.name ?? (memory?.notes ? JSON.parse(memory.notes).name : undefined),
        currentWeight: input.context?.currentWeight ?? memory?.currentWeight ?? undefined,
        targetWeight: input.context?.targetWeight ?? memory?.goalWeight ?? undefined,
        streak: input.context?.streak,
        weeklyCompletion: input.context?.weeklyCompletion,
        recentCheckins,
        recentInsights,
      });

      // Build message list for LLM (last 10 turns for context)
      const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...history.slice(-10).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: input.message },
      ];

      const response = await invokeLLM({ messages: llmMessages });
      const aiContent: string =
        (response as any)?.choices?.[0]?.message?.content ?? (input.lang === "ar" ? "عذراً، حدث خطأ. حاول مجدداً." : "Sorry, something went wrong. Please try again.");

      // Persist both sides
      await saveChatMessage({ userId, role: "user", content: input.message });
      await saveChatMessage({ userId, role: "assistant", content: aiContent });

      // Update memory with latest weights if provided
      if (input.context?.currentWeight || input.context?.targetWeight) {
        const existingNotes = memory?.notes ? JSON.parse(memory.notes) : {};
        if (input.context?.name) existingNotes.name = input.context.name;
        await upsertCoachMemory({
          userId,
          currentWeight: input.context.currentWeight ?? memory?.currentWeight ?? null,
          goalWeight: input.context.targetWeight ?? memory?.goalWeight ?? null,
          preferredLanguage: input.lang,
          notes: JSON.stringify(existingNotes),
        });
      }

      return { content: aiContent };
    }),

  /** Fetch recent chat history */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(40) }))
    .query(async ({ ctx, input }) => {
      return getChatHistory(ctx.user.id, input.limit);
    }),

  /** Clear chat history */
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    await clearChatHistory(ctx.user.id);
    return { success: true };
  }),

  /** Submit daily check-in and get AI coaching response */
  checkin: protectedProcedure
    .input(
      z.object({
        feeling: z.number().min(1).max(5),
        energy: z.number().min(1).max(5),
        sleep: z.number().min(1).max(5),
        lang: z.enum(["ar", "en"]).default("ar"),
        context: z.object({
          name: z.string().optional(),
          currentWeight: z.number().optional(),
          targetWeight: z.number().optional(),
          streak: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const today = new Date().toISOString().slice(0, 10);

      // Check if already checked in today
      const existing = await getTodayCheckin(userId, today);
      if (existing) {
        return { alreadyDone: true, aiResponse: existing.aiResponse ?? "" };
      }

      const isAr = input.lang === "ar";
      const feelingLabel = isAr
        ? `الشعور: ${ratingEmoji(input.feeling)} (${input.feeling}/5)`
        : `Feeling: ${ratingEmoji(input.feeling)} (${input.feeling}/5)`;
      const energyLabel = isAr
        ? `الطاقة: ${ratingEmoji(input.energy)} (${input.energy}/5)`
        : `Energy: ${ratingEmoji(input.energy)} (${input.energy}/5)`;
      const sleepLabel = isAr
        ? `النوم: ${ratingEmoji(input.sleep)} (${input.sleep}/5)`
        : `Sleep: ${ratingEmoji(input.sleep)} (${input.sleep}/5)`;

      const userMessage = isAr
        ? `تسجيل الحضور اليومي:\n${feelingLabel}\n${energyLabel}\n${sleepLabel}\n\nبناءً على هذه المعطيات، ما هي توصيتك لتمريني اليوم؟`
        : `Daily check-in:\n${feelingLabel}\n${energyLabel}\n${sleepLabel}\n\nBased on this, what do you recommend for my workout today?`;

      const memory = await getCoachMemory(userId);
      const systemPrompt = buildSystemPrompt(input.lang, {
        name: input.context?.name,
        currentWeight: input.context?.currentWeight ?? memory?.currentWeight ?? undefined,
        targetWeight: input.context?.targetWeight ?? memory?.goalWeight ?? undefined,
        streak: input.context?.streak,
      });

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const aiResponse: string =
        (response as any)?.choices?.[0]?.message?.content ??
        (isAr ? "شكراً على تسجيل الحضور! استمر في العمل الجيد." : "Thanks for checking in! Keep up the great work.");

      await saveCheckin({
        userId,
        date: today,
        feeling: input.feeling,
        energy: input.energy,
        sleep: input.sleep,
        aiResponse,
      });

      return { alreadyDone: false, aiResponse };
    }),

  /** Get today's check-in status */
  getTodayCheckin: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().slice(0, 10);
    return getTodayCheckin(ctx.user.id, today);
  }),

  /** Generate fresh AI insights based on user data */
  generateInsights: protectedProcedure
    .input(
      z.object({
        lang: z.enum(["ar", "en"]).default("ar"),
        context: z.object({
          name: z.string().optional(),
          currentWeight: z.number().optional(),
          targetWeight: z.number().optional(),
          streak: z.number().optional(),
          weeklyCompletion: z.number().optional(),
          totalSessions: z.number().optional(),
          weightChange: z.number().optional(), // kg gained/lost vs start
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const isAr = input.lang === "ar";
      const ctx2 = input.context ?? {};

      const prompt = isAr
        ? `بناءً على بيانات المستخدم التالية، أنشئ 3 رؤى تدريبية موجزة ومحددة:
- الاسم: ${ctx2.name ?? "المستخدم"}
- الوزن الحالي: ${ctx2.currentWeight ?? "؟"} كجم | الهدف: ${ctx2.targetWeight ?? "؟"} كجم
- تغيير الوزن: ${ctx2.weightChange ?? 0} كجم
- الاستمرارية الأسبوعية: ${ctx2.weeklyCompletion ?? 0}%
- إجمالي الجلسات: ${ctx2.totalSessions ?? 0}
- سلسلة الأيام: ${ctx2.streak ?? 0} يوم

أنتج 3 رؤى قصيرة (جملة واحدة لكل منها) بتنسيق JSON:
{"insights":[{"type":"progress|warning|motivation|recommendation","content":"النص بالعربية","contentEn":"English text"}]}`
        : `Based on the following user data, generate 3 concise, specific coaching insights:
- Name: ${ctx2.name ?? "User"}
- Current weight: ${ctx2.currentWeight ?? "?"} kg | Target: ${ctx2.targetWeight ?? "?"} kg
- Weight change: ${ctx2.weightChange ?? 0} kg
- Weekly completion: ${ctx2.weeklyCompletion ?? 0}%
- Total sessions: ${ctx2.totalSessions ?? 0}
- Streak: ${ctx2.streak ?? 0} days

Produce 3 short insights (one sentence each) as JSON:
{"insights":[{"type":"progress|warning|motivation|recommendation","content":"Arabic text","contentEn":"English text"}]}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a fitness analytics AI. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" } as any,
      });

      let parsed: { insights: { type: string; content: string; contentEn?: string }[] } = { insights: [] };
      try {
        const raw = (response as any)?.choices?.[0]?.message?.content ?? "{}";
        parsed = JSON.parse(raw);
      } catch {
        // fallback
        parsed.insights = [
          {
            type: "motivation",
            content: isAr ? "استمر في العمل الجيد!" : "Keep up the great work!",
            contentEn: "Keep up the great work!",
          },
        ];
      }

      const saved = [];
      for (const ins of (parsed.insights ?? []).slice(0, 3)) {
        await saveInsight({
          userId,
          type: ins.type ?? "motivation",
          content: ins.content,
          contentEn: ins.contentEn ?? ins.content,
        });
        saved.push(ins);
      }

      return { insights: saved };
    }),

  /** Fetch stored insights */
  getInsights: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      return getInsights(ctx.user.id, input.limit);
    }),

  /** Get coach memory */
  getMemory: protectedProcedure.query(async ({ ctx }) => {
    return getCoachMemory(ctx.user.id);
  }),
});
