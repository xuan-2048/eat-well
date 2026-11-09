import {ingredientKey} from './recipes.js';
import {foodById,recognizeFood,pantryName} from './foods.js';
import {validDay,localDay} from './plans.js';
export const PANTRY_KEY='eat-well-pantry-v1';
export const PANTRY_UNITS=['g','kg','ml','l','piece','pack','bottle'];
export const LOCATIONS=['fridge','freezer','pantry'];
export function foodIdentity(name){const food=recognizeFood(name);return {foodId:food?.id??null,key:food?.key??ingredientKey(name)};}
export function validPantryItem(item){
  return Boolean(item&&typeof item.id==='string'&&item.id.length>0&&item.id.length<=100
    &&typeof item.name==='string'&&item.name.trim().length>0&&item.name.length<=80
    &&(item.foodId===null||Object.hasOwn(foodById,item.foodId))
    &&item.key===(item.foodId===null?ingredientKey(item.name):foodById[item.foodId].key)
    &&typeof item.amount==='number'&&Number.isFinite(item.amount)&&item.amount>0&&item.amount<=100000
    &&PANTRY_UNITS.includes(item.unit)&&LOCATIONS.includes(item.location)
    &&(item.date===''||validDay(item.date))
    &&typeof item.createdAt==='string'&&Number.isFinite(Date.parse(item.createdAt))
    &&typeof item.updatedAt==='string'&&Number.isFinite(Date.parse(item.updatedAt)));
}
function validItems(items){return Array.isArray(items)&&items.every(validPantryItem)&&new Set(items.map(i=>i.id)).size===items.length;}
export function loadPantry(storage){
  try{const raw=storage.getItem(PANTRY_KEY);if(raw===null)return {items:[],error:false};
    const data=JSON.parse(raw);if(data?.version!==1||!validItems(data.items))throw new Error('Invalid inventory');
    return {items:data.items,error:false};
  }catch{return {items:[],error:true};}
}
export function savePantry(storage,items){if(!validItems(items))throw new Error('Invalid inventory');storage.setItem(PANTRY_KEY,JSON.stringify({version:1,items}));}
export function upsertPantry(items,item,{editing=false}={}){
  if(!validItems(items)||!validPantryItem(item))throw new Error('Invalid ingredient');
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
