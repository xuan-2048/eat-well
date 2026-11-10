import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createApi} from '../server/app.ts';
import {estimateRecipe, NUTRITION_VERSION} from '../shared/nutrition.js';
import {ingredientKey} from '../shared/recipes.js';
import {ingredientSignature} from '../shared/nutrition-settings.js';
import type {NutritionRequest} from '../shared/contracts.ts';

const recipe = {servings: 2, ingredients: [
  {name: 'Tomatoes', key: ingredientKey('Tomatoes'), amount: 300, unit: 'g', state: 'raw'},
  {name: 'Eggs', key: ingredientKey('Eggs'), amount: 100, unit: 'g', state: 'raw'},
]} satisfies NutritionRequest['recipe'];
const payload = () => ({version: 1, recipe: structuredClone(recipe), servings: 1});

test('nutrition API contracts over HTTP', async t => {
  const server = createApi().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test listener');
  const base = `http://127.0.0.1:${address.port}`;
  const post = (body: unknown, headers: Record<string, string> = {}) => fetch(`${base}/api/nutrition/estimate`, {
    method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: JSON.stringify(body),
  });
  await t.test('health and known totals are reproducible with no persistence service', async () => {
    const health = await fetch(`${base}/api/health`);
    assert.equal((await health.json()).status, 'ok');
    const response = await post(payload(), {Origin: 'http://localhost:8011'});
    assert.equal(response.status, 200);assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-powered-by'), null);
    const data = await response.json();
    assert.equal(data.version, 1);assert.equal(data.dataVersion, NUTRITION_VERSION);
    assert.deepEqual(data.result, estimateRecipe(recipe, 1));assert.equal(data.result.values.energy, 98.5);
  });
  await t.test('partial amounts, preparation mismatches and stale references retain their meaning across JSON', async () => {
    const input = {...recipe, ingredients: [...recipe.ingredients, {name: 'Unknown sauce', key: ingredientKey('Unknown sauce'), amount: null, unit: 'toTaste', state: 'unspecified'}]};
    const response = await post({...payload(), recipe: input, servings: 3});
    const data = await response.json();assert.equal(data.result.complete, false);assert.equal(data.result.included, 2);assert.equal(data.result.values.energy, 295.5);
    const settings = {version: 1, rows: [{index: 1, signature: ingredientSignature(recipe.ingredients[1]), dataVersion: NUTRITION_VERSION, fdcId: 173424, grams: 100, confirmed: true}]};
    const mismatch = await (await post({...payload(), recipe: {...recipe, nutrition: settings}})).json();assert.equal(mismatch.result.rows[1].status, 'mismatch');
    settings.rows[0].dataVersion = 'old-snapshot';
    const stale = await (await post({...payload(), recipe: {...recipe, nutrition: settings}})).json();assert.equal(stale.result.rows[1].status, 'stale');
  });
  await t.test('malformed inputs and unrelated/private recipe fields are rejected', async () => {
    for (const body of [null, [], {}, {...payload(), version: 2}, {...payload(), servings: 0}, {...payload(), servings: '3'}, {...payload(), servings: 101}, {...payload(), extra: 'private'}, {...payload(), recipe: {...recipe, photo: 'private'}}, {...payload(), recipe: {...recipe, ingredients: [{...recipe.ingredients[0], key: 'wrong'}]}}, {...payload(), recipe: {...recipe, ingredients: []}}]) {
      const response = await post(body);assert.equal(response.status, 400);assert.ok((await response.json()).error.code);
    }
    const bad = await fetch(`${base}/api/nutrition/estimate`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{broken'});
    assert.equal(bad.status, 400);assert.equal((await bad.json()).error.code, 'INVALID_JSON');
  });
  await t.test('content type, body limit and origin checks return bounded JSON errors', async () => {
    const text = await fetch(`${base}/api/nutrition/estimate`, {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: '{}'});assert.equal(text.status, 415);
    const oversized = await post({...payload(), extra: 'x'.repeat(70000)});assert.equal(oversized.status, 413);assert.equal((await oversized.json()).error.code, 'BODY_TOO_LARGE');
    const crossSite = await post(payload(), {Origin: 'https://unrelated.example'});assert.equal(crossSite.status, 403);
    const missing = await fetch(`${base}/api/unknown`);assert.equal(missing.status, 404);assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  });
});
