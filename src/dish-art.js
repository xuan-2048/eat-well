import {recognizeFood} from './foods.js';
// Shared, code-drawn illustrations. Matching is local and never changes a recipe.
const rules=[
  ['vegetables',/沙拉|凉拌|涼拌|\b(salad|salads)\b/u],
  ['pasta',/意(?:大利)?面|通心粉|義大利麵|\b(pasta|spaghetti|macaroni|penne|rigatoni|linguine|fettuccine)\b/u],
  ['soup',/汤|湯|羹|拉面|拉麵|\b(soup|soups|stew|stews|ramen|broth)\b/u],
  ['wrap',/夹饼|夾餅|薄饼|薄餅|卷饼|捲餅|墨西哥饼|\b(quesadilla|quesadillas|tortilla|tortillas|burrito|burritos|taco|tacos|wrap|wraps)\b/u],
  ['rice',/炒饭|炒飯|米饭|米飯|盖饭|蓋飯|丼|亲子|親子|咖喱|咖哩|\b(rice|risotto|oyakodon|donburi|curry)\b/u],
  ['tofu',/豆腐|麻婆|\b(tofu|mapo)\b/u],
  ['eggs',/鸡蛋|雞蛋|炒蛋|蒸蛋|煎蛋|蛋饼|蛋餅|\b(egg|eggs|omelet|omelette|frittata)\b/u],
  ['vegetables',/黄瓜|黃瓜|西兰花|西蘭花|花椰菜|菠菜|生菜|蔬菜|茄子|\b(cucumber|cucumbers|broccoli|spinach|lettuce|vegetable|vegetables|aubergine|eggplant)\b/u],
  ['pasta',/面条|麵條|炒面|炒麵|\b(noodle|noodles)\b/u]
];
const normalized=value=>typeof value==='string'?value.normalize('NFKC').trim().toLowerCase():'';
export function dishKind(recipe){
  const name=normalized(recipe?.name),named=rules.find(([,pattern])=>pattern.test(name));if(named)return named[0];
  // A custom name can fall back to the leading ingredients; pantry quantities are irrelevant.
  const ingredients=Array.isArray(recipe?.ingredients)?recipe.ingredients.slice(0,2):[];
  for(const ingredient of ingredients){const match=rules.find(([,pattern])=>pattern.test(normalized(ingredient?.name)));if(match)return match[0];}
  return 'generic';
}
const drawings={
  eggs:`<path d="M15 36c-5-3-4-10 2-11-1-6 7-8 10-4 4-5 11-4 13 1 7-2 12 4 9 9 6 4 3 11-3 12-3 6-12 6-15 2-5 5-13 1-12-3-6 1-9-3-4-6Z" fill="#f2dfb6"/><path d="m19 28 4 3-3 5m9-12 4 5-4 3m11-5 4 5-5 4m-11 4 5-4 3 5" stroke="#c9a36f"/><path d="m11 39 8-6 5 11c-6 3-11 1-13-5Z" fill="#dda58e"/><path d="m39 18 10 5-7 9c-5-3-6-8-3-14Z" fill="#dda58e"/><path d="m14 39 5-2 2 5m20-20 5 2-4 5" stroke="#bc816a"/><path d="m31 17 4-3m11 29 4-2m-25 5 1 4" stroke="#95a583" stroke-width="2"/>`,
  pasta:`<path d="M13 40c-3-13 8-23 20-21 12-1 21 9 18 21-7 10-31 13-38 0Z" fill="#f1dfbc" stroke="none"/><path d="M14 38c5-12 15-17 22-13s-1 9-10 7-13 7-4 10 17-2 17-7-12-2-8 3 18 5 19-4M18 33c0-10 15-15 24-8s8 15-2 20M18 43c8 8 27 4 29-3M25 24c5-6 17-3 19 2" stroke="#c4a36f"/><path d="M24 24c-2-4 2-8 7-6 2-5 9-3 10 1 6 0 8 5 3 8-6 4-15 1-20-3Z" fill="#dba48e" stroke="#ba8b75"/><path d="M32 20c-4-7 1-10 5-11 3 6 1 10-5 11Zm3 0c6-4 10-2 12 1-5 4-8 4-12-1Z" fill="#b7c8a2"/>`,
  rice:`<path d="M12 42c0-13 8-23 20-23s20 10 20 23c-9 8-31 8-40 0Z" fill="#f4eddb"/><path d="m22 29 2-2m7-3 2 1m8 4 2 2m-25 5 2 1m10-5 2 2m8 3 3-1m-17 5 2 1m7 0 2-1m-3-12 1 2m-7 4 1 2m17 4 2 1" stroke="#b4b69d"/><path d="m17 33 4-2 3 4-4 2Zm18 2 3-2 3 4-4 2Z" fill="#dfb28d" stroke="#bf9775"/><circle cx="39" cy="25" r="2.5" fill="#b0c29b"/><circle cx="28" cy="38" r="2.5" fill="#b0c29b"/><path d="m31 17 2-4m11 20 4-1" stroke="#a7b494"/>`,
  tofu:`<path d="M12 41c3-11 37-13 41-1 2 12-39 15-41 1Z" fill="#eed5c5" stroke="none"/><path d="m14 28 10-5 10 5-10 6Zm0 0v12l10 6V34m10-6v12l-10 6" fill="#f5efdd"/><path d="m32 24 10-5 10 5-10 6Zm0 0v11l10 6V30m10-6v11l-10 6" fill="#f5efdd"/><path d="m26 39 9-5 10 5-9 6Zm0 0v10l10 5V45m9-6v10l-9 5" fill="#faf4e5"/><path d="m19 22 4-3m15 13 5-2m-12 13 4-2m11-24 3-2" stroke="#99ad86" stroke-width="2.2"/><path d="m19 43 2 2m25-4 2 1" stroke="#c68b74"/>`,
  vegetables:`<path d="M17 35c-10-3-9-13-6-19 8 1 15 6 13 15m17 2c10-5 11-15 8-21-10 2-16 10-14 16M23 28c-6-8-3-17 3-21 8 6 10 14 5 20" fill="#dbe5ce" stroke="#8d9e7e"/><path d="m13 21 9 12m24-15-9 14M26 13l1 14" stroke="#a1b18e"/><ellipse cx="23" cy="40" rx="11" ry="10" transform="rotate(-24 23 40)" fill="#b8cba9"/><ellipse cx="23" cy="40" rx="7.6" ry="6.7" transform="rotate(-24 23 40)" fill="#edf2df" stroke="#a0b28c"/><ellipse cx="41" cy="38" rx="10" ry="9" transform="rotate(26 41 38)" fill="#b8cba9"/><ellipse cx="41" cy="38" rx="6.8" ry="6" transform="rotate(26 41 38)" fill="#edf2df" stroke="#a0b28c"/><path d="m21 37 2 2m1 3 2 1m14-8 1 2m2 2 1 1" stroke="#b7c39d"/><path d="m31 46 9 6c-5 5-11 3-13-1Z" fill="#dfa68f" stroke="#bc8975"/>`,
  soup:`<path d="M12 32c1 15 9 22 20 22s19-7 20-22" fill="#edf0e5"/><ellipse cx="32" cy="31" rx="21" ry="8" fill="#f4e2bf"/><path d="M16 34c9 5 23 5 32 0m-27 17 1 3h20l1-3" stroke="#9ca68d"/><path d="m21 29 4-2 3 3m10 0 3-2 3 2" stroke="#b1bf97" stroke-width="2"/><circle cx="32" cy="33" r="2" fill="#d5a184" stroke="none"/><path d="M24 20c-5-5 4-7 0-12m15 12c-5-5 4-7 0-12" stroke="#b1bbaa"/>`,
  wrap:`<path d="m10 39 24-24 4 31c-10 3-20 0-28-7Z" fill="#efdebc"/><path d="m29 42 22-23 3 27c-7 5-16 4-25-4Z" fill="#f4e5c7"/><path d="m13 39 4 3 4-1 4 4 4-1 5 2m-2-4 4 2 4-1 4 4 5-1" stroke="#a2b38a" stroke-width="2.3"/><path d="m18 33 13-10m-8 14 10-8m5 6 10-10m-5 15 7-7" stroke="#bf9b76"/><path d="m16 42 3 1m9 1 2 1m10 1 2 1" stroke="#ce9478" stroke-width="2.3"/>`,
  generic:`<path d="M18 49c5-15 10-26 23-38" stroke="#8f9f7f"/><path d="M23 36C12 35 11 26 13 21c10 0 15 6 10 15Zm8-12c-3-10 1-16 10-18 4 9 1 16-10 18Zm-8 15c10-6 17-3 20 3-8 6-15 5-20-3Z" fill="#dce6cf" stroke="#91a381"/><path d="m16 26 7 10m14-22-6 10m-2 16 9 1" stroke="#b0bf9a"/><circle cx="45" cy="28" r="5" fill="#e6b39a" stroke="#c0957e"/>`
};
export function dishIllustration(recipe){
  const kind=dishKind(recipe);
  return `<svg class="dish-illustration" data-dish-kind="${kind}" viewBox="0 0 64 64" fill="none" stroke="#818775" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawings[kind]}</svg>`;
}


const ingredients={
  tomato:`<path d="M31 20c-9-8-22 1-22 13 0 13 10 20 23 20s23-7 23-20c0-12-14-21-24-13Z" fill="#e4b09b"/><path d="m31 24-9-7 9 1 3-8 2 9 10-1-9 7-6-1Z" fill="#b4c69f"/><path d="M17 31c-2 4-1 8 1 11" stroke="#f7e0ce" stroke-width="2.5"/>`,
  egg:`<path d="M39 10c-7 0-15 15-15 27 0 10 6 17 15 17s15-7 15-17c0-12-8-27-15-27Z" fill="#e9dfc9" stroke="#969d86"/><path d="M25 19c-7 0-16 14-16 25 0 10 7 16 16 16s16-6 16-16c0-11-9-25-16-25Z" fill="#fbf7e9" stroke="#89977f"/><ellipse cx="25" cy="44" rx="8" ry="9" fill="#e7c78a" stroke="#c6aa77"/><path d="M34 19c-3 4-5 9-5 14" stroke="#fffaf0" stroke-width="2.2"/>`,
  garlic:`<path d="M27 25c-6 0-15 8-15 17 0 12 12 15 20 12 9 3 20-1 20-12 0-9-9-17-15-17l-1-15h-8Z" fill="#f5efdf"/><path d="M31 25c-8 9-10 20-6 29m9-29c7 9 10 20 5 29m-8-28 1 27m-6 4 6-3 6 3" stroke="#b9b69e"/><path d="m28 17 8-2" stroke="#b6c4a1"/>`,
  broccoli:`<path d="m30 34-2 21h9l-2-20 10-9-4-5-8 10-9-10-4 5Z" fill="#dce6cb"/><path d="M15 32c-9-1-9-12-2-15-2-9 10-13 15-7 4-9 17-5 17 2 11-2 16 10 8 16 1 10-11 14-16 7-8 7-18 5-22-3Z" fill="#bdcfaa"/><path d="M18 20c3-4 8-3 10 1m8-3c3-4 7-3 9 0m-18 10c4-3 8-2 9 2" stroke="#94a780"/>`,
  carrot:`<path d="M39 21c9 3 11 9 5 15L16 56c-4 2-5 0-3-4l15-30c2-4 6-3 11-1Z" fill="#e9c49e"/><path d="m36 21-2-12m5 13 7-12m-7 14 14-4" stroke="#a4b78f" stroke-width="2.3"/><path d="m27 31 6 3m-12 7 5 2m7-18 6 3" stroke="#bd9974"/>`,
  potato:`<path d="M31 14C16 10 9 25 11 39c1 12 11 17 24 14 15-2 22-14 18-26-4-10-12-9-22-13Z" fill="#e9ddc0"/><path d="m20 25 2 1m18-1 1 2m-12 7 2 1m12 5 1 2m-24-1 2 1m10 5 1 1" stroke="#b1a384"/>`,
  onion:`<path d="M29 22c-5 6-16 11-16 20 0 10 8 15 19 15s20-5 20-15c0-9-12-14-17-20l2-13-6 5-4-5Z" fill="#ead8cd"/><path d="M30 24c-9 11-10 25-4 32m8-32c9 11 11 25 5 32m-7-30v30" stroke="#baa69b"/><path d="m25 59 7-3 7 3"/>`,
  mushroom:`<path d="m27 31-4 23c5 4 13 4 18 0l-5-23Z" fill="#f3ecdc"/><path d="M8 31c1-15 12-23 24-23s23 8 24 23c-8 9-40 9-48 0Z" fill="#d3baa4"/><path d="M11 30c11-5 31-5 42 0m-25 8-1 13m8-13 1 13" stroke="#b49d89"/>`,
  pepper:`<path d="M31 23c-8-10-23-3-21 10 2 9 4 21 13 22 4 1 7-2 9-2 3 0 7 3 11 1 9-4 11-16 11-24 0-11-16-16-23-7Z" fill="#e3b29b"/><path d="M31 24c-4-8-2-14 5-16l4 5c-7 1-8 4-6 10m-8 5c-5 8-5 18-2 25m12-26c5 8 5 18 2 26" stroke="#a5b28d"/>`,
  milk:`<path d="m21 9 20 1 8 12v33H17V21Z" fill="#edf1e8"/><path d="m21 9 4 12h24M25 21v34m16-45-3 11"/><path d="M31 32h12v13H31Z" fill="#d6e3d9" stroke="#a8b9a8"/>`,
  cheese:`<path d="m11 31 25-19 19 21-23 20-21-8Z" fill="#eddbaf"/><path d="m11 31 21 9 23-7M32 40v13"/><circle cx="34" cy="28" r="3" fill="#d8bd84" stroke="none"/><circle cx="24" cy="30" r="2.5" fill="#d8bd84" stroke="none"/><path d="m40 43 5-4" stroke="#cfb17d"/>`,
  chicken:`<path d="M39 13c-10-1-17 7-16 16l-9 11c-5-2-9 3-6 7 1 2 3 3 5 2-1 5 5 8 8 4 1-2 1-4 0-6l10-9c12 2 24-13 16-21-2-2-5-3-8-4Z" fill="#ddbea2"/><path d="M36 19c6-2 10 2 8 7m-21 3 8 9" stroke="#b49b7f"/>`,
  grain:`<path d="M17 12h30l-5 10 7 28c-6 7-28 7-34 0l7-28Z" fill="#f0e8d4"/><path d="M22 22h20m-19 15 3-2m6 7 3-2m2-8 3 2m-13 13 2-2" stroke="#b5aa8f"/>`,
  bread:`<path d="M15 29c-11-8-2-19 17-19s28 11 17 19v25H15Z" fill="#e2c7a0"/><path d="M21 29c-9-8 0-13 11-13s20 5 11 13v19H21Z" fill="#f6e8cc"/><path d="m27 27 2 1m7 9 2 1m-12 4 2-1" stroke="#cdb793"/>`,
  bottle:`<path d="M26 9h12v13c0 6 9 8 9 15v19H17V37c0-7 9-9 9-15Z" fill="#edf0dc"/><path d="M25 8h14v6H25Zm-8 31h30v11H17Z" fill="#c9d5b8"/><path d="M23 32c-2 3-2 5-2 8" stroke="#fffdf4" stroke-width="2.5"/>`,
  jar:`<path d="M20 20h24l3 34H17Z" fill="#f5f1e5"/><path d="M20 13h24v8H20Z" fill="#cfdbbf"/><path d="m24 15 1 3m7-3v3m8-3-1 3m-14 17 2 1m9 4 2-1m-12 8 2 1" stroke="#a1b18c"/>`
};
const ingredientKinds={tomato:'tomato',egg:'egg',garlic:'garlic',chicken:'chicken',broccoli:'broccoli',potato:'potato',carrot:'carrot',onion:'onion',pepper:'pepper',mushroom:'mushroom',spinach:'generic',tofu:'tofu',milk:'milk',cheese:'cheese','raw-rice':'grain','cooked-rice':'rice',pasta:'pasta',noodles:'pasta',bread:'bread',oil:'bottle',soy:'bottle',salt:'jar'};
export function ingredientKind(item){
  const recognized=typeof item?.name==='string'?recognizeFood(item.name):null,id=item?.foodId??recognized?.id;
  return Object.hasOwn(ingredientKinds,id)?ingredientKinds[id]:'generic';
}
export function ingredientIllustration(item){
  const kind=ingredientKind(item),drawing=Object.hasOwn(ingredients,kind)?ingredients[kind]:drawings[kind];
  return `<svg class="dish-illustration ingredient-illustration" data-ingredient-kind="${kind}" viewBox="0 0 64 64" fill="none" stroke="#818775" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawing}</svg>`;
}
