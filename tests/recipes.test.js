import test from 'node:test';
import assert from 'node:assert/strict';
import {ingredientKey,validRecipe,loadRecipes,saveRecipes,filterRecipes,RECIPE_KEY} from '../src/recipes.js';
const make=()=>({id:'one',name:'番茄炒蛋',cuisine:'chinese',servings:2,wanted:true,cooked:false,
  ingredients:[{key:'tomato',name:'西红柿',amount:300,unit:'g',state:'raw'}],steps:['切块并炒熟。'],photo:'',createdAt:'2026-11-08T12:00:00Z',updatedAt:'2026-11-08T12:00:00Z'});
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
test('ingredient aliases use a stable key without guessing unknown food identity',()=>{
  assert.equal(ingredientKey(' 西红柿 '),ingredientKey('Tomatoes'));
  assert.equal(ingredientKey('自制辣酱'),'custom:自制辣酱');
});
test('structured amounts reject zero, NaN and unsupported units; to-taste is explicit unknown',()=>{
  const r=make();assert.ok(validRecipe(r));
  for(const amount of [0,-1,NaN,Infinity,'300'])assert.equal(validRecipe({...r,ingredients:[{...r.ingredients[0],amount}]}),false);
  assert.equal(validRecipe({...r,servings:0}),false);
  assert.equal(validRecipe({...r,steps:[]}),false);
  assert.equal(validRecipe({...r,ingredients:[{...r.ingredients[0],unit:'bucket'}]}),false);
  assert.ok(validRecipe({...r,ingredients:[{...r.ingredients[0],amount:null,unit:'toTaste'}]}));
});
test('create/edit/status/delete persist through reload with exact quantities and Unicode',()=>{
  const store=memory();const r=make();saveRecipes(store,[r]);
  assert.deepEqual(loadRecipes(store),{recipes:[r],error:false});
  const edited={...r,name:'番茄炒蛋 v2',cooked:true,wanted:false,servings:3};saveRecipes(store,[edited]);
  assert.deepEqual(loadRecipes(store).recipes,[edited]);
  saveRecipes(store,[]);assert.deepEqual(loadRecipes(store).recipes,[]);
});
test('broken or duplicate persisted data is reported without overwriting originals',()=>{
  const store=memory();store.setItem(RECIPE_KEY,'{broken');assert.equal(loadRecipes(store).error,true);
  assert.equal(store.getItem(RECIPE_KEY),'{broken');
  store.setItem(RECIPE_KEY,JSON.stringify({version:1,recipes:[make(),make()]}));assert.equal(loadRecipes(store).error,true);
});
test('quota errors are propagated so the UI can keep the draft open',()=>{
  assert.throws(()=>saveRecipes({setItem(){throw new Error('quota');}},[make()]),/quota/);
});
test('wanted and cooked are independent and compose with cuisine and ingredient search',()=>{
  const r=make();const both={...r,id:'two',name:'Egg toast',cuisine:'everyday',cooked:true};
  assert.equal(filterRecipes([r,both],{tab:'wanted'}).length,2);
  assert.equal(filterRecipes([r,both],{tab:'cooked'}).length,1);
  assert.deepEqual(filterRecipes([r,both],{cuisine:'chinese',query:'西红柿'}),[r]);
  assert.equal(filterRecipes([r,both],{query:'不存在'}).length,0);
});
test('stored photos must be bounded inline JPEGs, never remote URLs or HTML',()=>{
  const r=make();
  for(const photo of ['https://example.test/image.jpg','javascript:alert(1)','data:image/svg+xml,<svg/>'])assert.equal(validRecipe({...r,photo}),false);
  assert.ok(validRecipe({...r,photo:'data:image/jpeg;base64,YWJj'}));
});
