import {validRecipe} from '../../shared/recipes.js';
export const RECIPE_KEY='eat-well-recipes-v1';
export function loadRecipes(storage){
  try{
    const raw=storage.getItem(RECIPE_KEY);
    if(raw===null)return {recipes:[],error:false};
    const data=JSON.parse(raw);
    if(data?.version!==1 || !Array.isArray(data.recipes) || !data.recipes.every(validRecipe)
      || new Set(data.recipes.map(r=>r.id)).size!==data.recipes.length)throw new Error('Invalid recipe data');
    return {recipes:data.recipes,error:false};
  }catch{return {recipes:[],error:true};}
}
export function saveRecipes(storage,recipes){
  if(!recipes.every(validRecipe) || new Set(recipes.map(r=>r.id)).size!==recipes.length)throw new Error('Invalid recipe data');
  storage.setItem(RECIPE_KEY,JSON.stringify({version:1,recipes}));
}
