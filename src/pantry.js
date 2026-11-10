import {pantryName,recognizeFood} from './foods.js';
import {validDay,localDay} from './plans.js';
import {validPantryItem,validPantryItems,validPurchaseReceipts} from './pantry-data.js';
import {validCookingRecords} from './cooking-data.js';
export {PANTRY_UNITS,LOCATIONS,foodIdentity,validPantryItem} from './pantry-data.js';
export const PANTRY_KEY='eat-well-pantry-v1';
export function loadKitchen(storage){
  try{
    const raw=storage.getItem(PANTRY_KEY);
    if(raw===null)return {version:1,items:[],records:[],receipts:[],error:false};
    const data=JSON.parse(raw);
    if(![1,2].includes(data?.version)||!validPantryItems(data.items)||data.version===2&&(!validCookingRecords(data.records)||(data.receipts!==undefined&&!validPurchaseReceipts(data.receipts))))throw new Error('Invalid kitchen data');
    return {version:data.version,items:data.items,records:data.version===2?data.records:[],receipts:data.version===2?(data.receipts??[]):[],error:false};
  }catch{return {version:0,items:[],records:[],receipts:[],error:true};}
}
export function loadPantry(storage){const result=loadKitchen(storage);return {items:result.items,error:result.error};}
export function saveKitchen(storage,items,records,receipts){
  if(!validPantryItems(items)||!validCookingRecords(records))throw new Error('Invalid kitchen data');
  const current=loadKitchen(storage);if(current.error)throw new Error('Unreadable kitchen data');
  const savedReceipts=receipts??current.receipts;if(!validPurchaseReceipts(savedReceipts))throw new Error('Invalid receipts');
  if(current.version===1){
    const raw=storage.getItem(PANTRY_KEY),backup=`${PANTRY_KEY}-v1-backup`;
    if(raw!==null&&storage.getItem(backup)===null)storage.setItem(backup,raw);
  }
  // A single localStorage write commits inventory and cooking records together.
  storage.setItem(PANTRY_KEY,JSON.stringify({version:2,items,records,receipts:savedReceipts}));
}
export function savePantry(storage,items,{receipt}={}){
  if(!validPantryItems(items))throw new Error('Invalid inventory');
  const current=loadKitchen(storage);if(current.error)throw new Error('Unreadable kitchen data');
  if(current.version===2||receipt){
    if(receipt&&!validPurchaseReceipts([receipt]))throw new Error('Invalid receipt');
    const receipts=receipt&&!current.receipts.some(r=>r.id===receipt.id)?[...current.receipts,receipt]:current.receipts;
    saveKitchen(storage,items,current.records,receipts);
  }
  else storage.setItem(PANTRY_KEY,JSON.stringify({version:1,items}));
}
export function upsertPantry(items,item,{editing=false}={}){
  if(!validPantryItems(items)||!validPantryItem(item))throw new Error('Invalid ingredient');
  if(editing&&!items.some(i=>i.id===item.id))throw new Error('Entry no longer exists');
  return items.some(i=>i.id===item.id)?items.map(i=>i.id===item.id?{...item}:i):[{...item},...items];
}
export function daysToDate(date,today=localDay()){
  if(!validDay(date)||!validDay(today))return null;
  const epoch=value=>{const [y,m,d]=value.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;};
  return epoch(date)-epoch(today);
}
export function dateStatus(date,today=localDay()){
  const days=daysToDate(date,today);
  return days===null?'none':days<0?'past':days===0?'today':days<=3?'soon':'later';
}
export function filterPantry(items,{location='all',dateFilter='all',query='',today=localDay()}={}){
  const q=query.normalize('NFKC').trim().toLowerCase(),recognized=q?recognizeFood(q):null;
  return items.filter(item=>
    (location==='all'||item.location===location)
    &&(dateFilter==='all'||(dateFilter==='soon'?['today','soon'].includes(dateStatus(item.date,today)):dateFilter==='past'?dateStatus(item.date,today)==='past':!item.date))
    &&(!q||[item.name,pantryName(item,'zh'),pantryName(item,'en')].some(name=>name.normalize('NFKC').toLowerCase().includes(q))||item.foodId===recognized?.id))
    .sort((a,b)=>(a.date?0:1)-(b.date?0:1)||(a.date||'').localeCompare(b.date||'')||b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
}
