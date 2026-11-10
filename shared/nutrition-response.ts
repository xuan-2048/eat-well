import {NUTRITION_VERSION} from './nutrition.js';
import type {Nutrient, NutrientValues, NutritionRequest, NutritionResponse} from './contracts.ts';

const keys: Nutrient[] = ['energy', 'protein', 'carbs', 'fat', 'fiber'];
const statuses = ['included', 'unmatched', 'state', 'mismatch', 'weight', 'unmeasured', 'stale'];
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const nonnegative = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const values = (value: unknown): value is NutrientValues => record(value) && keys.every(key => value[key] === null || nonnegative(value[key]));

// Validate the transport schema without invoking calculation or persistence.
export function validNutritionResponse(body: unknown, request: NutritionRequest): body is NutritionResponse {
  if (!record(body) || body.version !== 1 || body.dataVersion !== NUTRITION_VERSION || !record(body.result)) return false;
  const result = body.result, total = request.recipe.ingredients.length;
  if (!Array.isArray(result.rows) || result.rows.length !== total || result.total !== total
      || !Number.isInteger(result.included) || !nonnegative(result.included) || result.included > total
      || result.servings !== request.servings || result.recipeServings !== request.recipe.servings
      || !values(result.values) || !values(result.totals) || !record(result.coverage)) return false;
  for (let index = 0; index < total; index++) {
    const row: unknown = result.rows[index];
    if (!record(row) || row.index !== index || typeof row.manual !== 'boolean' || typeof row.status !== 'string'
        || !statuses.includes(row.status) || !values(row.nutrients) || !record(row.ingredient)) return false;
    const ingredient = request.recipe.ingredients[index];
    if (!(Object.keys(ingredient) as (keyof typeof ingredient)[]).every(key => (row.ingredient as Record<string, unknown>)[key] === ingredient[key])) return false;
    if (row.grams !== null && (!nonnegative(row.grams) || row.grams <= 0 || row.grams > 1e7)) return false;
    if (row.reference !== null) {
      const food = row.reference;
      if (!record(food) || !Number.isSafeInteger(food.fdcId) || !nonnegative(food.fdcId) || food.fdcId === 0
          || !record(food.name) || typeof food.name.zh !== 'string' || typeof food.name.en !== 'string'
          || typeof food.state !== 'string' || !values(food.per100g)) return false;
    }
    if (row.status === 'included' && (row.grams === null || row.reference === null)) return false;
    if (row.status !== 'included' && (row.grams !== null || keys.some(key => (row.nutrients as NutrientValues)[key] !== null))) return false;
  }
  const rows = result.rows as NutritionResponse['result']['rows'];
  if (result.included !== rows.filter(row => row.status === 'included').length) return false;
  for (const key of keys) {
    const count = rows.filter(row => row.nutrients[key] !== null).length;
    if (result.coverage[key] !== count || (count === 0) !== (result.values[key] === null) || (count === 0) !== (result.totals[key] === null)) return false;
  }
  return result.complete === keys.every(key => (result.coverage as Record<string, unknown>)[key] === total);
}
