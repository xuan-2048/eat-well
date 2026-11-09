import test from 'node:test';
import assert from 'node:assert/strict';
import {weekDays,shiftDay,dateRange,copyMeal,mealCopyPreview,savePlans,loadPlans} from '../src/plans.js';
import {weekCopy} from '../src/week-copy.js';
import {buildShortages} from '../src/shortages.js';
import {shoppingFromShortages,saveShopping,loadShopping} from '../src/shopping.js';
const source={date:'2026-11-09',meal:'lunch'},target={date:'2026-11-11',meal:'dinner'};
const plan=(id,recipeId,slot=source,servings=2)=>({id,recipeId,...slot,servings});
const recipes=[{id:'tomato',name:'Tomatoes',servings:2,ingredients:[{name:'tomato',amount:300,unit:'g',state:'raw'}]},{id:'egg',name:'Eggs',servings:2,ingredients:[{name:'egg',amount:2,unit:'piece',state:'raw'}]}];
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('Monday-based week and date shifts cross DST, leap days and year boundaries',()=>{
 assert.deepEqual(weekDays('2026-11-01'),['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01']);
 assert.equal(weekDays('2027-01-01')[0],'2026-12-28');assert.equal(shiftDay('2028-02-28',2),'2028-03-01');
 assert.equal(shiftDay('2026-03-08',1),'2026-03-09');assert.throws(()=>shiftDay('2026-02-30',1));
});
test('selected dates are inclusive and reject invalid, reversed and oversized ranges',()=>{
 assert.deepEqual(dateRange('2026-12-31','2027-01-02'),['2026-12-31','2027-01-01','2027-01-02']);
 assert.deepEqual(dateRange('2026-11-09','2026-11-09'),['2026-11-09']);
 assert.equal(dateRange('2026-11-01','2026-12-01').length,31);
 for(const [start,end] of [['2026-11-10','2026-11-09'],['2026-02-30','2026-03-01'],['2026-11-01','2026-12-02']])assert.throws(()=>dateRange(start,end));
});
test('copying several dishes preserves target dishes and servings, skips duplicates and uses new IDs',()=>{
 const original=[plan('a','tomato',source,1.5),plan('b','egg'),plan('c','tomato',target,4)];
 const before=structuredClone(original),preview=mealCopyPreview(original,source,target,recipes);
 assert.equal(preview.added.length,1);assert.equal(preview.skipped.length,1);assert.equal(preview.existing[0].servings,4);
 const result=copyMeal(original,source,target,recipes,()=> 'new');assert.equal(result.added,1);assert.equal(result.skipped,1);
 assert.deepEqual(original,before);assert.equal(result.plans.length,4);assert.equal(result.plans.find(p=>p.id==='new').servings,2);
 assert.equal(result.plans.find(p=>p.id==='c').servings,4);
 const store=memory();savePlans(store,result.plans);assert.deepEqual(loadPlans(store).plans,result.plans);
 const again=copyMeal(result.plans,source,target,recipes,()=> 'unused');assert.equal(again.added,0);assert.deepEqual(again.plans,result.plans);
});
test('invalid copy destinations, empty sources, missing recipes and ID collisions never change source data',()=>{
 const items=[plan('a','tomato'),plan('b','egg')],before=structuredClone(items);
 assert.throws(()=>copyMeal(items,source,source,recipes,()=> 'new'),/Same meal/);
 assert.throws(()=>copyMeal(items,{date:'2026-11-10',meal:'lunch'},target,recipes,()=> 'new'),/Empty source/);
 assert.throws(()=>copyMeal(items,source,{...target,date:'bad'},recipes,()=> 'new'));
 assert.throws(()=>copyMeal(items,source,target,[recipes[0]],()=> 'new'),/Missing recipe/);
 assert.throws(()=>copyMeal(items,source,target,recipes,()=> 'a'),/Duplicate ID/);assert.deepEqual(items,before);
});
test('copied future dates participate in selected-day shortages without counting stock twice',()=>{
 const copied=copyMeal([plan('a','tomato',source,2)],source,target,recipes,()=> 'future').plans;
 const dates=dateRange(source.date,target.date);
 const report=buildShortages(copied,recipes,[{id:'batch',name:'Tomatoes',key:'tomato',foodId:'tomato',amount:400,unit:'g',state:'raw',date:''}],dates);
 assert.equal(report.rows[0].required,600);assert.equal(report.rows[0].available,400);assert.equal(report.rows[0].missing,200);
 const store=memory();saveShopping(store,shoppingFromShortages([],report.rows,()=> 'shop',dates));
 const entry=loadShopping(store).items[0];assert.equal(entry.amount,200);assert.deepEqual(entry.dates,dates);
});
test('weekly planning messages have matching English and Chinese coverage',()=>{
 assert.deepEqual(Object.keys(weekCopy.en).sort(),Object.keys(weekCopy.zh).sort());
 for(const lang of ['en','zh'])assert.ok(Object.values(weekCopy[lang]).every(value=>value.trim().length));
});
