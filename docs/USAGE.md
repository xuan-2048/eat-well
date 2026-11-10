# Using Eat Well

## What you can do

### Recipes and meal plans

**Browse sample recipes** offers six recipes without preset photos: egg fried rice, mapo-style chicken and tofu, tomato and basil pasta, black bean quesadillas, oyakodon and Korean cucumber salad. Save one or the set; repeated saves skip entries already in the library. Each recipe links to its cooking reference. Text is adapted and portions are adjusted. See [the catalog and sources](RECIPE_CATALOG.md).


Recipes have a serving count, measured ingredients, preparation states, cooking steps and an optional photo. Cuisine filters and name or ingredient search help find a saved dish. “Want to cook” and “Cooked” are independent labels.

Lunch and dinner can each hold several dishes. Add, replace or remove one dish without changing the rest of the meal. Every dish has its own planned servings and an ingredient preview. Dishes sit in one horizontal row for each meal: swipe on a phone, use the arrow controls, or focus the row and press the arrow keys. **All** expands a meal into a grid so every dish is visible; **Row** returns to scrolling. Lunch and dinner stay separate. Changing a two-serving recipe to three planned servings multiplies measured amounts by 1.5; ingredients marked “to taste” stay unmeasured. The saved recipe stays unchanged. The same scaling control is available in recipe details.

The Menu page has **Today & tomorrow** and **Week** views. The week starts on Monday. Tap a day to see its lunch and dinner, move between weeks, jump to a date or return to today. Small counts show which days have planned dishes. Future plans use the same saved collection as existing daily menus.

Use **Copy meal** to reuse a whole lunch or dinner on another date or in another meal slot. The preview shows what will be added, what the destination already contains and which recipes will be skipped. Existing dishes and their servings stay as they are; newly copied dishes get independent IDs and retain the source servings. Copying does not keep the meals linked. A source or destination changed in another tab must be reviewed again before saving.

### Fridge and ingredient checks

Keep separate stock entries with a quantity, unit, raw/cooked state, storage location and optional expiry date. Search works with common Chinese and English aliases, including 番茄, 西红柿 and tomato. Custom ingredients are supported too.

Choose **Today**, **Tomorrow**, **Both days**, **This week** or **Choose dates** under **Shopping → Check ingredients**. A custom range includes both endpoints and can cover up to 31 days. **Check this week** on the Menu page opens the week currently being viewed, including a future week. Requirements are combined across the selected dishes, then stock is allocated once across those requirements. The result shows the amount needed, the stock counted and the remaining gap.

| Situation | How it is handled |
| --- | --- |
| g and kg, or ml and L | Converted to a shared unit before comparison |
| Pieces, packs, bottles, teaspoons or tablespoons | Compared only with the same unit |
| A recipe needs pieces but stock is recorded by weight | Flagged for manual confirmation |
| Recipe specifies raw or cooked, but stock differs or is unspecified | Flagged for manual confirmation |
| Stock has a date before the planned meal | Excluded from that meal's calculation |
| Stock has no date | Can count if its unit and preparation match |
| Recipe says “to taste” | Kept unknown and shown for review |

For example, if two dishes need 450 g and 200 g of tomatoes, the total is 650 g. With 0.2 kg of matching tomatoes in the fridge, the shopping gap is 450 g. A pack of tomatoes is not assigned a guessed weight.

“Counted stock” is the amount allocated to the selected meals, capped at their need. It may be smaller than the total quantity in the fridge. Entered dates are organization reminders; the app does not assess whether food is safe to eat.

### Shopping and putting groceries away

**Update shopping list** creates items for measured shortages. Repeating it refreshes the unpurchased menu items rather than appending duplicates. Compatible ingredients from several dishes become one requirement. Manually added and purchased items stay on the list; their known quantities count toward the gap when the list is updated. Items needing review are left out until you confirm a purchase amount. Generated entries show the selected dates, so a list for the coming weekend can be distinguished from one for the current week. Changing the range and updating replaces all unpurchased menu entries with that range's requirements.

You can also add groceries by hand, including items with an undecided quantity. Compatible manual entries merge. Different units or preparation states remain separate.

The list has **To buy**, **Purchased** and **Received** groups. Checking a purchase moves it to Purchased. **Add to pantry** then asks for the actual quantity, preparation, storage and date. If the list called for 3 eggs but you bought 6, the fridge gets 6. The original shopping requirement is retained separately. Retrying a partly saved receipt does not create a second stock batch.

Planning meals and buying groceries do not automatically consume stock or record food intake.

## Cooking records and stock use

Log a dish from the Menu page, or choose a saved recipe under **Cooking log**. Each record has an actual cooking date and meal, servings made, optional personal intake, notes and an optional photo. An empty intake field means unknown; zero means you did not eat any. Portions use quarter-serving increments, and personal intake cannot exceed the amount made.

The log groups records by date and can filter by date and meal. Each record keeps a copy of the recipe's quantities and steps. Editing or deleting the original recipe does not change earlier cooking records. Photos are separate from recipe photos. A menu dish opens its existing record if it has already been logged, which prevents recording the same assignment twice. Manually added records do not guess which planned meal they belong to.

Saving a cooking record leaves stock unchanged. **Review stock use** previews ingredients for the servings made and suggests quantities only from compatible current stock. Check or adjust each batch in its stored unit: a kilogram batch stays in kilograms, and a pack is not assigned a guessed number of pieces. Unmeasured ingredients and incompatible units need manual input. Only positive, explicitly confirmed amounts are deducted; blank or zero entries are left alone.

**Undo deduction** adds the confirmed amounts back to current stock. If a batch's identity or unit changed, it restores the quantity as a separate batch. Editing servings made requires an undo first; notes, photos and personal intake can be corrected without another deduction. Deleting a record asks for confirmation and also returns any stock still deducted by that record.

Menu assignments with cooking records are excluded from shopping checks. Copies of those meals remain independent plans. Deleting a linked cooking record makes its original plan pending again.

## Framing a photo

Uploading a recipe or cooking photo opens a circular plate preview. Drag the image, pinch or use the zoom slider to choose the part you want to show. Arrow buttons and keyboard arrows can move it too. **Use photo** applies the crop to the open form; save that form to keep it. Canceling the crop keeps the previous photo.

**Adjust crop** reopens the compressed original with its saved zoom and position, so you can move it or zoom back out. The saved square crop is shown inside round menu plates and recipe thumbnails. The original and crop remain in browser storage and are included in complete backups. **Backup & restore → Clear all photos** removes current photos and their editing originals while preserving recipe text, menus, stock and a recoverable copy of the preceding data. Larger photo collections need more storage space.

## Plate styles

The plate icon beside the language button opens four choices: white porcelain, sage rim, soft blue rim and fluted ivory. Choosing one updates menus and the photo-framing preview immediately. The preference is saved locally and included in backups.

Dishes without photos use small SVG food sketches in a shared sage, cream and warm orange palette. Names are matched first, followed by the leading ingredients for custom dish names. Eight categories cover eggs, pasta, rice, tofu, vegetables, soup, wraps and a neutral fallback. The same sketches appear in menu plates, recipe lists, the recipe picker and cooking history. Photos take precedence when one is added. Matching runs locally and leaves saved recipe data unchanged.

## Backup and restore

Open the backup icon beside the language button. **Download backup** saves a versioned JSON file containing recipes and photos, dated meal plans, stock batches, cooking records and their deduction history, purchase receipts, shopping items, language and plate style. Keep the file somewhere outside browser storage if you want to move devices or protect it from clearing site data.

Choose a backup file to see its date and counts alongside your current data. Version-2 exports include appearance; version-1 files remain importable with the default plate. Files are validated before confirmation: unsupported versions, malformed collections, duplicate IDs and invalid photos or quantities are rejected. Files can be up to 20 MB, although the browser's available storage can be smaller. Deleted recipe references in menus are retained and shown as a warning.

Import replaces the complete data set. It does not merge dishes or add stock to what is already there. Confirm the checkbox and choose **Replace current data**. The replacement and a recovery copy of your current data are saved together. If the write fails, neither changes. If your data changed while the preview was open, review the file again.

**Review recovery copy** previews the data from before the last restore. Restoring it also keeps the data it replaces as the next recovery copy. You can download that copy as a separate file. Only one recovery copy is retained in the app; it is in the same browser storage and is removed if that storage is cleared. Keeping photos and a recovery copy requires extra space. Other open Eat Well tabs reload when a restore completes, so finish any drafts first.


## Walkthrough

To walk through the app:

1. Open **Recipes** and use **Add sample recipe**, or save your own recipe with ingredient quantities.
2. Open **Menu**, add a lunch dish and choose its servings. Add a second dish to the same lunch.
3. Switch to **Week**, choose a future date, or use **Copy meal** to reuse the lunch. Check the copy preview before saving.
4. Add the stock you already have under **Fridge**, including preparation states where known.
5. Use **Check ingredients** and choose a preset or date range. Review any uncertain units or amounts.
6. Update the shopping list, mark an item purchased and confirm its actual quantity with **Add to pantry**.
7. Return to **Menu**, log a dish you made, and enter the servings made and your own intake separately.
8. Review stock use, confirm the actual amounts, then try the undo control. Refresh to check that the cooking record and stock state are retained.

The language button switches interface text and recognized food names. User-written recipe names and instructions remain as entered.
