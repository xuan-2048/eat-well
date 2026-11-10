import express from 'express';
import type {ErrorRequestHandler} from 'express';
import {NUTRITION_VERSION, estimateRecipe} from '../shared/nutrition.js';
import {validNutritionRecipe} from '../shared/recipes.js';

const onlyKeys = (value: unknown, allowed: string[]) => Boolean(value && typeof value === 'object'
  && !Array.isArray(value) && Object.keys(value).every(key => allowed.includes(key)));

export function createApi({origins = ['http://localhost:8011', 'http://127.0.0.1:8011', 'http://localhost:8014', 'http://127.0.0.1:8014']} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set({'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
    if (req.headers.origin && !origins.includes(req.headers.origin)) {
      res.status(403).json({error: {code: 'ORIGIN_NOT_ALLOWED'}});
      return;
    }
    next();
  });
  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', service: 'eat-well-api', version: 1, dataVersion: NUTRITION_VERSION});
  });
  app.post('/api/nutrition/estimate', express.json({limit: '64kb'}), (req, res) => {
    if (!req.is('application/json')) {
      res.status(415).json({error: {code: 'JSON_REQUIRED'}});
      return;
    }
    const body = req.body;
    // The API accepts nutrition input only, never recipe photos, notes or browser storage.
    const valid = onlyKeys(body, ['version', 'recipe', 'servings']) && body.version === 1
      && onlyKeys(body.recipe, ['servings', 'ingredients', 'nutrition'])
      && validNutritionRecipe(body.recipe)
      && body.recipe.ingredients.every((i: unknown) => onlyKeys(i, ['name', 'key', 'amount', 'unit', 'state']))
      && (!body.recipe.nutrition || onlyKeys(body.recipe.nutrition, ['version', 'rows'])
        && body.recipe.nutrition.rows.every((row: unknown) => onlyKeys(row, ['index', 'signature', 'fdcId', 'dataVersion', 'grams', 'confirmed'])))
      && Number.isFinite(body.servings) && body.servings > 0 && body.servings <= 100;
    if (!valid) {
      res.status(400).json({error: {code: 'INVALID_NUTRITION_INPUT'}});
      return;
    }
    res.json({version: 1, dataVersion: NUTRITION_VERSION, result: estimateRecipe(body.recipe, body.servings)});
  });
  app.use('/api', (_req, res) => {res.status(404).json({error: {code: 'NOT_FOUND'}});});
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({error: {code: status === 413 ? 'BODY_TOO_LARGE' : status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR'}});
  };
  app.use(errors);
  return app;
}
