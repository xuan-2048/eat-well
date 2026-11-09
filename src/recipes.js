export const RECIPE_KEY='eat-well-recipes-v1';
export const CUISINES=['chinese','italian','mexican','japanese','korean','everyday','other'];
export const UNITS=['g','ml','piece','tbsp','tsp','toTaste'];
export const STATES=['unspecified','raw','cooked'];
const aliases={番茄:'tomato',西红柿:'tomato',tomato:'tomato',tomatoes:'tomato',鸡蛋:'egg',蛋:'egg',egg:'egg',eggs:'egg',大蒜:'garlic',蒜:'garlic',garlic:'garlic',米饭:'rice',rice:'rice'};
export function ingredientKey(name){const key=name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');return Object.hasOwn(aliases,key)?aliases[key]:`custom:${key}`;}
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function validRecipe(r){
  return Boolean(r && text(r.id,100) && text(r.name,100) && CUISINES.includes(r.cuisine)
    && Number.isInteger(r.servings) && r.servings>=1 && r.servings<=100
    && typeof r.wanted==='boolean' && typeof r.cooked==='boolean'
    && Array.isArray(r.ingredients) && r.ingredients.length>=1 && r.ingredients.length<=50
    && r.ingredients.every(i=>i && text(i.name,80) && i.key===ingredientKey(i.name) && UNITS.includes(i.unit) && STATES.includes(i.state)
      && (i.unit==='toTaste'?i.amount===null:typeof i.amount==='number'&&Number.isFinite(i.amount)&&i.amount>0&&i.amount<=100000))
    && Array.isArray(r.steps) && r.steps.length>=1 && r.steps.length<=100 && r.steps.every(s=>text(s,2000))
    && (r.photo==='' || (typeof r.photo==='string' && r.photo.length<=400000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(r.photo)))
    && typeof r.createdAt==='string' && Number.isFinite(Date.parse(r.createdAt))
    && typeof r.updatedAt==='string' && Number.isFinite(Date.parse(r.updatedAt)));
}
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
export function filterRecipes(recipes,{tab='all',cuisine='all',query=''}={}){
  const q=query.trim().normalize('NFKC').toLowerCase();
  return recipes.filter(r=>(tab==='all'||r[tab])&&(cuisine==='all'||r.cuisine===cuisine)
    && (!q || [r.name,...r.ingredients.map(i=>i.name)].some(s=>s.normalize('NFKC').toLowerCase().includes(q))))
    .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
}
