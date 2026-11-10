import test from 'node:test';
import assert from 'node:assert/strict';
import {examples} from '../src/catalog.js';
import {validRecipe,ingredientKey} from '../src/recipes.js';
test('every sample has valid bilingual measured ingredients, steps without preset photos',()=>{
 assert.equal(new Set(examples.map(e=>e.key)).size,examples.length);assert.ok(examples.length>=6);
 for(const entry of examples){
  for(const language of ['zh','en']){
   const now='2026-11-09T12:00:00Z',recipe={id:entry.key,name:entry.name[language],cuisine:entry.cuisine,servings:entry.servings,ingredients:entry.ingredients.map(i=>({name:i[language],key:ingredientKey(i[language]),amount:i.amount,unit:i.unit,state:i.state})),steps:entry.steps[language],photo:'',wanted:true,cooked:false,createdAt:now,updatedAt:now,source:{title:entry.site,url:entry.url}};
   assert.ok(validRecipe(recipe),`${entry.key} ${language}`);
  }
 }
});
