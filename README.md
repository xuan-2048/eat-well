# 好好吃饭 · Eat Well

A mobile-first, bilingual pantry-to-recipe PWA, developed one small, reviewable milestone at a time.

手机优先的中英双语做饭应用：记录现有食材，选择菜系，找到今晚能做的菜，并把缺少的食材加入购物清单。

## Current status / 当前状态

The personal recipe library is implemented locally: create/edit/delete, quantities and units, servings, instructions, optional compressed photos, independent wanted/cooked labels, cuisine filtering and ingredient/name search. Chinese/English UI is supported; user-written content stays in the language entered. Records are stored in this browser only.

本地已实现“我的菜谱”：新增、编辑、确认删除，结构化食材用量、单位、生熟状态、份数、做法、选填照片，想吃／做过标记、菜系筛选和搜索。界面支持中英文；用户自己输入的内容不会自动翻译。

Meal planning, pantry inventory, nutrition, cloud sync and PWA installation are not implemented yet. Optional sample data is added only by explicitly selecting “Add sample recipe”. Clearing browser data deletes local records. Do not use private/incognito browsing for records you want to keep. Photos are resized to at most 720px and stored as bounded JPEGs; a failed storage write keeps the form draft open.

## Run / 启动

Requires Python 3; Node.js is used for syntax checks. No package installation is required.

```sh
npm start
```

Open http://localhost:8011. Run `npm run check` for JavaScript syntax validation and `npm test` for recipe/persistence tests. This is a local preview, not an installed PWA or a deployed service.

## Product focus / 产品重点

- Chinese/English interface, ingredient aliases and recipe instructions.
- Cuisine selection with transparent ranking: what is available, what is missing, why this recipe appears.
- Quick pantry entry and optional user-entered date reminders.
- Missing ingredients → deduplicated shopping list.
- Mobile layout, browser persistence, then installable/offline PWA behavior.

首版重点是中英食材同义词、菜系选择、可解释的匹配与轻量记录。面向自己做饭的学生，先把少量真实使用流程做好。

## Development approach / 开发方式

See [the roadmap](docs/ROADMAP.md) and [design direction](docs/DESIGN.md).

**Current owner instruction: local changes only. Do not commit or push until the owner explicitly approves after review.** This supersedes the earlier automatic milestone-commit approach. Completed local work and verification should still be documented.

**当前要求：先改本地供用户检查；用户明确确认后才能 commit、push。** 没有自动开发或定时提交任务。

## References / 参考

- [Prototype recipe catalog](docs/RECIPE_CATALOG.md): 12 example recipes in the separate prototype, not implemented here yet.
- [Related projects](docs/RELATED_PROJECTS.md): research notes and product differentiation.

Dates are user-entered organization reminders, not food-safety determinations. Ingredient presence does not prove sufficient quantity. Recipe content and data provenance will be recorded as the catalog is implemented.
