/**
 * Nutrition Router — AI Nutrition System
 *
 * Procedures:
 *  - getGoals          : get or create user's daily nutrition goals
 *  - setGoals          : update daily nutrition goals
 *  - getTodayLog       : get all meal entries + water for today
 *  - logMeal           : add a meal entry
 *  - deleteMeal        : remove a meal entry
 *  - logWater          : add a water entry
 *  - deleteWater       : remove a water entry
 *  - getWeeklyTrends   : get last 7 days of daily totals
 *  - scanFood          : AI image analysis → estimated macros
 *  - generateInsights  : AI analysis → store nutrition insights
 *  - getInsights       : fetch stored insights
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import {
  nutritionGoals,
  mealEntries,
  waterLogs,
  nutritionInsights,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

async function getOrCreateGoals(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [existing] = await db
    .select()
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId));
  if (existing) return existing;
  await db.insert(nutritionGoals).values({ userId });
  const [created] = await db
    .select()
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId));
  return created;
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const nutritionRouter = router({
  // ── Goals ──────────────────────────────────────────────────────────────────
  getGoals: protectedProcedure.query(async ({ ctx }) => {
    return await getOrCreateGoals(ctx.user.id);
  }),

  setGoals: protectedProcedure
    .input(
      z.object({
        calories: z.number().min(500).max(10000),
        proteinG: z.number().min(0).max(500),
        carbsG:   z.number().min(0).max(1000),
        fatG:     z.number().min(0).max(300),
        waterMl:  z.number().min(500).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      await getOrCreateGoals(ctx.user.id);
      await db
        .update(nutritionGoals)
        .set(input)
        .where(eq(nutritionGoals.userId, ctx.user.id));
      return { success: true };
    }),

  // ── Today's Log ────────────────────────────────────────────────────────────
  getTodayLog: protectedProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      const date = input.date ?? todayStr();
      const [meals, water, goals] = await Promise.all([
        db
          .select()
          .from(mealEntries)
          .where(
            and(eq(mealEntries.userId, ctx.user.id), eq(mealEntries.date, date))
          )
          .orderBy(mealEntries.createdAt),
        db
          .select()
          .from(waterLogs)
          .where(
            and(eq(waterLogs.userId, ctx.user.id), eq(waterLogs.date, date))
          )
          .orderBy(waterLogs.loggedAt),
        getOrCreateGoals(ctx.user.id),
      ]);

      // Compute daily totals
      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          proteinG: acc.proteinG + Number(m.proteinG),
          carbsG:   acc.carbsG   + Number(m.carbsG),
          fatG:     acc.fatG     + Number(m.fatG),
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      );
      const totalWaterMl = water.reduce((s, w) => s + w.amountMl, 0);

      return { meals, water, goals, totals, totalWaterMl, date };
    }),

  // ── Log Meal ───────────────────────────────────────────────────────────────
  logMeal: protectedProcedure
    .input(
      z.object({
        date:        z.string().optional(),
        mealType:    z.enum(["breakfast", "lunch", "dinner", "snack"]),
        foodName:    z.string().min(1).max(255),
        foodNameAr:  z.string().max(255).optional(),
        calories:    z.number().min(0).max(9999),
        proteinG:    z.number().min(0).max(999),
        carbsG:      z.number().min(0).max(999),
        fatG:        z.number().min(0).max(999),
        servingSize: z.string().max(64).optional(),
        imageUrl:    z.string().max(512).optional(),
        addedByAI:   z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      const date = input.date ?? todayStr();
      await db.insert(mealEntries).values({
        userId:      ctx.user.id,
        date,
        mealType:    input.mealType,
        foodName:    input.foodName,
        foodNameAr:  input.foodNameAr,
        calories:    input.calories,
        proteinG:    input.proteinG,
        carbsG:      input.carbsG,
        fatG:        input.fatG,
        servingSize: input.servingSize,
        imageUrl:    input.imageUrl,
        addedByAI:   input.addedByAI ?? false,
      });
      return { success: true };
    }),

  // ── Delete Meal ────────────────────────────────────────────────────────────
  deleteMeal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      await db
        .delete(mealEntries)
        .where(
          and(eq(mealEntries.id, input.id), eq(mealEntries.userId, ctx.user.id))
        );
      return { success: true };
    }),

  // ── Log Water ──────────────────────────────────────────────────────────────
  logWater: protectedProcedure
    .input(
      z.object({
        amountMl: z.number().min(50).max(2000),
        date:     z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      const date = input.date ?? todayStr();
      await db.insert(waterLogs).values({
        userId:   ctx.user.id,
        date,
        amountMl: input.amountMl,
      });
      return { success: true };
    }),

  // ── Delete Water Entry ─────────────────────────────────────────────────────
  deleteWater: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      await db
        .delete(waterLogs)
        .where(
          and(eq(waterLogs.id, input.id), eq(waterLogs.userId, ctx.user.id))
        );
      return { success: true };
    }),

  // ── Weekly Trends ──────────────────────────────────────────────────────────
  getWeeklyTrends: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new Error("DB unavailable");
    const from = daysAgoStr(6);
    const to   = todayStr();

    const [meals, water, goals] = await Promise.all([
      db
        .select()
        .from(mealEntries)
        .where(
          and(
            eq(mealEntries.userId, ctx.user.id),
            gte(mealEntries.date, from),
            lte(mealEntries.date, to)
          )
        ),
      db
        .select()
        .from(waterLogs)
        .where(
          and(
            eq(waterLogs.userId, ctx.user.id),
            gte(waterLogs.date, from),
            lte(waterLogs.date, to)
          )
        ),
      getOrCreateGoals(ctx.user.id),
    ]);

    // Build a map of date → daily totals
    const days: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number; waterMl: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = daysAgoStr(i);
      days[d] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl: 0 };
    }
    for (const m of meals) {
      if (days[m.date]) {
        days[m.date].calories += m.calories;
        days[m.date].proteinG += Number(m.proteinG);
        days[m.date].carbsG   += Number(m.carbsG);
        days[m.date].fatG     += Number(m.fatG);
      }
    }
    for (const w of water) {
      if (days[w.date]) {
        days[w.date].waterMl += w.amountMl;
      }
    }

    const trend = Object.entries(days).map(([date, vals]) => ({
      date,
      dayLabel: new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
      ...vals,
    }));

    return { trend, goals };
  }),

  // ── AI Food Scanner ────────────────────────────────────────────────────────
  scanFood: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        lang:     z.enum(["ar", "en"]).default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = input.lang === "ar"
        ? `أنت خبير تغذية. حلّل هذه الصورة للطعام وأعطني:
1. اسم الطبق (بالعربي والإنجليزي)
2. حجم الحصة المقدّرة
3. السعرات الحرارية
4. البروتين (جرام)
5. الكربوهيدرات (جرام)
6. الدهون (جرام)

أجب بـ JSON فقط بهذا الشكل:
{
  "foodName": "...",
  "foodNameAr": "...",
  "servingSize": "...",
  "calories": 0,
  "proteinG": 0,
  "carbsG": 0,
  "fatG": 0,
  "confidence": "high|medium|low",
  "notes": "..."
}`
        : `You are a nutrition expert. Analyze this food image and provide:
1. Food/dish name (English and Arabic)
2. Estimated serving size
3. Calories
4. Protein (grams)
5. Carbs (grams)
6. Fat (grams)

Reply with JSON only in this exact format:
{
  "foodName": "...",
  "foodNameAr": "...",
  "servingSize": "...",
  "calories": 0,
  "proteinG": 0,
  "carbsG": 0,
  "fatG": 0,
  "confidence": "high|medium|low",
  "notes": "..."
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: input.imageUrl, detail: "high" } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "food_scan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                foodName:    { type: "string" },
                foodNameAr:  { type: "string" },
                servingSize: { type: "string" },
                calories:    { type: "number" },
                proteinG:    { type: "number" },
                carbsG:      { type: "number" },
                fatG:        { type: "number" },
                confidence:  { type: "string" },
                notes:       { type: "string" },
              },
              required: ["foodName", "foodNameAr", "servingSize", "calories", "proteinG", "carbsG", "fatG", "confidence", "notes"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices[0].message.content;
      const result = typeof raw === "string" ? JSON.parse(raw) : raw;
      return result as {
        foodName: string; foodNameAr: string; servingSize: string;
        calories: number; proteinG: number; carbsG: number; fatG: number;
        confidence: string; notes: string;
      };
    }),

  // ── AI Nutrition Insights ──────────────────────────────────────────────────
  generateInsights: protectedProcedure
    .input(z.object({ lang: z.enum(["ar", "en"]).default("en") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new Error("DB unavailable");
      const from = daysAgoStr(6);
      const to   = todayStr();

      // Gather context
      const [meals, water, goals] = await Promise.all([
        db.select().from(mealEntries).where(
          and(eq(mealEntries.userId, ctx.user.id), gte(mealEntries.date, from), lte(mealEntries.date, to))
        ),
        db.select().from(waterLogs).where(
          and(eq(waterLogs.userId, ctx.user.id), gte(waterLogs.date, from), lte(waterLogs.date, to))
        ),
        getOrCreateGoals(ctx.user.id),
      ]);

      const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
      const totalProtein  = meals.reduce((s, m) => s + Number(m.proteinG), 0);
      const totalCarbs    = meals.reduce((s, m) => s + Number(m.carbsG), 0);
      const totalFat      = meals.reduce((s, m) => s + Number(m.fatG), 0);
      const totalWater    = water.reduce((s, w) => s + w.amountMl, 0);
      const days          = 7;

      const avgCalories = Math.round(totalCalories / days);
      const avgProtein  = Math.round(totalProtein  / days);
      const avgCarbs    = Math.round(totalCarbs    / days);
      const avgFat      = Math.round(totalFat      / days);
      const avgWater    = Math.round(totalWater    / days);

      const isAr = input.lang === "ar";
      const systemPrompt = isAr
        ? "أنت مدرب تغذية محترف في تطبيق Prime Fit. قدّم نصائح تغذوية مخصصة وعملية باللهجة الكويتية."
        : "You are a professional nutrition coach in Prime Fit app. Provide personalized, actionable nutrition insights.";

      const userPrompt = `
User's 7-day nutrition summary:
- Average daily calories: ${avgCalories} kcal (goal: ${goals.calories})
- Average daily protein: ${avgProtein}g (goal: ${goals.proteinG}g)
- Average daily carbs: ${avgCarbs}g (goal: ${goals.carbsG}g)
- Average daily fat: ${avgFat}g (goal: ${goals.fatG}g)
- Average daily water: ${avgWater}ml (goal: ${goals.waterMl}ml)
- Total meals logged: ${meals.length}

Generate exactly 4 nutrition insights. Each insight must have:
- type: one of "protein", "hydration", "calories", "macros", "recovery", "general"
- priority: "high", "medium", or "low"
- content: insight in ${isAr ? "Kuwaiti Arabic" : "English"} (1-2 sentences, specific and actionable)
- contentAr: insight in Kuwaiti Arabic (1-2 sentences)

Reply with JSON array only:
[
  { "type": "...", "priority": "...", "content": "...", "contentAr": "..." },
  ...
]`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
      });

      const raw = response.choices[0].message.content;
      let insights: { type: string; priority: string; content: string; contentAr: string }[] = [];
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        insights = Array.isArray(parsed) ? parsed : [];
      } catch {
        insights = [];
      }

      // Clear old insights and save new ones
      await db.delete(nutritionInsights).where(eq(nutritionInsights.userId, ctx.user.id));
      if (insights.length > 0) {
        await db.insert(nutritionInsights).values(
          insights.map((ins) => ({
            userId:     ctx.user.id,
            type:       (ins.type as any) ?? "general",
            content:    ins.content ?? "",
            contentAr:  ins.contentAr ?? ins.content,
            priority:   (ins.priority as any) ?? "medium",
          }))
        );
      }

      return { success: true, count: insights.length };
    }),

  getInsights: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new Error("DB unavailable");
    return await db
      .select()
      .from(nutritionInsights)
      .where(eq(nutritionInsights.userId, ctx.user.id))
      .orderBy(desc(nutritionInsights.createdAt));
  }),
});
