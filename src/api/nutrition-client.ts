import {estimateRecipe} from '../../shared/nutrition.js';
import {validNutritionResponse} from '../../shared/nutrition-response.ts';
import {validNutritionRecipe} from '../../shared/recipes.js';
import type {EstimateResult, NutritionEstimate, NutritionRecipe, NutritionRequest} from '../../shared/contracts.ts';

export function nutritionRequest(recipe: NutritionRecipe, servings: number): NutritionRequest {
  const input: NutritionRecipe = {
    servings: recipe.servings,
    ingredients: recipe.ingredients.map(({name, key, amount, unit, state}) => ({name, key, amount, unit, state})),
  };
  if (recipe.nutrition) input.nutrition = {
    version: recipe.nutrition.version,
    rows: recipe.nutrition.rows.map(({index, signature, fdcId, dataVersion, grams, confirmed}) => ({index, signature, fdcId, dataVersion, grams, confirmed})),
  };
  if (!validNutritionRecipe(input) || !Number.isFinite(servings) || servings <= 0 || servings > 100) throw new Error('Invalid nutrition request');
  return {version: 1, recipe: input, servings};
}

export function createNutritionClient({fetcher = fetch, timeout = 4000}: {fetcher?: typeof fetch; timeout?: number} = {}) {
  return {
    async estimate(recipe: NutritionRecipe, servings: number, signal?: AbortSignal): Promise<EstimateResult> {
      const request = nutritionRequest(recipe, servings);
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, {once: true});
      if (signal?.aborted) controller.abort();
      const timer = setTimeout(abort, timeout);
      try {
        const response = await fetcher('/api/nutrition/estimate', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(request), signal: controller.signal,
        });
        if (!response.ok) throw new Error('Nutrition service unavailable');
        const body = await response.json();
        // Keep the response boundary explicit; never display unvalidated remote values.
        if (!validNutritionResponse(body, request)) throw new Error('Invalid nutrition response');
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        return {result: body.result, via: 'server'};
      } catch {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        return {result: estimateRecipe(request.recipe, servings) as NutritionEstimate, via: 'local'};
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      }
    },
  };
}
