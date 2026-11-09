# Roadmap

Eat Well connects a personal recipe library with meal planning, fridge stock and grocery shopping. The current app runs locally in a phone browser with Chinese and English interfaces.

| Step | Deliverable | Status |
| --- | --- | --- |
| 1 | Mobile layout, shared typography and language switch | Implemented |
| 2 | Recipe library with quantities, photos, cuisine and wanted/cooked labels | Implemented |
| 3 | Today/tomorrow lunch and dinner planning | Implemented |
| 4 | Fridge batches, ingredient aliases, locations and date filters | Implemented |
| 5 | Several dishes per meal and serving-based ingredient previews | Implemented |
| 6 | Selected-day ingredient check with compatible unit and preparation matching | Implemented |
| 7 | Shopping list, purchased state and confirmed actual-quantity pantry receipt | Implemented |
| 8 | Weekly menu, copying meals and selected-date shopping | Implemented |
| 9 | Cooking records with actual portions, notes and photos | Planned |
| 10 | Versioned export and restore | Planned |
| 11 | Nutrition per recipe and serving | Planned |
| 12 | Daily nutrition from actual intake | Planned |
| 13 | Offline support and home-screen installation | Planned |

## Current milestone

Step 8 adds a Monday-to-Sunday selector, previous/next week navigation, direct date selection, meal-copy previews and custom shopping date ranges. Copying preserves destination dishes and skips existing recipe IDs. Source and destination edits detected before copying require another review. Ingredient checks allocate stock once across the chosen range, and generated shopping entries retain their source dates. Existing daily menus and shopping entries remain compatible.

Validation includes automated model/persistence tests and English/Chinese browser checks at phone widths. README screenshots use the English interface with separate demo data and are displayed individually.

## Scope

Keep data local before adding accounts or cloud sync. Stock matching does not guess weights for pieces or packs, convert volume to weight, infer safe food dates or mark a planned meal as eaten. Nutrition work will need sourced food data, preparation states and visible unknown quantities; see [the nutrition notes](NUTRITION.md).

Visual direction: [DESIGN.md](DESIGN.md). Completed work and verification: [PROGRESS.md](PROGRESS.md).
