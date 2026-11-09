import {foodIdentity} from './pantry.js';
import {scaleIngredients,localDay} from './plans.js';
const units={g:['g',1],kg:['g',1000],ml:['ml',1],l:['ml',1000],piece:['piece',1],pack:['pack',1],bottle:['bottle',1],tbsp:['tbsp',1],tsp:['tsp',1],toTaste:['toTaste',1]};
export const roundAmount=n=>Math.round(n*1e6)/1e6;
export function canonicalAmount(amount,unit){if(!units[unit])throw new Error('Unknown unit');return {amount:amount===null?null:roundAmount(amount*units[unit][1]),unit:units[unit][0]};}
export function requirementKey(key,unit,state){return JSON.stringify([key,unit,state??'unspecified']);}
function inventoryState(item){return item.state??(item.foodId==='cooked-rice'?'cooked':'unspecified');}
export function buildShortages(plans,recipes,pantry,dates=[localDay()]){
  const pool=pantry.map(item=>({...item,...canonicalAmount(item.amount,item.unit),remaining:canonicalAmount(item.amount,item.unit).amount}));
  const rows=new Map(),warnings=[],needs=[];
  for(const plan of plans.filter(p=>dates.includes(p.date))){
    const recipe=recipes.find(r=>r.id===plan.recipeId);
    if(!recipe){warnings.push({type:'missingRecipe',planId:plan.id,date:plan.date,meal:plan.meal});continue;}
    for(const ingredient of scaleIngredients(recipe,plan.servings)){
      const identity=foodIdentity(ingredient.name),quantity=canonicalAmount(ingredient.amount,ingredient.unit);
      needs.push({...ingredient,...identity,...quantity,date:plan.date,planId:plan.id,recipeName:recipe.name});
    }
  }
  needs.sort((a,b)=>a.date.localeCompare(b.date)||(a.state==='unspecified'?1:0)-(b.state==='unspecified'?1:0));
  for(const need of needs){
    const group=requirementKey(need.key,need.unit,need.state);
    if(!rows.has(group))rows.set(group,{id:group,key:need.key,foodId:need.foodId,name:need.name,unit:need.unit,state:need.state,required:need.amount===null?null:0,available:0,missing:null,reasons:[],sources:[]});
    const row=rows.get(group);row.sources.push({date:need.date,planId:need.planId,recipeName:need.recipeName});
    if(need.amount===null){row.reasons.push('unmeasured');continue;}
    row.required=roundAmount(row.required+need.amount);
    let remaining=need.amount;
    for(const item of pool.filter(i=>i.key===need.key).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.id.localeCompare(b.id))){
      if(item.date&&item.date<need.date){if(item.remaining>0)row.reasons.push('date');continue;}
      if(item.unit!==need.unit){if(item.remaining>0)row.reasons.push('unit');continue;}
      if(need.state!=='unspecified'&&inventoryState(item)!==need.state){if(item.remaining>0)row.reasons.push('state');continue;}
      const used=Math.min(remaining,item.remaining);item.remaining=roundAmount(item.remaining-used);remaining=roundAmount(remaining-used);row.available=roundAmount(row.available+used);
      if(remaining<=0)break;
    }
  }
  return {rows:[...rows.values()].map(row=>{
    row.missing=row.required===null?null:Math.max(0,roundAmount(row.required-row.available));
    row.reasons=[...new Set(row.reasons)];
    row.status=row.missing===0?'covered':row.reasons.length?'review':'missing';return row;
  }),warnings};
}
