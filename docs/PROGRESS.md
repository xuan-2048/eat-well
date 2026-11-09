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

## 2026-11-09 · Multiple dishes, ingredient checks and shopping

Implemented the four approved features locally:

- Date-bound meals now contain independent dish assignments. Add, replace, change servings or remove a single dish without altering its neighbours. Version-1 single-dish menus load without writes; the first version-2 save preserves the original payload under a backup key.
- Ingredient previews in recipe details and the meal picker scale measured quantities by planned servings. “To taste” remains unknown, and source recipe amounts remain unchanged.
- Today/tomorrow/both-days checks aggregate common-food aliases and allocate each pantry batch once. kg/g and L/ml convert; incompatible units, uncertain preparation and unmeasured quantities need explicit review. Stock dated before a planned meal is excluded for that date. Deleted recipe references raise a warning.
- Shopping regeneration replaces pending menu items while retaining manual, purchased and received entries. Compatible requirements aggregate; compatible manual quantities merge. Purchased is distinct from received. Receipt confirmation records actual quantities separately and uses deterministic pantry IDs to make retries safe after a partial write failure.

Pantry records now optionally include preparation state, with legacy records preserved. New UI includes a fourth Shopping navigation tab, day scopes, quantity comparisons, manual confirmation and purchase/receipt groups. Saved collections are refreshed before mutations. Storage failures leave form drafts open.

README expanded with the real workflow, comparison rules, local setup, storage and migration details, source layout, checks and remaining features. Replaced the three-column image table with individual larger English screenshots; added the full ingredient-check image. Demo records live on localhost:8013, separate from the owner's localhost:8011 data.

Verification: 39 automated tests pass; npm run check passes. Browser checks include adding two dishes to the same lunch, reload persistence, removing one without affecting the other, and a 2→3 serving preview (300→450 g tomatoes and 2→3 eggs). Two dishes requiring 650 g tomatoes minus 0.2 kg stock produce a 450 g gap. Repeated list generation does not duplicate items. Pack-versus-piece garlic and to-taste oil/salt require review. Purchasing 500 g tomatoes adds a separate 500 g batch; purchasing 6 eggs for a 3-egg requirement displays and stores the actual 6. After receipt, the stock comparison counts these groceries. Automated tests also simulate a failed second receipt write followed by retry, preserving one pantry batch and its original confirmed quantity. English/Chinese workflow views checked; page width equals viewport at 320 px, including receipt and meal-picker dialogs; 390 px screenshots captured; no warning/error logs in tested flows.

Submission checkpoint: the owner moved this release forward to 2026-11-09 and requested an immediate commit and push. It follows menu/pantry checkpoint bb62a83. Weekly planning, cooking history, backup/restore and nutrition remain planned. The superseded 2026-11-10 scheduled task will be removed after a successful push.


## 2026-11-09 · Weekly menu, meal copying and date-range shopping

Implemented locally: a weekly Menu view beside Today & tomorrow, Monday-based day buttons with dish counts, previous/next week, direct date selection and return to today. The selected day uses the existing multi-dish lunch/dinner cards and independent planned servings. Existing menu storage and records remain unchanged.

Copy meal previews additions, existing destination dishes and skipped duplicate recipes. Copies get new dish IDs, keep source servings and do not stay linked to the source. Existing destination dishes and their servings are preserved. Same-slot copies, missing source recipes and empty source meals are rejected. A refreshed source/destination signature prevents saving a stale preview after another tab edits the menu; storage failures keep the dialog open.

Ingredient checking now supports This week and inclusive custom ranges up to 31 days, as well as the existing day presets. Check this week uses the week currently displayed in Menu. Reversed, missing, invalid or oversized ranges block generation. New generated shopping entries retain selected source dates; existing records without this optional field continue to load. Updating a range replaces pending menu-generated lines while preserving manual, purchased and received entries.

Verification: 45 automated tests cover the previous workflow plus Monday-based weeks across DST/year boundaries, inclusive range validation, multi-dish copying and duplicate skipping, untouched source/target servings, persistence and a future-date shortage-to-shopping round trip. Browser checks on separate localhost:8013 demo data: future Wednesday lunch created with an existing four-serving dish; copying Monday lunch adds only the pasta and preserves the four-serving dish. Reload retains the future plan. A second copy to the next week's dinner switches to that target week and retains independent portions. Invalid same-slot and duplicate-only copies are blocked. A cross-tab change from 3 to 3.5 portions refreshes the preview and asks for confirmation before any copy; the temporary portion edit was restored. Date-range checks for November 9–11 show 1,450 g tomatoes required, 700 g stock counted once and a 750 g gap. Generated entries show those dates, with no duplicates on repeated updates. A reversed range hides generation until corrected. English/Chinese views, December/January week navigation, 320 px page/dialog widths and 390 px screenshots checked; no console warnings/errors in the tested flows.

README updated for the weekly workflow and date-range rules. English menu, copy-preview, comparison and shopping screenshots are displayed individually at a larger width. Original localhost:8011 user records were not used for demo mutations.

Submission checkpoint: the scheduled 2026-11-09 15:19:21 America/New_York commit/push did not complete. A follow-up status check found the remote still at base 7cb320979490d41e3daf2757d30cddea9fe568e6 and all milestone changes preserved locally. The original authorized submission is being completed after fresh validation, using the actual commit time. The obsolete one-time task will be deleted after a verified push. Cooking records, stock consumption, backups and nutrition remain planned.
