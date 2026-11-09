# Development log

## 2026-11-08 · Milestone 1

Implemented a minimal warm cream/orange interface with an original bowl illustration, persistent Chinese/English switch, and navigation between three explicit preview states. Pantry entry and recipe logic are intentionally the next separate milestones.

### Validation

- `npm run check`: both JavaScript modules pass syntax checks.
- In-app browser: switch Chinese → English → reload; English selection and document language persist. Switch back to Chinese.
- Navigate home → pantry → home and verify selected navigation state and translated empty content.
- At 390px and 320px widths, document width equals viewport width; inspected phone layout visually.
- Checked console errors during the exercised flows.

### Next small step

Ingredient model and quick pantry entry: stable ingredient IDs, aliases, quantity notes, storage location and optional user-entered dates. Preserve structured quantity and raw/cooked-state requirements for future recipe nutrition.

### Limits

No ingredient records, working recipe catalog, editable shopping list, offline/install support, nutritional totals or hosted service yet. Language is the only stored user preference.


## 2026-11-08 · Reference-led layout revision

Reviewed the owner's Civa post text and first four images. Removed promotional copy, large hero and decorative footer. Changed the shell to white with today/tomorrow menu groups, plate placeholders, light gray-green checks, want-to-cook/cooked library views and bottom navigation. Recipe entry and meal assignment remain unimplemented.

Validation: `npm run check`; browser navigation between home and wanted/cooked states; English switch and reload persistence; Chinese rendering; page width equals viewport at 320px and 390px; no console errors during checked flows.

Next feature is now the personal recipe library, followed by daily meal planning, then pantry matching. Structured quantities and servings remain prerequisites for later nutrition estimates.


## 2026-11-08 · Personal recipe library (local, not committed)

- Preserved the local rebrand to 好好吃饭 / Eat Well.
- Create/edit/detail/confirmed-delete; independent wanted/cooked labels; all/wanted/cooked views; cuisine and name/ingredient search.
- Structured quantities, units, raw/cooked state, servings and ordered instructions. Explicit “to taste” amounts remain unknown, not zero.
- Optional local JPEG/PNG/WebP photo selection, conversion to bounded JPEG and preview/removal.
- Versioned localStorage records. Invalid stored records are reported without overwriting them. Failed writes keep drafts open.
- Explicit optional sample recipe. No automatic inventory or recipe seeding.

Validation: recipe model/persistence and bilingual coverage tests; JavaScript syntax checks; browser create → edit (2 to 3 servings, 300g to 450g, add salt to taste) → photo selection → cooked flag → reload; cuisine/search; delete cancel then confirm for a test-only record. Test record removed; an explicitly labeled tomato-and-eggs sample remains for review. Phone form/layout checks and console inspection performed.

Limits: recipe amounts are recorded, not nutritionally analyzed. “Cooked” is a label, not a dated food-intake log. Meal scheduling and pantry tracking are the next steps. No cloud sync, install/offline behavior or deployment. All changes await review; no commit or push authorized.


## 2026-11-09 · Today/tomorrow menu planning (local, delayed commit/push authorized)

Implemented four date-bound slots (today/tomorrow × lunch/dinner). Each slot holds one saved recipe and a planned serving count from 0.25 to 100 in quarter-serving increments. Tap a plate to choose/search recipes, replace the current recipe, change portions or remove the assignment. Home renders the current recipe name and optional photo. Unresolved/deleted recipe references remain visible and replaceable. Planned portions do not mark a recipe cooked or record dietary intake.

Storage: versioned localStorage collection separate from recipes, unique date/meal keys, validation and no silent overwrites of corrupt records. Saves merge against the latest stored collection. Other-tab changes and returning to the app refresh local data; local date rollover updates today/tomorrow. Historical entries remain stored but there is no history/calendar UI yet.

Validation: 15 automated tests across recipe, translation and menu models. Browser checks: assign today lunch at 1.5 servings → reload; replace with a temporary photo recipe and verify photo load; delete that temporary recipe and verify missing-reference state; replace with the existing sample; assign tomorrow dinner at 2 servings; remove it while today's lunch remains intact; re-add it in English. Temporary test recipe removed. A 320px English picker overflow was found and fixed; dialog width now equals scroll width. 390px phone layout and console errors checked. Review data consists only of the previously labeled sample recipe assigned to today's lunch and tomorrow's dinner.

Timing: do not commit early. Prior recipe/logo source is frozen at /private/tmp/eat-well-recipe-stage-20261109/source with a hash manifest alongside, for the separate 20-minute task. New menu files, working-tree integrations and this documentation belong to the separate one-hour task. Neither automatic task should overwrite the working tree or include unrelated user changes.

Known scope: one dish per meal; no meal history UI, automatic ingredient consumption, calorie totals, actual-intake tracking, cloud sync or deployment.


## 2026-11-09 · Pantry, typography and README (local; scheduled 09:00)

Implemented pantry create/edit/confirmed-delete with separate batches, quantities in g/kg/ml/L/pieces/packs/bottles, fridge/freezer/cupboard locations and optional user-entered dates. A common-food catalog recognizes Chinese/English aliases while allowing custom ingredients; raw rice and cooked rice remain distinct. Existing recipe identities are preserved. Entries search across the original name, both display languages and known synonyms. Filters compose location with today/within-three-days/past-date/no-date groups. No safety judgment, automatic consumption, shopping list or recipe matching is implemented yet.

Inventory uses a separate versioned localStorage collection. Writes validate and merge the latest collection; unreadable data is not overwritten. Editing an entry removed in another tab reports the conflict. Date calculations use calendar days and distinguish missing dates from zero days.

Typography now uses one shared UI font stack across text, inputs, selects, options and buttons. Form fields use 16px text in both languages, while headings and helper text retain their appropriate hierarchy. Native menu appearance can still follow the platform.

README rewritten for repository readers: project features, local setup, data/storage, code structure, checks and next features. No owner instructions, chat workflow or commit schedules remain in README. GitHub repository renamed to xuan-2048/eat-well and origin updated; local checkout directory remains unchanged.

Verification: 22 automated tests pass. Browser create 西红柿/300g/date → recognized 番茄/Tomatoes → reload → search tomato; edit to 450g/freezer/past date; combine date/location filters; add custom sauce with bottle unit/no date; switch English; check 320px editor width equals scroll width; cancel and confirm deletion. All temporary pantry records removed. Computed font families and form sizes checked, including dropdown options. 390px form inspected visually.

Submission: prior menu task keeps its own checked snapshot. This stage, including fonts and README, is explicitly authorized for 2026-11-09 09:00 America/New_York commit/push; no early commit. The menu checkpoint README was separately cleaned without including future pantry implementation claims.


## 2026-11-09 · Consolidated handoff and README screenshots

Owner confirmed all completed local changes should commit/push together at 01:07 America/New_York; the separate 09:00 task was deleted. Active task eat-well-2 now targets the real working-tree changes instead of the old stage snapshots. GitHub origin is https://github.com/xuan-2048/eat-well.git.

README now contains three real local-app screenshots in docs/images: menu.jpg, recipe.jpg and pantry.jpg. Sample recipe is identified in the caption; pantry screenshot is an unsaved example and no inventory was added for the screenshot. Removed internal development/authorization wording from README and verified all image references exist.

Expanded future scope discussed with owner: multiple dishes per meal, serving-based ingredient scaling, pantry missing-item comparison, shopping list, weekly menu/history, export/restore and later nutrition. These remain planned and are not included as implemented features in this handoff.
