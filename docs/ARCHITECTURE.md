# Code and data

The app uses HTML, CSS and JavaScript ES modules, with an import map to keep browser module versions consistent. Python only serves the static files. There is no account system, backend or external recipe service.

```text
src/
  app.js             Page rendering, forms and interactions
  recipes.js         Recipe validation, filtering and storage
  plans.js           Daily/weekly dates, dish assignments, meal copies and scaling
  pantry.js          Stock filters and the shared stock/cooking storage
  pantry-data.js     Stock identities and validation
  cooking.js         Cooking records, stock-use previews, deductions and undo
  cooking-data.js    Cooking snapshots and deduction validation
  cooking-ui.js      History, record forms and stock confirmation
  photos.js          Shared local photo compression and crop export
  photo-editor.js    Drag, zoom and circular plate framing
  photo-frame.js     Crop geometry and edit metadata validation
  catalog.js         Bilingual recipe templates without preset photos
  catalog-ui.js      Example recipe gallery and save controls
  plate-ui.js        Locally saved ceramic plate choices
  dish-art.js        Local bilingual dish/ingredient matching and shared SVG sketches
  storage.js         Legacy-compatible storage and atomic full-data replacement
  backup.js          Versioned file validation, export and restore
  backup-ui.js       Download, import preview and recovery controls
  foods.js           Common food names and bilingual aliases
  shortages.js       Unit normalization and stock allocation
  shopping.js        List generation, manual merging and receipt handling
  *copy.js           English and Chinese interface text
  select-ui.js       Consistent dropdowns with keyboard and form support
  menu-ui.js         Scrollable meal rows and the all-dishes overview
  styles.css         Shared typography and responsive layout
tests/               Model, persistence and translation tests
docs/images/         Screenshots from the running app
```

Recipes, photos and photo-edit sources, meal plans, pantry batches, cooking records and shopping items are stored in `localStorage`. Photos are resized and compressed to JPEG in the browser. Data stays in the current browser profile and origin; it does not sync between devices. Clearing site data removes it. Use the backup control to download and restore JSON files.

Each dish assignment references a recipe ID and stores its own date, meal and servings. Ingredient requirements use the recipe's current quantities. A missing recipe remains visible in the menu and raises a warning during the ingredient check.

Existing single-dish menus load into the multiple-dish format without changing their dates or servings. On the first save, the original version-1 menu payload is backed up before version 2 is written. Unreadable saved collections are reported rather than silently replaced. Receipt handling uses a stable stock ID so an interrupted save can be retried without duplicate groceries.

Cooking records and pantry batches share a version-2 payload under the existing pantry storage key. The first cooking save or new purchase receipt preserves the version-1 pantry payload as a migration backup. A deduction, undo or deletion writes both the new stock quantities and the record state in one localStorage operation. Failed writes leave both unchanged, and retries do not deduct or restore the same record twice. Ordinary pantry and shopping updates preserve the cooking records. Durable receipt markers prevent a retried purchase from re-adding groceries even after the original batch has been used up. The migration backup is separate from a complete downloaded backup. After the first restore, a shared storage adapter saves all active collections and the recovery copy under one atomic envelope, `eat-well-data-v1`. Later model writes preserve the other collections and the recovery copy. Older individual keys are read until that first restore and cleaned up only after it succeeds.
