import {PLATE_KEY,validPlateStyle} from './plate-data.js';
import {loadRecipes} from './recipes.js';
import {loadPlans} from './plans.js';
import {loadKitchen} from './pantry.js';
import {loadShopping} from './shopping.js';
import {LANGUAGE_KEY,validEntries,normalizeEntries} from './storage.js';
export const MAX_BACKUP_BYTES=20*1024*1024;
const reader=entries=>({getItem:key=>entries[key]??null});
export function inspectEntries(entries){
  if(!validEntries(entries))throw new Error('Invalid backup');
  const storage=reader(entries),recipes=loadRecipes(storage),plans=loadPlans(storage),kitchen=loadKitchen(storage),shopping=loadShopping(storage);
  if([recipes,plans,kitchen,shopping].some(result=>result.error)||![null,'en','zh'].includes(entries[LANGUAGE_KEY])||entries[PLATE_KEY]!==null&&!validPlateStyle(entries[PLATE_KEY]))throw new Error('Invalid backup');
  return {recipes:recipes.recipes.length,plans:plans.plans.length,pantry:kitchen.items.length,records:kitchen.records.length,shopping:shopping.items.length,photos:recipes.recipes.filter(r=>r.photo).length+kitchen.records.filter(r=>r.photo).length,missingRecipes:plans.plans.filter(p=>!recipes.recipes.some(r=>r.id===p.recipeId)).length};
}
export function exportBackup(storage,now=new Date().toISOString()){
  const entries=storage.capture();inspectEntries(entries);
  if(!Number.isFinite(Date.parse(now)))throw new Error('Invalid date');
  return {format:'eat-well-backup',version:2,exportedAt:now,entries};
}
export function parseBackup(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('File too large');
  let data;try{data=JSON.parse(text);}catch{throw new Error('Invalid JSON');}
  if(data?.format!=='eat-well-backup'||![1,2].includes(data.version)||typeof data.exportedAt!=='string'||!Number.isFinite(Date.parse(data.exportedAt)))throw new Error('Unsupported backup');
  if(!validEntries(data.entries,{legacy:data.version===1}))throw new Error('Invalid backup');
  const entries=normalizeEntries(data.entries),counts=inspectEntries(entries);
  // Only the allowlisted collections are ever restored. No arbitrary storage keys.
  return {entries,exportedAt:data.exportedAt,counts};
}
export function restoreBackup(storage,preview,expected,now){
  inspectEntries(preview.entries);storage.replace(preview.entries,expected,now);
}
export function recoveryBackup(storage){
  const previous=storage.recovery();if(!previous)return null;
  return {...previous,counts:inspectEntries(previous.entries)};
}

// Photo deletion uses the same atomic recovery mechanism as a full restore.
export function clearPhotos(storage,expected,now=new Date().toISOString()){
  const entries=storage.capture();inspectEntries(entries);let changed=false;
  const cleanRecipe=recipe=>{
    const hadPhoto=Boolean(recipe.photo||recipe.photoEdit);
    const source=recipe.source?{title:recipe.source.title,url:recipe.source.url}:undefined;
    if(hadPhoto)changed=true;
    return {...recipe,photo:'',photoEdit:null,...(source?{source}:{}),...(hadPhoto?{updatedAt:now}:{})};
  };
  const recipeKey='eat-well-recipes-v1',pantryKey='eat-well-pantry-v1',next={...entries};
  if(entries[recipeKey]!==null){const recipes=JSON.parse(entries[recipeKey]);recipes.recipes=recipes.recipes.map(cleanRecipe);next[recipeKey]=JSON.stringify(recipes);}
  if(entries[pantryKey]!==null){
    const kitchen=JSON.parse(entries[pantryKey]);
    if(kitchen.version===2)kitchen.records=kitchen.records.map(record=>{
      const hadPhoto=Boolean(record.photo||record.photoEdit||record.recipeSnapshot.photo||record.recipeSnapshot.photoEdit);
      if(hadPhoto)changed=true;
      return {...record,photo:'',photoEdit:null,recipeSnapshot:cleanRecipe(record.recipeSnapshot),...(hadPhoto?{revision:record.revision+1,updatedAt:now}:{})};
    });
    next[pantryKey]=JSON.stringify(kitchen);
  }
  if(!changed)return false;
  inspectEntries(next);storage.replace(next,expected,now);return true;
}
