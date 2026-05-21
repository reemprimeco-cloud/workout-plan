/**
 * Food Analysis Engine
 * Step 1: Vision LLM detects food items + portion sizes from image
 * Step 2: USDA lookup for accurate nutrition data per item
 * Step 3: Returns structured meal with totals + AI insights
 */

import { invokeLLM } from "./llm";
import { batchSearchUSDA } from "./usda";
import type { NutritionPer100g } from "./usda";

export interface DetectedFood {
  name:           string;
  nameAr:         string;
  estimatedGrams: number;
  confidence:     "high" | "medium" | "low";
  portionDesc:    string;    // e.g. "1 medium piece", "1 cup"
  portionDescAr:  string;
}

export interface FoodAnalysisItem {
  name:           string;
  nameAr:         string;
  estimatedGrams: number;
  portionDesc:    string;
  portionDescAr:  string;
  confidence:     "high" | "medium" | "low";
  fdcId?:         number;
  per100g:        NutritionPer100g;
  portion:        NutritionPer100g;
}

export interface MealAnalysis {
  items:        FoodAnalysisItem[];
  totals:       NutritionPer100g;
  mealType:     "breakfast" | "lunch" | "dinner" | "snack";
  insightAr:    string;
  insightEn:    string;
  imageQuality: "good" | "poor" | "unclear";
  analyzedAt:   string;
}

const SYSTEM_PROMPT = `You are a professional nutritionist and food recognition expert.
Analyze food images and return ONLY valid JSON — no markdown, no explanation.

Rules:
- Identify ALL food items visible in the image
- Estimate portion weight in grams based on visual cues (plate size, common portions)
- Be specific: "grilled chicken breast" not just "chicken"
- For Arabic foods, provide Arabic name too
- Confidence: high = clearly visible, medium = likely, low = uncertain
- mealType: guess based on foods shown
- imageQuality: good/poor/unclear based on image clarity`;

const FOOD_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name:           { type: "string" },
          nameAr:         { type: "string" },
          estimatedGrams: { type: "number" },
          confidence:     { type: "string", enum: ["high", "medium", "low"] },
          portionDesc:    { type: "string" },
          portionDescAr:  { type: "string" },
        },
        required: ["name", "nameAr", "estimatedGrams", "confidence", "portionDesc", "portionDescAr"],
      },
    },
    mealType:     { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
    insightAr:    { type: "string" },
    insightEn:    { type: "string" },
    imageQuality: { type: "string", enum: ["good", "poor", "unclear"] },
  },
  required: ["items", "mealType", "insightAr", "insightEn", "imageQuality"],
};

/** Step 1: Use vision LLM to detect food items from image */
async function detectFoodsFromImage(imageBase64: string, mimeType: string): Promise<{
  items: DetectedFood[];
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  insightAr: string;
  insightEn: string;
  imageQuality: "good" | "poor" | "unclear";
}> {
  const result = await invokeLLM({
    messages: [
      {
        role:    "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type:      "image_url",
            image_url: {
              url:    `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Analyze this food image. Return the JSON with all food items, portions, and nutritional insights.",
          },
        ],
      },
    ],
    outputSchema: { name: "food_analysis", schema: FOOD_SCHEMA } as any,
  });

  const content = result.choices?.[0]?.message?.content ?? "";
  let parsed: any;

  try {
    const jsonStr = typeof content === "string"
      ? content.replace(/```json|```/g, "").trim()
      : JSON.stringify(content);
    parsed = JSON.parse(jsonStr);
  } catch {
    // If parsing fails, return a minimal response
    parsed = {
      items: [],
      mealType: "snack",
      insightAr: "لم نتمكن من التعرف على الطعام بوضوح. حاول صورة أوضح.",
      insightEn: "Could not clearly identify food. Try a clearer image.",
      imageQuality: "unclear",
    };
  }

  return parsed;
}

/** Ask LLM to estimate nutrition for items that USDA couldn't find */
async function estimateNutritionWithLLM(
  items: Array<{ name: string; estimatedGrams: number }>
): Promise<NutritionPer100g[]> {
  const schema = {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            calories:    { type: "number" },
            protein:     { type: "number" },
            carbs:       { type: "number" },
            fat:         { type: "number" },
            fiber:       { type: "number" },
            sugar:       { type: "number" },
            sodium:      { type: "number" },
            cholesterol: { type: "number" },
          },
          required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "cholesterol"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  };

  const itemsList = items.map((it, i) =>
    `${i + 1}. ${it.name} (${it.estimatedGrams}g portion)`
  ).join("\n");

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional nutritionist. Estimate the nutritional values for the given food portions. " +
            "Return ONLY the JSON with estimated values for each item in the SAME ORDER as given. " +
            "Values should be for the ACTUAL PORTION SIZE given (not per 100g). " +
            "Be realistic — use standard nutritional databases as reference.",
        },
        {
          role: "user",
          content: `Estimate nutrition for these food portions:\n${itemsList}`,
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "nutrition_estimates", strict: true, schema } } as any,
    });
    const content = result.choices?.[0]?.message?.content ?? "";
    const jsonStr = typeof content === "string"
      ? content.replace(/```json|```/g, "").trim()
      : JSON.stringify(content);
    const parsed = JSON.parse(jsonStr);
    return (parsed.items ?? []).map((it: any) => ({
      calories:    Math.round((it.calories    ?? 0) * 10) / 10,
      protein:     Math.round((it.protein     ?? 0) * 10) / 10,
      carbs:       Math.round((it.carbs       ?? 0) * 10) / 10,
      fat:         Math.round((it.fat         ?? 0) * 10) / 10,
      fiber:       Math.round((it.fiber       ?? 0) * 10) / 10,
      sugar:       Math.round((it.sugar       ?? 0) * 10) / 10,
      sodium:      Math.round((it.sodium      ?? 0) * 10) / 10,
      cholesterol: Math.round((it.cholesterol ?? 0) * 10) / 10,
    }));
  } catch {
    return items.map(() => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 }));
  }
}

/** Full analysis: vision detection + USDA nutrition lookup + LLM fallback */
export async function analyzeFoodImage(imageBase64: string, mimeType = "image/jpeg"): Promise<MealAnalysis> {
  // Step 1 — Detect foods from image
  const vision = await detectFoodsFromImage(imageBase64, mimeType);

  if (!vision.items.length || vision.imageQuality === "unclear") {
    return {
      items:        [],
      totals:       { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 },
      mealType:     vision.mealType,
      insightAr:    vision.insightAr,
      insightEn:    vision.insightEn,
      imageQuality: vision.imageQuality,
      analyzedAt:   new Date().toISOString(),
    };
  }

  // Step 2 — Batch USDA lookup
  const usdaResults = await batchSearchUSDA(
    vision.items.map(i => ({ name: i.name, estimatedGrams: i.estimatedGrams }))
  );

  // Step 3 — Identify items that need LLM fallback (USDA returned null or all-zero nutrition)
  const needsFallback = vision.items.map((vItem, idx) => {
    const usda = usdaResults[idx];
    if (!usda) return true;
    const total = usda.portion.calories + usda.portion.protein + usda.portion.carbs + usda.portion.fat;
    return total === 0;
  });

  // Step 4 — Run LLM fallback for items that need it
  const fallbackItems = vision.items
    .map((vItem, idx) => needsFallback[idx] ? { name: vItem.name, estimatedGrams: vItem.estimatedGrams } : null)
    .filter(Boolean) as Array<{ name: string; estimatedGrams: number }>;

  let llmEstimates: NutritionPer100g[] = [];
  if (fallbackItems.length > 0) {
    llmEstimates = await estimateNutritionWithLLM(fallbackItems);
  }

  // Step 5 — Merge vision + USDA + LLM fallback data
  let llmIdx = 0;
  const items: FoodAnalysisItem[] = vision.items.map((vItem, idx) => {
    const usda = usdaResults[idx];
    let portion: NutritionPer100g;
    let per100g: NutritionPer100g;

    if (needsFallback[idx]) {
      // Use LLM estimate (already scaled to portion size)
      portion = llmEstimates[llmIdx] ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 };
      // Back-calculate per100g from portion
      const factor = vItem.estimatedGrams > 0 ? 100 / vItem.estimatedGrams : 1;
      per100g = Object.fromEntries(
        Object.entries(portion).map(([k, v]) => [k, Math.round((v as number) * factor * 10) / 10])
      ) as unknown as NutritionPer100g;
      llmIdx++;
    } else {
      per100g = usda!.per100g;
      portion  = usda!.portion;
    }

    return {
      name:           vItem.name,
      nameAr:         vItem.nameAr,
      estimatedGrams: vItem.estimatedGrams,
      portionDesc:    vItem.portionDesc,
      portionDescAr:  vItem.portionDescAr,
      confidence:     vItem.confidence,
      fdcId:          usda?.fdcId,
      per100g,
      portion,
    };
  });

  // Step 4 — Calculate totals
  const totals: NutritionPer100g = items.reduce((acc, item) => ({
    calories:    acc.calories    + item.portion.calories,
    protein:     acc.protein     + item.portion.protein,
    carbs:       acc.carbs       + item.portion.carbs,
    fat:         acc.fat         + item.portion.fat,
    fiber:       acc.fiber       + item.portion.fiber,
    sugar:       acc.sugar       + item.portion.sugar,
    sodium:      acc.sodium      + item.portion.sodium,
    cholesterol: acc.cholesterol + item.portion.cholesterol,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 });

  // Round totals
  Object.keys(totals).forEach(k => {
    (totals as any)[k] = Math.round((totals as any)[k] * 10) / 10;
  });

  return {
    items,
    totals,
    mealType:     vision.mealType,
    insightAr:    vision.insightAr,
    insightEn:    vision.insightEn,
    imageQuality: vision.imageQuality,
    analyzedAt:   new Date().toISOString(),
  };
}
