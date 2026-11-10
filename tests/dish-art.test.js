import {foods} from '../src/foods.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {dishKind,dishIllustration,ingredientKind,ingredientIllustration} from '../src/dish-art.js';
import {examples} from '../src/catalog.js';
test('Chinese and English sample names select the same illustration category',()=>{
 const expected={mapo:'tofu',rice:'rice',pasta:'pasta',quesadilla:'wrap',oyakodon:'rice',cucumber:'vegetables'};
 for(const recipe of examples)for(const language of ['zh','en'])assert.equal(dishKind({name:recipe.name[language]}),expected[recipe.key]);
 assert.equal(dishKind({name:'番茄炒蛋'}),'eggs');assert.equal(dishKind({name:'Tomato & eggs'}),'eggs');
});
test('dish type takes priority over ingredients and English words are matched without substring errors',()=>{
 for(const [name,kind] of [['Egg fried rice','rice'],['鸡蛋汤','soup'],['Tofu pasta','pasta'],['Cucumber rice salad','vegetables'],['Eggplant','vegetables'],['Spinach omelette','eggs'],['Creamy ramen','soup']])assert.equal(dishKind({name,ingredients:[{name:'Egg'}]}),kind);
});
test('custom dish names use leading ingredients while unknown dishes have a neutral fallback',()=>{
 const recipe={name:'Family special',ingredients:[{name:'Tofu'},{name:'Garlic'}]},before=structuredClone(recipe);assert.equal(dishKind(recipe),'tofu');assert.deepEqual(recipe,before);
 assert.equal(dishKind({name:'Sunday special',ingredients:[{name:'Olive oil'},{name:'Salt'}]}),'generic');assert.equal(dishKind(null),'generic');
});
test('generated markup contains only trusted decorative SVG and never interpolates recipe text',()=>{
 const markup=dishIllustration({name:'<script>alert(1)</script>',ingredients:[]});assert.ok(markup.startsWith('<svg '));assert.ok(markup.includes('aria-hidden="true"'));assert.ok(markup.includes('data-dish-kind="generic"'));assert.ok(!markup.includes('<script>'));assert.ok(!markup.includes('alert('));
});

test('pantry illustrations use the shared ingredient identity across Chinese and English aliases',()=>{
 for(const food of foods){const expected=ingredientKind({foodId:food.id});for(const alias of food.aliases)assert.equal(ingredientKind({name:alias}),expected);assert.ok(ingredientIllustration({foodId:food.id}).includes('<svg '));}
 assert.equal(ingredientKind({name:'西红柿'}),'tomato');assert.equal(ingredientKind({name:'Eggs'}),'egg');assert.equal(ingredientKind({name:'蒜'}),'garlic');
});
test('unknown pantry items get trusted generic art without changing stock data',()=>{
 const item={name:'<script>custom</script>',foodId:null,amount:12,unit:'pack'},before=structuredClone(item),markup=ingredientIllustration(item);assert.ok(markup.includes('data-ingredient-kind="generic"'));assert.ok(!markup.includes('<script>'));assert.deepEqual(item,before);
});
