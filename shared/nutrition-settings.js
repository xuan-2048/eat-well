export function ingredientSignature(ingredient){return JSON.stringify([ingredient.name.normalize('NFKC').trim().toLowerCase(),ingredient.key,ingredient.amount,ingredient.unit,ingredient.state]);}
export function validNutritionSettings(value){
  return Boolean(value&&value.version===1&&Array.isArray(value.rows)&&value.rows.length<=50
    &&value.rows.every(row=>row&&Number.isInteger(row.index)&&row.index>=0&&row.index<50&&typeof row.signature==='string'&&row.signature.length<=600&&Number.isSafeInteger(row.fdcId)&&row.fdcId>0&&row.fdcId<=1e8&&typeof row.dataVersion==='string'&&row.dataVersion.length>0&&row.dataVersion.length<=100&&Number.isFinite(row.grams)&&row.grams>0&&row.grams<=1e7&&row.confirmed===true)
    &&new Set(value.rows.map(row=>row.index)).size===value.rows.length);
}
