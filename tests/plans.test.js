import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAN_KEY,localDay,validDay,followingDay,validPlan,loadPlans,savePlans,assignMeal,removeMeal,resolveMeal} from '../src/plans.js';
import {planCopy} from '../src/plan-copy.js';
const recipes=[{id:'tomato',name:'番茄炒蛋'},{id:'rice',name:'炒饭'}];
const meal=(changes={})=>({id:`dish:${changes.date??'2026-11-09'}:${changes.meal??'lunch'}`,date:'2026-11-09',meal:'lunch',recipeId:'tomato',servings:2,...changes});
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('local calendar day stays local; tomorrow works across DST, months and years',()=>{
  assert.equal(localDay(new Date(2026,10,9,0,1)),'2026-11-09');
  assert.equal(followingDay('2026-11-01'),'2026-11-02');
  assert.equal(followingDay('2026-03-08'),'2026-03-09');
  assert.equal(followingDay('2026-12-31'),'2027-01-01');
  assert.equal(followingDay('2028-02-28'),'2028-02-29');
  assert.equal(validDay('2026-02-29'),false);
  assert.equal(validDay('2026-11-31'),false);
});
test('replacing a dish preserves other dates, meals and source input',()=>{
  const lunch=meal(),dinner=meal({meal:'dinner'}),tomorrow=meal({date:'2026-11-10'});
  const original=[lunch,dinner,tomorrow];
  const result=assignMeal(original,meal({recipeId:'rice',servings:1.5}),recipes);
  assert.equal(result.length,3);assert.equal(original[0].recipeId,'tomato');
  assert.equal(resolveMeal(result,recipes,'2026-11-09','lunch').recipe.id,'rice');
  assert.deepEqual(resolveMeal(result,recipes,'2026-11-09','dinner').plan,dinner);
  assert.deepEqual(resolveMeal(result,recipes,'2026-11-10','lunch').plan,tomorrow);
});
test('plans round-trip with fractional servings and can be removed without touching recipes',()=>{
  const storage=memory();const plans=assignMeal([],meal({servings:0.75}),recipes);savePlans(storage,plans);
  assert.deepEqual(loadPlans(storage),{plans,error:false});
  savePlans(storage,removeMeal(loadPlans(storage).plans,'2026-11-09','lunch'));
  assert.deepEqual(loadPlans(storage).plans,[]);assert.equal(recipes.length,2);
});
test('invalid portions, missing recipe IDs and duplicate dish IDs are rejected',()=>{
  for(const servings of [0,-1,NaN,Infinity,0.3,101,'2'])assert.equal(validPlan(meal({servings})),false);
  assert.throws(()=>assignMeal([],meal({recipeId:'missing'}),recipes));
  assert.throws(()=>savePlans(memory(),[meal(),meal()]));
  assert.equal(validPlan(meal({meal:'breakfast'})),false);
});
test('deleted recipe keeps a recoverable placeholder; edits resolve from current recipe',()=>{
  const plans=[meal()];const missing=resolveMeal(plans,[],'2026-11-09','lunch');
  assert.equal(missing.recipe,null);assert.deepEqual(missing.plan,meal());
  assert.equal(resolveMeal(plans,[{id:'tomato',name:'新菜名'}],'2026-11-09','lunch').recipe.name,'新菜名');
  assert.equal(resolveMeal(plans,recipes,'2026-11-09','dinner'),null);
});
test('corrupt data remains untouched and quota errors propagate',()=>{
  const storage=memory();storage.setItem(PLAN_KEY,'{bad');
  assert.equal(loadPlans(storage).error,true);assert.equal(storage.getItem(PLAN_KEY),'{bad');
  assert.throws(()=>savePlans({getItem(){return null;},setItem(){throw new Error('quota');}},[meal()]),/quota/);
});
test('menu actions are available in both languages',()=>assert.deepEqual(Object.keys(planCopy.zh).sort(),Object.keys(planCopy.en).sort()));
test('v1 plans load without writes, retain all dates, and back up the original on first v2 save',()=>{
  const store=memory(),old=meal();delete old.id;
  const original=JSON.stringify({version:1,plans:[old]});store.setItem(PLAN_KEY,original);
  const loaded=loadPlans(store);assert.equal(loaded.error,false);assert.equal(loaded.plans[0].servings,old.servings);assert.equal(store.getItem(PLAN_KEY),original);
  savePlans(store,loaded.plans);assert.equal(store.getItem(`${PLAN_KEY}-v1-backup`),original);assert.equal(JSON.parse(store.getItem(PLAN_KEY)).version,2);
});
test('adding a second dish and removing it leaves the first dish unchanged',()=>{
  const first=meal(),second=meal({id:'dish-two',recipeId:'rice'});
  const plans=assignMeal([first],second,recipes);assert.equal(plans.length,2);
  assert.deepEqual(removeMeal(plans,first.date,first.meal,'dish-two'),[first]);
  assert.throws(()=>assignMeal(plans,{...second,id:'duplicate'},recipes),/Duplicate/);
});
