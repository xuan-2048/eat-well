export const PLAN_KEY='eat-well-meal-plans-v1';
export const MEALS=['lunch','dinner'];
export function localDay(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDay(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [y,m,d]=value.split('-').map(Number);
  if(y<1000)return false;
  const date=new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
export function followingDay(day){
  if(!validDay(day))throw new Error('Invalid date');
  const [y,m,d]=day.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10);
}
export function validPlan(plan){
  return Boolean(plan&&validDay(plan.date)&&MEALS.includes(plan.meal)
    &&typeof plan.recipeId==='string'&&plan.recipeId.trim().length>0&&plan.recipeId.length<=100
    &&typeof plan.servings==='number'&&Number.isFinite(plan.servings)&&plan.servings>=0.25&&plan.servings<=100&&Number.isInteger(plan.servings*4));
}
function validCollection(plans){return Array.isArray(plans)&&plans.every(validPlan)&&new Set(plans.map(p=>`${p.date}:${p.meal}`)).size===plans.length;}
export function loadPlans(storage){
  try{
    const raw=storage.getItem(PLAN_KEY);if(raw===null)return {plans:[],error:false};
    const data=JSON.parse(raw);
    if(data?.version!==1||!validCollection(data.plans))throw new Error('Invalid plan data');
    return {plans:data.plans,error:false};
  }catch{return {plans:[],error:true};}
}
export function savePlans(storage,plans){
  if(!validCollection(plans))throw new Error('Invalid plans');
  storage.setItem(PLAN_KEY,JSON.stringify({version:1,plans}));
}
export function assignMeal(plans,plan,recipes){
  if(!validCollection(plans)||!validPlan(plan)||!recipes.some(r=>r.id===plan.recipeId))throw new Error('Invalid meal assignment');
  return [...plans.filter(p=>p.date!==plan.date||p.meal!==plan.meal),{...plan}];
}
export function removeMeal(plans,date,meal){
  if(!validCollection(plans)||!validDay(date)||!MEALS.includes(meal))throw new Error('Invalid meal');
  return plans.filter(p=>p.date!==date||p.meal!==meal);
}
// Resolve the recipe at display time: recipe edits appear immediately; deleted
// recipes remain explicit unresolved plans until the user replaces/removes them.
export function resolveMeal(plans,recipes,date,meal){
  const plan=plans.find(p=>p.date===date&&p.meal===meal);
  return plan?{plan,recipe:recipes.find(r=>r.id===plan.recipeId)??null}:null;
}
