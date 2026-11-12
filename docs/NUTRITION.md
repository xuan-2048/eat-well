# Nutrition estimates

Recipe details show calories (kcal), protein, total carbohydrate, fat and fiber (g). Choose **Per serving**, **Whole recipe** or **Selected servings**. The last option follows the serving input above the ingredient list. **Cooking log → Daily nutrition** totals actual intake by date and meal. AI suggestions are not implemented yet.

菜谱详情支持每份、整道菜和所选份数的营养估算。展开“查看食材与计算依据”可以补充重量、调整参考食物，或检查每项食材贡献了多少。

## Data

The app bundles 42 reference foods from [USDA FoodData Central’s SR Legacy CSV release, April 2018](https://fdc.nal.usda.gov/download-datasets/). This is a fixed reference snapshot, not a live API or the latest USDA release. Source values are public domain under CC0; see the [USDA API guide](https://fdc.nal.usda.gov/api-guide/). No external API key is needed. The local API uses this bundled data; if the service is unavailable, the browser calculates with the same rules and labels the fallback.

Each local record keeps its FDC ID, original English description, translated description, preparation state, nutrient values per 100 g, available reference portion weights and source publication date. Dataset metadata records the release, retrieval date, download URL and archive SHA-256. Source publication dates can differ from the release date.

The source nutrient IDs are 1008 (energy, kcal), 1003 (protein, g), 1005 (carbohydrate by difference, g), 1004 (fat, g) and 1079 (fiber, g). Missing observations remain `null`. A recorded zero, such as the energy value for table salt, remains zero.

The generated subset is in `shared/nutrition-data.js`. To rebuild it, download the [official ZIP](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip) and run:

```sh
python3 tools/build-nutrition-data.py /path/to/FoodData_Central_sr_legacy_food_csv_2018-04.zip
```

The extraction script checks the source nutrient units and copies observations by FDC ID. It does not generate or ask a language model for nutrient values.

## Calculation

For each included ingredient:

```text
ingredient nutrient = edible grams × source nutrient per 100 g / 100
recipe subtotal = sum of known ingredient values
selected servings = recipe subtotal × selected portions / original recipe yield
```

Intermediate values are not rounded; the interface displays up to one decimal place. For example, 300 g raw tomatoes and 100 g raw whole egg contribute 54 + 143 = 197 kcal to a two-serving recipe, or 98.5 kcal per serving. This excludes any unmeasured cooking oil or other ingredients.

Automatic matching uses explicit Chinese/English aliases and compatible preparation states. Measured grams can be used directly. Generic oil, drained beans without a matching reference, and other ambiguous foods may need a reference selected manually. A whole recipe with only some usable ingredients is labelled **Partial estimate · known subtotal only**. Nutrients missing from an otherwise usable food have their own coverage count. No known observations produces a dash, not zero.

## Confirming a weight

Use **Ingredients and calculation → Complete/Adjust** to select a reference and enter **total edible grams for the entire original recipe**. The original recipe yield is shown beside the field. Remove shells and bones from the weight. Confirm the reference variety and preparation state before saving.

Pieces, spoons, milliliters and “to taste” amounts do not automatically become grams. If USDA provides a compatible portion, the editor offers a button that explicitly fills its reference weight. Two large eggs, for example, can use the source’s 50 g per egg to fill 100 g. That is a reference, not a measurement of the user’s eggs. Cancel leaves stored data untouched. The editor never changes recipe quantities, shopping requirements or pantry stock.

Saved references stay on the recipe and travel with JSON backups and new cooking snapshots. Later edits to ingredient name, identity, amount, unit or preparation invalidate that ingredient’s saved reference until it is confirmed again. A changed reference-data version also invalidates it. Raw/cooked mismatches are rejected; an unspecified state needs explicit confirmation. A stale open editor cannot overwrite a changed recipe, and failed storage writes leave the previous recipe intact. **Use automatic matching** removes the manual override.

## Limits and next steps

Reference varieties, brands and preparation methods differ. These are ingredient-based estimates: cooking retention, discarded liquid, absorbed oil and changes in water content are not modeled. Enter the oil actually used and retained when that amount is known. The app does not estimate nutrient deficiency, supplement doses or personalized intake targets.

The daily view sums actual eaten portions from cooking records. It never uses planned or made portions as a substitute for eaten portions. Empty days have no estimate; unknown intake produces dashes. An explicitly entered zero produces zero even if the recipe lacks nutritional detail. Otherwise, partial ingredients and missing source nutrients contribute only their known values, with per-nutrient coverage and incomplete-data messages.

New cooking records store an optional version-1 `nutritionBasis`: per-serving values, ingredient coverage, source data version, signature of the recipe quantities/reference choices and capture time. Later edits to the recipe library or source dataset do not change those numbers. Editing the record’s eaten portions scales that saved basis; changing its date moves the contribution to that date. Stock, photo and note operations preserve the basis. JSON backups validate and retain it without changing the backup or kitchen payload version.

Older records without a basis remain readable and are not rewritten during load or ordinary edits. Their saved recipe snapshot is estimated using the bundled reference version and is labelled accordingly; later recipe-library edits are never pulled into history. Data is incomplete if that saved recipe has unresolved weights or references. The daily view only describes lunch and dinner recorded in this app; it does not assert that every meal or snack has been logged.

Recommendation work follows this milestone. Optional weather describes cooking context; it is not evidence of a nutritional deficiency. See [the roadmap](ROADMAP.md).
