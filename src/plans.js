export const PLAN_KEY='eat-well-meal-plans-v1';
export const MEALS=['lunch','dinner'];
export function localDay(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDay(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [y,m,d]=value.split('-').map(Number);if(y<1000)return false;
  const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
export function followingDay(day){
  if(!validDay(day))throw new Error('Invalid date');
  const [y,m,d]=day.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10);
}
const legacyValid=p=>Boolean(p&&validDay(p.date)&&MEALS.includes(p.meal)&&typeof p.recipeId==='string'&&p.recipeId.trim().length>0&&p.recipeId.length<=100&&typeof p.servings==='number'&&Number.isFinite(p.servings)&&p.servings>=0.25&&p.servings<=100&&Number.isInteger(p.servings*4));
export function validPlan(plan){return legacyValid(plan)&&typeof plan.id==='string'&&plan.id.trim().length>0&&plan.id.length<=150;}
function validCollection(plans){return Array.isArray(plans)&&plans.every(validPlan)&&new Set(plans.map(p=>p.id)).size===plans.length;}
export function loadPlans(storage){
  try{
    const raw=storage.getItem(PLAN_KEY);if(raw===null)return {plans:[],error:false};
    const data=JSON.parse(raw);
    if(data?.version===1){
      if(!Array.isArray(data.plans)||!data.plans.every(legacyValid)||new Set(data.plans.map(p=>`${p.date}:${p.meal}`)).size!==data.plans.length)throw new Error('Invalid legacy plans');
      return {plans:data.plans.map(p=>({...p,id:`legacy:${p.date}:${p.meal}`})),error:false};
    }
    if(data?.version!==2||!validCollection(data.plans))throw new Error('Invalid plans');
    return {plans:data.plans,error:false};
  }catch{return {plans:[],error:true};}
}
export function savePlans(storage,plans){
  if(!validCollection(plans))throw new Error('Invalid plans');
  const raw=storage.getItem(PLAN_KEY);
  if(raw!==null){
    if(loadPlans(storage).error)throw new Error('Invalid existing plans');
    if(JSON.parse(raw).version===1&&storage.getItem(`${PLAN_KEY}-v1-backup`)===null)storage.setItem(`${PLAN_KEY}-v1-backup`,raw);
  }
  storage.setItem(PLAN_KEY,JSON.stringify({version:2,plans}));
}
export function assignMeal(plans,plan,recipes){
  if(!validCollection(plans)||!validPlan(plan)||!recipes.some(r=>r.id===plan.recipeId))throw new Error('Invalid meal assignment');
  if(plans.some(p=>p.id!==plan.id&&p.date===plan.date&&p.meal===plan.meal&&p.recipeId===plan.recipeId))throw new Error('Duplicate dish');
  return plans.some(p=>p.id===plan.id)?plans.map(p=>p.id===plan.id?{...plan}:p):[...plans,{...plan}];
}
export function removeMeal(plans,date,meal,id){
  if(!validCollection(plans)||!validDay(date)||!MEALS.includes(meal))throw new Error('Invalid meal');
  return plans.filter(p=>p.date!==date||p.meal!==meal||(id&&p.id!==id));
}
export function resolveMeals(plans,recipes,date,meal){return plans.filter(p=>p.date===date&&p.meal===meal).map(plan=>({plan,recipe:recipes.find(r=>r.id===plan.recipeId)??null}));}
export function resolveMeal(plans,recipes,date,meal){return resolveMeals(plans,recipes,date,meal)[0]??null;}
export function scaleIngredients(recipe,servings){
  if(!Number.isFinite(servings)||servings<=0||!Number.isFinite(recipe.servings)||recipe.servings<=0)throw new Error('Invalid servings');
  return recipe.ingredients.map(i=>({...i,amount:i.amount===null?null:Math.round(i.amount*servings/recipe.servings*1e6)/1e6}));
}
