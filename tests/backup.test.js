import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppStorage,DATA_KEYS,ROOT_KEY,LANGUAGE_KEY} from '../src/storage.js';
import {exportBackup,parseBackup,restoreBackup,clearPhotos,recoveryBackup,inspectEntries,MAX_BACKUP_BYTES} from '../src/backup.js';
import {RECIPE_KEY,saveRecipes,loadRecipes,ingredientKey} from '../src/recipes.js';
import {PLAN_KEY,savePlans,loadPlans} from '../src/plans.js';
import {PANTRY_KEY,foodIdentity,savePantry,loadKitchen,loadPantry} from '../src/pantry.js';
import {saveCookingRecord,consumptionPreview,applyConsumption,undoConsumption} from '../src/cooking.js';
import {SHOPPING_KEY,saveShopping,loadShopping,receiveShopping} from '../src/shopping.js';
import {backupCopy} from '../src/backup-copy.js';
const now='2026-11-09T17:00:00Z';
const photo='data:image/jpeg;base64,/9j/2Q==';
const recipe={id:'r',name:'Tomatoes',cuisine:'everyday',servings:2,wanted:true,cooked:false,ingredients:[{name:'Tomatoes',key:ingredientKey('Tomatoes'),amount:300,unit:'g',state:'raw'}],steps:['Cook.'],photo,createdAt:now,updatedAt:now};
function memory(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
const signature=s=>JSON.stringify(s.capture());
function populated(){
 const raw=memory(),storage=createAppStorage(raw);
 saveRecipes(storage,[recipe]);savePlans(storage,[{id:'p',recipeId:'r',date:'2026-11-09',meal:'lunch',servings:2}]);
 saveShopping(storage,[{id:'s',name:'Tomatoes',...foodIdentity('Tomatoes'),amount:300,unit:'g',state:'raw',bought:true,received:false,source:'manual'}]);
 receiveShopping(storage,'s',{name:'Tomatoes',amount:600,unit:'g',state:'raw',location:'fridge',date:''},now);
 saveCookingRecord(storage,{id:'c',sourcePlanId:'p',date:'2026-11-09',meal:'lunch',recipeSnapshot:recipe,cookedServings:2,eatenServings:1,notes:'Saved note',photo},{now});
 const preview=consumptionPreview(storage,'c');applyConsumption(storage,'c',[{batchId:'shopping:s',amount:300}],preview.signature,now);
 storage.setItem(LANGUAGE_KEY,'en');return {raw,storage};
}
test('complete backup roundtrip retains photos, source IDs, deduction ledger and receipt history',()=>{
 const {storage}=populated(),file=exportBackup(storage,now),preview=parseBackup(JSON.stringify(file));
 assert.deepEqual(preview.counts,{recipes:1,plans:1,pantry:1,records:1,shopping:1,photos:2,missingRecipes:0});
 const target=createAppStorage(memory());restoreBackup(target,preview,signature(target),now);
 assert.deepEqual(target.capture(),storage.capture());assert.equal(loadRecipes(target).recipes[0].photo,photo);
 const kitchen=loadKitchen(target);assert.equal(kitchen.records[0].stock.status,'applied');assert.equal(kitchen.records[0].photo,photo);assert.equal(kitchen.receipts[0].id,'s');
 undoConsumption(target,'c',kitchen.records[0].revision,now);assert.equal(loadPantry(target).items[0].amount,600);
});
test('restore target and exact pre-restore copy are committed in one write; undo swaps whole collections',()=>{
 const {storage,raw}=populated(),before=storage.capture(),empty=createAppStorage(memory()),file=parseBackup(JSON.stringify(exportBackup(empty,now)));
 const writes=[];const counted=createAppStorage({...raw,setItem(k,v){writes.push(k);raw.setItem(k,v);}});
 restoreBackup(counted,file,signature(counted),now);assert.deepEqual(writes,[ROOT_KEY]);
 assert.equal(loadRecipes(counted).recipes.length,0);assert.deepEqual(recoveryBackup(counted).entries,before);
 const recovery=recoveryBackup(counted);restoreBackup(counted,recovery,signature(counted),now);
 assert.deepEqual(counted.capture(),before);assert.equal(recoveryBackup(counted).counts.recipes,0);
});
test('quota failure leaves all current collections and the previous recovery copy unchanged',()=>{
 const {storage,raw}=populated(),empty=parseBackup(JSON.stringify(exportBackup(createAppStorage(memory()),now)));
 restoreBackup(storage,empty,signature(storage),now);const before=new Map(raw.data);
 const blocked=createAppStorage({...raw,setItem(){throw new Error('quota');}});
 assert.throws(()=>restoreBackup(blocked,empty,signature(blocked),now),/quota/);assert.deepEqual(raw.data,before);
});
test('outdated preview cannot overwrite a recipe, language, stock or shopping update',()=>{
 const {storage}=populated(),preview=parseBackup(JSON.stringify(exportBackup(storage,now))),expected=signature(storage);
 saveRecipes(storage,[{...recipe,name:'Changed'}]);assert.throws(()=>restoreBackup(storage,preview,expected,now),/Data changed/);
 assert.equal(loadRecipes(storage).recipes[0].name,'Changed');
});
test('ordinary edits after restore preserve every other collection and the recovery copy',()=>{
 const {storage}=populated(),target=createAppStorage(memory());restoreBackup(target,parseBackup(JSON.stringify(exportBackup(storage,now))),signature(target),now);
 const previous=target.recovery();saveRecipes(target,[{...recipe,name:'Edited'}]);savePantry(target,loadPantry(target).items.map(i=>({...i,amount:400})));
 target.setItem(LANGUAGE_KEY,'zh');assert.deepEqual(target.recovery(),previous);assert.equal(loadKitchen(target).records.length,1);assert.equal(loadShopping(target).items[0].received,true);assert.equal(loadPlans(target).plans[0].id,'p');
});
test('legacy menu and pantry payloads remain exact and migrate normally after import',()=>{
 const raw=memory();raw.setItem(PLAN_KEY,JSON.stringify({version:1,plans:[{date:'2026-11-09',meal:'lunch',recipeId:'r',servings:2}]}));raw.setItem(PANTRY_KEY,JSON.stringify({version:1,items:[]}));
 const source=createAppStorage(raw),target=createAppStorage(memory()),before=source.capture();
 restoreBackup(target,parseBackup(JSON.stringify(exportBackup(source,now))),signature(target),now);assert.deepEqual(target.capture(),before);
 assert.equal(loadPlans(target).plans[0].id,'legacy:2026-11-09:lunch');savePlans(target,loadPlans(target).plans);assert.equal(JSON.parse(target.getItem(PLAN_KEY)).version,2);assert.equal(target.getItem(`${PLAN_KEY}-v1-backup`),before[PLAN_KEY]);
});
test('invalid JSON, unsupported versions, oversized files and arbitrary storage keys are rejected',()=>{
 const file=exportBackup(createAppStorage(memory()),now);
 for(const data of [{...file,version:3},{...file,format:'other'},{...file,exportedAt:'bad'},{...file,entries:{...file.entries,secret:'x'}},{...file,entries:[]},{...file,entries:{...file.entries,[LANGUAGE_KEY]:'fr'}}])assert.throws(()=>parseBackup(JSON.stringify(data)));
 assert.throws(()=>parseBackup('{'));assert.throws(()=>parseBackup(' '.repeat(MAX_BACKUP_BYTES+1)),/large/);
 assert.throws(()=>parseBackup(JSON.stringify({...file,entries:{...file.entries,[RECIPE_KEY]:'{"version":1,"recipes":[{}]}'}})));
});
test('all nested collections and unique IDs are validated before restoring',()=>{
 const {storage}=populated(),file=exportBackup(storage,now);
 for(const key of [RECIPE_KEY,PLAN_KEY,PANTRY_KEY,SHOPPING_KEY]){
  const bad=structuredClone(file),payload=JSON.parse(bad.entries[key]),array=key===RECIPE_KEY?'recipes':key===PLAN_KEY?'plans':'items';payload[array].push(payload[array][0]);bad.entries[key]=JSON.stringify(payload);assert.throws(()=>parseBackup(JSON.stringify(bad)));
 }
 const bad=structuredClone(file),kitchen=JSON.parse(bad.entries[PANTRY_KEY]);kitchen.records[0].stock.lines[0].amount=999;bad.entries[PANTRY_KEY]=JSON.stringify(kitchen);assert.throws(()=>parseBackup(JSON.stringify(bad)));
});
test('deleted recipes are reported but valid historical snapshots and orphaned plans stay intact',()=>{
 const {storage}=populated();saveRecipes(storage,[]);const preview=parseBackup(JSON.stringify(exportBackup(storage,now)));assert.equal(preview.counts.missingRecipes,1);assert.equal(preview.counts.records,1);
});
test('optional legacy cleanup failure cannot undo an atomic successful restore',()=>{
 const {storage}=populated(),raw=memory();raw.removeItem=()=>{throw new Error('blocked cleanup');};const target=createAppStorage(raw);
 restoreBackup(target,parseBackup(JSON.stringify(exportBackup(storage,now))),signature(target),now);assert.equal(loadRecipes(target).recipes.length,1);
});
test('corrupt restored envelope is surfaced without overwriting it',()=>{
 const raw=memory();raw.setItem(ROOT_KEY,'{"version":999}');const storage=createAppStorage(raw);
 assert.throws(()=>storage.setItem(LANGUAGE_KEY,'en'));assert.equal(loadRecipes(storage).error,true);assert.equal(raw.getItem(ROOT_KEY),'{"version":999}');
});
test('invalid current legacy data is preserved exactly in recovery when importing a valid file',()=>{
 const raw=memory();raw.setItem(RECIPE_KEY,'broken');const target=createAppStorage(raw),original=target.capture(),empty=parseBackup(JSON.stringify(exportBackup(createAppStorage(memory()),now)));
 restoreBackup(target,empty,signature(target),now);assert.deepEqual(target.recovery().entries,original);assert.equal(loadRecipes(target).error,false);
});
test('a second adapter observes restored data and subsequent edits without stale cached state',()=>{
 const raw=memory(),a=createAppStorage(raw),b=createAppStorage(raw),source=populated().storage;
 restoreBackup(a,parseBackup(JSON.stringify(exportBackup(source,now))),signature(a),now);assert.equal(loadPlans(b).plans.length,1);saveRecipes(b,[{...recipe,name:'Other tab'}]);assert.equal(loadRecipes(a).recipes[0].name,'Other tab');
});
test('backup interface copy has matching Chinese and English keys',()=>{assert.deepEqual(Object.keys(backupCopy.zh).sort(),Object.keys(backupCopy.en).sort());assert.ok(DATA_KEYS.every(key=>Object.hasOwn(exportBackup(createAppStorage(memory()),now).entries,key)));});

test('clearing photos removes editable originals but preserves text, plans, stock and an undo copy',()=>{
 const {storage}=populated(),before=storage.capture(),old=loadKitchen(storage).records[0];
 assert.equal(clearPhotos(storage,signature(storage),now),true);
 assert.equal(inspectEntries(storage.capture()).photos,0);const recipe=loadRecipes(storage).recipes[0],record=loadKitchen(storage).records[0];
 assert.equal(recipe.photo,'');assert.equal(recipe.photoEdit,null);assert.equal(record.photo,'');assert.equal(record.photoEdit,null);assert.equal(record.notes,old.notes);assert.deepEqual(record.stock,old.stock);assert.equal(record.revision,old.revision+1);
 assert.equal(storage.getItem(PLAN_KEY),before[PLAN_KEY]);assert.equal(storage.getItem(SHOPPING_KEY),before[SHOPPING_KEY]);assert.deepEqual(storage.recovery().entries,before);
 const recovery=storage.recovery();assert.equal(clearPhotos(storage,signature(storage),now),false);assert.deepEqual(storage.recovery(),recovery);
 restoreBackup(storage,recovery,signature(storage),now);assert.equal(inspectEntries(storage.capture()).photos,2);
});
test('failed photo clearing leaves images and originals untouched',()=>{
 const {storage,raw}=populated(),before=storage.capture(),blocked=createAppStorage({...raw,setItem(){throw new Error('quota');}});
 assert.throws(()=>clearPhotos(blocked,signature(blocked),now),/quota/);assert.deepEqual(storage.capture(),before);assert.equal(inspectEntries(storage.capture()).photos,2);
});
