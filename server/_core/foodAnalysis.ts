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

/** Full analysis: vision detection + USDA nutrition lookup */
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

  // Step 3 — Merge vision + USDA data
  const items: FoodAnalysisItem[] = vision.items.map((vItem, idx) => {
    const usda = usdaResults[idx];
    const fallbackPer100g: NutritionPer100g = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 };
    return {
      name:           vItem.name,
      nameAr:         vItem.nameAr,
      estimatedGrams: vItem.estimatedGrams,
      portionDesc:    vItem.portionDesc,
      portionDescAr:  vItem.portionDescAr,
      confidence:     vItem.confidence,
      fdcId:          usda?.fdcId,
      per100g:        usda?.per100g  ?? fallbackPer100g,
      portion:        usda?.portion  ?? fallbackPer100g,
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
