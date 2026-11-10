import test from 'node:test';
import assert from 'node:assert/strict';
import {createNutritionClient, nutritionRequest} from '../src/api/nutrition-client.ts';
import {estimateRecipe, NUTRITION_VERSION} from '../shared/nutrition.js';
import {ingredientKey} from '../shared/recipes.js';
import {validNutritionResponse} from '../shared/nutrition-response.ts';
import type {NutritionRecipe} from '../shared/contracts.ts';
const recipe = {servings: 2, ingredients: [{name: 'Tomatoes', key: ingredientKey('Tomatoes'), amount: 300, unit: 'g', state: 'raw'}]} satisfies NutritionRecipe;
const response = () => ({version: 1, dataVersion: NUTRITION_VERSION, result: estimateRecipe(recipe, 1)});
const fetcher = (fn: (...args: Parameters<typeof fetch>) => Promise<Response>) => fn as typeof fetch;

test('API payload contains calculation inputs only, excluding photos, notes and unknown nested fields', () => {
 const settings = {index: 0, signature: 's', fdcId: 170457, dataVersion: NUTRITION_VERSION, grams: 300, confirmed: true as const, privateExtra: 'not sent'};
 const rich = {...recipe, id: 'private-id', name: 'Private title', photo: 'private image', steps: ['private note'], nutrition: {version: 1 as const, rows: [settings]}, ingredients: [{...recipe.ingredients[0], privateExtra: 'not sent'}]};
 const request = nutritionRequest(rich, 1);
 for (const fragment of ['private', 'privateExtra', 'photo', 'steps']) assert.equal(JSON.stringify(request).includes(fragment), false);
 assert.deepEqual(Object.keys(request.recipe), ['servings', 'ingredients', 'nutrition']);
});
test('client uses versioned HTTP contract and accepts a valid server response independent of object key order', async () => {
 const client = createNutritionClient({fetcher: fetcher(async (url, options) => {
  assert.equal(url, '/api/nutrition/estimate');assert.equal(options?.method, 'POST');
  assert.deepEqual(JSON.parse(String(options?.body)), nutritionRequest(recipe, 1));
  const body = response();return Response.json({result: body.result, dataVersion: body.dataVersion, version: body.version});
 })});
 const result = await client.estimate(recipe, 1);assert.equal(result.via, 'server');assert.equal(result.result.values.energy, 27);
});
test('transport, HTTP and malformed-response failures fall back to the same local rules without writing data', async () => {
 for (const fetchFn of [fetcher(async () => {throw new TypeError('offline');}), fetcher(async () => Response.json({}, {status: 503})), fetcher(async () => Response.json({version: 1, dataVersion: NUTRITION_VERSION, result: {values: {energy: 9999}}}))]) {
  const before = structuredClone(recipe), result = await createNutritionClient({fetcher: fetchFn}).estimate(recipe, 1);
  assert.equal(result.via, 'local');assert.deepEqual(result.result, estimateRecipe(recipe, 1));assert.deepEqual(recipe, before);
 }
});
test('response validation rejects wrong versions, mismatched rows, impossible values and inconsistent coverage', () => {
 const request = nutritionRequest(recipe, 1);
 assert.ok(validNutritionResponse(response(), request));
 for (const mutate of [
  (v: any) => {v.dataVersion = 'other';}, (v: any) => {v.result.servings = 2;}, (v: any) => {v.result.rows[0].ingredient.name = 'Different';},
  (v: any) => {v.result.values.energy = -2;}, (v: any) => {v.result.values.energy = Infinity;}, (v: any) => {v.result.rows[0].nutrients.fat = 'unknown';},
  (v: any) => {v.result.rows[0].grams = null;}, (v: any) => {v.result.complete = false;}, (v: any) => {v.result.coverage.energy = 0;},
 ]) {const value = structuredClone(response());mutate(value);assert.equal(validNutritionResponse(value, request), false);}
});
test('superseded requests reject after abort instead of returning a stale fallback/result', async () => {
 const controller = new AbortController();let finish!: (value: Response) => void;
 const client = createNutritionClient({fetcher: fetcher(() => new Promise(resolve => {finish = resolve;}))});
 const pending = client.estimate(recipe, 1, controller.signal);controller.abort();finish(Response.json(response()));
 await assert.rejects(pending, {name: 'AbortError'});
});
test('a request timeout produces a local estimate, and invalid inputs never reach fetch', async () => {
 const client = createNutritionClient({timeout: 1, fetcher: fetcher(async (_url, init) => new Promise((_resolve, reject) => {
  init?.signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), {once: true});
 }))});
 assert.equal((await client.estimate(recipe, 1)).via, 'local');
 let called = false;
 const invalid = createNutritionClient({fetcher: fetcher(async () => {called = true; return Response.json(response());})});
 await assert.rejects(invalid.estimate(recipe, 0));assert.equal(called, false);
});
