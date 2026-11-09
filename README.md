# Fridge Helper App · 冰箱食材助手

A mobile-first, bilingual pantry-to-recipe PWA, developed one small, reviewable milestone at a time.

手机优先的中英双语冰箱食材助手：记录现有食材，选择菜系，找到今晚能做的菜，并把缺少的食材加入购物清单。

## Current status / 当前状态

Milestone 1 is implemented: a warm, minimal mobile shell with Chinese/English switching, persistent language preference and home/pantry/shopping preview views. Ingredient tracking, recipe matching, shopping edits and nutrition remain planned. The earlier prototype remains separate; its implementation and Git history are not copied here.

已完成第 1 步：奶油白＋暖橙的手机首页框架、中英切换与语言保存。食材记录、菜谱推荐、购物编辑和营养分析尚未实现。此前的原型代码保留作参考；此仓库从小步骤重新实现。

## Run / 启动

Requires Python 3; Node.js is used for syntax checks. No package installation is required.

```sh
npm start
```

Open http://localhost:8011. Run `npm run check` for JavaScript syntax validation. This is a local preview, not an installed PWA or a deployed service.

## Product focus / 产品重点

- Chinese/English interface, ingredient aliases and recipe instructions.
- Cuisine selection with transparent ranking: what is available, what is missing, why this recipe appears.
- Quick pantry entry and optional user-entered date reminders.
- Missing ingredients → deduplicated shopping list.
- Mobile layout, browser persistence, then installable/offline PWA behavior.

首版重点是中英食材同义词、菜系选择、可解释的匹配与轻量记录。面向自己做饭的学生，先把少量真实使用流程做好。

## Development approach / 开发方式

See [the roadmap](docs/ROADMAP.md). Each implementation commit should represent a real, checked change. Commit at natural checkpoints during active development and at the end of each session; timestamps reflect actual work. No scheduled empty commits or artificial backdating.

每次先完成一个可检查的小功能，再运行适用的检查并提交。开发期间隔一段时间到达自然节点时 commit；结束当天工作前 push。不会为了凑时间或数量制造空提交，也不修改提交时间。没有运行中的自动开发或定时提交任务。

## References / 参考

- [Prototype recipe catalog](docs/RECIPE_CATALOG.md): 12 example recipes in the separate prototype, not implemented here yet.
- [Related projects](docs/RELATED_PROJECTS.md): research notes and product differentiation.

Dates are user-entered organization reminders, not food-safety determinations. Ingredient presence does not prove sufficient quantity. Recipe content and data provenance will be recorded as the catalog is implemented.
