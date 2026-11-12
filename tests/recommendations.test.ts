import test from 'node:test';
import assert from 'node:assert/strict';
import {rankRecommendations,validRecommendationOptions} from '../shared/recommendations.ts';
import type {RecommendationOptions,Candidate,RecommendationRecipe} from '../shared/recommendations.ts';
import {recommendationPreview,planRecommendation,shopRecommendation} from '../src/services/recommendations.ts';
import {saveRecipes,loadRecipes,validRecipe,ingredientKey} from '../src/recipes.js';
import {savePantry,foodIdentity,loadPantry,PANTRY_KEY} from '../src/pantry.js';
import {savePlans,loadPlans} from '../src/plans.js';
import {saveShopping,loadShopping,addManualShopping,shoppingFromShortages,SHOPPING_KEY} from '../src/shopping.js';
import {saveCookingRecord} from '../src/cooking.js';
import {createAppStorage} from '../src/storage.js';
import {exportBackup,parseBackup,restoreBackup} from '../src/backup.js';
import {recommendationCopy} from '../src/features/recommendations/recommendation-copy.ts';
const today='2026-11-12',now='2026-11-12T17:00:00Z';
const opts=(changes:Partial<RecommendationOptions>={}):RecommendationOptions=>({cuisine:'all',maxMinutes:null,date:today,meal:'dinner',servings:1,...changes});
const ingredient=(name:string,amount:number|null=300,unit='g',state='raw')=>({name,key:ingredientKey(name),amount,unit,state});
const recipe=(id='tomato',changes:object={})=>({id,name:`Dish ${id}`,cuisine:'chinese',cookMinutes:20,servings:1,wanted:true,cooked:false,ingredients:[ingredient('Tomatoes')],steps:['Cook.'],photo:'',createdAt:now,updatedAt:now,...changes});
function memory(){const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};}
const batch=(changes:object={})=>({id:'stock',name:'西红柿',...foodIdentity('西红柿'),amount:.3,unit:'kg',state:'raw',location:'fridge',date:'',createdAt:now,updatedAt:now,...changes});
const setup=()=>{const store=memory();saveRecipes(store,[recipe(),recipe('pasta',{cuisine:'italian',cookMinutes:30,ingredients:[ingredient('Pasta',100)]})]);return store;};
const ids=()=>{let n=0;return()=>`generated-${++n}`;};

test('optional cook time remains backward-compatible and survives saves and backups',()=>{
 const old=recipe();delete (old as Partial<typeof old>).cookMinutes;assert.ok(validRecipe(old));assert.ok(validRecipe({...old,cookMinutes:null}));
 for(const cookMinutes of [0,-1,1.5,1441,NaN,Infinity,'20'])assert.equal(validRecipe({...old,cookMinutes}),false);
 const store=createAppStorage(memory());saveRecipes(store,[recipe()]);const target=createAppStorage(memory());restoreBackup(target,parseBackup(JSON.stringify(exportBackup(store,now))),JSON.stringify(target.capture()),now);
 assert.equal(loadRecipes(target).recipes[0].cookMinutes,20);
});
test('stock matching uses existing aliases, units, preparation and selected servings without mutating stock',()=>{
 const store=setup();savePantry(store,[batch()]);const before=store.getItem(PANTRY_KEY);
 const result=recommendationPreview(store,opts(),today);assert.equal(result.ranked[0].recipe.id,'tomato');assert.equal(result.ranked[0].covered,1);
 const larger=recommendationPreview(store,opts({servings:2}),today).ranked.find(c=>c.recipe.id==='tomato')!;assert.equal(larger.rows[0].required,600);assert.equal(larger.rows[0].available,300);assert.equal(larger.rows[0].missing,300);assert.equal(store.getItem(PANTRY_KEY),before);
});
test('time and cuisine are hard filters; unknown durations never promise to meet a deadline',()=>{
 const store=setup();saveRecipes(store,[recipe(),recipe('unknown',{cookMinutes:null}),recipe('italian',{cuisine:'italian',cookMinutes:60})]);
 const result=recommendationPreview(store,opts({maxMinutes:30}),today);assert.deepEqual(result.ranked.map(c=>c.recipe.id),['tomato']);assert.equal(result.unknownTime,1);
 assert.equal(recommendationPreview(store,opts({maxMinutes:15}),today).ranked.length,0);
 assert.deepEqual(recommendationPreview(store,opts({cuisine:'italian'}),today).ranked.map(c=>c.recipe.id),['italian']);assert.equal(recommendationPreview(store,opts(),today).ranked.length,3);
});
test('incompatible units/states, unweighed ingredients and dates stay review items instead of invented coverage',()=>{
 const store=setup();saveRecipes(store,[recipe('review',{ingredients:[ingredient('Tomatoes'),ingredient('Salt',null,'toTaste','unspecified')]})]);
 for(const changed of [{unit:'piece',amount:2},{state:'cooked'},{date:'2026-11-11'}]){
  savePantry(store,[batch(changed)]);const entry=recommendationPreview(store,opts(),today).ranked[0];assert.equal(entry.covered,0);assert.equal(entry.review,2);assert.equal(entry.missing,0);
 }
 savePantry(store,[batch({date:today})]);assert.equal(recommendationPreview(store,opts(),today).ranked[0].covered,1);assert.equal(recommendationPreview(store,opts({date:'2026-11-13'}),today).ranked[0].covered,0);
});
test('recent actual cooking lowers rank while old records, future records and plans do not act as recent meals',()=>{
 const store=setup();saveRecipes(store,[recipe('a'),recipe('b')]);
 saveCookingRecord(store,{id:'c',sourcePlanId:null,date:today,meal:'lunch',recipeSnapshot:recipe('a'),cookedServings:1,eatenServings:null,notes:'',photo:''},{now});
 const result=recommendationPreview(store,opts(),today);assert.equal(result.ranked[0].recipe.id,'b');assert.equal(result.ranked.find(c=>c.recipe.id==='a')!.recent,true);
 const candidates=result.ranked.map(({recipe,rows})=>({recipe,rows}));
 assert.equal(rankRecommendations(candidates,[{date:'2026-11-05',recipeSnapshot:{id:'a'}},{date:'2026-11-13',recipeSnapshot:{id:'b'}}],opts(),today).ranked.some(c=>c.recent),false);
});
test('ranking is deterministic, nonmutating and empty/invalid choices are explicit',()=>{
 const candidates=[{recipe:recipe('a') as RecommendationRecipe,rows:[]},{recipe:recipe('b') as RecommendationRecipe,rows:[]}] as Candidate[];
 const before=structuredClone(candidates);assert.deepEqual(rankRecommendations(candidates,[],opts(),today).ranked.map(c=>c.recipe.id),['a','b']);assert.deepEqual(candidates,before);assert.equal(rankRecommendations([],[],opts(),today).ranked.length,0);
 for(const change of [{date:'2026-11-11'},{date:'2026-11-14'},{cuisine:'made-up'},{servings:0},{servings:.1},{maxMinutes:0},{meal:'breakfast'}])assert.equal(validRecommendationOptions({...opts(),...change} as RecommendationOptions,today),false);
});
test('adding a dish preserves other plans and duplicate attempts never overwrite their servings',()=>{
 const store=setup(),o=opts(),preview=recommendationPreview(store,o,today);savePlans(store,[{id:'existing',recipeId:'pasta',date:today,meal:'dinner',servings:2}]);
 assert.equal(planRecommendation(store,'tomato',o,preview.signature,ids(),today).already,false);assert.equal(loadPlans(store).plans.length,2);
 assert.equal(planRecommendation(store,'tomato',opts({servings:3}),preview.signature,ids(),today).already,true);assert.equal(loadPlans(store).plans.find((p:{recipeId:string})=>p.recipeId==='tomato')!.servings,1);
});
test('stale recipe/stock/history previews cannot write either menu or shopping',()=>{
 const store=setup(),preview=recommendationPreview(store,opts(),today);saveRecipes(store,[recipe('tomato',{cookMinutes:25}),recipe('pasta')]);
 assert.throws(()=>planRecommendation(store,'tomato',opts(),preview.signature,ids(),today),/changed/);
 const next=recommendationPreview(store,opts(),today);savePantry(store,[batch()]);assert.throws(()=>shopRecommendation(store,'tomato',opts(),next.signature,ids(),today),/changed/);assert.equal(loadShopping(store).items.length,0);
 const current=recommendationPreview(store,opts(),today);
 saveCookingRecord(store,{id:'recent',sourcePlanId:null,date:today,meal:'lunch',recipeSnapshot:recipe('tomato'),cookedServings:1,eatenServings:null,notes:'',photo:''},{now});
 assert.throws(()=>planRecommendation(store,'tomato',opts(),current.signature,ids(),today),/changed/);
 assert.throws(()=>shopRecommendation(store,'tomato',opts(),current.signature,ids(),today),/changed/);assert.equal(loadPlans(store).plans.length,0);
});
test('recommendation groceries append to manual/menu items; repeating or reloading does not double-add',()=>{
 const store=setup(),id=ids();let shopping=addManualShopping([],{name:'西红柿',amount:100,unit:'g',state:'raw'},id);
 shopping=shoppingFromShortages(shopping,[{id:JSON.stringify(['custom:pasta','g','raw']),name:'Pasta',key:ingredientKey('Pasta'),unit:'g',state:'raw',status:'missing',missing:100}],id,[today]);saveShopping(store,shopping);
 const preview=recommendationPreview(store,opts(),today),first=shopRecommendation(store,'tomato',opts(),preview.signature,id,today);assert.equal(first.added,1);
 assert.equal(first.items.find((i:{name:string;amount:number})=>i.name==='西红柿')!.amount,400);assert.ok(first.items.some((i:{name:string;source:string})=>i.source==='menu'&&i.name==='Pasta'));
 const before=store.getItem(SHOPPING_KEY);assert.equal(shopRecommendation(store,'tomato',opts(),preview.signature,id,today).already,1);assert.equal(store.getItem(SHOPPING_KEY),before);
 // Different meal is a separate requirement; the same target stays idempotent even after quantity changes.
 assert.equal(shopRecommendation(store,'tomato',opts({servings:2}),preview.signature,id,today).already,1);
 assert.equal(shopRecommendation(store,'tomato',opts({meal:'lunch'}),preview.signature,id,today).added,1);
 for(const received of [false,true]){
  const items=loadShopping(store).items.map((i:{recommendationKeys?:string[]})=>i.recommendationKeys?{...i,bought:true,received}:i);saveShopping(store,items);
  const purchased=store.getItem(SHOPPING_KEY);assert.equal(shopRecommendation(store,'tomato',opts(),preview.signature,id,today).already,1);assert.equal(store.getItem(SHOPPING_KEY),purchased);
 }
});
test('unknown quantities are excluded from shopping and failed writes preserve every collection',()=>{
 const store=setup();saveRecipes(store,[recipe('tomato',{ingredients:[ingredient('Tomatoes'),ingredient('Salt',null,'toTaste','unspecified')]})]);
 const preview=recommendationPreview(store,opts(),today),before=store.getItem(SHOPPING_KEY);
 assert.throws(()=>shopRecommendation({...store,setItem(){throw new Error('quota');}},'tomato',opts(),preview.signature,ids(),today),/quota/);assert.equal(store.getItem(SHOPPING_KEY),before);
 const result=shopRecommendation(store,'tomato',opts(),preview.signature,ids(),today);assert.equal(result.added,1);assert.equal(result.review,1);assert.equal(result.items.length,1);assert.equal(loadPantry(store).items.length,0);
});
test('shopping markers survive backup and malformed markers/corrupt collections are rejected',()=>{
 const store=createAppStorage(memory());saveRecipes(store,[recipe()]);const preview=recommendationPreview(store,opts(),today);shopRecommendation(store,'tomato',opts(),preview.signature,ids(),today);
 const target=createAppStorage(memory());restoreBackup(target,parseBackup(JSON.stringify(exportBackup(store,now))),JSON.stringify(target.capture()),now);
 const p=recommendationPreview(target,opts(),today);assert.equal(shopRecommendation(target,'tomato',opts(),p.signature,ids(),today).already,1);
 const corrupt=memory();corrupt.setItem(SHOPPING_KEY,JSON.stringify({version:1,items:[{...loadShopping(store).items[0],recommendationKeys:['x','x']}]}));assert.equal(loadShopping(corrupt).error,true);
 corrupt.setItem(PANTRY_KEY,'broken');assert.throws(()=>recommendationPreview(corrupt,opts(),today),/Unreadable/);assert.equal(corrupt.getItem(PANTRY_KEY),'broken');
 assert.deepEqual(Object.keys(recommendationCopy.zh).sort(),Object.keys(recommendationCopy.en).sort());
});
