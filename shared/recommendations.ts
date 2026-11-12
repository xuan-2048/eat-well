import {validDay,followingDay} from './dates.js';
import {CUISINES} from './recipes.js';
import type {SavedRecipe} from './contracts.ts';

export interface RecommendationRecipe extends SavedRecipe {cuisine:string;cookMinutes?:number|null;photo:string}
export interface RecommendationOptions {cuisine:string;maxMinutes:number|null;date:string;meal:'lunch'|'dinner';servings:number}
export interface StockRow {
 id:string;key:string;name:string;unit:string;state:string;required:number|null;available:number;missing:number|null;
 status:'covered'|'review'|'missing';reasons:string[];
}
export interface Candidate {recipe:RecommendationRecipe;rows:StockRow[]}
export interface RecentCooking {date:string;recipeSnapshot:{id:string}}
export interface RankedCandidate extends Candidate {covered:number;missing:number;review:number;recent:boolean;score:number}

export function validRecommendationOptions(options:RecommendationOptions,today:string):boolean {
 return Boolean(options&&validDay(today)&&['all',...CUISINES].includes(options.cuisine)
  &&(options.maxMinutes===null||Number.isInteger(options.maxMinutes)&&options.maxMinutes>=1&&options.maxMinutes<=1440)
  &&[today,followingDay(today)].includes(options.date)&&['lunch','dinner'].includes(options.meal)
  &&Number.isFinite(options.servings)&&options.servings>=.25&&options.servings<=100&&Number.isInteger(options.servings*4));
}
export function rankRecommendations(candidates:Candidate[],history:RecentCooking[],options:RecommendationOptions,today:string){
 if(!validRecommendationOptions(options,today))throw new Error('Invalid recommendation options');
 const midnight=(day:string)=>new Date(`${day}T12:00:00Z`).getTime();
 const recentIds=new Set(history.filter(r=>validDay(r.date)&&r.date<=today&&midnight(today)-midnight(r.date)<=6*86400000).map(r=>r.recipeSnapshot.id));
 let unknownTime=0;
 const ranked:RankedCandidate[]=[];
 for(const candidate of candidates){
  const {recipe,rows}=candidate;
  if(options.cuisine!=='all'&&recipe.cuisine!==options.cuisine)continue;
  if(options.maxMinutes!==null){
   if(recipe.cookMinutes==null){unknownTime++;continue;}
   if(recipe.cookMinutes>options.maxMinutes)continue;
  }
  const covered=rows.filter(r=>r.status==='covered').length,missing=rows.filter(r=>r.status==='missing').length,review=rows.filter(r=>r.status==='review').length;
  const partial=rows.filter(r=>r.status!=='covered'&&r.required!==null&&r.required>0).reduce((sum,r)=>sum+Math.min(1,r.available/r.required!),0);
  const recent=recentIds.has(recipe.id),denominator=Math.max(1,rows.length);
  const score=100*covered/denominator+15*partial/denominator-(recent?20:0)+(recipe.cookMinutes==null?0:4/(1+recipe.cookMinutes/30));
  ranked.push({...candidate,covered,missing,review,recent,score});
 }
 ranked.sort((a,b)=>b.score-a.score||a.recipe.id.localeCompare(b.recipe.id));
 return {ranked,unknownTime};
}
