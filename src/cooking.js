import {loadKitchen,saveKitchen,foodIdentity} from './pantry.js';
import {localDay} from './plans.js';
import {buildShortages,canonicalAmount,roundAmount} from './shortages.js';
import {validCookingRecord,validCookingRecords} from './cooking-data.js';
export {validCookingRecord,validCookingRecords} from './cooking-data.js';
export function loadCooking(storage){const data=loadKitchen(storage);return {records:data.records,error:data.error};}
function kitchen(storage){const data=loadKitchen(storage);if(data.error)throw new Error('Unreadable kitchen data');return data;}
function findRecord(data,id){const record=data.records.find(r=>r.id===id);if(!record)throw new Error('Record removed');return record;}
function checkRevision(record,revision){if(record.revision!==revision)throw new Error('Record changed');}
export function saveCookingRecord(storage,draft,{expectedRevision=null,now=new Date().toISOString()}={}){
  const data=kitchen(storage),old=data.records.find(r=>r.id===draft.id);
  if(old)checkRevision(old,expectedRevision);else if(expectedRevision!==null)throw new Error('Record removed');
  if(old?.stock.status==='applied'&&draft.cookedServings!==old.cookedServings)throw new Error('Undo first');
  const snapshot=old?.recipeSnapshot??structuredClone({...draft.recipeSnapshot,photo:'',photoEdit:null});
  const record={id:draft.id,sourcePlanId:old?old.sourcePlanId:draft.sourcePlanId??null,date:draft.date,meal:draft.meal,
    recipeSnapshot:snapshot,cookedServings:draft.cookedServings,eatenServings:draft.eatenServings,notes:draft.notes,photo:draft.photo,photoEdit:draft.photoEdit??null,
    stock:old?.stock??{status:'none'},revision:(old?.revision??0)+1,createdAt:old?.createdAt??now,updatedAt:now};
  if(!validCookingRecord(record)||record.date>localDay(new Date(now)))throw new Error('Invalid record');
  if(data.records.some(r=>r.id!==record.id&&record.sourcePlanId!==null&&r.sourcePlanId===record.sourcePlanId))throw new Error('Already recorded');
  const records=old?data.records.map(r=>r.id===old.id?record:r):[record,...data.records];
  saveKitchen(storage,data.items,records);return {record,records,items:data.items};
}
function signature(record,items){return JSON.stringify([record.id,record.revision,items]);}
export function consumptionPreview(storage,id){
  const data=kitchen(storage),record=findRecord(data,id);
  const plan={id:record.id,recipeId:record.recipeSnapshot.id,date:record.date,meal:record.meal,servings:record.cookedServings};
  const report=buildShortages([plan],[record.recipeSnapshot],data.items,[record.date]);
  const keys=new Set(record.recipeSnapshot.ingredients.map(i=>foodIdentity(i.name).key)),defaults=new Map();
  for(const row of report.rows)for(const used of row.allocations){
    const item=data.items.find(i=>i.id===used.batchId),factor=canonicalAmount(1,item.unit).amount;
    defaults.set(item.id,roundAmount((defaults.get(item.id)??0)+used.amount/factor));
  }
  return {record,rows:report.rows,items:data.items.filter(i=>keys.has(i.key)).map(item=>({item,amount:Math.min(item.amount,defaults.get(item.id)??0)})),signature:signature(record,data.items)};
}
export function applyConsumption(storage,id,usage,expectedSignature,now=new Date().toISOString()){
  const data=kitchen(storage),record=findRecord(data,id);
  if(record.stock.status==='applied')return {...data,record,already:true};
  if(signature(record,data.items)!==expectedSignature)throw new Error('Inventory changed');
  const keys=new Set(record.recipeSnapshot.ingredients.map(i=>foodIdentity(i.name).key));
  if(!Array.isArray(usage)||!usage.length||new Set(usage.map(u=>u.batchId)).size!==usage.length)throw new Error('Invalid usage');
  const lines=usage.map(u=>{
    const item=data.items.find(i=>i.id===u.batchId),amount=roundAmount(u.amount);
    if(!item||!keys.has(item.key)||!Number.isFinite(u.amount)||u.amount<=0||amount<=0||amount>item.amount)throw new Error('Invalid usage');
    return {batch:structuredClone(item),amount,afterAmount:roundAmount(item.amount-amount)};
  });
  const items=data.items.flatMap(item=>{const line=lines.find(l=>l.batch.id===item.id);return !line?[item]:line.afterAmount>0?[{...item,amount:line.afterAmount,updatedAt:now}]:[];});
  const next={...record,revision:record.revision+1,updatedAt:now,stock:{status:'applied',operation:record.revision+1,at:now,lines}};
  const records=data.records.map(r=>r.id===id?next:r);saveKitchen(storage,items,records);return {items,records,record:next,already:false};
}
function undoItems(data,record,now){
  const items=data.items.map(item=>({...item}));
  for(const [index,line] of record.stock.lines.entries()){
    const existing=items.find(i=>i.id===line.batch.id);
    if(existing&&existing.key===line.batch.key&&existing.unit===line.batch.unit&&(existing.state??'unspecified')===(line.batch.state??'unspecified')&&roundAmount(existing.amount+line.amount)<=100000){
      existing.amount=roundAmount(existing.amount+line.amount);existing.updatedAt=now;
    }else{
      const id=existing?`undo:${record.id}:${record.stock.operation}:${index}`:line.batch.id;
      if(items.some(i=>i.id===id))throw new Error('Restore conflict');
      items.push({...line.batch,id,amount:line.amount,updatedAt:now});
    }
  }
  return items;
}
export function undoConsumption(storage,id,expectedRevision,now=new Date().toISOString()){
  const data=kitchen(storage),record=findRecord(data,id);
  if(record.stock.status!=='applied')return {...data,record,already:true};
  checkRevision(record,expectedRevision);
  const items=undoItems(data,record,now),next={...record,revision:record.revision+1,updatedAt:now,stock:{...record.stock,status:'undone',undoneAt:now}};
  const records=data.records.map(r=>r.id===id?next:r);saveKitchen(storage,items,records);return {items,records,record:next,already:false};
}
export function deleteCookingRecord(storage,id,expectedRevision,now=new Date().toISOString()){
  const data=kitchen(storage),record=data.records.find(r=>r.id===id);
  if(!record)return {...data,already:true};checkRevision(record,expectedRevision);
  const items=record.stock.status==='applied'?undoItems(data,record,now):data.items;
  const records=data.records.filter(r=>r.id!==id);saveKitchen(storage,items,records);return {items,records,already:false};
}

export function pendingCookingPlans(plans,records){const done=new Set(records.map(r=>r.sourcePlanId).filter(Boolean));return plans.filter(plan=>!done.has(plan.id));}
