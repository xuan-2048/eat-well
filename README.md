<img src="mark.svg" width="52" alt="Eat Well spoon logo">

# Eat Well · 好好吃饭

A cooking planner for phone browsers, built with HTML, CSS and JavaScript. Save recipes, plan meals, check your fridge and turn missing ingredients into a shopping list.

一个支持中英文的做饭小工具：保存菜谱、安排菜单、管理冰箱库存、整理购物清单，记录实际做了什么和吃了多少。

## Features

- **Recipes:** measured ingredients, cooking steps, cuisine filters, search and six editable sample recipes with source links. Optional photos support dragging and zooming to choose a crop.
- **Meal planning:** daily and weekly views, several dishes per meal, separate serving counts and copying a meal to another date. Swipe through dishes or expand the whole meal.
- **Fridge:** stock batches with quantities, units, preparation states, storage locations and optional dates. Common Chinese and English ingredient names share the same identity.
- **Shopping:** check planned dishes against stock, combine shortages and confirm the actual amount bought before adding groceries to the fridge.
- **Cooking log:** keep servings made separate from servings eaten. Review stock use before deducting it; deductions can be undone.
- **Appearance:** Chinese/English interface, four ceramic plate styles, and matching SVG sketches for dishes and fridge ingredients.
- **Backups:** export JSON, preview an import and recover the data from before the last replacement. Photos can be cleared without removing recipes or menus.

## Screenshots

English interface with sample data.

### Weekly menu

Choose a day, arrange lunch and dinner, and check the ingredients needed for the week.

<a href="docs/images/menu.jpg"><img src="docs/images/menu.jpg" width="390" alt="Weekly menu with two dishes arranged for Wednesday lunch"></a>

### Fridge

Each ingredient batch keeps its own quantity, unit and storage details.

<a href="docs/images/pantry.jpg"><img src="docs/images/pantry.jpg" width="390" alt="Fridge inventory showing tomato, egg and garlic sketches beside their stock quantities"></a>

## Run locally

Requires Python 3 and Node.js 20 or newer. No npm packages or API keys are needed.

```sh
git clone https://github.com/xuan-2048/eat-well.git
cd eat-well
npm start
```

Open [localhost:8011](http://localhost:8011). Stop the server with `Ctrl+C`.

If the port is occupied:

```sh
python3 -m http.server 8012 --bind 127.0.0.1
```

A different port has its own browser data. For a walkthrough of recipes, menus and stock use, see [the usage guide](docs/USAGE.md).

## Data and calculations

Data is saved in the current browser with `localStorage`. There is no account system or cloud sync. Clearing site data removes the saved collections and the local recovery copy, so download a JSON backup to keep a separate copy.

Ingredient checks convert g/kg and ml/L. They do not guess the weight of a piece or pack, convert volume to weight, or treat an unmeasured ingredient as zero. Incompatible units and preparation states are shown for review. Entered food dates are reminders, not food-safety assessments.

Planned servings do not count as actual intake. Cooking records keep a recipe snapshot and use the portions actually entered. Stock changes only after confirmation.

The app runs as static files; Python serves them locally. See [code and storage details](docs/ARCHITECTURE.md) for the module layout, migrations and persistence behavior.

## Checks

```sh
npm run check
npm test
```

Tests cover recipe validation, meal planning, quantity scaling, ingredient matching, shopping receipts, cooking records, stock deduction and undo, backup/restore, plate preferences and illustration matching. Browser checks include English/Chinese views and phone-width layouts.

## Next

- Per-recipe nutrition estimates, followed by daily totals from recorded intake.
- Dish suggestions using available ingredients, preferences, cooking time and optional weather information.
- Offline support and home-screen installation.

Details: [roadmap](docs/ROADMAP.md), [sample recipe sources](docs/RECIPE_CATALOG.md), [design notes](docs/DESIGN.md).

The early menu layout was inspired by [Civa](https://xhslink.cn/o/4xtGwV55nr9). The spoon logo, food sketches and plate styling are original to this project.
