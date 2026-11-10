import {nutritionData} from './nutrition-data.js';
import {ingredientSignature} from './nutrition-settings.js';
import {validNutritionRecipe} from './recipes.js';
export const NUTRIENTS=['energy','protein','carbs','fat','fiber'];
export const NUTRITION_VERSION='usda-sr-legacy-2018-04-v1';
export const nutritionFoods=nutritionData.foods;
export const nutritionSource=nutritionData.source;
const normalize=value=>value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export const foodByFdc=id=>nutritionFoods.find(food=>food.fdcId===id)??null;
export function referenceMatches(ingredient){const name=normalize(ingredient.name);return nutritionFoods.filter(food=>food.aliases.some(alias=>normalize(alias)===name));}
export function compatibleState(ingredient,food,confirmed=false){return food.state==='asSold'||ingredient.state===food.state||ingredient.state==='unspecified'&&confirmed;}
export function nutritionStamp(recipe){return JSON.stringify([recipe.id,recipe.servings,recipe.ingredients,recipe.nutrition??null]);}
export function estimateIngredient(ingredient,index,setting){
  const aliases=referenceMatches(ingredient),automatic=aliases.find(food=>compatibleState(ingredient,food))??aliases[0]??null;
  const row={index,ingredient,reference:setting?foodByFdc(setting.fdcId):automatic,grams:null,status:'included',manual:Boolean(setting),nutrients:Object.fromEntries(NUTRIENTS.map(key=>[key,null]))};
  if(setting&&(setting.signature!==ingredientSignature(ingredient)||setting.dataVersion!==NUTRITION_VERSION)){row.status='stale';return row;}
  if(!row.reference){row.status='unmatched';return row;}
  if(!compatibleState(ingredient,row.reference,Boolean(setting?.confirmed))){row.status=ingredient.state==='unspecified'?'state':'mismatch';return row;}
  // Only measured mass is automatic. Portion references require an explicit user choice.
  row.grams=setting?.grams??(ingredient.unit==='g'?ingredient.amount:null);
  if(row.grams===null){row.status=ingredient.unit==='toTaste'?'unmeasured':'weight';return row;}
  if(!Number.isFinite(row.grams)||row.grams<=0){row.grams=null;row.status='weight';return row;}
  for(const key of NUTRIENTS){const value=row.reference.per100g[key];if(typeof value==='number'&&Number.isFinite(value)&&value>=0)row.nutrients[key]=value*row.grams/100;}
  return row;
}
export function estimateRecipe(recipe,servings=1){
  if(!validNutritionRecipe(recipe)||!Number.isFinite(servings)||servings<=0||servings>100)throw new Error('Invalid nutrition recipe');
  const settings=recipe.nutrition?.rows??[],rows=recipe.ingredients.map((ingredient,index)=>estimateIngredient(ingredient,index,settings.find(row=>row.index===index)));
  const totals={},scaled={},coverage={};
  for(const key of NUTRIENTS){const known=rows.filter(row=>row.nutrients[key]!==null);coverage[key]=known.length;totals[key]=known.length?known.reduce((total,row)=>total+row.nutrients[key],0):null;scaled[key]=totals[key]===null?null:totals[key]*servings/recipe.servings;}
  const included=rows.filter(row=>row.status==='included').length;
  return {rows,totals,values:scaled,coverage,included,total:rows.length,complete:NUTRIENTS.every(key=>coverage[key]===rows.length),servings,recipeServings:recipe.servings};
}

export function withNutritionReference(recipe,index,input,expectedStamp,now=new Date().toISOString()){
  if(nutritionStamp(recipe)!==expectedStamp)throw new Error('Recipe changed');
  const ingredient=recipe.ingredients[index];if(!Number.isInteger(index)||!ingredient)throw new Error('Invalid ingredient');
  let rows=(recipe.nutrition?.rows??[]).filter(row=>row.index!==index);
  if(input!==null){
    const reference=foodByFdc(input.fdcId);if(!reference||input.confirmed!==true)throw new Error('Invalid reference');
    if(!compatibleState(ingredient,reference,true))throw new Error('Preparation mismatch');
    if(!Number.isFinite(input.grams)||input.grams<=0||input.grams>1e7)throw new Error('Missing weight');
    rows.push({index,signature:ingredientSignature(ingredient),fdcId:reference.fdcId,grams:input.grams,confirmed:true,dataVersion:NUTRITION_VERSION});
  }
  const updated={...recipe,nutrition:{version:1,rows:rows.sort((a,b)=>a.index-b.index)},updatedAt:now};
  return updated;
}
