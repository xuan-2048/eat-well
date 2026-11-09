# Incremental roadmap / 逐步开发计划

Started: 2026-11-08 (America/New_York). Milestones describe scope, not a promise of unattended future execution.

| Step | Small deliverable | Acceptance check | Status |
| --- | --- | --- | --- |
| 0 | Project definition, reference research, prototype catalog | Docs distinguish implemented features from plans | Done |
| 1 | Minimal mobile app shell and Chinese/English switch | Both languages render at phone width; selection persists after reload | Done |
| 2 | Personal recipe library: add/edit/delete and want-to-cook/cooked status | Persist bilingual-compatible dish records, cuisine, ingredient quantities, units and servings; handle unknown inputs | Done locally; awaiting review |
| 3 | Today's/tomorrow's meal planning | Assign a saved dish to a meal, replace/remove it, and preserve planned date and servings | Planned |
| 4 | Ingredient model and quick pantry entry | Add/edit/remove, alias handling, optional dates and reload persistence | Planned |
| 5 | First three structured sample recipes and pantry matching | Valid bilingual recipe data; explain available/missing ingredients; deterministic ranking and cuisine filtering | Planned |
| 6 | Expand catalog and date-aware sorting | Validate recipe fields, local date boundaries and incomplete inventory | Planned |
| 7 | Shopping list | Missing ingredients added, duplicates merged, purchased items managed | Planned |
| 8 | PWA shell and deployment | Manifest/icons, offline behavior, HTTPS preview, actual phone installation checks | Planned |
| 9 | Nutrition estimates per recipe and serving | Traceable amounts, sources, serving calculations and explicit unknown data | Planned |
| 10 | Meal intake and daily nutrition summary | Separate actual consumption from plans; do not treat unknown nutrients as zero | Planned |

Priorities updated after reviewing the owner's Civa reference on 2026-11-08: recipe library and meal planning precede pantry matching. Today's UI remains a shell; the updated plan does not mean those features are implemented.

## Checkpoint policy / 提交节奏

Current override: **do not commit or push without explicit owner approval after local review**. The earlier automatic checkpoint policy below applies only after authorization.


- One coherent slice per commit, following an appropriate check.
- During longer work, aim for a checkpoint after roughly 30–60 minutes when a coherent change is ready; do not wait merely to space out timestamps.
- Push completed commits before handing off a development session.
- Record what actually changed, what was checked and the next small step.
- User-requested changes may reorder or reduce milestones.

## Scope boundaries / 首版边界

Local-first storage before account sync. No image recognition, autonomous recipe generation, nutrition diagnosis or automatic food-safety decisions in the initial scope. Cuisine tags describe the recipe's intended style and may use “inspired” where appropriate.

Step 1 uses dependency-free HTML, CSS and JavaScript to keep the first language/layout milestone small. Future framework and backend changes should be justified by a feature. Visual direction: [near-white menu layout with minimal copy](DESIGN.md). Preserve the quantity and provenance requirements in the [nutrition plan](NUTRITION.md) when implementing recipe data.
