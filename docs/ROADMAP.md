# Incremental roadmap / 逐步开发计划

Started: 2026-11-08 (America/New_York). Milestones describe scope, not a promise of unattended future execution.

| Step | Small deliverable | Acceptance check | Status |
| --- | --- | --- | --- |
| 0 | Project definition, reference research, prototype catalog | Docs distinguish implemented features from plans | Done |
| 1 | Minimal mobile app shell and Chinese/English switch | Both languages render at phone width; selection persists after reload | Done |
| 2 | Personal recipe library: add/edit/delete and want-to-cook/cooked status | Persist bilingual-compatible dish records, cuisine, ingredient quantities, units and servings; handle unknown inputs | Done locally; awaiting review |
| 3 | Today's/tomorrow's meal planning | Assign a saved dish to a meal, replace/remove it, and preserve planned date and servings | Done locally; delayed commit/push authorized |
| 4 | Ingredient model and quick pantry entry | Add/edit/remove, alias handling, optional dates and reload persistence | Done locally; 09:00 commit/push authorized |
| 5 | Multiple dishes per meal and portion scaling | Add/remove individual dishes without replacing the whole meal; scale measured ingredients and preserve unknown amounts | Planned |
| 6 | Pantry comparison and missing ingredients | Match aliases, compare compatible units and show uncertain conversions explicitly | Planned |
| 7 | Shopping list from selected days | Aggregate needs, subtract usable known stock, deduplicate and keep purchased state | Planned |
| 8 | Weekly menu and cooking history | Browse dates, copy a meal, and distinguish a plan from a confirmed cooking record | Planned |
| 9 | Export and restore | Versioned JSON backup with validation and explicit merge/replace behavior | Planned |
| 10 | Nutrition per recipe and serving | Source-backed quantities, consistent serving calculations and visible unknown data | Planned |
| 11 | Actual meal intake | Record consumed portions separately from plans and aggregate daily nutrition | Planned |
| 12 | Installable/offline PWA | Manifest/icons, HTTPS, cache upgrade and real phone installation checks | Planned |

Priorities updated after reviewing the owner's Civa reference on 2026-11-08: recipe library and meal planning precede pantry matching. Today's UI remains a shell; the updated plan does not mean those features are implemented.

## Checkpoint policy / 提交节奏

Current authorization: combine completed menu, pantry, typography, README and real screenshots into one commit/push at 2026-11-09 01:07 America/New_York. The owner explicitly confirmed this and canceled the separate 09:00 task. Do not use prior stage snapshots for this merged commit. Other future features are not included in that authorization.


- One coherent slice per commit, following an appropriate check.
- During longer work, aim for a checkpoint after roughly 30–60 minutes when a coherent change is ready; do not wait merely to space out timestamps.
- Push completed commits before handing off a development session.
- Record what actually changed, what was checked and the next small step.
- User-requested changes may reorder or reduce milestones.

## Scope boundaries / 首版边界

Local-first storage before account sync. No image recognition, autonomous recipe generation, nutrition diagnosis or automatic food-safety decisions in the initial scope. Cuisine tags describe the recipe's intended style and may use “inspired” where appropriate.

Step 1 uses dependency-free HTML, CSS and JavaScript to keep the first language/layout milestone small. Future framework and backend changes should be justified by a feature. Visual direction: [near-white menu layout with minimal copy](DESIGN.md). Preserve the quantity and provenance requirements in the [nutrition plan](NUTRITION.md) when implementing recipe data.
