import {NUTRIENTS,NUTRITION_VERSION,estimateRecipe} from './nutrition.js';
import {ingredientSignature} from './nutrition-settings.js';
export function nutritionBasisSignature(recipe){
  return JSON.stringify([recipe.servings,recipe.ingredients.map(ingredientSignature),(recipe.nutrition?.rows??[]).map(r=>[r.index,r.signature,r.fdcId,r.grams,r.confirmed,r.dataVersion]).sort((a,b)=>a[0]-b[0])]);
}
/** @returns {import('./contracts.ts').NutritionBasis} */
export function captureNutritionBasis(recipe,at=new Date().toISOString()){
  if(!Number.isFinite(Date.parse(at)))throw new Error('Invalid nutrition timestamp');
  const result=estimateRecipe(recipe,1);
  return {version:1,dataVersion:NUTRITION_VERSION,capturedAt:at,signature:nutritionBasisSignature(recipe),perServing:result.values,coverage:result.coverage,ingredientCount:result.total,includedIngredients:result.included,complete:result.complete};
}
export function validNutritionBasis(value,recipe){
  if(!value||value.version!==1||typeof value.dataVersion!=='string'||!value.dataVersion.trim()||value.dataVersion.length>100
    ||typeof value.capturedAt!=='string'||!Number.isFinite(Date.parse(value.capturedAt))||value.signature!==nutritionBasisSignature(recipe)
    ||value.ingredientCount!==recipe.ingredients.length||!Number.isInteger(value.includedIngredients)||value.includedIngredients<0||value.includedIngredients>value.ingredientCount
    ||!value.perServing||!value.coverage)return false;
  for(const key of NUTRIENTS){
    const n=value.perServing[key],count=value.coverage[key];
    if(!Number.isInteger(count)||count<0||count>value.includedIngredients||(count===0)!==(n===null)||n!==null&&(!Number.isFinite(n)||n<0))return false;
  }
  return value.complete===NUTRIENTS.every(key=>value.coverage[key]===value.ingredientCount);
}
