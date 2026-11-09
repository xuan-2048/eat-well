import {copy} from './copy.js';
import {foods,recognizeFood,pantryName} from './foods.js';
import {PANTRY_KEY,PANTRY_UNITS,LOCATIONS,foodIdentity,validPantryItem,loadPantry,savePantry,upsertPantry,daysToDate,dateStatus,filterPantry} from './pantry.js';
import {pantryCopy} from './pantry-copy.js';
import {PLAN_KEY,MEALS,localDay,followingDay,loadPlans,savePlans,assignMeal,removeMeal,resolveMeal,validPlan} from './plans.js';
import {planCopy} from './plan-copy.js';
import {recipeCopy} from './recipe-copy.js';
import {CUISINES,UNITS,STATES,ingredientKey,validRecipe,loadRecipes,saveRecipes,filterRecipes} from './recipes.js';
const app=document.getElementById('app');
const LANGUAGE_KEY='fridge-helper-app-language';
const initialPage=location.hash.slice(1);
let language='zh',page=['home','recipes','pantry'].includes(initialPage)?initialPage:'home',recipeTab='all',storageError=false;
let cuisineFilter='all',searchQuery='',records=[],recipeLoadError=false;
try{const result=loadRecipes(localStorage);records=result.recipes;recipeLoadError=result.error;}catch{recipeLoadError=true;}
let plans=[],planLoadError=false;
try{const loaded=loadPlans(localStorage);plans=loaded.plans;planLoadError=loaded.error;}catch{planLoadError=true;}
let renderedDay=localDay(),plannerSlot=null,selectedRecipeId='',plannerQuery='';
const planner=document.getElementById('meal-planner');
const P=()=>planCopy[language];
let pantryItems=[],pantryLoadError=false,pantryLocation='all',pantryDateFilter='all',pantryQuery='',pantryEditingId=null;
try{const loaded=loadPantry(localStorage);pantryItems=loaded.items;pantryLoadError=loaded.error;}catch{pantryLoadError=true;}
const pantryEditor=document.getElementById('pantry-editor');
const pantryDelete=document.getElementById('pantry-delete');
const F=()=>pantryCopy[language];
const dialog=document.getElementById('recipe-dialog');
const editor=document.getElementById('recipe-editor');
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID();
let editingId=null,draftPhoto='',photoPending=false,photoGeneration=0,toastTimer;
const R=()=>recipeCopy[language];
function toast(message){const el=document.getElementById('toast');clearTimeout(toastTimer);el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function write(next){if(recipeLoadError)return false;try{saveRecipes(localStorage,next);records=next;return true;}catch{return false;}}
function amountLabel(i){return i.unit==='toTaste'?R().units.toTaste:`${i.amount} ${R().units[i.unit]}`;}
try{language=localStorage.getItem(LANGUAGE_KEY)==='en'?'en':'zh';}catch{storageError=true;}
const icons={
  home:'<path d="M5 3v6m3-6v6M2 3v6c0 3 6 3 6 0M5 12v9M17 3c-4 5-4 10 0 10h2M19 3v18"/>',
  recipes:'<path d="M5 3h13a2 2 0 0 1 2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 0v18M11 8h5m-5 4h5"/>',
  pantry:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M8 5v2m0 7v4"/>'
};
const icon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg>`;
function render(){
  if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);
  const c=copy[language];
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.title=language==='zh'?'好好吃饭 · Eat Well':'Eat Well';
  const date=new Intl.DateTimeFormat(c.dateLocale,{month:'long',day:'numeric',weekday:'short'}).format(new Date());
  const nav=[['home',c.home],['recipes',c.recipes],['pantry',c.pantry]];
  app.innerHTML=`<div class="shell"><header><a class="brand" href="#home" data-page="home"><img src="./mark.svg?v=2" width="30" height="30" alt=""><span>${c.title}</span></a><button class="language" type="button" data-language aria-label="${c.switchLabel}">${c.switchText}</button></header>
    <main><div class="date-row"><span>${date}</span><small>${c.preview}</small></div>
      ${page==='home'?`
        <div class="quick-links"><button type="button" data-library="wanted"><span aria-hidden="true">♡</span> ${c.wanted}</button><button type="button" data-library="cooked"><span aria-hidden="true">✓</span> ${c.cooked}</button></div>
        ${menuSection(localDay(),c.today)}
        ${menuSection(followingDay(localDay()),c.tomorrow)}`:
      page==='recipes'?`
        ${libraryHTML()}`:
      `${pantryHTML()}`}
      ${pantryLoadError?`<p class="storage-error" role="alert">${F().loadError}</p>`:''}
      ${planLoadError?`<p class="storage-error" role="alert">${P().loadError}</p>`:''}
      ${recipeLoadError?`<p class="storage-error" role="alert">${R().loadError}</p>`:''}
      ${storageError?`<p class="storage-error" role="status">${c.storageError}</p>`:''}
    </main>
    <nav aria-label="${c.nav}">${nav.map(([id,label])=>`<button type="button" data-page="${id}" ${page===id?'aria-current="page"':''}>${icon(id)}<span>${label}</span></button>`).join('')}</nav></div>`;
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-language],[data-page],[data-library],[data-recipe-tab]' );
  if(!target)return;
  event.preventDefault();
  if(target.hasAttribute('data-language')){
    language=language==='zh'?'en':'zh';
    try{localStorage.setItem(LANGUAGE_KEY,language);storageError=false;}catch{storageError=true;}
    render();document.querySelector('[data-language]').focus();return;
  }
  if(target.dataset.recipeTab){recipeTab=target.dataset.recipeTab;render();document.querySelector(`[data-recipe-tab="${recipeTab}"]`).focus();return;}
  if(target.dataset.library){page='recipes';recipeTab=target.dataset.library;}else{page=target.dataset.page;}
  render();document.querySelector(`nav [data-page="${page}"]`).focus();
});
render();

function libraryHTML(){
  const r=R(),c=copy[language];
  return `<section class="library"><div class="section-heading"><h1>${c.library}</h1><button class="primary" type="button" data-add-recipe ${recipeLoadError?'disabled':''}>＋ ${r.add}</button></div>
    <div class="recipe-tabs" role="group" aria-label="${c.library}">${['all','wanted','cooked'].map(id=>`<button type="button" data-recipe-tab="${id}" aria-pressed="${recipeTab===id}">${id==='all'?r.all:c[id]} <small>${records.filter(item=>id==='all'||item[id]).length}</small></button>`).join('')}</div>
    <div class="library-filters"><label class="sr-only" for="recipe-search">${r.search}</label><input id="recipe-search" type="search" maxlength="100" value="${escapeHTML(searchQuery)}" placeholder="${r.search}"><label class="sr-only" for="cuisine-filter">${r.cuisine}</label><select id="cuisine-filter"><option value="all">${r.allCuisines}</option>${CUISINES.map(id=>`<option value="${id}" ${cuisineFilter===id?'selected':''}>${r.cuisines[id]}</option>`).join('')}</select></div>
    <div id="recipe-results">${recipeResultsHTML()}</div><p class="local-note">${r.local}</p></section>`;
}
function recipeResultsHTML(){
  const r=R(),filtered=filterRecipes(records,{tab:recipeTab,cuisine:cuisineFilter,query:searchQuery});
  if(!filtered.length)return `<div class="empty-state">${icon('recipes')}<h2>${records.length?r.noResults:r.empty}</h2><p>${records.length?r.noResultsHint:r.emptyHint}</p>${!records.length?`<button class="secondary" type="button" data-sample ${recipeLoadError?'disabled':''}>${r.sample}</button>`:''}</div>`;
  return `<div class="recipe-grid">${filtered.map(item=>`<button class="recipe-card" type="button" data-open-recipe="${escapeHTML(item.id)}"><div class="dish-image">${item.photo?`<img src="${item.photo}" alt="" loading="lazy">`:`<span aria-hidden="true">${icon('recipes')}</span>`}</div><span class="dish-content"><small>${r.cuisines[item.cuisine]} · ${item.servings} ${r.servingSuffix}${item.sample?' · '+r.sampleTag:''}</small><strong>${escapeHTML(item.name)}</strong><span class="dish-ingredients">${escapeHTML(item.ingredients.map(i=>i.name).join(' · '))}</span><span class="dish-tags">${item.wanted?`<span>♡ ${copy[language].wanted}</span>`:''}${item.cooked?`<span>✓ ${copy[language].cooked}</span>`:''}</span></span><span class="dish-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;
}
function openDetails(id){
  const item=records.find(r=>r.id===id);if(!item)return;
  const r=R();
  dialog.dataset.recipe=id;
  dialog.innerHTML=`<div class="dialog-header"><span>${r.detail}</span><button type="button" data-close-dialog aria-label="${r.close}">×</button></div>${item.photo?`<img class="detail-photo" src="${item.photo}" alt="">`:''}<p class="detail-meta">${r.cuisines[item.cuisine]} · ${item.servings} ${r.servingSuffix}</p><h2 id="detail-title">${escapeHTML(item.name)}</h2><div class="status-actions"><button type="button" data-toggle-status="wanted" aria-pressed="${item.wanted}">♡ ${copy[language].wanted}</button><button type="button" data-toggle-status="cooked" aria-pressed="${item.cooked}">✓ ${copy[language].cooked}</button></div><h3>${r.ingredients}</h3><ul class="ingredient-detail">${item.ingredients.map(i=>`<li><span>${escapeHTML(i.name)}${i.state==='unspecified'?'':`<small>${r.states[i.state]}</small>`}</span><b>${amountLabel(i)}</b></li>`).join('')}</ul><h3>${r.steps}</h3><ol class="step-list">${item.steps.map(step=>`<li>${escapeHTML(step)}</li>`).join('')}</ol><div class="detail-actions"><button class="secondary" type="button" data-edit-recipe="${escapeHTML(id)}">${r.edit}</button><button class="danger" type="button" data-confirm-delete="${escapeHTML(id)}">${r.delete}</button></div>`;
  dialog.setAttribute('aria-labelledby','detail-title');
  if(!dialog.open)dialog.showModal();
}
function ingredientRow(item={name:'',amount:'',unit:'g',state:'unspecified'}){
  const r=R(),id=uid();
  return `<div class="ingredient-row"><label class="ingredient-name" for="name-${id}">${r.ingredient}<input id="name-${id}" name="ingredientName" value="${escapeHTML(item.name)}" maxlength="80" required placeholder="${r.ingredient}"></label><label for="amount-${id}">${r.amount}<input id="amount-${id}" type="number" inputmode="decimal" name="amount" min="0.000001" max="100000" step="any" value="${item.amount??''}" ${item.unit==='toTaste'?'disabled':'required'}></label><label for="unit-${id}">${r.unit}<select id="unit-${id}" name="unit">${UNITS.map(unit=>`<option value="${unit}" ${item.unit===unit?'selected':''}>${r.units[unit]}</option>`).join('')}</select></label><label for="state-${id}" class="ingredient-state">${r.state}<select id="state-${id}" name="state">${STATES.map(state=>`<option value="${state}" ${item.state===state?'selected':''}>${r.states[state]}</option>`).join('')}</select></label><button type="button" class="remove-row" data-remove-row aria-label="${r.removeIngredient}">×</button></div>`;
}
function photoPreview(){
  const box=editor.querySelector('#photo-preview');
  box.innerHTML=draftPhoto?`<img src="${draftPhoto}" alt=""><button type="button" data-remove-photo class="text-link">${R().removePhoto}</button>`:'';
}
function openEditor(id){
  const item=records.find(r=>r.id===id),r=R();
  if(dialog.open)dialog.close();
  editingId=item?.id??null;draftPhoto=item?.photo??'';photoGeneration++;photoPending=false;
  editor.innerHTML=`<form id="recipe-form"><div class="dialog-header"><h2 id="editor-title">${item?r.edit:r.add}</h2><button type="button" data-close-editor aria-label="${r.close}">×</button></div>
    <label for="dish-name">${r.name}<input id="dish-name" name="name" maxlength="100" value="${escapeHTML(item?.name??'')}" placeholder="${r.nameHint}" required></label>
    <div class="form-pair"><label for="dish-cuisine">${r.cuisine}<select id="dish-cuisine" name="cuisine">${CUISINES.map(id=>`<option value="${id}" ${item?.cuisine===id?'selected':''}>${r.cuisines[id]}</option>`).join('')}</select></label><label for="dish-servings">${r.servings}<input id="dish-servings" type="number" inputmode="numeric" name="servings" min="1" max="100" step="1" value="${item?.servings??2}" required></label></div>
    <fieldset><legend>${r.ingredients}</legend><div id="ingredient-rows">${(item?.ingredients??[{}]).map(i=>ingredientRow(i.name===undefined?undefined:i)).join('')}</div><button type="button" class="text-link" data-add-row>＋ ${r.addIngredient}</button></fieldset>
    <label for="dish-steps">${r.steps}<textarea id="dish-steps" name="steps" rows="5" maxlength="20000" placeholder="${r.stepsHint}" required>${escapeHTML(item?.steps.join('\n')??'')}</textarea></label>
    <fieldset class="flags"><legend>${r.status}</legend><label><input type="checkbox" name="wanted" ${item?item.wanted?'checked':'':'checked'}> ${copy[language].wanted}</label><label><input type="checkbox" name="cooked" ${item?.cooked?'checked':''}> ${copy[language].cooked}</label></fieldset>
    <label for="dish-photo">${r.photo}<input id="dish-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help"></label><p id="photo-help" class="form-note">${r.photoHint}</p><div id="photo-preview"></div><p id="photo-status" class="form-note" role="status"></p><p id="form-error" role="alert" class="form-error"></p>
    <div class="form-actions"><button type="button" class="secondary" data-close-editor>${r.cancel}</button><button class="primary" id="save-recipe" ${recipeLoadError?'disabled':''}>${r.save}</button></div></form>`;
  editor.setAttribute('aria-labelledby','editor-title');photoPreview();editor.showModal();
}
function closeEditor(){photoGeneration++;photoPending=false;editor.close();if(editingId)openDetails(editingId);}
function formError(message){editor.querySelector('#form-error').textContent=message;}
async function preparePhoto(file){
  const generation=++photoGeneration;
  photoPending=false;editor.querySelector('#save-recipe').disabled=recipeLoadError;editor.querySelector('#photo-status').textContent='';
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){formError(R().photoError);return;}
  photoPending=true;editor.querySelector('#save-recipe').disabled=true;
  editor.querySelector('#photo-status').textContent=R().photoBusy;
  let bitmap;
  try{
    bitmap=await createImageBitmap(file);
    const scale=Math.min(1,720/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let result=canvas.toDataURL('image/jpeg',0.75);
    if(result.length>400000)result=canvas.toDataURL('image/jpeg',0.45);
    if(result.length>400000)throw new Error('Photo too large');
    if(generation===photoGeneration&&editor.open){draftPhoto=result;photoPreview();formError('');}
  }catch{if(generation===photoGeneration&&editor.open)formError(R().photoError);}
  finally{
    bitmap?.close();
    if(generation===photoGeneration&&editor.open){photoPending=false;editor.querySelector('#save-recipe').disabled=recipeLoadError;editor.querySelector('#photo-status').textContent='';}
  }
}
function addSample(){
  const r=R(),now=new Date().toISOString();
  const sample={id:uid(),name:r.sampleName,cuisine:'chinese',servings:2,wanted:true,cooked:false,sample:true,
    ingredients:r.exampleNames.map((name,index)=>({name,key:ingredientKey(name),amount:[300,2,null,null][index],unit:['g','piece','toTaste','toTaste'][index],state:index<2?'raw':'unspecified'})),steps:r.sampleSteps,photo:'',createdAt:now,updatedAt:now};
  if(!write([sample,...records])){toast(recipeLoadError?r.loadError:r.saveError);return;}
  recipeTab='all';cuisineFilter='all';searchQuery='';render();openDetails(sample.id);
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.hasAttribute('data-add-recipe'))openEditor();
  else if(target.dataset.openRecipe)openDetails(target.dataset.openRecipe);
  else if(target.hasAttribute('data-sample'))addSample();
  else if(target.hasAttribute('data-close-dialog'))dialog.close();
  else if(target.hasAttribute('data-close-editor'))closeEditor();
  else if(target.dataset.editRecipe)openEditor(target.dataset.editRecipe);
  else if(target.hasAttribute('data-add-row')){
    const rows=editor.querySelector('#ingredient-rows');if(rows.children.length>=50)return;
    rows.insertAdjacentHTML('beforeend',ingredientRow());rows.lastElementChild.querySelector('input').focus();
  }else if(target.hasAttribute('data-remove-row')){
    const row=target.closest('.ingredient-row');
    if(row.parentElement.children.length===1){row.querySelector('input').value='';row.querySelector('input').focus();}else row.remove();
  }else if(target.hasAttribute('data-remove-photo')){
    photoGeneration++;photoPending=false;draftPhoto='';editor.querySelector('#dish-photo').value='';editor.querySelector('#save-recipe').disabled=recipeLoadError;editor.querySelector('#photo-status').textContent='';photoPreview();
  }else if(target.dataset.toggleStatus){
    const id=dialog.dataset.recipe,key=target.dataset.toggleStatus;
    const next=records.map(r=>r.id===id?{...r,[key]:!r[key],updatedAt:new Date().toISOString()}:r);
    if(!write(next)){toast(recipeLoadError?R().loadError:R().saveError);return;}
    render();openDetails(id);dialog.querySelector(`[data-toggle-status="${key}"]`).focus();toast(R().updated);
  }else if(target.dataset.confirmDelete){
    const id=target.dataset.confirmDelete,item=records.find(r=>r.id===id);
    dialog.innerHTML=`<h2 id="delete-title">${R().deleteTitle}</h2><p class="delete-name">${escapeHTML(item.name)}</p><p class="form-note">${R().deleteBody}</p><p class="form-error" role="alert" id="delete-error"></p><div class="form-actions"><button type="button" class="secondary" data-cancel-delete="${escapeHTML(id)}">${R().cancel}</button><button type="button" class="danger solid" data-delete-recipe="${escapeHTML(id)}">${R().delete}</button></div>`;
    dialog.setAttribute('aria-labelledby','delete-title');dialog.querySelector('[data-cancel-delete]').focus();
  }else if(target.dataset.cancelDelete)openDetails(target.dataset.cancelDelete);
  else if(target.dataset.deleteRecipe){
    if(!write(records.filter(r=>r.id!==target.dataset.deleteRecipe))){dialog.querySelector('#delete-error').textContent=recipeLoadError?R().loadError:R().saveError;return;}
    dialog.close();render();toast(R().deleted);
  }
});
document.addEventListener('input',event=>{
  if(event.target.id==='recipe-search'){searchQuery=event.target.value;document.getElementById('recipe-results').innerHTML=recipeResultsHTML();}
});
document.addEventListener('change',event=>{
  if(event.target.id==='cuisine-filter'){cuisineFilter=event.target.value;document.getElementById('recipe-results').innerHTML=recipeResultsHTML();}
  if(event.target.name==='unit'){
    const amount=event.target.closest('.ingredient-row').querySelector('[name="amount"]');
    amount.disabled=event.target.value==='toTaste';amount.required=!amount.disabled;
  }
  if(event.target.id==='dish-photo')preparePhoto(event.target.files[0]);
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='recipe-form')return;event.preventDefault();if(photoPending)return;
  const data=new FormData(event.target),old=records.find(r=>r.id===editingId),now=new Date().toISOString();
  const ingredients=[...editor.querySelectorAll('.ingredient-row')].map(row=>{
    const name=row.querySelector('[name="ingredientName"]').value.trim(),unit=row.querySelector('[name="unit"]').value;
    return {name,key:ingredientKey(name),amount:unit==='toTaste'?null:Number(row.querySelector('[name="amount"]').value),unit,state:row.querySelector('[name="state"]').value};
  });
  const recipe={id:old?.id??uid(),name:data.get('name').trim(),cuisine:data.get('cuisine'),servings:Number(data.get('servings')),
    ingredients,steps:data.get('steps').split('\n').map(s=>s.trim()).filter(Boolean),wanted:data.has('wanted'),cooked:data.has('cooked'),photo:draftPhoto,createdAt:old?.createdAt??now,updatedAt:now,...(old?.sample?{sample:true}:{})};
  if(!validRecipe(recipe)){formError(R().validation);return;}
  const next=old?records.map(r=>r.id===old.id?recipe:r):[recipe,...records];
  if(!write(next)){formError(recipeLoadError?R().loadError:R().saveError);return;}
  photoGeneration++;editor.close();page='recipes';recipeTab='all';cuisineFilter='all';searchQuery='';render();openDetails(recipe.id);toast(R().saved);
});
editor.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});

function menuSection(date,title){
  const p=P(),c=copy[language];
  return `<section class="menu-section live-menu"><div class="section-heading"><h${date===localDay()?'1':'2'}>${title}</h${date===localDay()?'1':'2'}><span class="menu-date">${date.slice(5).replace('-',' / ')}</span></div><div class="tablecloth">${MEALS.map(meal=>{
    const entry=resolveMeal(plans,records,date,meal),recipe=entry?.recipe;
    const label=`${title} · ${c[meal]} · ${recipe?recipe.name:entry?p.missing:p.arrange}`;
    return `<div class="meal"><span class="meal-label">${c[meal]}</span><button type="button" class="plate plan-plate ${recipe?'has-recipe':''}" data-plan-date="${date}" data-plan-meal="${meal}" aria-label="${escapeHTML(label)}" ${planLoadError?'disabled':''}>${recipe?.photo?`<img src="${recipe.photo}" alt="">`:recipe?`<span class="plate-initial" aria-hidden="true">${escapeHTML(Array.from(recipe.name)[0])}</span>`:`<span aria-hidden="true">${entry?'!':'＋'}</span>`}</button><p class="meal-name ${entry&&!recipe?'missing-recipe':''}">${recipe?escapeHTML(recipe.name):entry?p.missing:c.noMeal}</p><small class="meal-portions">${entry?`${entry.plan.servings} ${p.servings}`:p.selectHint}</small></div>`;
  }).join('')}</div></section>`;
}
function freshRecipes(){
  try{const data=loadRecipes(localStorage);if(data.error)return false;records=data.recipes;recipeLoadError=false;return true;}catch{return false;}
}
function openPlanner(date,meal){
  if(!MEALS.includes(meal))return;
  const fresh=(()=>{try{return loadPlans(localStorage);}catch{return {error:true};}})();
  if(fresh.error){planLoadError=true;render();toast(P().loadError);return;}
  plans=fresh.plans;
  if(!freshRecipes()){recipeLoadError=true;render();toast(R().loadError);return;}
  const entry=resolveMeal(plans,records,date,meal),p=P(),c=copy[language];
  plannerSlot={date,meal};selectedRecipeId=entry?.recipe?.id??'';plannerQuery='';
  const title=`${date===localDay()?c.today:date===followingDay(localDay())?c.tomorrow:date} · ${c[meal]}`;
  planner.innerHTML=`<form id="plan-form"><div class="dialog-header"><h2 id="planner-title">${title}</h2><button type="button" data-close-planner aria-label="${p.close}">×</button></div><p class="detail-meta">${date}</p>
    ${entry&&!entry.recipe?`<p class="missing-plan-note">${p.missingNote}</p>`:''}
    ${records.length?`<label for="planner-search">${p.choose}<input id="planner-search" type="search" maxlength="100" placeholder="${p.search}"></label><div id="planner-options">${plannerOptions()}</div><p id="planner-selection" class="form-note" role="status">${plannerSelection()}</p><div class="plan-portions"><label for="planned-servings">${p.planned}<input id="planned-servings" name="servings" type="number" inputmode="decimal" min="0.25" max="100" step="0.25" value="${entry?.plan.servings??1}" required></label><p class="form-note">${p.plannedNote}</p></div>`:`<div class="empty-planner">${icon('recipes')}<p>${p.noRecipes}</p><button type="button" class="primary" data-planner-add>${p.addRecipe}</button></div>`}
    <p class="form-error" role="alert" id="plan-error"></p><div class="plan-form-actions">${entry?`<button type="button" class="danger" data-remove-plan>${p.remove}</button>`:''}<div><button type="button" class="secondary" data-close-planner>${p.cancel}</button>${records.length?`<button type="submit" class="primary">${p.save}</button>`:''}</div></div></form>`;
  planner.setAttribute('aria-labelledby','planner-title');planner.showModal();
}
function plannerSelection(){const recipe=records.find(r=>r.id===selectedRecipeId);return recipe?`${P().selected}: ${escapeHTML(recipe.name)}`:P().notSelected;}
function plannerOptions(){
  const p=P(),visible=filterRecipes(records,{query:plannerQuery});
  if(!visible.length)return `<p class="planner-no-match">${p.noMatch}<small>${p.searchHint}</small></p>`;
  return `<fieldset class="planner-choices"><legend class="sr-only">${p.choose}</legend>${visible.map(recipe=>`<label class="planner-choice"><input type="radio" name="recipeId" value="${escapeHTML(recipe.id)}" ${selectedRecipeId===recipe.id?'checked':''}><span class="choice-thumbnail">${recipe.photo?`<img src="${recipe.photo}" alt="">`:`<span aria-hidden="true">${escapeHTML(Array.from(recipe.name)[0])}</span>`}</span><span class="choice-name"><strong>${escapeHTML(recipe.name)}</strong><small>${R().cuisines[recipe.cuisine]} · ${p.base} ${recipe.servings} ${p.servings}</small></span></label>`).join('')}</fieldset>`;
}
function applyPlanChange(operation){
  // Merge into the most recent stored collection so editing one slot doesn't
  // overwrite changes another open tab made to the other slots.
  const fresh=loadPlans(localStorage);
  if(fresh.error)throw new Error(P().loadError);
  const next=operation(fresh.plans);
  savePlans(localStorage,next);plans=next;planLoadError=false;
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.planDate)openPlanner(target.dataset.planDate,target.dataset.planMeal);
  else if(target.hasAttribute('data-close-planner'))planner.close();
  else if(target.hasAttribute('data-planner-add')){
    planner.close();page='recipes';recipeTab='all';render();openEditor();
  }else if(target.hasAttribute('data-remove-plan')){
    try{applyPlanChange(current=>removeMeal(current,plannerSlot.date,plannerSlot.meal));}
    catch{planner.querySelector('#plan-error').textContent=P().saveError;return;}
    planner.close();render();toast(P().removed);
  }
});
document.addEventListener('input',event=>{
  if(event.target.id==='planner-search'){
    plannerQuery=event.target.value;planner.querySelector('#planner-options').innerHTML=plannerOptions();
  }
});
document.addEventListener('change',event=>{
  if(event.target.name==='recipeId'){selectedRecipeId=event.target.value;planner.querySelector('#planner-selection').innerHTML=plannerSelection();}
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='plan-form')return;event.preventDefault();
  const error=planner.querySelector('#plan-error');
  if(!freshRecipes()){error.textContent=R().loadError;return;}
  if(!records.some(recipe=>recipe.id===selectedRecipeId)){error.textContent=selectedRecipeId?P().recipeChanged:P().invalid;return;}
  const plan={...plannerSlot,recipeId:selectedRecipeId,servings:Number(new FormData(event.target).get('servings'))};
  if(!validPlan(plan)){error.textContent=P().invalid;return;}
  try{applyPlanChange(current=>assignMeal(current,plan,records));}
  catch{error.textContent=P().saveError;return;}
  planner.close();render();toast(P().saved);
});
function refreshLocalData(){
  try{
    const inventory=loadPantry(localStorage);pantryItems=inventory.items;pantryLoadError=inventory.error;
    const latest=loadPlans(localStorage);plans=latest.plans;planLoadError=latest.error;
    const latestRecipes=loadRecipes(localStorage);records=latestRecipes.recipes;recipeLoadError=latestRecipes.error;
  }catch{planLoadError=true;recipeLoadError=true;}
  renderedDay=localDay();render();
}
window.addEventListener('storage',event=>{
  if(event.key===PLAN_KEY||event.key==='eat-well-recipes-v1'||event.key===PANTRY_KEY||event.key===null)refreshLocalData();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!editor.open&&!dialog.open&&!planner.open&&!pantryEditor.open&&!pantryDelete.open)refreshLocalData();});
setInterval(()=>{if(localDay()!==renderedDay&&!editor.open&&!dialog.open&&!planner.open&&!pantryEditor.open&&!pantryDelete.open)refreshLocalData();},30000);

function pantryAmount(item){const singular={piece:'pc',pack:'pack',bottle:'bottle'};const unit=language==='en'&&item.amount===1?(singular[item.unit]??F().units[item.unit]):F().units[item.unit];return `${item.amount} ${unit}`;}
function pantryDateLabel(item){
  const f=F(),status=dateStatus(item.date),days=daysToDate(item.date);
  return status==='none'?f.noDate:status==='past'?`${f.past} · ${item.date}`:status==='today'?f.dateToday:status==='soon'?f.dateSoon(days):f.dateLater(item.date);
}
function pantryHTML(){
  const f=F(),near=pantryItems.filter(i=>['soon','today'].includes(dateStatus(i.date))).length,past=pantryItems.filter(i=>dateStatus(i.date)==='past').length;
  return `<section class="library pantry-library"><div class="section-heading"><h1>${f.title}</h1><button type="button" class="primary" data-pantry-add ${pantryLoadError?'disabled':''}>＋ ${f.add}</button></div>
    <div class="pantry-date-filters" role="group" aria-label="${f.allDates}">${[['all',f.allDates,pantryItems.length],['soon',f.near,near],['past',f.past,past],['none',f.noDate,pantryItems.filter(i=>!i.date).length]].map(([id,label,count])=>`<button type="button" data-pantry-date="${id}" aria-pressed="${pantryDateFilter===id}">${label} <small>${count}</small></button>`).join('')}</div>
    <div class="library-filters"><label class="sr-only" for="pantry-search">${f.search}</label><input id="pantry-search" type="search" value="${escapeHTML(pantryQuery)}" maxlength="80" placeholder="${f.search}"><label class="sr-only" for="pantry-location">${f.location}</label><select id="pantry-location"><option value="all">${f.all}</option>${LOCATIONS.map(id=>`<option value="${id}" ${pantryLocation===id?'selected':''}>${f.locations[id]}</option>`).join('')}</select></div>
    <div id="pantry-results">${pantryResultsHTML()}</div><p class="local-note">${f.local}</p></section>`;
}
function pantryResultsHTML(){
  const f=F(),items=filterPantry(pantryItems,{location:pantryLocation,dateFilter:pantryDateFilter,query:pantryQuery});
  if(!items.length)return `<div class="empty-state">${icon('pantry')}<h2>${pantryItems.length?f.noMatch:f.none}</h2><p>${pantryItems.length?f.noMatchHint:f.emptyHint}</p></div>`;
  return `<div class="pantry-entries">${items.map(item=>{const name=pantryName(item,language);return `<article class="pantry-entry"><div class="pantry-initial" aria-hidden="true">${escapeHTML(Array.from(name)[0])}</div><div class="pantry-entry-info"><h2>${escapeHTML(name)}</h2><p>${pantryAmount(item)} · ${f.locations[item.location]}</p><small class="date-label date-${dateStatus(item.date)}">${escapeHTML(pantryDateLabel(item))}</small></div><div class="pantry-entry-actions"><button type="button" data-pantry-edit="${escapeHTML(item.id)}" aria-label="${f.edit} ${escapeHTML(name)}">${f.edit}</button><button type="button" class="remove-entry" data-pantry-delete="${escapeHTML(item.id)}" aria-label="${f.delete} ${escapeHTML(name)}">${f.delete}</button></div></article>`;}).join('')}</div>`;
}
function recognitionHTML(name){
  const food=recognizeFood(name);return food?`${F().recognized}：${food[language]} <span>${food[language==='zh'?'en':'zh']}</span>`:name.trim()?F().custom:'';
}
function freshPantry(){const result=loadPantry(localStorage);if(result.error)throw new Error('read');return result.items;}
function openPantryEditor(id){
  try{pantryItems=freshPantry();pantryLoadError=false;}catch{pantryLoadError=true;render();toast(F().loadError);return;}
  const item=pantryItems.find(i=>i.id===id),f=F();
  pantryEditingId=item?.id??null;
  pantryEditor.innerHTML=`<form id="pantry-form"><div class="dialog-header"><h2 id="pantry-editor-title">${item?f.edit:f.add}</h2><button type="button" data-pantry-close aria-label="${f.close}">×</button></div>
    <label for="pantry-name">${f.name}<input id="pantry-name" name="name" list="food-suggestions" value="${escapeHTML(item?.name??'')}" maxlength="80" placeholder="${f.nameHint}" required aria-describedby="food-recognition"></label><datalist id="food-suggestions">${foods.map(food=>`<option value="${food[language]}">${food[language==='zh'?'en':'zh']}</option>`).join('')}</datalist><p class="food-recognition" id="food-recognition" role="status">${recognitionHTML(item?.name??'')}</p>
    <div class="form-pair pantry-amount"><label for="pantry-amount">${f.amount}<input id="pantry-amount" name="amount" type="number" inputmode="decimal" min="0.000001" max="100000" step="any" value="${item?.amount??1}" required></label><label for="pantry-unit">${f.unit}<select id="pantry-unit" name="unit">${PANTRY_UNITS.map(id=>`<option value="${id}" ${(item?.unit??'g')===id?'selected':''}>${f.units[id]}</option>`).join('')}</select></label></div>
    <label for="pantry-storage">${f.location}<select id="pantry-storage" name="location">${LOCATIONS.map(id=>`<option value="${id}" ${(item?.location??'fridge')===id?'selected':''}>${f.locations[id]}</option>`).join('')}</select></label>
    <label for="pantry-date">${f.date}<input id="pantry-date" name="date" type="date" min="1000-01-01" max="9999-12-31" value="${item?.date??''}" aria-describedby="pantry-date-note"></label><p class="form-note" id="pantry-date-note">${f.dateHint}</p><p class="form-note pantry-separate">${f.separate}</p><p class="form-error" id="pantry-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-pantry-close>${f.cancel}</button><button type="submit" class="primary">${f.save}</button></div></form>`;
  pantryEditor.setAttribute('aria-labelledby','pantry-editor-title');pantryEditor.showModal();
}
function openPantryDelete(id){
  const item=pantryItems.find(i=>i.id===id);if(!item)return;const f=F();
  pantryDelete.innerHTML=`<h2 id="pantry-delete-title">${f.removeTitle}</h2><p class="delete-name">${escapeHTML(pantryName(item,language))} · ${pantryAmount(item)}</p><p class="form-note">${f.removeBody}</p><p id="pantry-delete-error" class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-pantry-delete-cancel>${f.cancel}</button><button type="button" class="danger solid" data-pantry-delete-confirm="${escapeHTML(id)}">${f.delete}</button></div>`;
  pantryDelete.setAttribute('aria-labelledby','pantry-delete-title');pantryDelete.showModal();
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.hasAttribute('data-pantry-add'))openPantryEditor();
  else if(target.dataset.pantryEdit)openPantryEditor(target.dataset.pantryEdit);
  else if(target.dataset.pantryDelete)openPantryDelete(target.dataset.pantryDelete);
  else if(target.hasAttribute('data-pantry-close'))pantryEditor.close();
  else if(target.hasAttribute('data-pantry-delete-cancel'))pantryDelete.close();
  else if(target.dataset.pantryDate){pantryDateFilter=target.dataset.pantryDate;render();document.querySelector(`[data-pantry-date="${pantryDateFilter}"]`).focus();}
  else if(target.dataset.pantryDeleteConfirm){
    try{const next=freshPantry().filter(i=>i.id!==target.dataset.pantryDeleteConfirm);savePantry(localStorage,next);pantryItems=next;}
    catch{pantryDelete.querySelector('#pantry-delete-error').textContent=F().saveError;return;}
    pantryDelete.close();render();toast(F().removed);
  }
});
document.addEventListener('input',event=>{
  if(event.target.id==='pantry-search'){pantryQuery=event.target.value;document.getElementById('pantry-results').innerHTML=pantryResultsHTML();}
  if(event.target.id==='pantry-name')pantryEditor.querySelector('#food-recognition').innerHTML=recognitionHTML(event.target.value);
});
document.addEventListener('change',event=>{
  if(event.target.id==='pantry-location'){pantryLocation=event.target.value;document.getElementById('pantry-results').innerHTML=pantryResultsHTML();}
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='pantry-form')return;event.preventDefault();
  const form=new FormData(event.target),name=form.get('name').trim(),now=new Date().toISOString(),error=pantryEditor.querySelector('#pantry-error');
  let fresh;
  try{fresh=freshPantry();}catch{error.textContent=F().loadError;return;}
  const old=fresh.find(i=>i.id===pantryEditingId);
  if(pantryEditingId&&!old){error.textContent=F().changed;return;}
  const item={id:old?.id??uid(),name,...foodIdentity(name),amount:Number(form.get('amount')),unit:form.get('unit'),location:form.get('location'),date:form.get('date'),createdAt:old?.createdAt??now,updatedAt:now};
  if(!validPantryItem(item)){error.textContent=F().invalid;return;}
  try{const next=upsertPantry(fresh,item,{editing:Boolean(pantryEditingId)});savePantry(localStorage,next);pantryItems=next;pantryLoadError=false;}
  catch{error.textContent=F().saveError;return;}
  pantryEditor.close();pantryQuery='';pantryLocation='all';pantryDateFilter='all';render();toast(F().saved);
});
