import {NUTRITION_VERSION} from './nutrition.js';
import {validNutritionRecipe} from './recipes.js';
import {validNutritionBasis,captureNutritionBasis} from './nutrition-basis.js';
import {validDay} from './dates.js';
import type {Nutrient,NutrientValues,SavedRecipe,NutritionBasis} from './contracts.ts';

export type Meal = 'lunch' | 'dinner';
export const dailyNutrients: Nutrient[] = ['energy','protein','carbs','fat','fiber'];
export type {NutritionBasis} from './contracts.ts';
export interface IntakeRecord {
  id: string; date: string; meal: Meal; recipeSnapshot: SavedRecipe;
  cookedServings: number; eatenServings: number | null; nutritionBasis?: NutritionBasis;
}
export type IntakeStatus = 'complete' | 'partial' | 'unavailable' | 'unrecorded' | 'notEaten';
export interface IntakeRow {
  id: string; meal: Meal; name: string; eatenServings: number | null; cookedServings: number;
  values: NutrientValues; nutrientComplete: Record<Nutrient,boolean>; status: IntakeStatus;
  basisKind: 'frozen' | 'recipe'; dataVersion: string; capturedAt: string | null;
  includedIngredients: number; ingredientCount: number;
}
const unknown = (): NutrientValues => ({energy:null,protein:null,carbs:null,fat:null,fiber:null});
const flags = (value:boolean) => Object.fromEntries(dailyNutrients.map(key=>[key,value])) as Record<Nutrient,boolean>;

export function recordIntake(record:IntakeRecord):IntakeRow {
  if(!validNutritionRecipe(record.recipeSnapshot)||!Number.isFinite(record.cookedServings)||record.cookedServings<.25||record.cookedServings>100
    ||!Number.isInteger(record.cookedServings*4)||record.eatenServings!==null&&(!Number.isFinite(record.eatenServings)||record.eatenServings<0||record.eatenServings>record.cookedServings||!Number.isInteger(record.eatenServings*4)))throw new Error('Invalid intake record');
  if(record.nutritionBasis&&!validNutritionBasis(record.nutritionBasis,record.recipeSnapshot))throw new Error('Invalid nutrition basis');
  const basis=record.nutritionBasis;
  const row:IntakeRow={id:record.id,meal:record.meal,name:record.recipeSnapshot.name,eatenServings:record.eatenServings,cookedServings:record.cookedServings,
    values:unknown(),nutrientComplete:flags(false),status:'unrecorded',basisKind:basis?'frozen':'recipe',dataVersion:basis?.dataVersion??NUTRITION_VERSION,capturedAt:basis?.capturedAt??null,
    includedIngredients:basis?.includedIngredients??0,ingredientCount:record.recipeSnapshot.ingredients.length};
  if(record.eatenServings===null)return row;
  if(record.eatenServings===0)return {...row,values:{energy:0,protein:0,carbs:0,fat:0,fiber:0},nutrientComplete:flags(true),status:'notEaten'};
  const reference=basis??captureNutritionBasis(record.recipeSnapshot);
  row.includedIngredients=reference.includedIngredients;
  for(const key of dailyNutrients){
    row.values[key]=reference.perServing[key]===null?null:reference.perServing[key]*record.eatenServings;
    row.nutrientComplete[key]=reference.coverage[key]===reference.ingredientCount;
  }
  row.status=reference.complete?'complete':dailyNutrients.some(key=>row.values[key]!==null)?'partial':'unavailable';
  return row;
}

export function summarizeIntake(rows:IntakeRow[]){
  const values=unknown(),known=Object.fromEntries(dailyNutrients.map(key=>[key,0])) as Record<Nutrient,number>,completeCounts={...known};
  for(const key of dailyNutrients){
    const included=rows.filter(row=>row.values[key]!==null);known[key]=included.length;
    values[key]=included.length?included.reduce((sum,row)=>sum+row.values[key]!,0):null;
    completeCounts[key]=rows.filter(row=>row.nutrientComplete[key]).length;
  }
  return {values,known,completeCounts,total:rows.length,unrecorded:rows.filter(row=>row.status==='unrecorded').length,
    partial:rows.filter(row=>['partial','unavailable'].includes(row.status)).length,
    legacy:rows.filter(row=>row.basisKind==='recipe'&&row.eatenServings!==null&&row.eatenServings>0).length,
    complete:rows.length>0&&rows.every(row=>row.status==='complete'||row.status==='notEaten')};
}
export function dailyNutrition(records:IntakeRecord[],day:string){
  if(!validDay(day)||!Array.isArray(records)||new Set(records.map(r=>r.id)).size!==records.length
    ||records.some(r=>!validDay(r.date)||!['lunch','dinner'].includes(r.meal)))throw new Error('Invalid daily records');
  const rows=records.filter(record=>record.date===day).map(recordIntake);
  return {day,rows,...summarizeIntake(rows),meals:(['lunch','dinner'] as const).map(meal=>{const entries=rows.filter(row=>row.meal===meal);return {meal,rows:entries,...summarizeIntake(entries)};})};
}
