import {foodIdentity,PANTRY_UNITS,LOCATIONS,loadPantry,savePantry,validPantryItem} from './pantry.js';
import {STATES} from './recipes.js';
import {validDay} from './plans.js';
import {canonicalAmount,requirementKey,roundAmount} from './shortages.js';
export const SHOPPING_KEY='eat-well-shopping-v1';
export const SHOPPING_UNITS=[...PANTRY_UNITS,'tbsp','tsp'];
export function validShoppingItem(i){return Boolean(i&&typeof i.id==='string'&&i.id.length>0&&i.id.length<=91&&typeof i.name==='string'&&i.name.trim().length>0&&i.name.length<=80&&typeof i.key==='string'&&i.key===foodIdentity(i.name).key&&SHOPPING_UNITS.includes(i.unit)&&(i.amount===null||typeof i.amount==='number'&&Number.isFinite(i.amount)&&i.amount>0&&i.amount<=1e8)&&STATES.includes(i.state)&&typeof i.bought==='boolean'&&typeof i.received==='boolean'&&(!i.received||i.bought)&&['menu','manual'].includes(i.source)&&(i.receipt===undefined||validReceipt(i.receipt)));}
function validReceipt(r){return Boolean(r&&typeof r.name==='string'&&r.name.trim().length>0&&r.name.length<=80&&Number.isFinite(r.amount)&&r.amount>0&&r.amount<=100000&&PANTRY_UNITS.includes(r.unit)&&STATES.includes(r.state)&&LOCATIONS.includes(r.location)&&(r.date===''||validDay(r.date)));}
function validList(items){return Array.isArray(items)&&items.every(validShoppingItem)&&new Set(items.map(i=>i.id)).size===items.length;}
export function loadShopping(storage){try{const raw=storage.getItem(SHOPPING_KEY);if(raw===null)return {items:[],error:false};const data=JSON.parse(raw);if(data?.version!==1||!validList(data.items))throw new Error('Invalid shopping data');return {items:data.items,error:false};}catch{return {items:[],error:true};}}
export function saveShopping(storage,items){if(!validList(items))throw new Error('Invalid shopping list');storage.setItem(SHOPPING_KEY,JSON.stringify({version:1,items}));}
function groupOf(item){const quantity=canonicalAmount(item.amount,item.unit);return requirementKey(item.key,quantity.unit,item.state);}
export function shoppingFromShortages(items,rows,idFactory){
  if(!validList(items))throw new Error('Invalid shopping list');
  const keep=items.filter(i=>i.source!=='menu'||i.bought||i.received);
  for(const row of rows.filter(r=>r.status==='missing'&&r.missing>0)){
    const already=keep.filter(i=>!i.received&&groupOf(i)===row.id&&i.amount!==null).reduce((n,i)=>n+canonicalAmount(i.amount,i.unit).amount,0);
    const amount=roundAmount(Math.max(0,row.missing-already));if(!amount)continue;
    const old=items.find(i=>i.source==='menu'&&!i.bought&&!i.received&&groupOf(i)===row.id);
    keep.push({id:old?.id??idFactory(),name:row.name,key:row.key,amount,unit:row.unit,state:row.state,bought:false,received:false,source:'menu'});
  }
  return keep;
}
export function addManualShopping(items,entry,idFactory){
  if(!validList(items))throw new Error('Invalid shopping list');
  const quantity=canonicalAmount(entry.amount,entry.unit),identity=foodIdentity(entry.name);
  const candidate={...entry,...quantity,...identity,id:idFactory(),source:'manual',bought:false,received:false};
  if(!validShoppingItem(candidate))throw new Error('Invalid item');
  const existing=items.find(i=>!i.bought&&!i.received&&i.source==='manual'&&i.amount!==null&&candidate.amount!==null&&groupOf(i)===groupOf(candidate));
  if(candidate.amount===null&&items.some(i=>!i.bought&&!i.received&&i.source==='manual'&&i.amount===null&&groupOf(i)===groupOf(candidate)))return items;
  if(existing)return items.map(i=>i.id===existing.id?{...i,unit:candidate.unit,amount:roundAmount(canonicalAmount(i.amount,i.unit).amount+candidate.amount)}:i);
  return [...items,candidate];
}
// Write pantry first, then the shopping receipt. A deterministic pantry ID makes
// retrying after a quota error safe: it cannot add a second batch for the item.
export function receiveShopping(storage,id,details,now=new Date().toISOString()){
  const shopping=loadShopping(storage),inventory=loadPantry(storage);
  if(shopping.error||inventory.error)throw new Error('Unreadable data');
  const line=shopping.items.find(i=>i.id===id);if(!line||!line.bought)throw new Error('Mark purchased first');
  if(line.received)return {items:shopping.items,pantry:inventory.items};
  const item={id:`shopping:${id}`,name:details.name,...foodIdentity(details.name),amount:details.amount,unit:details.unit,location:details.location,date:details.date,state:details.state,createdAt:now,updatedAt:now};
  if(!validPantryItem(item)||!PANTRY_UNITS.includes(item.unit)||!LOCATIONS.includes(item.location)||!STATES.includes(item.state))throw new Error('Invalid inventory amount');
  const stored=inventory.items.find(i=>i.id===item.id)??item;
  const pantry=inventory.items.some(i=>i.id===item.id)?inventory.items:[item,...inventory.items];
  savePantry(storage,pantry);
  const items=shopping.items.map(i=>i.id===id?{...i,received:true,receipt:{name:stored.name,amount:stored.amount,unit:stored.unit,state:stored.state??'unspecified',location:stored.location,date:stored.date}}:i);saveShopping(storage,items);
  return {items,pantry};
}
