import {loadRecipes,saveRecipes} from '../repositories/recipes.js';
import {withNutritionReference} from '../../shared/nutrition.js';
export function saveNutritionReference(storage,recipeId,index,input,expectedStamp,now=new Date().toISOString()){
  const loaded=loadRecipes(storage);
  if(loaded.error)throw new Error('Unreadable recipes');
  const recipe=loaded.recipes.find(r=>r.id===recipeId);
  if(!recipe)throw new Error('Recipe removed');
  const updated=withNutritionReference(recipe,index,input,expectedStamp,now);
  saveRecipes(storage,loaded.recipes.map(r=>r.id===recipeId?updated:r));
  return updated;
}
