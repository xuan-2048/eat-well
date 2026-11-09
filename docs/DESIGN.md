# Design direction · 设计方向

Selected by the owner on 2026-11-08: **cream + warm orange**, relaxed and minimal, like an everyday recipe notebook.

## Reference material

- [Mela](https://www.mela.recipes/): use its recipe-focused presentation as a reference for readable hierarchy. Our design interpretation is restrained spacing and few competing controls.
- [Paprika](https://www.paprikaapp.com/): reference the organization of recipes, meal planning and grocery lists; do not reproduce its screens or branding.

References were checked on 2026-11-08. They are design references, not dependencies or claims of feature parity. No external screenshots, code or recipe content are incorporated.

## Our visual direction

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#FBF8F2` | Main background |
| Ink | `#3E3730` | Primary text |
| Muted ink | `#796E63` | Supporting text |
| Warm orange | `#B84F32` | Selected controls and emphasis |
| Peach | `#F5E5D9` | Soft emphasis surface |
| Hairline | `#E8E0D7` | Occasional separators |

- Phone-first layout; desktop remains a quiet, narrow reading surface.
- Use whitespace and type hierarchy before adding borders or cards.
- Rounded, comfortable controls; no heavy shadows or decorative metric dashboards.
- Draw a small original bowl mark with code; avoid dependence on stock photography.
- Keep Chinese and English equally readable. Include clear selected states and visible keyboard focus.
- Empty states show actual data state; do not invent stock counts or recommendations.

## First UI milestone

Home, pantry and shopping shell views; persistent language switch; explicit preview status. Ingredient entry, recipe matching, shopping edits and nutrition are not implemented in this milestone. Do not show working-looking controls for unavailable features.
