# Incremental roadmap / 逐步开发计划

Started: 2026-11-08 (America/New_York). Milestones describe scope, not a promise of unattended future execution.

| Step | Small deliverable | Acceptance check | Status |
| --- | --- | --- | --- |
| 0 | Project definition, reference research, prototype catalog | Docs distinguish implemented features from plans | Done |
| 1 | Minimal mobile app shell and Chinese/English switch | Both languages render at phone width; selection persists after reload | Planned |
| 2 | Ingredient model and quick pantry entry | Add/edit/remove, alias handling, unknown input feedback and reload persistence | Planned |
| 3 | First three structured recipes | Bilingual titles, ingredients, quantities, steps and cuisine; data validation | Planned |
| 4 | Matching and cuisine filters | Available/missing ingredients explained; staples treated explicitly; deterministic tests | Planned |
| 5 | Expand the catalog and improve date-aware sorting | Validate recipe fields; date changes and incomplete data covered | Planned |
| 6 | Shopping list | Missing ingredients added, duplicates merged, purchased items managed | Planned |
| 7 | PWA shell and deployment | Manifest/icons, offline behavior, HTTPS preview, actual phone installation checks | Planned |

## Checkpoint policy / 提交节奏

- One coherent slice per commit, following an appropriate check.
- During longer work, aim for a checkpoint after roughly 30–60 minutes when a coherent change is ready; do not wait merely to space out timestamps.
- Push completed commits before handing off a development session.
- Record what actually changed, what was checked and the next small step.
- User-requested changes may reorder or reduce milestones.

## Scope boundaries / 首版边界

Local-first storage before account sync. No image recognition, autonomous recipe generation, nutrition diagnosis or automatic food-safety decisions in the initial scope. Cuisine tags describe the recipe's intended style and may use “inspired” where appropriate.

Technical framework selection is part of step 1. Avoid adding infrastructure until the feature requires it.
