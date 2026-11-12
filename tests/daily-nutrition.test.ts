import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyNutrition,recordIntake,dailyNutrients} from '../shared/daily-nutrition.ts';
import type {IntakeRecord} from '../shared/daily-nutrition.ts';
import {captureNutritionBasis,validNutritionBasis} from '../shared/nutrition-basis.js';
import {foodByFdc} from '../shared/nutrition.js';
import {ingredientKey,saveRecipes} from '../src/recipes.js';
import {saveCookingRecord,loadCooking,deleteCookingRecord} from '../src/cooking.js';
import {loadKitchen,PANTRY_KEY} from '../src/pantry.js';
import {exportBackup,parseBackup,restoreBackup} from '../src/backup.js';
import {createAppStorage} from '../src/storage.js';
import {dailyCopy} from '../src/features/cooking/daily-copy.ts';
const now='2026-11-11T15:00:00Z',day='2026-11-11';
const ingredient=(name:string,amount:number|null=100,unit='g',state='raw')=>({name,key:ingredientKey(name),amount,unit,state});
const recipe=()=>({id:'r',name:'Tomato & eggs',cuisine:'chinese',servings:2,wanted:true,cooked:false,ingredients:[ingredient('Tomatoes',300),ingredient('Eggs',100)],steps:['Cook.'],photo:'',createdAt:now,updatedAt:now});
const record=(changes:object={}):IntakeRecord=>({id:'a',date:day,meal:'lunch',recipeSnapshot:recipe() as IntakeRecord['recipeSnapshot'],cookedServings:3,eatenServings:1.25,...changes});
function memory(){const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};}
const draft=(changes:object={})=>({...record(),sourcePlanId:null,notes:'',photo:'',...changes});
const near=(a:number|null,b:number)=>assert.ok(a!==null&&Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('daily intake follows eaten servings, not recipe yield, portions made or stock deduction',()=>{
 const row=recordIntake(record());near(row.values.energy,123.125);near(row.values.protein,9.5);assert.equal(row.status,'complete');
 const report=dailyNutrition([record()],day);near(report.values.energy,123.125);assert.equal(report.complete,true);assert.equal(report.legacy,1);
 const store=memory(),saved=saveCookingRecord(store,draft(),{now}).record;assert.equal(saved.stock.status,'none');near(dailyNutrition([saved as IntakeRecord],day).values.energy,123.125);
});
test('empty days, unknown eaten portions and true zero portions stay distinct',()=>{
 const empty=dailyNutrition([],day);assert.equal(empty.complete,false);assert.equal(empty.total,0);
 const unknown=dailyNutrition([record({eatenServings:null})],day);assert.equal(unknown.unrecorded,1);
 for(const key of dailyNutrients){assert.equal(empty.values[key],null);assert.equal(unknown.values[key],null);}
 const zero=dailyNutrition([record({eatenServings:0,recipeSnapshot:{...recipe(),ingredients:[ingredient('Unknown sauce',null,'toTaste','unspecified')]}})],day);
 assert.equal(zero.rows[0].status,'notEaten');assert.equal(zero.complete,true);for(const key of dailyNutrients)assert.equal(zero.values[key],0);
});
test('partial ingredient values and unrecorded portions produce a visibly incomplete known subtotal',()=>{
 const partial=record({recipeSnapshot:{...recipe(),ingredients:[ingredient('Tomatoes',300),ingredient('Eggs',2,'piece')]} });
 const records=[partial,record({id:'b',eatenServings:null}),record({id:'c',eatenServings:1,meal:'dinner'})];
 const report=dailyNutrition(records,day);assert.equal(report.complete,false);assert.equal(report.partial,1);assert.equal(report.unrecorded,1);near(report.values.energy,33.75+98.5);
 assert.equal(report.known.energy,2);assert.equal(report.completeCounts.energy,1);assert.equal(report.rows[0].status,'partial');
});
test('meal/date grouping does not borrow other days and supports several dishes per meal',()=>{
 const rows=[record(),record({id:'b',meal:'lunch',eatenServings:1}),record({id:'c',meal:'dinner',eatenServings:2}),record({id:'d',date:'2026-11-10'})];
 const result=dailyNutrition(rows,day);assert.equal(result.total,3);assert.equal(result.meals[0].total,2);assert.equal(result.meals[1].total,1);near(result.values.energy,98.5*4.25);
 near(dailyNutrition(rows,'2026-11-10').values.energy,123.125);assert.equal(dailyNutrition(rows,'2026-11-09').values.energy,null);
});
test('duplicates, invalid dates and impossible intake are rejected instead of double-counted',()=>{
 assert.throws(()=>dailyNutrition([record(),record()],day));assert.throws(()=>dailyNutrition([],'2026-02-30'));
 for(const eatenServings of [-1,4,.1,NaN,Infinity])assert.throws(()=>recordIntake(record({eatenServings})));
 assert.throws(()=>dailyNutrition([record({meal:'breakfast'})],day));
});
test('new saves pin nutrition; edits preserve the basis even after recipe/source data changes',()=>{
 const store=memory(),original=recipe();saveRecipes(store,[original]);
 const saved=saveCookingRecord(store,draft({recipeSnapshot:original}),{now}).record;assert.ok(saved.nutritionBasis);assert.ok(validNutritionBasis(saved.nutritionBasis,saved.recipeSnapshot));
 const basis=structuredClone(saved.nutritionBasis),source=foodByFdc(170457)!;const prior=source.per100g.energy;
 try{
  source.per100g.energy=999;saveRecipes(store,[{...original,ingredients:[ingredient('Tomatoes',9999)]}]);
  const edited=saveCookingRecord(store,{...saved,eatenServings:2,recipeSnapshot:{...original,servings:9}},{expectedRevision:saved.revision,now}).record;
  assert.deepEqual(edited.nutritionBasis,basis);assert.equal(edited.recipeSnapshot.servings,2);near(recordIntake(edited as IntakeRecord).values.energy,197);
 }finally{source.per100g.energy=prior;}
});
test('legacy records remain valid and use their own saved recipe without being silently upgraded',()=>{
 const store=memory(),saved=saveCookingRecord(store,draft(),{now}).record;delete saved.nutritionBasis;
 store.setItem(PANTRY_KEY,JSON.stringify({version:2,items:[],records:[saved],receipts:[]}));
 const edited=saveCookingRecord(store,{...saved,notes:'Edited legacy note'},{expectedRevision:saved.revision,now}).record;
 assert.equal(edited.nutritionBasis,undefined);assert.equal(recordIntake(edited as IntakeRecord).basisKind,'recipe');near(recordIntake(edited as IntakeRecord).values.energy,123.125);
});
test('basis signature ignores photo/name changes but rejects changed quantities and invalid metrics',()=>{
 const source=recipe(),basis=captureNutritionBasis(source,now);assert.ok(validNutritionBasis(basis,{...source,name:'Renamed',photo:''}));
 assert.equal(validNutritionBasis(basis,{...source,servings:3}),false);
 for(const invalid of [{...basis,perServing:{...basis.perServing,energy:-1}},{...basis,complete:false},{...basis,coverage:{...basis.coverage,energy:0}},{...basis,ingredientCount:99},{...basis,dataVersion:''},{...basis,capturedAt:'invalid'}])assert.equal(validNutritionBasis(invalid,source),false);
});
test('backup/recovery and date/portion edits preserve the basis and update the appropriate daily total',()=>{
 const store=createAppStorage(memory()),saved=saveCookingRecord(store,draft(),{now}).record;
 const target=createAppStorage(memory());restoreBackup(target,parseBackup(JSON.stringify(exportBackup(store,now))),JSON.stringify(target.capture()),now);
 assert.deepEqual(loadKitchen(target).records[0].nutritionBasis,saved.nutritionBasis);
 const edited=saveCookingRecord(target,{...saved,date:'2026-11-10',eatenServings:.5},{expectedRevision:saved.revision,now}).record;
 assert.equal(dailyNutrition(loadCooking(target).records as IntakeRecord[],day).total,0);near(dailyNutrition([edited as IntakeRecord],'2026-11-10').values.energy,49.25);
 deleteCookingRecord(target,edited.id,edited.revision,now);assert.equal(dailyNutrition(loadCooking(target).records as IntakeRecord[],'2026-11-10').total,0);
});
test('corrupt saved bases are surfaced without rewriting data, and failed saves leave no half-record',()=>{
 const store=memory(),saved=saveCookingRecord(store,draft(),{now}).record;const before=store.getItem(PANTRY_KEY);
 assert.throws(()=>saveCookingRecord({...store,setItem(){throw new Error('quota');}},draft({id:'new'}),{now}),/quota/);assert.equal(store.getItem(PANTRY_KEY),before);
 const broken={...saved,nutritionBasis:{...saved.nutritionBasis,signature:'broken'}};const raw=JSON.stringify({version:2,items:[],records:[broken]});store.setItem(PANTRY_KEY,raw);
 assert.equal(loadCooking(store).error,true);assert.equal(store.getItem(PANTRY_KEY),raw);
});
test('missing individual nutrients keep their own coverage and translations cover the daily view',()=>{
 const r=record(),basis=captureNutritionBasis(r.recipeSnapshot,now);basis.perServing.fiber=null;basis.coverage.fiber=0;basis.complete=false;
 const report=dailyNutrition([{...r,nutritionBasis:basis}],day);assert.equal(report.values.fiber,null);near(report.values.energy,123.125);assert.equal(report.complete,false);
 assert.deepEqual(Object.keys(dailyCopy.zh).sort(),Object.keys(dailyCopy.en).sort());
});
