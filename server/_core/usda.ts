/**
 * USDA FoodData Central API client
 * Free API — no key needed for basic search
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_KEY  = process.env.USDA_API_KEY ?? "DEMO_KEY"; // DEMO_KEY = 30 req/hr, own key = 1000/hr

export interface USDANutrient {
  nutrientId:   number;
  nutrientName: string;
  value:        number;
  unitName:     string;
}

export interface USDAFood {
  fdcId:          number;
  description:    string;
  brandName?:     string;
  servingSize?:   number;
  servingSizeUnit?: string;
  nutrients:      USDANutrient[];
}

export interface NutritionPer100g {
  calories:    number;
  protein:     number; // g
  carbs:       number; // g
  fat:         number; // g
  fiber:       number; // g
  sugar:       number; // g
  sodium:      number; // mg
  cholesterol: number; // mg
}

/** Nutrient IDs we care about */
const NUTRIENT_MAP: Record<number, keyof NutritionPer100g> = {
  1008: "calories",
  1003: "protein",
  1005: "carbs",
  1004: "fat",
  1079: "fiber",
  2000: "sugar",
  1093: "sodium",
  1253: "cholesterol",
};

/** Search USDA for a food item and return top match with nutrition */
export async function searchUSDAFood(query: string): Promise<USDAFood | null> {
  try {
    const params = new URLSearchParams({
      query,
      dataType: "Foundation,SR Legacy,Branded",
      pageSize: "5",
      api_key:  USDA_KEY,
    });

    const res = await fetch(`${USDA_BASE}/foods/search?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const foods = data?.foods ?? [];
    if (!foods.length) return null;

    // Prefer Foundation > SR Legacy > Branded
    const sorted = foods.sort((a: any, b: any) => {
      const order = ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"];
      return order.indexOf(a.dataType) - order.indexOf(b.dataType);
    });

    const food = sorted[0];
    return {
      fdcId:          food.fdcId,
      description:    food.description,
      brandName:      food.brandName,
      servingSize:    food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
      nutrients:      (food.foodNutrients ?? []).map((n: any) => ({
        nutrientId:   n.nutrientId,
        nutrientName: n.nutrientName,
        value:        n.value ?? 0,
        unitName:     n.unitName ?? "",
      })),
    };
  } catch (err) {
    console.error("[USDA] Search failed:", err);
    return null;
  }
}

/** Extract clean nutrition per 100g from USDA food */
export function extractNutrition(food: USDAFood): NutritionPer100g {
  const result: NutritionPer100g = {
    calories: 0, protein: 0, carbs: 0, fat: 0,
    fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
  };
  for (const n of food.nutrients) {
    const key = NUTRIENT_MAP[n.nutrientId];
    if (key) result[key] = Math.round(n.value * 10) / 10;
  }
  return result;
}

/** Scale nutrition from per-100g to a given portion in grams */
export function scaleNutrition(per100g: NutritionPer100g, grams: number): NutritionPer100g {
  const factor = grams / 100;
  return Object.fromEntries(
    Object.entries(per100g).map(([k, v]) => [k, Math.round(v * factor * 10) / 10])
  ) as unknown as NutritionPer100g;
}

/** Batch search multiple food items */
export async function batchSearchUSDA(items: Array<{ name: string; estimatedGrams: number }>) {
  const results = await Promise.all(
    items.map(async (item) => {
      const food = await searchUSDAFood(item.name);
      if (!food) return null;
      const per100g = extractNutrition(food);
      const portion = scaleNutrition(per100g, item.estimatedGrams);
      return {
        name:         item.name,
        estimatedGrams: item.estimatedGrams,
        fdcId:        food.fdcId,
        description:  food.description,
        per100g,
        portion,
      };
    })
  );
  return results.filter(Boolean);
}
