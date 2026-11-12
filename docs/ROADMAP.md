# Roadmap

Eat Well connects a personal recipe library with meal planning, fridge stock and grocery shopping. The current app runs locally in a phone browser with Chinese and English interfaces.

| Step | Deliverable | Status |
| --- | --- | --- |
| 1 | Mobile layout, shared typography and language switch | Implemented |
| 2 | Recipe library with quantities, photos, cuisine and wanted/cooked labels | Implemented |
| 3 | Today/tomorrow lunch and dinner planning | Implemented |
| 4 | Fridge batches, ingredient aliases, locations and date filters | Implemented |
| 5 | Several dishes per meal and serving-based ingredient previews | Implemented |
| 6 | Selected-day ingredient check with compatible unit and preparation matching | Implemented |
| 7 | Shopping list, purchased state and confirmed actual-quantity pantry receipt | Implemented |
| 8 | Weekly menu, copying meals and selected-date shopping | Implemented |
| 9 | Cooking records, actual intake, photos and confirmed stock use with undo | Implemented |
| 10 | Versioned export and restore | Implemented |
| 11 | Nutrition per recipe and serving | Implemented |
| 11a | React/TypeScript nutrition view, separate API and shared calculation rules | Implemented |
| 11b | Move remaining page rendering and forms into React/TypeScript | Planned |
| 12 | Daily nutrition from actual intake and React cooking-history page | Implemented |
| 13a | Saved-dish suggestions by stock, cuisine, cooking time and recent cooking | Implemented |
| 13b | Extend suggestions with preferences, optional weather and intake context | Planned |
| 14 | Offline support and home-screen installation | Planned |

## Current milestone

Step 13a adds “What to cook?” on the Menu page. It picks one saved recipe at a time using cuisine/time filters, current inventory and recent cooking records. Each candidate has factual reasons, a scaled stock check and per-serving nutrition. Menu actions preserve existing dishes; grocery actions append measured shortages without replacing another meal's list. Recipe cooking time is optional, and unknown times are excluded when a time limit is selected.

The recommendation view uses React/TypeScript, a persistence service and pure shared ranking rules. The pantry is neither reserved nor deducted. Daily intake remains available separately; recommendations do not diagnose nutritional needs. Weather, location and AI providers are still pending.

Validation includes filtering/ranking, stale-data guards, additive writes, duplicate prevention, backup compatibility, and English/Chinese phone-width browser checks.

## Architecture before AI

The first slice is implemented: Vite builds the app, the nutrition estimate panel uses React/TypeScript, and an independent Express API calculates estimates. Shared rules have no browser or storage dependencies; recipe persistence has a repository and nutrition saves have a service layer. Existing JavaScript pages and the nutrition reference editor coexist with the new component through a small adapter.

Next, migrate recipe forms, menu planning and fridge screens one at a time. Preserve current storage keys and compare each workflow before moving on. AI endpoints can follow this boundary; no AI provider is connected yet. Accounts, a database and cloud synchronization remain separate decisions.

References: [adding React to an existing app](https://react.dev/learn/add-react-to-an-existing-project) and [migrating JavaScript to TypeScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html).

## 推荐一道菜 · Recommendation to-do

- [ ] 所在城市：允许手动设置城市；天气推荐只需要大致地区，不需要保存完整住址。
- [ ] 天气与干燥程度：接入温度、相对湿度和天气更新时间，作为口感、冷热和汤水类偏好的参考；天气不可用时仍能推荐。
- [ ] 时间：结合季节、当地时间、午餐或晚餐，以及用户这次有多少做饭时间；菜谱已支持选填预计总耗时。
- [ ] 营养摄入：接入每份营养估算和做饭记录里实际吃的份数；标明记录是否完整，未记录的摄入保持未知。
- [x] 第一版筛选：从已保存菜谱中按菜系、耗时、库存覆盖和最近 7 天做饭记录选择。
- [ ] 增加明确的饮食偏好和忌口设置。
- [x] 一次推荐一道：展示菜名、预计耗时、已有/缺少的食材和具体理由；支持换一道、加入菜单、添加缺料。
- [ ] 数据不足时降级：先按食材、口味和时间推荐，不编造天气或营养信息。可以记录推荐是否被采用，用于后续调整规则。

每份营养、实际摄入汇总和本地规则推荐已完成；后续再接上天气等情境信息。天气只影响烹饪与口味选择；不会据此诊断缺乏营养素或给出补充剂剂量。第一版用可解释的筛选与排序规则，不依赖生成式模型。

## Scope

Keep data local before adding accounts or cloud sync. Stock matching does not guess weights for pieces or packs, convert volume to weight, infer safe food dates or mark a planned meal as eaten. Nutrition work will need sourced food data, preparation states and visible unknown quantities; see [the nutrition notes](NUTRITION.md).

Visual direction: [DESIGN.md](DESIGN.md). Completed work and verification: [PROGRESS.md](PROGRESS.md).
