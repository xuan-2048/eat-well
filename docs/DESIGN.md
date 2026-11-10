# Design direction · 设计方向

Updated on 2026-11-08 after owner feedback: **near-white, minimal copy, menu-first layout**. This replaces the initial cream-and-orange promotional homepage. Warm orange remains a small selection accent, not a page background.

## Reference

[慢行羊的 Civa 刺饭介绍帖](https://xhslink.cn/o/4xtGwV55nr9), viewed in a browser. Reviewed the post text and first four carousel images, including home and menu-selection views.

Observed: today/tomorrow menu groups; want-to-cook/cooked entry points; dishes presented on plates; a checked-tablecloth treatment; bottom navigation. The post describes dish tracking, meal planning and inventory dates. Family sharing is described as future work in the original post; comments discuss subsequent changes, so that is not treated as a verified current feature audit.

Our interpretation: use a similar information hierarchy, original plate placeholders and a very subtle gray-green checked surface. Use white instead of the reference's warm textured background. No copied character art, logo, text, food photos or paper texture.

Earlier references: [Mela](https://www.mela.recipes/) and [Paprika](https://www.paprikaapp.com/) remain useful for recipe readability and organization.

## Rules

- Background `#FAFBFC`, main surface `#FFFFFF`, primary text `#303332`.
- Accent `#AE553D`, muted text `#737B77`, dividers `#E9ECEA`.
- No marketing headline, supporting slogans, inspirational quote, decorative caption or promotional footer.
- Date and short functional labels; compact actions; no invented dishes or counts.
- Home shows today and tomorrow; bottom navigation is Menu / Recipes / Fridge.
- Want-to-cook and cooked views are explicit empty states until recipe records are implemented.
- Preview status is a small label. No controls that pretend to save or schedule meals yet.
- Chinese/English equally supported, with readable phone layout and keyboard focus.

## Next feature

Personal recipe library: add/edit/delete dishes, cuisine, ingredients, structured amounts and servings, plus want-to-cook/cooked status. Then choose dishes for today's or tomorrow's meals. Pantry matching and shopping follow this foundation. Recipe data must support the future nutrition plan.

## Current visual details

The mark uses the curved bowl and broad handle of a Chinese soup spoon, drawn with gently uneven tomato-red lines. An ivory spoon body sits on a pale apricot rounded square. A short inner curve suggests the bowl's depth, and the handle opening keeps the utensil recognizable at small sizes. The user's spoon sketch guided the shape; this project uses its own SVG paths. Recipe and ingredient sketches share fine outlines and restrained fills. Photo-free menu plates retain their ceramic rims, with the food sketch centered inside and the dish name below.
