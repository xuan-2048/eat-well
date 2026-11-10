import {saveNutritionReference} from '../../services/nutrition.js';
import {nutritionCopy} from '../../nutrition-copy.js';
import {NUTRIENTS,nutritionFoods,foodByFdc,compatibleState,estimateRecipe,nutritionStamp} from '../../../shared/nutrition.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>value===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(value);
const unit=key=>key==='energy'?'kcal':'g';
export function createReferenceDialog({storage,getLanguage,onSaved,toast}){
  const dialog=document.getElementById('nutrition-editor');let active=null;
  const C=()=>nutritionCopy[getLanguage()];
  const referenceName=food=>food.name[getLanguage()];
  const valuesHTML=values=>NUTRIENTS.map(key=>`<span>${C().nutrients[key]} <b>${number(values[key])}</b> ${unit(key)}</span>`).join('');
  function sourceHTML(food){
    if(!food)return '';
    return `<details class="nutrition-reference"><summary>${C().details} · FDC ${food.fdcId}</summary><p>${escape(referenceName(food))}</p><p lang="en">${escape(food.name.en)}</p><p>${C().per100}</p><div class="nutrition-reference-values">${valuesHTML(food.per100g)}</div></details>`;
  }
  function open(recipe,index){
    const row=estimateRecipe(recipe).rows[index];if(!row)return;
    active={recipe,index,stamp:nutritionStamp(recipe)};const c=C();
    const food=row.reference&&compatibleState(row.ingredient,row.reference,true)?row.reference:null;
    const grams=row.status==='included'?row.grams:row.ingredient.unit==='g'?row.ingredient.amount:'';
    dialog.innerHTML=`<form id="nutrition-form"><div class="dialog-header"><h2 id="nutrition-editor-title">${c.editTitle}</h2><button type="button" data-nutrition-close aria-label="${c.close}">×</button></div><p class="detail-meta">${escape(recipe.name)} · ${escape(row.ingredient.name)}</p><label for="nutrition-food">${c.reference}<select id="nutrition-food" required><option value="">${c.choose}</option>${nutritionFoods.filter(f=>compatibleState(row.ingredient,f,true)).map(f=>`<option value="${f.fdcId}" ${food?.fdcId===f.fdcId?'selected':''}>${escape(referenceName(f))}</option>`).join('')}</select></label>${row.ingredient.state==='unspecified'?`<p class="form-note">${c.stateNote}</p>`:''}<div id="nutrition-food-detail"></div><label for="nutrition-grams">${c.weight}<input type="number" id="nutrition-grams" min="0.000001" max="10000000" step="any" inputmode="decimal" value="${grams}" required></label><p class="form-note">${c.weightNote(recipe.servings)}</p><div id="nutrition-portions"></div><label class="use-ack"><input id="nutrition-confirm" type="checkbox" required>${c.confirm}</label><p id="nutrition-error" class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-nutrition-close>${c.cancel}</button><button type="submit" class="primary">${c.save}</button></div>${recipe.nutrition?.rows.some(r=>r.index===index)?`<button type="button" class="text-link nutrition-reset" data-nutrition-reset>${c.reset}</button>`:''}</form>`;
    dialog.setAttribute('aria-labelledby','nutrition-editor-title');updateReference();dialog.showModal();
  }
  function updateReference(){
    const food=foodByFdc(Number(dialog.querySelector('#nutrition-food').value)),c=C(),ingredient=active.recipe.ingredients[active.index];
    dialog.querySelector('#nutrition-food-detail').innerHTML=sourceHTML(food);
    const portions=food?.portions.filter(p=>p.unit===ingredient.unit&&Number.isFinite(ingredient.amount))??[];
    dialog.querySelector('#nutrition-portions').innerHTML=portions.length?`<p class="form-note">${c.portion}</p><div class="nutrition-portions">${portions.map((p,index)=>`<button type="button" class="secondary" data-nutrition-portion="${index}">${escape(c.usePortion(`${ingredient.amount} × ${c.portionLabels[p.label]??p.label}`,number(p.grams*ingredient.amount/p.amount)))}</button>`).join('')}</div><p class="form-note">${c.portionNote}</p>`:'';
    dialog.querySelector('#nutrition-confirm').checked=false;
  }
  function save(input){
    if(!active)return;
    try{const updated=saveNutritionReference(storage,active.recipe.id,active.index,input,active.stamp);dialog.close();onSaved(updated,active.index);toast(C().saved);}
    catch(error){dialog.querySelector('#nutrition-error').textContent=['Recipe changed','Recipe removed'].includes(error.message)?C().changed:C().error;}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-nutrition-close],[data-nutrition-reset],[data-nutrition-portion]');if(!button)return;
    if(button.hasAttribute('data-nutrition-close')){dialog.close();return;}
    if(button.hasAttribute('data-nutrition-reset')){save(null);return;}
    const food=foodByFdc(Number(dialog.querySelector('#nutrition-food').value)),ingredient=active.recipe.ingredients[active.index];
    const portion=food?.portions.filter(p=>p.unit===ingredient.unit&&Number.isFinite(ingredient.amount))[Number(button.dataset.nutritionPortion)];
    if(portion){dialog.querySelector('#nutrition-grams').value=String(Number((portion.grams*ingredient.amount/portion.amount).toFixed(6)));dialog.querySelector('#nutrition-confirm').checked=false;}
  });
  dialog.addEventListener('change',event=>{if(event.target.id==='nutrition-food')updateReference();});
  dialog.addEventListener('input',event=>{if(event.target.id==='nutrition-grams')dialog.querySelector('#nutrition-confirm').checked=false;});
  dialog.addEventListener('submit',event=>{if(event.target.id!=='nutrition-form')return;event.preventDefault();save({fdcId:Number(dialog.querySelector('#nutrition-food').value),grams:Number(dialog.querySelector('#nutrition-grams').value),confirmed:dialog.querySelector('#nutrition-confirm').checked});});
  dialog.addEventListener('close',()=>{active=null;});
  return {open};
}
