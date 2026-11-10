# Future nutrition analysis · 后续营养分析

Status: planned, not implemented. Requested by the owner on 2026-11-08.

## Useful first slice

Estimate a recipe's energy, protein, fat, carbohydrate and fiber per serving. Show ingredient contributions, data sources and incomplete data. The cooking log already records consumed portions separately from portions made; use those entries to aggregate daily nutrient intake after recipe estimates are available.

先做每道菜、每份的营养估算，再做实际吃了多少和每日汇总。维生素与矿物质、补充剂记录单独作为后续扩展，避免与基础菜谱功能同时铺开。

## Data decisions to preserve in earlier milestones

- Stable ingredient IDs independent of display language; explicit aliases.
- Structured quantity and unit, plus raw/cooked state and recipe yield/servings.
- Conversion to edible grams only with an explicit conversion; no guessed conversions for arbitrary “cups” or “pieces”.
- Keep source identifier, source nutrient unit, per-100g basis where provided and retrieval/version metadata.
- Missing nutrient data is unknown, never silently zero.
- Track planned servings separately from the amount actually consumed.
- If supplements are later supported, record serving size, constituent nutrients and units independently; do not sum incompatible units or forms.

## Sources to evaluate during implementation

- [USDA FoodData Central API](https://fdc.nal.usda.gov/api-guide/): candidate food composition source. Evaluate dish coverage, API access, units and attribution before integration.
- [NIH nutrient reference overview](https://ods.od.nih.gov/HealthInformation/nutrientrecommendations/): reference terminology if personalized intake comparisons are added later.

These links are candidates, not a completed API integration. Any comparison to reference intakes must identify the selected standard and applicable population. The product will describe estimated intake and dietary patterns, not diagnose deficiency or prescribe supplement doses.

## Acceptance checks for the future milestone

Known recipe totals can be reproduced from source amounts; serving scaling is consistent; missing data is visible; raw/cooked mismatches and unsupported units are flagged; ingredient and reference sources can be inspected.


## Later: choosing one dish

The recommendation milestone follows recipe estimates and daily intake. It combines recorded intake with available ingredients, preferences, cooking time and optional city-level weather. Location, temperature, humidity, season and meal time are context for choosing a dish, not evidence of a nutrient deficiency. Incomplete meal records stay visible as incomplete; missing nutrient values are not zero. The full implementation checklist is in [ROADMAP.md](ROADMAP.md).
