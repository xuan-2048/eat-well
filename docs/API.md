# Local API

The API is an independent Node.js/Express process. Default address: `http://127.0.0.1:8020`. The browser calls `/api` on its frontend origin; Vite and its local production preview proxy those paths. This is a local development setup, not a deployed service.

## GET /api/health

Returns service status, contract version and nutrition dataset version. It does not return environment settings.

## POST /api/nutrition/estimate

Use `Content-Type: application/json`. The request body limit is 64 KiB. Contract types are in `shared/contracts.ts`.

```json
{
  "version": 1,
  "recipe": {
    "servings": 2,
    "ingredients": [
      {"name": "Tomatoes", "key": "tomato", "amount": 300, "unit": "g", "state": "raw"}
    ]
  },
  "servings": 1
}
```

The recipe accepts only `servings`, `ingredients` and optional `nutrition` reference metadata. Ingredient fields are `name`, `key`, `amount`, `unit` and `state`. Preparation and quantity validation are shared with stored recipes. Reference metadata follows the existing `version: 1, rows: [...]` format, with index, signature, FDC ID, data version, confirmed edible grams and acknowledgment.

The response is `{version: 1, dataVersion, result}`. The result contains ingredient rows, original-recipe totals, scaled values, per-nutrient coverage and completeness. In the example, energy is 27 kcal per serving. It is only the supplied tomato contribution, not a full tomato-and-egg dish. Nullable values stay null across JSON. See [nutrition calculations](NUTRITION.md).

The endpoint has no persistence or side effects. Browser collection contents, recipe photos and notes are neither accepted nor stored. No external food or AI API is called.

## Errors and origins

Errors use `{error: {code}}`: malformed JSON/invalid input is 400, disallowed origin 403, unknown API route 404, an oversized body 413 and unsupported content type 415. Unexpected failures return a generic 500 response without a stack trace or request contents. API responses use `Cache-Control: no-store`.

No cross-origin browser access is enabled. Requests carrying an Origin header must match `WEB_ORIGINS`. Defaults include loopback frontend ports 8011 and 8014 (the separate demo preview). Set `API_PORT` and `WEB_ORIGINS` in a local `.env` if using other ports; a sample is provided. Both processes bind to loopback addresses.

## Next endpoints

Future AI requests belong in server routes, with an explicit input/output contract and server-side provider configuration. No AI route or provider is implemented yet. Account authentication and cloud data storage are separate future work.
