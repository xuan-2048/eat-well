import {loadRecipes,validRecipe} from '../recipes.js';
import {loadKitchen} from '../pantry.js';
import {loadPlans,assignMeal,savePlans,localDay} from '../plans.js';
import {buildShortages} from '../shortages.js';
import {loadShopping,saveShopping,appendRecommendationShortages} from '../shopping.js';
import {rankRecommendations,validRecommendationOptions} from '../../shared/recommendations.ts';
import type {Candidate,RecommendationOptions,RecommendationRecipe,StockRow} from '../../shared/recommendations.ts';

export interface RecommendationStorage {getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void}
export function readRecommendationData(storage:RecommendationStorage){
 const library=loadRecipes(storage),kitchen=loadKitchen(storage);
 if(library.error||kitchen.error)throw new Error('Unreadable recommendation data');
 const recipes=library.recipes as RecommendationRecipe[];
 const signature=JSON.stringify([recipes.map(r=>[r.id,r.name,r.servings,r.ingredients,r.nutrition??null,r.cuisine,r.cookMinutes??null]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),kitchen.items,kitchen.records.map((r:{id:string;date:string;recipeSnapshot:{id:string}})=>[r.id,r.date,r.recipeSnapshot.id])]);
 return {recipes,pantry:kitchen.items,history:kitchen.records,signature};
}
export function recommendationPreview(storage:RecommendationStorage,options:RecommendationOptions,today=localDay()){
 if(!validRecommendationOptions(options,today))throw new Error('Invalid recommendation options');
 const data=readRecommendationData(storage);
 const candidates:Candidate[]=data.recipes.map(recipe=>({recipe,rows:buildShortages([{id:'recommendation-preview',recipeId:recipe.id,date:options.date,meal:options.meal,servings:options.servings}],[recipe],data.pantry,[options.date]).rows as StockRow[]}));
 return {...data,...rankRecommendations(candidates,data.history,options,today)};
}
function freshCandidate(storage:RecommendationStorage,recipeId:string,options:RecommendationOptions,expected:string,today:string){
 const preview=recommendationPreview(storage,options,today);
 if(preview.signature!==expected)throw new Error('Recommendation changed');
 const candidate=preview.ranked.find(row=>row.recipe.id===recipeId);
 if(!candidate||!validRecipe(candidate.recipe))throw new Error('Recommendation changed');
 return candidate;
}
export function planRecommendation(storage:RecommendationStorage,recipeId:string,options:RecommendationOptions,expected:string,idFactory:()=>string,today=localDay()){
 const candidate=freshCandidate(storage,recipeId,options,expected,today),saved=loadPlans(storage);
 if(saved.error)throw new Error('Unreadable plans');
 const old=saved.plans.find((p:{recipeId:string;date:string;meal:string;servings:number})=>p.recipeId===recipeId&&p.date===options.date&&p.meal===options.meal);
 if(old)return {already:true,servings:old.servings};
 const plans=assignMeal(saved.plans,{id:idFactory(),recipeId:recipeId,date:options.date,meal:options.meal,servings:options.servings},[candidate.recipe]);
 savePlans(storage,plans);return {already:false,servings:options.servings};
}
export function shopRecommendation(storage:RecommendationStorage,recipeId:string,options:RecommendationOptions,expected:string,idFactory:()=>string,today=localDay()){
 const candidate=freshCandidate(storage,recipeId,options,expected,today),shopping=loadShopping(storage);
 if(shopping.error)throw new Error('Unreadable shopping list');
 const key=JSON.stringify([recipeId,options.date,options.meal]);
 const result=appendRecommendationShortages(shopping.items,candidate.rows,key,idFactory);
 if(result.added)saveShopping(storage,result.items);
 return result;
}
