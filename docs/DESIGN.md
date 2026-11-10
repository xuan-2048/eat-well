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

The mark is a seated pig holding a spoon, with a transparent background. Cream and beige fills, warm brown outlines, triangular ears and an oval snout keep the mascot readable at header sizes. Small dot eyes, a slight smile and two pale blush marks give the pig a gentle expression. The beige spoon has a broad bowl, small concave detail and long handle. The rounded hand-drawn character direction follows the user's reference, with original SVG paths and a distinct pig design. Recipe and ingredient sketches use fine outlines and restrained fills. Photo-free menu plates retain their ceramic rims, with the food sketch centered inside and the dish name below.
