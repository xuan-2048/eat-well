import test from 'node:test';
import assert from 'node:assert/strict';
import {ingredientKey} from '../src/recipes.js';
import {pantryName,recognizeFood} from '../src/foods.js';
import {PANTRY_KEY,PANTRY_UNITS,LOCATIONS,foodIdentity,validPantryItem,loadPantry,savePantry,upsertPantry,daysToDate,dateStatus,filterPantry} from '../src/pantry.js';
import {pantryCopy} from '../src/pantry-copy.js';
const item=(changes={})=>({id:'one',name:'西红柿',...foodIdentity('西红柿'),amount:300,unit:'g',location:'fridge',date:'2026-11-11',createdAt:'2026-11-09T05:00:00Z',updatedAt:'2026-11-09T05:00:00Z',...changes});
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('Chinese synonyms and English normalize; unknown foods keep their original identity',()=>{
  for(const name of ['番茄',' 西红柿 ','TOMATO','ｔｏｍａｔｏｅｓ'])assert.equal(foodIdentity(name).foodId,'tomato');
  assert.equal(foodIdentity('constructor').key,'custom:constructor');assert.equal(foodIdentity('__proto__').key,'custom:__proto__');
  assert.equal(foodIdentity('自制辣酱').foodId,null);assert.equal(foodIdentity('自制辣酱').key,ingredientKey('自制辣酱'));
  assert.equal(pantryName(item(),'en'),'Tomatoes');assert.notEqual(recognizeFood('大米').id,recognizeFood('米饭').id);
});
test('positive amounts, explicit units, storage and valid optional dates are required',()=>{
  assert.ok(validPantryItem(item()));assert.ok(validPantryItem(item({date:''})));
  for(const amount of [0,-1,NaN,Infinity,'2'])assert.equal(validPantryItem(item({amount})),false);
  for(const changes of [{date:'2026-02-30'},{unit:'toTaste'},{location:'floor'},{name:' '},{key:'wrong'}])assert.equal(validPantryItem(item(changes)),false);
});
test('create/edit/delete round-trip; equal foods are separate batches with units preserved',()=>{
  const store=memory();let items=upsertPantry([],item());
  items=upsertPantry(items,item({id:'two',unit:'pack',amount:1,location:'freezer'}));savePantry(store,items);
  assert.equal(loadPantry(store).items.length,2);assert.equal(items.find(i=>i.id==='two').unit,'pack');
  items=upsertPantry(loadPantry(store).items,item({amount:450}),{editing:true});savePantry(store,items);
  assert.equal(loadPantry(store).items.find(i=>i.id==='one').amount,450);
  savePantry(store,items.filter(i=>i.id!=='one'));assert.equal(loadPantry(store).items[0].id,'two');
  assert.throws(()=>upsertPantry([],item(),{editing:true}));
});
test('date reminders use calendar days across DST and distinguish unknown/past/today/soon',()=>{
  assert.equal(daysToDate('2026-11-02','2026-11-01'),1);assert.equal(daysToDate('2026-03-09','2026-03-08'),1);
  assert.equal(dateStatus('','2026-11-09'),'none');assert.equal(dateStatus('2026-11-08','2026-11-09'),'past');
  assert.equal(dateStatus('2026-11-09','2026-11-09'),'today');assert.equal(dateStatus('2026-11-12','2026-11-09'),'soon');
  assert.equal(dateStatus('2026-11-13','2026-11-09'),'later');
});
test('location/date filters compose with cross-language synonym search',()=>{
  const items=[item(),item({id:'two',date:'',location:'freezer'}),item({id:'three',date:'2026-11-08'})];
  assert.equal(filterPantry(items,{query:'番茄',location:'freezer'}).length,1);
  assert.equal(filterPantry(items,{query:'tomato',dateFilter:'soon',today:'2026-11-09'}).length,1);
  assert.equal(filterPantry(items,{dateFilter:'past',today:'2026-11-09'}).length,1);
  assert.equal(filterPantry(items,{dateFilter:'none'}).length,1);
});
test('corrupt or duplicate records are reported without overwriting; quota errors propagate',()=>{
  const store=memory();store.setItem(PANTRY_KEY,'bad');assert.equal(loadPantry(store).error,true);assert.equal(store.getItem(PANTRY_KEY),'bad');
  store.setItem(PANTRY_KEY,JSON.stringify({version:1,items:[item(),item()]}));assert.equal(loadPantry(store).error,true);
  assert.throws(()=>savePantry({setItem(){throw new Error('quota');}},[item()]),/quota/);
});
test('bilingual pantry labels cover units, storage and the same messages',()=>{
  assert.deepEqual(Object.keys(pantryCopy.zh).sort(),Object.keys(pantryCopy.en).sort());
  for(const lang of ['zh','en']){for(const id of PANTRY_UNITS)assert.ok(pantryCopy[lang].units[id]);for(const id of LOCATIONS)assert.ok(pantryCopy[lang].locations[id]);}
});
