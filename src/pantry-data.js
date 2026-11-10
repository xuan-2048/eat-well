import {STATES,ingredientKey} from './recipes.js';
import {foodById,recognizeFood} from './foods.js';
import {validDay} from './plans.js';
export const PANTRY_UNITS=['g','kg','ml','l','piece','pack','bottle'];
export const LOCATIONS=['fridge','freezer','pantry'];
export function foodIdentity(name){const food=recognizeFood(name);return {foodId:food?.id??null,key:food?.key??ingredientKey(name)};}
export function validPantryItem(item){
  return Boolean(item&&typeof item.id==='string'&&item.id.length>0&&item.id.length<=100
    &&typeof item.name==='string'&&item.name.trim().length>0&&item.name.length<=80
    &&(item.foodId===null||Object.hasOwn(foodById,item.foodId))
    &&item.key===(item.foodId===null?ingredientKey(item.name):foodById[item.foodId].key)
    &&typeof item.amount==='number'&&Number.isFinite(item.amount)&&item.amount>0&&item.amount<=100000
    &&(item.state===undefined||STATES.includes(item.state))
    &&PANTRY_UNITS.includes(item.unit)&&LOCATIONS.includes(item.location)
    &&(item.date===''||validDay(item.date))
    &&typeof item.createdAt==='string'&&Number.isFinite(Date.parse(item.createdAt))
    &&typeof item.updatedAt==='string'&&Number.isFinite(Date.parse(item.updatedAt)));
}

export function validPantryItems(items){return Array.isArray(items)&&items.every(validPantryItem)&&new Set(items.map(i=>i.id)).size===items.length;}

export function validPurchaseReceipts(receipts){
  return Array.isArray(receipts)&&receipts.every(receipt=>receipt&&typeof receipt.id==='string'&&receipt.id.length>0&&receipt.id.length<=91&&validPantryItem(receipt.batch)&&receipt.batch.id===`shopping:${receipt.id}`)&&new Set(receipts.map(r=>r.id)).size===receipts.length;
}
