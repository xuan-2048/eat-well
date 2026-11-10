import test from 'node:test';
import assert from 'node:assert/strict';
import {PANTRY_KEY,foodIdentity,savePantry,loadPantry,loadKitchen} from '../src/pantry.js';
import {saveCookingRecord,loadCooking,consumptionPreview,applyConsumption,undoConsumption,deleteCookingRecord,validCookingRecord} from '../src/cooking.js';
import {ingredientKey} from '../src/recipes.js';
const now='2026-11-09T17:00:00Z';
const recipe=()=>({id:'recipe',name:'Tomato & eggs',cuisine:'chinese',servings:2,wanted:true,cooked:false,ingredients:[{name:'Tomatoes',key:ingredientKey('Tomatoes'),amount:300,unit:'g',state:'raw'},{name:'Eggs',key:ingredientKey('Eggs'),amount:2,unit:'piece',state:'raw'},{name:'Salt',key:ingredientKey('Salt'),amount:null,unit:'toTaste',state:'unspecified'}],steps:['Cook the tomatoes and eggs.'],photo:'',createdAt:now,updatedAt:now});
const batch=(id,name,amount,unit)=>({id,name,...foodIdentity(name),amount,unit,state:'raw',location:'fridge',date:'',createdAt:now,updatedAt:now});
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const draft=(changes={})=>({id:'record',sourcePlanId:'plan',date:'2026-11-09',meal:'lunch',recipeSnapshot:recipe(),cookedServings:3,eatenServings:1.25,notes:'Left some for tomorrow.',photo:'',...changes});
function setup(){const store=memory();savePantry(store,[batch('tomatoes','西红柿',1,'kg'),batch('eggs','Eggs',6,'piece')]);return store;}
const create=(store,changes={})=>saveCookingRecord(store,draft(changes),{now}).record;
const uses=preview=>preview.items.filter(i=>i.amount>0).map(i=>({batchId:i.item.id,amount:i.amount}));
test('legacy pantry is backed up and cooking records save with inventory without changing amounts',()=>{
 const store=setup(),original=store.getItem(PANTRY_KEY),record=create(store);
 assert.equal(store.getItem(`${PANTRY_KEY}-v1-backup`),original);assert.equal(loadKitchen(store).version,2);
 assert.equal(loadPantry(store).items[0].amount,1);assert.equal(loadCooking(store).records[0].eatenServings,1.25);assert.equal(record.stock.status,'none');
 const items=loadPantry(store).items;savePantry(store,[...items,batch('garlic','Garlic',1,'pack')]);assert.equal(loadCooking(store).records.length,1);
});
test('records keep a historical recipe snapshot even after source and draft recipe edits',()=>{
 const store=setup(),source=recipe(),record=create(store,{recipeSnapshot:source});source.name='Changed';source.ingredients[0].amount=999;
 const saved=saveCookingRecord(store,{...record,notes:'Updated note',recipeSnapshot:source},{expectedRevision:record.revision,now});
 assert.equal(saved.record.recipeSnapshot.name,'Tomato & eggs');assert.equal(saved.record.recipeSnapshot.ingredients[0].amount,300);
});
test('cooked/eaten quantities remain distinct, unknown intake stays null and invalid portions/future dates fail',()=>{
 const store=setup();const record=create(store,{eatenServings:null});assert.equal(record.eatenServings,null);
 assert.ok(validCookingRecord({...record,eatenServings:0}));
 for(const changes of [{cookedServings:0},{eatenServings:4},{eatenServings:-1},{eatenServings:0.1},{date:'2026-11-10'}])assert.throws(()=>saveCookingRecord(store,draft(changes),{expectedRevision:record.revision,now}));
 assert.equal(loadCooking(store).records[0].revision,1);
});
test('one plan cannot be recorded twice; stale edits cannot overwrite newer changes or recreate a deleted record',()=>{
 const store=setup(),record=create(store);
 assert.throws(()=>create(store,{id:'duplicate'}),/Already recorded/);
 saveCookingRecord(store,{...record,notes:'Newer'},{expectedRevision:1,now});
 assert.throws(()=>saveCookingRecord(store,record,{expectedRevision:1,now}),/Record changed/);
 deleteCookingRecord(store,record.id,2,now);
 assert.throws(()=>saveCookingRecord(store,record,{expectedRevision:2,now}),/Record removed/);
});
test('preview scales by cooked portions, converts grams to stored kilograms and leaves to-taste unknown',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record');
 assert.equal(preview.items.find(i=>i.item.id==='tomatoes').amount,0.45);assert.equal(preview.items.find(i=>i.item.id==='eggs').amount,3);
 assert.equal(preview.rows.find(r=>r.foodId==='salt').status,'review');assert.equal(loadPantry(store).items[0].amount,1);
});
test('confirmed consumption is atomic and retrying it never deducts twice',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record'),usage=uses(preview);
 const before=store.getItem(PANTRY_KEY),flaky={getItem:store.getItem,setItem(){throw new Error('quota');}};
 assert.throws(()=>applyConsumption(flaky,'record',usage,preview.signature,now),/quota/);assert.equal(store.getItem(PANTRY_KEY),before);
 applyConsumption(store,'record',usage,preview.signature,now);assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').amount,0.55);
 assert.equal(loadCooking(store).records[0].stock.status,'applied');
 assert.equal(applyConsumption(store,'record',usage,preview.signature,now).already,true);assert.equal(loadPantry(store).items.find(i=>i.id==='eggs').amount,3);
});
test('stale stock previews, excessive usage and unrelated batches never change stock or history',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record');
 savePantry(store,[...loadPantry(store).items,batch('garlic','garlic',1,'pack')]);
 assert.throws(()=>applyConsumption(store,'record',uses(preview),preview.signature,now),/Inventory changed/);
 const current=consumptionPreview(store,'record'),before=store.getItem(PANTRY_KEY);
 for(const usage of [[{batchId:'tomatoes',amount:2}],[{batchId:'garlic',amount:1}],[{batchId:'eggs',amount:-1}],[{batchId:'eggs',amount:1},{batchId:'eggs',amount:1}]])assert.throws(()=>applyConsumption(store,'record',usage,current.signature,now));
 assert.equal(store.getItem(PANTRY_KEY),before);
});
test('incompatible units are not guessed but explicit actual-use quantities can be confirmed',()=>{
 const store=memory();savePantry(store,[batch('pieces','Tomatoes',5,'piece')]);create(store);
 const preview=consumptionPreview(store,'record');assert.equal(preview.items[0].amount,0);assert.equal(preview.rows[0].status,'review');
 applyConsumption(store,'record',[{batchId:'pieces',amount:2}],preview.signature,now);assert.equal(loadPantry(store).items[0].amount,3);
});
test('undo adds consumed quantities back to current stock and remains idempotent',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record');let result=applyConsumption(store,'record',uses(preview),preview.signature,now);
 savePantry(store,loadPantry(store).items.map(i=>i.id==='tomatoes'?{...i,amount:0.2}:i));
 result=undoConsumption(store,'record',result.record.revision,now);assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').amount,0.65);
 undoConsumption(store,'record',result.record.revision,now);assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').amount,0.65);
});
test('undo recreates a fully consumed batch and restores separately if its identity or unit changed',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record');const result=applyConsumption(store,'record',[{batchId:'tomatoes',amount:1}],preview.signature,now);
 assert.equal(loadPantry(store).items.some(i=>i.id==='tomatoes'),false);
 undoConsumption(store,'record',result.record.revision,now);assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').amount,1);
 const second=consumptionPreview(store,'record'),used=applyConsumption(store,'record',[{batchId:'tomatoes',amount:0.45}],second.signature,now);
 savePantry(store,loadPantry(store).items.map(i=>i.id==='tomatoes'?{...i,unit:'pack',amount:1}:i));
 undoConsumption(store,'record',used.record.revision,now);
 assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').unit,'pack');assert.equal(loadPantry(store).items.find(i=>i.id.startsWith('undo:')).amount,0.45);
});
test('changing cooked servings requires undo; eaten servings and notes can be edited without changing stock',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record'),used=applyConsumption(store,'record',uses(preview),preview.signature,now);
 assert.throws(()=>saveCookingRecord(store,{...used.record,cookedServings:4},{expectedRevision:used.record.revision,now}),/Undo first/);
 const edited=saveCookingRecord(store,{...used.record,eatenServings:2,notes:'Ate more'},{expectedRevision:used.record.revision,now});
 assert.equal(edited.record.eatenServings,2);assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').amount,0.55);
});
test('deleting a deducted record restores inventory in the same atomic write, with no second refund on retry',()=>{
 const store=setup();create(store);const preview=consumptionPreview(store,'record'),used=applyConsumption(store,'record',uses(preview),preview.signature,now);
 const before=store.getItem(PANTRY_KEY),flaky={getItem:store.getItem,setItem(){throw new Error('quota');}};
 assert.throws(()=>deleteCookingRecord(flaky,'record',used.record.revision,now),/quota/);assert.equal(store.getItem(PANTRY_KEY),before);
 deleteCookingRecord(store,'record',used.record.revision,now);deleteCookingRecord(store,'record',used.record.revision,now);
 assert.equal(loadCooking(store).records.length,0);assert.equal(loadPantry(store).items.find(i=>i.id==='tomatoes').amount,1);
});
test('corrupt cooking data and failed legacy backups preserve the original stored collection',()=>{
 const store=setup(),original=store.getItem(PANTRY_KEY);
 const noBackup={getItem:store.getItem,setItem(k,v){if(k.endsWith('-backup'))throw new Error('quota');store.setItem(k,v);}};
 assert.throws(()=>create(noBackup),/quota/);assert.equal(store.getItem(PANTRY_KEY),original);
 store.setItem(PANTRY_KEY,JSON.stringify({version:2,items:loadPantry(store).items,records:[{bad:true}]}));const broken=store.getItem(PANTRY_KEY);
 assert.equal(loadCooking(store).error,true);assert.equal(loadPantry(store).error,true);assert.throws(()=>savePantry(store,[]));assert.equal(store.getItem(PANTRY_KEY),broken);
});

import {cookingCopy} from '../src/cooking-copy.js';
test('cooking and consumption controls have matching English and Chinese text',()=>{assert.deepEqual(Object.keys(cookingCopy.zh).sort(),Object.keys(cookingCopy.en).sort());for(const lang of ['en','zh'])assert.ok(Object.values(cookingCopy[lang]).every(value=>value.trim().length));});

import {pendingCookingPlans} from '../src/cooking.js';
test('shopping excludes logged plan IDs while copied plans stay pending; deleting the record restores the original plan',()=>{
 const store=setup();create(store);
 const plans=[{id:'plan',date:'2026-11-09'},{id:'copy',date:'2026-11-10'}];
 assert.deepEqual(pendingCookingPlans(plans,loadCooking(store).records),[plans[1]]);
 deleteCookingRecord(store,'record',1,now);
 assert.deepEqual(pendingCookingPlans(plans,loadCooking(store).records),plans);
});

import {addManualShopping,saveShopping,receiveShopping,loadShopping,SHOPPING_KEY} from '../src/shopping.js';
test('a retried purchase receipt never re-adds a batch already consumed by a cooking record',()=>{
 const store=setup();create(store);
 const list=addManualShopping([],{name:'Tomatoes',amount:500,unit:'g',state:'raw'},()=> 'receipt');list[0].bought=true;saveShopping(store,list);
 let fail=true;const flaky={getItem:store.getItem,setItem(k,v){if(k===SHOPPING_KEY&&fail){fail=false;throw new Error('quota');}store.setItem(k,v);}};
 const detail={name:'Tomatoes',amount:500,unit:'g',state:'raw',location:'fridge',date:''};
 assert.throws(()=>receiveShopping(flaky,'receipt',detail,now),/quota/);assert.equal(loadCooking(store).records.length,1);
 const preview=consumptionPreview(store,'record');applyConsumption(store,'record',[{batchId:'shopping:receipt',amount:500}],preview.signature,now);
 assert.equal(loadPantry(store).items.some(i=>i.id==='shopping:receipt'),false);
 receiveShopping(store,'receipt',detail,now);
 assert.equal(loadPantry(store).items.some(i=>i.id==='shopping:receipt'),false);
 assert.equal(loadShopping(store).items[0].received,true);assert.equal(loadShopping(store).items[0].receipt.amount,500);
 assert.equal(loadCooking(store).records[0].stock.status,'applied');
});
