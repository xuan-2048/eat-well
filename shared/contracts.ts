export type Language = 'zh' | 'en';
export type Nutrient = 'energy' | 'protein' | 'carbs' | 'fat' | 'fiber';
export type NutrientValues = Record<Nutrient, number | null>;
export interface Ingredient {
  name: string;
  key: string;
  amount: number | null;
  unit: 'g' | 'ml' | 'piece' | 'tbsp' | 'tsp' | 'toTaste';
  state: 'raw' | 'cooked' | 'unspecified';
}
export interface NutritionSetting {
  index: number;
  signature: string;
  fdcId: number;
  dataVersion: string;
  grams: number;
  confirmed: true;
}
export interface NutritionRecipe {
  servings: number;
  ingredients: Ingredient[];
  nutrition?: {version: 1; rows: NutritionSetting[]};
}
export interface SavedRecipe extends NutritionRecipe {id: string; name: string}
export interface FoodReference {
  fdcId: number;
  name: Record<Language, string>;
  state: string;
  per100g: NutrientValues;
}
export type RowStatus = 'included' | 'unmatched' | 'state' | 'mismatch' | 'weight' | 'unmeasured' | 'stale';
export interface NutritionRow {
  index: number;
  ingredient: Ingredient;
  reference: FoodReference | null;
  grams: number | null;
  status: RowStatus;
  manual: boolean;
  nutrients: NutrientValues;
}
export interface NutritionEstimate {
  rows: NutritionRow[];
  totals: NutrientValues;
  values: NutrientValues;
  coverage: Record<Nutrient, number>;
  included: number;
  total: number;
  complete: boolean;
  servings: number;
  recipeServings: number;
}
export interface NutritionRequest {version: 1; recipe: NutritionRecipe; servings: number}
export interface NutritionResponse {version: 1; dataVersion: string; result: NutritionEstimate}
export interface EstimateResult {result: NutritionEstimate; via: 'server' | 'local'}

export interface NutritionBasis {
  version: 1; dataVersion: string; capturedAt: string; signature: string;
  perServing: NutrientValues; coverage: Record<Nutrient,number>;
  ingredientCount: number; includedIngredients: number; complete: boolean;
}
