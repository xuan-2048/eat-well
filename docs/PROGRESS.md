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


## 2026-11-09 · Cooking history and confirmed stock use (local review)

Added Cooking log navigation and record actions beside menu dishes. Records can also start from saved recipes. Date and lunch/dinner filters, create/edit/detail/confirmed-delete, made portions, optional personal intake (unknown stays null; zero is valid), notes and compressed local photos are implemented. Snapshot copies retain original ingredient quantities and steps after source-recipe changes or deletion. Each planned dish links to at most one record; manual records do not infer plan links.

Stock-use previews scale by servings made, allocate compatible batches once and show uncertain or unmeasured requirements. Actual-use fields stay in each batch's stored unit. A required acknowledgment confirms that blank/zero amounts are not deducted. Saving a record alone does not alter stock. Repeating a confirmed deduction is a no-op. Undo returns quantities to current compatible batches, recreates emptied batches, or restores a separate batch if identity/unit changed. Deleting a deducted record restores stock and removes the record in the same write. Made portions are locked while a deduction is applied; personal intake, notes and photos remain editable.

Moved pure stock validation into pantry-data.js. Pantry and cooking history now share a validated version-2 envelope under the existing pantry key, making record/stock transitions one localStorage write. First migration backs up the exact version-1 pantry payload. A durable purchase-receipt marker remains after a stock batch is consumed or removed, preventing a failed shopping-receipt write from re-adding groceries on retry; ordinary pantry/cooking writes preserve these markers. The received shopping group now says Received in English to distinguish receipt history from current stock. Normal pantry writes and purchase receipts preserve history; corrupt data is not overwritten. Failed writes preserve both stock and record state. Recipe and cooking photo forms share photos.js compression. A versioned browser import map keeps the complete module graph on one preview revision, preventing mixed cached/new modules; the latest browser reload shows the Received shopping label and no console warnings/errors.

Linked plans with cooking records are excluded from shopping requirements; deleting a record makes its plan pending again. Old meal-plan and shopping storage remain compatible. UI checks observed changes before saving; this remains local browser storage rather than a multi-user database.

Validation: 61 automated tests pass, including migration/backup, immutable recipe snapshots, unknown versus zero intake, source-plan deduplication, stale edits, portion validation, cooked-based scaling, original-unit conversion, atomic failure/retry, overuse rejection, explicit incompatible-unit usage, undo after later stock changes, full-batch restoration, changed-unit restoration, deletion refunds, bilingual copy and pending-plan filtering. Existing recipe, menu, pantry and shopping tests also pass.

Browser checks use only separate localhost:8013 demo data: log the three-serving tomato-and-eggs menu with personal intake 1.25; confirm 0.2 kg plus 250 g tomatoes and 3 eggs, reload and verify remaining stock; check shopping excludes that source plan; undo and verify the original batches/quantities return. Create a temporary backdated pasta dinner with unknown intake and a compressed photo, reload/filter it, explicitly confirm 0.1 pack garlic, cancel then confirm deletion and verify the stock refund. Temporary record/photo removed. Edit made/eaten portions while undone and verify 600 g/4-egg preview for four made portions; restore the sample to three made and 1.25 eaten. Another-tab record edit invalidates an open deduction preview; refreshing and confirming succeeds. Applied records expose a read-only made field and allow note corrections without another deduction. English/Chinese views, 320 px page/dialog widths and 390 px review screenshots checked with no console warnings/errors in tested flows.

README includes the new workflow, storage details and English history/confirmation screenshots. The retained demo record is explicitly sample data, with confirmed deduction visible. Original localhost:8011 records were not mutated for tests. Current owner request: local work for review only; no commit, push or scheduled submission for this stage. Base remains f2e7a80aeedb89497bbdbf1a300027a047990f47.


## 2026-11-09 · Consistent dropdown typography (local review)

Replaced platform-rendered select popups with a shared select-only combobox presentation. Native select values, names and required validation remain available to the existing forms; the visible trigger and expanded options use the same UI font, 16 px size, normal weight and dark text. The popup follows the near-white/sage page styling and is shared by meal, cuisine, storage, unit and recipe controls. It handles dynamically rendered forms, disabled options, viewport placement and dialog top-layer placement.

Browser checks: Chinese meal options match the trigger's computed font family/size/color; click, arrows, Enter, Escape cancellation and Tab commit/focus work. English cuisine typeahead selects Italian and filters recipes correctly. A required recipe selection blocks an empty cooking form and presents a visible error; selecting pasta and dinner saves the correct temporary record. Escape closes the dropdown while keeping its editor open. The temporary record was deleted from the separate demo origin. At 320 px, page and dialog scroll widths equal their client widths; no console warnings/errors in these flows. Keyboard and pointer behavior were checked; no screen-reader certification is claimed. All work remains local, with no commit or push.

Next proposed milestone is versioned export and restore, including photos, a restore preview and a backup of current data before replacing it. Nutrition summaries remain after that milestone.


## 2026-11-09 · Backup, restore and smaller dropdowns (local review)

Implemented version-1 Eat Well JSON export and import with an allowlist of five app collections: recipes/photos, plans, shared pantry/cooking/receipt state, shopping and language. Files are checked before preview, with collection/photo counts, missing-recipe warnings, a required replacement acknowledgment and a 20 MB file limit. Import replaces the complete set. A stale preview is rejected if observed data changed. Recovery data can be previewed, downloaded or restored; the current data then becomes the next recovery copy.

A legacy-compatible storage adapter reads existing individual keys until the first restore. Restore commits all target values and the exact preceding values in one localStorage envelope. A quota/write failure leaves both current data and recovery unchanged. Subsequent model writes preserve the recovery and other collections. Legacy-key cleanup happens only after the atomic write and is optional. Updated app tabs reload on a new restore generation; ordinary collection writes refresh their data. This is local browser storage, not multi-user transaction isolation. Recovery consumes additional space and is removed with browser data; downloaded files remain the portable backup.

Validation: 75 automated tests pass, including complete photo/ledger/receipt roundtrips, undo after import, atomic write failure, exact recovery swaps, invalid nested data, duplicate IDs, file/version limits, legacy payload migration, corrupt-data preservation and independent adapter reads. Browser checks on localhost:8013 downloaded a real JSON file, rejected an invalid version, previewed replacement with empty data, blocked confirmation without acknowledgment, restored and reloaded, then recovered all original counts and language. Remaining inventory stayed 250 g tomatoes, 3 eggs and 1 pack garlic. No console warnings/errors in those flows. English backup screenshot added to README individually at width 480.

Dropdown triggers and options are now 14 px, with smaller option padding; browser-computed sizes match. At 320 px, backup dialogs and pages have no horizontal overflow. The original localhost:8011 data was not used for restore tests. No commit, push or scheduled submission.

## 2026-11-09 · Horizontal meal browsing (local review)

Each lunch/dinner now has a horizontal dish row with native touch/trackpad scrolling, snap alignment, overflow-aware previous/next controls and keyboard arrows/Home/End. The All control switches a meal to an overview grid; Row returns to scrolling. Dish counts are visible, lunch and dinner stay separate, and empty meals retain their add action. Reduced-motion preferences disable smooth scrolling. Controls update after scrolling and resizing; the view choice survives page renders within the session.

Browser validation used a third sample Tomato soup recipe added only to the separate demo origin. A three-dish lunch overflowed only its own row (436 px content in a 326 px row at 390 px viewport); next moved to the end and updated disabled controls. All showed all three cards in a grid. Both views stayed within a 320 px page. The added sample also verified normal recipe and plan saves after restoration. An English screenshot was added to README. Original user data remains unchanged; all changes remain uncommitted.


Future scope requested: added a recommendation checklist covering city-level location, weather temperature/humidity, season and meal timing, available cooking time, actual recorded nutrient intake, pantry stock, preferences and dietary exclusions. The proposed UI offers one dish with reasons, missing ingredients, another suggestion and an explicit add-to-menu action. Planned after nutrition estimates and daily totals; no weather API, location collection or recommendation engine was implemented in this milestone.


## 2026-11-09 · Photo framing and online recipe examples (local review)

Recipe and cooking photo uploads now open a circular plate crop editor with dragging, slider/pinch zoom, keyboard/button movement, reset, apply and cancel. Applying updates the form draft; saving the form persists a square crop plus its compressed original and normalized framing, allowing later zoom-out/repositioning. Bounded inline JPEG sources and frame coordinates are validated. Cooking snapshots strip photo-edit sources to avoid duplicating recipe originals; actual record photos retain their own editable source. A replaced catalog photo drops the old image attribution while retaining its cooking reference.

Added six opt-in bilingual recipe examples with structured quantities and adapted steps. All photos are bundled locally from Wikimedia Commons; author/uploader, source page, license and crop/resize notice appear in saved recipe details and assets/recipes/CREDITS.md. Cooking references are documented in RECIPE_CATALOG.md. Photos are illustrative and not claimed to be the exact source recipe's result. Save-all reads fresh data after processing photos and skips existing catalog IDs. Save failures do not write a partial set.

Browser checks: demo bulk-save adds all six, saved controls disable duplicate imports, source/author/license links render, and photo edits retain the 1.60× zoom after save/reload/reopen. Canceling a changed crop returns to the original frame. Pointer movement, arrow controls and square preview geometry were checked; no console warnings/errors in tested flows. English editor and catalog screenshots were added individually to README. Geometry, frame persistence, source URL and bilingual catalog tests supplement the existing suite.

The user explicitly asked to see the examples in their own local app. Six examples were added through the UI to localhost:8011, preserving the original recipe (seven total). Their supplied tomato-and-eggs photo was cropped at 1.60× and saved to the existing recipe; after reload, both existing planned plates display it. The supplied private photo and its proof screenshot are not added to repository assets. No plans, pantry quantities or cooking records were changed on that origin. No commit or push.


## 2026-11-09 · Plate choices and photo removal (local review)

Added four locally saved ceramic styles: porcelain, sage rim, soft blue rim and fluted ivory. The header control previews all four; selection updates menu plates and photo framing. Backup version 2 includes the plate preference, accepts old version-1 files with a default style, and normalizes older atomic envelopes without discarding active data or recovery copies. At 320 px the picker dialog and page have no horizontal overflow; styles switch and persist after reload.

The user then reduced photo replacement to a single image and ultimately requested all photos be removed. Final state: no preset food photos or image downloads are bundled; the six recipe examples retain text and source links only. The plate picker uses a small code-drawn sprig rather than a food photograph. Photo upload/framing remains available for future voluntary use.

Added a recoverable Clear all photos action. It removes recipe/record photos, compressed editing originals and snapshot photos while preserving text, plans, inventory, shopping and appearance. Affected cooking revisions advance to invalidate stale edits; confirmed stock ledgers remain unchanged. The full preceding state is kept as the normal local recovery copy in the same atomic write. Failed writes leave images untouched; repeating an already-complete clear does not overwrite the recovery copy.

On localhost:8011, the authorized clear completed and reload showed 7 recipes, 2 planned dishes and 0 current photos. Sage plate style remained selected. Downloaded food images and photographic editor/catalog screenshots were removed from the project. Private supplied originals outside the app were not modified. Validation: 86 tests pass, including photo removal/recovery, quota failure, appearance roundtrips and old backup/envelope compatibility. All changes remain local; no commit or push.


## 2026-11-09 · Plain plates without initials (local review)

Photo-free planned dishes now show a plain ceramic well with a subtle glaze highlight. The recipe name and servings remain below the plate, and the existing accessible button label still identifies the dish. The four selected rim styles remain visible. Missing-recipe warnings retain their warning symbol. No recipe or menu data was changed. Commit/push remains stopped after the user's request to wait.


## 2026-11-09 · Matched food sketches (local review)

Added an original set of eight inline SVG sketches: eggs, pasta, rice, tofu, vegetables, soup, wraps and a neutral herb motif. Fine gray-green strokes and pale cream, sage and terracotta fills match the existing ceramic styles. Photo-free menu plates, library thumbnails, recipe-picker choices, cooking-history cards and example tiles share the drawings. Existing photo rendering still takes precedence.

Matching uses normalized Chinese/English recipe names, then leading ingredient names. Dish-type rules take priority, so egg fried rice uses rice and egg soup uses soup. English boundaries avoid matching eggplant as egg. Unknown dishes get the neutral motif. The SVG markup is static trusted code; recipe strings are not interpolated into it. This is category matching rather than per-recipe AI generation; no recipe or plan data is modified.

Validation: 90 tests pass, including bilingual example matches, category precedence, unknown/custom names, no data mutation and safe SVG output. Browser checks on localhost:8011 show eggs/pasta/tofu for the user's three lunch dishes and sketches for all seven saved recipes, with zero current food photos. At 320 px the gallery/page have no horizontal overflow; checked flows show no console warnings/errors. English menu and gallery screenshots were refreshed using the separate demo origin, whose old sample photos were also cleared. No commit or push.


## 2026-11-09 · README, pantry sketches and warm spoon mark

Fridge entries now use ingredient sketches through the existing food identity dictionary, including distinct tomato, whole/halved egg and garlic drawings. All 22 known ingredients have a matching illustration or appropriate shared motif, with neutral art for custom entries. Quantities, dates, stock and aliases are unchanged.

Redesigned the mark as a spoon with a filled tomato-red bowl, concave highlight and tapered warm handle over a porcelain plate. The final logo uses ivory, tomato red and terracotta without green. Header and favicon assets share the updated version.

README now has a short project description, feature list, setup/check commands and two complete English page screenshots: weekly menu and fridge. Detailed workflows and persistence notes moved to USAGE.md and ARCHITECTURE.md. Screenshots are captured from separate demo data without open dialogs or cropped controls. Added ingredient-alias and safe-markup checks; the full suite has 92 passing tests. The user authorized one combined commit and push after these changes.

The final logo was refined from the user's spoon-sketch reference into an original Chinese soup-spoon outline: ivory body, tomato-red hand-drawn contours and pale apricot background. The broad curved bowl, inner depth line and handle opening replace the earlier oval-spoon design.
