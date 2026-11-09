import {ingredientKey} from './recipes.js';
const rows=[
  ['tomato','番茄','Tomatoes',['西红柿','tomato','tomatoes']],
  ['egg','鸡蛋','Eggs',['蛋','egg','eggs']],
  ['chicken','鸡肉','Chicken',['鸡胸肉','chicken','chicken breast']],
  ['broccoli','西兰花','Broccoli',['broccoli']],
  ['potato','土豆','Potatoes',['马铃薯','potato','potatoes']],
  ['carrot','胡萝卜','Carrots',['carrot','carrots']],
  ['onion','洋葱','Onions',['onion','onions']],
  ['garlic','大蒜','Garlic',['蒜','garlic']],
  ['pepper','彩椒','Bell peppers',['甜椒','bell pepper','bell peppers']],
  ['mushroom','蘑菇','Mushrooms',['mushroom','mushrooms']],
  ['spinach','菠菜','Spinach',['spinach']],
  ['tofu','豆腐','Tofu',['tofu']],
  ['milk','牛奶','Milk',['milk']],
  ['cheese','奶酪','Cheese',['芝士','cheese']],
  ['raw-rice','大米','Uncooked rice',['生米','rice','uncooked rice']],
  ['cooked-rice','米饭','Cooked rice',['熟米饭','cooked rice']],
  ['pasta','意面','Pasta',['意大利面','pasta','spaghetti']],
  ['noodles','面条','Noodles',['noodle','noodles']],
  ['bread','面包','Bread',['吐司','bread','toast']],
  ['oil','食用油','Cooking oil',['油','cooking oil','oil']],
  ['soy','酱油','Soy sauce',['生抽','soy sauce']],
  ['salt','盐','Salt',['salt']],
];
const normalize=name=>name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export const foods=rows.map(([id,zh,en,aliases])=>({id,zh,en,aliases:[zh,en,...aliases].map(normalize),key:ingredientKey(id==='cooked-rice'?'rice':en)}));
export const foodById=Object.fromEntries(foods.map(food=>[food.id,food]));
export function recognizeFood(name){return foods.find(food=>food.aliases.includes(normalize(name)))??null;}
export function pantryName(item,language){return item.foodId?foodById[item.foodId][language]:item.name;}
