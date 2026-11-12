import {validNutritionBasis} from '../shared/nutrition-basis.js';
import {validPhotoEdit} from './photo-frame.js';
import {validRecipe} from './recipes.js';
import {MEALS,validDay} from './plans.js';
import {validPantryItem} from './pantry-data.js';
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const portion=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0.25&&n<=100&&Number.isInteger(n*4);
export const validCookingPhoto=photo=>photo===''||(typeof photo==='string'&&photo.length<=400000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(photo));
function validStock(stock){
  if(!stock||!['none','applied','undone'].includes(stock.status))return false;
  if(stock.status==='none')return true;
  return Number.isSafeInteger(stock.operation)&&stock.operation>0&&stamp(stock.at)
    &&(stock.status!=='undone'||stamp(stock.undoneAt))
    &&Array.isArray(stock.lines)&&stock.lines.length>0&&stock.lines.every(line=>validPantryItem(line.batch)
      &&Number.isFinite(line.amount)&&line.amount>0&&line.amount<=line.batch.amount
      &&Number.isFinite(line.afterAmount)&&line.afterAmount>=0&&Math.abs(line.batch.amount-line.amount-line.afterAmount)<0.000001)
    &&new Set(stock.lines.map(line=>line.batch.id)).size===stock.lines.length;
}
export function validCookingRecord(r){
  return Boolean(r&&text(r.id,64)&&(r.sourcePlanId===null||text(r.sourcePlanId,150))&&validDay(r.date)&&MEALS.includes(r.meal)
    &&validRecipe(r.recipeSnapshot)&&(r.nutritionBasis===undefined||validNutritionBasis(r.nutritionBasis,r.recipeSnapshot))&&portion(r.cookedServings)
    &&(r.eatenServings===null||typeof r.eatenServings==='number'&&Number.isFinite(r.eatenServings)&&r.eatenServings>=0&&r.eatenServings<=r.cookedServings&&Number.isInteger(r.eatenServings*4))
    &&typeof r.notes==='string'&&r.notes.length<=2000&&validCookingPhoto(r.photo)
    &&(r.photoEdit===undefined||r.photoEdit===null||r.photo!==''&&validPhotoEdit(r.photoEdit))
    &&Number.isSafeInteger(r.revision)&&r.revision>0&&validStock(r.stock)&&stamp(r.createdAt)&&stamp(r.updatedAt));
}
export function validCookingRecords(records){
  if(!Array.isArray(records)||!records.every(validCookingRecord)||new Set(records.map(r=>r.id)).size!==records.length)return false;
  const sources=records.filter(r=>r.sourcePlanId!==null).map(r=>r.sourcePlanId);
  return new Set(sources).size===sources.length;
}
