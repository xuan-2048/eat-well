import test from 'node:test';
import assert from 'node:assert/strict';
import {nutritionData} from '../src/nutrition-data.js';
import {nutritionCopy} from '../src/nutrition-copy.js';
import {ingredientSignature,validNutritionSettings} from '../src/nutrition-settings.js';
import {NUTRIENTS,NUTRITION_VERSION,nutritionFoods,foodByFdc,referenceMatches,estimateIngredient,estimateRecipe,nutritionStamp,saveNutritionReference} from '../src/nutrition.js';
import {ingredientKey,validRecipe,saveRecipes,loadRecipes,RECIPE_KEY} from '../src/recipes.js';
import {createAppStorage} from '../src/storage.js';
import {exportBackup,parseBackup,restoreBackup} from '../src/backup.js';
import {saveCookingRecord} from '../src/cooking.js';
import {loadKitchen} from '../src/pantry.js';
const now='2026-11-10T05:40:00Z';
const ingredient=(name,amount=100,unit='g',state='raw')=>({name,key:ingredientKey(name),amount,unit,state});
const recipe=(ingredients=[ingredient('Tomatoes',300),ingredient('Eggs',100)])=>({id:'r',name:'Tomatoes and eggs',cuisine:'chinese',servings:2,wanted:true,cooked:false,ingredients,steps:['Cook.'],photo:'',createdAt:now,updatedAt:now});
const manual=(i,fdcId,grams,index=0)=>({index,fdcId,grams,signature:ingredientSignature(i),dataVersion:NUTRITION_VERSION,confirmed:true});
function memory(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('USDA subset has pinned provenance, unique references, correct units and no fabricated missing values',()=>{
 assert.equal(nutritionFoods.length,42);assert.equal(new Set(nutritionFoods.map(f=>f.fdcId)).size,42);
 assert.equal(nutritionData.source.release,'2018-04');assert.equal(nutritionData.source.license,'CC0 1.0');assert.match(nutritionData.source.sha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(nutritionData.nutrientIds,{energy:1008,protein:1003,carbs:1005,fat:1004,fiber:1079});
 for(const f of nutritionFoods){assert.ok(f.name.zh&&f.name.en);assert.deepEqual(Object.keys(f.per100g),NUTRIENTS);for(const v of Object.values(f.per100g))assert.ok(v===null||Number.isFinite(v)&&v>=0);for(const p of f.portions)assert.ok(p.amount>0&&p.grams>0&&['piece','tsp','tbsp'].includes(p.unit));}
 assert.deepEqual(foodByFdc(170457).per100g,{energy:18,protein:.88,carbs:3.89,fat:.2,fiber:1.2});
});
test('whole recipe and fractional servings reproduce the source arithmetic without rounding intermediate values',()=>{
 const r=recipe(),result=estimateRecipe(r);assert.ok(result.complete);assert.equal(result.included,2);
 const expected={energy:197,protein:15.2,carbs:12.39,fat:10.11,fiber:3.6};
 for(const k of NUTRIENTS){near(result.totals[k],expected[k]);near(result.values[k],expected[k]/2);near(estimateRecipe(r,3).values[k],expected[k]*1.5);near(estimateRecipe(r,.25).values[k],expected[k]/8);}
 for(const invalid of [0,-1,101,NaN,Infinity,'2'])assert.throws(()=>estimateRecipe(r,invalid));
});
test('pieces, spoons, milliliters and to-taste quantities stay unknown until explicitly confirmed',()=>{
 for(const i of [ingredient('Eggs',2,'piece'),ingredient('Olive oil',1,'tbsp','unspecified'),ingredient('Whole milk',100,'ml','unspecified'),ingredient('Salt',null,'toTaste','unspecified')]){
  const result=estimateRecipe(recipe([i]));assert.equal(result.complete,false);assert.equal(result.included,0);for(const k of NUTRIENTS)assert.equal(result.values[k],null);
 }
 const portions=foodByFdc(171287).portions;assert.equal(portions.find(p=>p.label==='large').grams,50);
 const i=ingredient('Eggs',2,'piece');assert.equal(estimateIngredient(i,0,manual(i,171287,100)).nutrients.energy,143);
});
test('a partial subtotal excludes unknown food and true source zeros remain distinguishable from missing data',()=>{
 const r=recipe([ingredient('Tomatoes',300),ingredient('Unidentified sauce',30)]),result=estimateRecipe(r);
 assert.equal(result.complete,false);assert.equal(result.rows[1].status,'unmatched');assert.equal(result.included,1);assert.equal(result.values.energy,27);
 const salt=estimateRecipe(recipe([ingredient('Salt',2,'g','unspecified')]));assert.equal(salt.complete,true);for(const key of NUTRIENTS)assert.equal(salt.values[key],0);
});
test('explicit aliases select preparation-specific references and avoid broad guessed food identities',()=>{
 assert.equal(estimateIngredient(ingredient('西红柿'),0).reference.fdcId,170457);
 assert.equal(estimateIngredient(ingredient('Tomatoes',100,'g','cooked'),0).reference.fdcId,170050);
 for(const name of ['Chicken','Milk','Cooking oil','Vegetable oil','Drained black beans','Ground cumin','Tomato ketchup'])assert.equal(referenceMatches(ingredient(name)).length,0,name);
});
test('a missing source nutrient stays unknown while other nutrients can still be counted',()=>{
 const source=foodByFdc(170457),original=source.per100g.fiber;
 try{source.per100g.fiber=null;const result=estimateRecipe(recipe([ingredient('Tomatoes',300)]));assert.equal(result.included,1);assert.equal(result.complete,false);assert.equal(result.values.energy,27);assert.equal(result.values.fiber,null);assert.equal(result.coverage.fiber,0);}
 finally{source.per100g.fiber=original;}
});
test('unspecified raw/cooked state needs confirmation; explicit raw/cooked mismatches cannot be overridden',()=>{
 const unknown=ingredient('Tomatoes',100,'g','unspecified');assert.equal(estimateIngredient(unknown,0).status,'state');
 assert.equal(estimateIngredient(unknown,0,manual(unknown,170457,100)).status,'included');
 const raw=ingredient('Eggs');assert.equal(estimateIngredient(raw,0,manual(raw,173424,100)).status,'mismatch');
 const cooked=ingredient('Garlic',100,'g','cooked');assert.equal(estimateIngredient(cooked,0).status,'mismatch');
});
test('changed names, identity, amount, unit, state or data version invalidate stored references rather than reuse stale weights',()=>{
 const i=ingredient('Eggs',2,'piece'),setting=manual(i,171287,100);
 for(const edited of [ingredient('Egg',2,'piece'),ingredient('Eggs',3,'piece'),ingredient('Eggs',2,'g'),ingredient('Eggs',2,'piece','cooked')])assert.equal(estimateIngredient(edited,0,setting).status,'stale');
 assert.equal(estimateIngredient(i,0,{...setting,dataVersion:'future-v2'}).status,'stale');assert.equal(estimateIngredient(i,0,{...setting,fdcId:9999999}).status,'unmatched');
});
test('saving a reference persists exact grams and can reset to automatic without touching ingredient or other recipe data',()=>{
 const store=memory(),r=recipe([ingredient('Eggs',2,'piece')]);saveRecipes(store,[r]);
 const updated=saveNutritionReference(store,'r',0,{fdcId:171287,grams:98.5,confirmed:true},nutritionStamp(r),now);
 assert.deepEqual(updated.ingredients,r.ingredients);assert.equal(updated.servings,2);assert.equal(loadRecipes(store).recipes[0].nutrition.rows[0].grams,98.5);near(estimateRecipe(updated).values.energy,143*.985/2);
 const reset=saveNutritionReference(store,'r',0,null,nutritionStamp(updated),now);assert.equal(reset.nutrition.rows.length,0);assert.equal(estimateRecipe(reset).rows[0].status,'weight');
});
test('stale dialogs and malformed inputs cannot overwrite the latest recipe',()=>{
 const store=memory(),r=recipe(),input={fdcId:170457,grams:300,confirmed:true};saveRecipes(store,[r]);
 for(const bad of [{...input,fdcId:999999},{...input,confirmed:false},{...input,grams:0},{...input,grams:Infinity},{...input,grams:'300'},{...input,grams:1e8}])assert.throws(()=>saveNutritionReference(store,'r',0,bad,nutritionStamp(r),now));
 saveRecipes(store,[{...r,servings:3}]);const before=store.getItem(RECIPE_KEY);assert.throws(()=>saveNutritionReference(store,'r',0,input,nutritionStamp(r),now),/changed/);assert.equal(store.getItem(RECIPE_KEY),before);
 saveRecipes(store,[]);assert.throws(()=>saveNutritionReference(store,'r',0,input,nutritionStamp(r),now),/removed/);
});
test('fresh saves preserve unrelated concurrent edits; quota errors and corrupt storage do not replace data',()=>{
 const store=memory(),r=recipe();saveRecipes(store,[{...r,name:'New title',cooked:true}]);
 const updated=saveNutritionReference(store,'r',0,{fdcId:170457,grams:300,confirmed:true},nutritionStamp(r),now);assert.equal(updated.name,'New title');assert.equal(updated.cooked,true);
 const before=store.getItem(RECIPE_KEY);assert.throws(()=>saveNutritionReference({...store,setItem(){throw new Error('quota');}},'r',0,null,nutritionStamp(updated),now),/quota/);assert.equal(store.getItem(RECIPE_KEY),before);
 store.setItem(RECIPE_KEY,'broken');assert.throws(()=>saveNutritionReference(store,'r',0,null,nutritionStamp(r),now),/Unreadable/);assert.equal(store.getItem(RECIPE_KEY),'broken');
});
test('nutrition metadata is validated inside recipes and backups while older recipes still load',()=>{
 const r=recipe(),row=manual(r.ingredients[0],170457,300);assert.ok(validRecipe(r));assert.ok(validRecipe({...r,nutrition:{version:1,rows:[row]}}));
 for(const nutrition of [{version:2,rows:[]},{version:1,rows:[row,row]},{version:1,rows:[{...row,grams:-1}]},{version:1,rows:[{...row,index:50}]},{version:1,rows:[{...row,confirmed:false}]},{version:1,rows:[{...row,signature:'x'.repeat(601)}]}]){assert.equal(validNutritionSettings(nutrition),false);assert.equal(validRecipe({...r,nutrition}),false);}
});
test('backup/restore and cooking snapshots retain reference metadata without coupling history to later edits',()=>{
 const store=createAppStorage(memory()),r=recipe([ingredient('Eggs',2,'piece')]);saveRecipes(store,[r]);
 const updated=saveNutritionReference(store,'r',0,{fdcId:171287,grams:100,confirmed:true},nutritionStamp(r),now);
 saveCookingRecord(store,{id:'c',sourcePlanId:null,date:'2026-11-10',meal:'lunch',recipeSnapshot:updated,cookedServings:2,eatenServings:1,notes:'',photo:''},{now});
 const file=parseBackup(JSON.stringify(exportBackup(store,now))),target=createAppStorage(memory());restoreBackup(target,file,JSON.stringify(target.capture()),now);
 assert.deepEqual(loadRecipes(target).recipes[0].nutrition,updated.nutrition);assert.deepEqual(loadKitchen(target).records[0].recipeSnapshot.nutrition,updated.nutrition);
 saveNutritionReference(target,'r',0,{fdcId:171287,grams:120,confirmed:true},nutritionStamp(updated),now);assert.equal(loadKitchen(target).records[0].recipeSnapshot.nutrition.rows[0].grams,100);
});
test('both languages cover every nutrient, missing status and confirmation action',()=>{
 for(const c of Object.values(nutritionCopy)){for(const k of NUTRIENTS)assert.ok(c.nutrients[k]);for(const status of ['included','unmatched','state','mismatch','weight','unmeasured','stale'])assert.ok(c.status[status]);for(const k of ['save','reset','confirm','sourceNote','missing'])assert.ok(c[k]);assert.ok(c.coverage(1,2));assert.ok(c.weightNote(2));}
});
