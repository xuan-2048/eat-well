import {copy} from './copy.js';
import {recipeCopy} from './recipe-copy.js';
import {CUISINES,UNITS,STATES,ingredientKey,validRecipe,loadRecipes,saveRecipes,filterRecipes} from './recipes.js';
const app=document.getElementById('app');
const LANGUAGE_KEY='fridge-helper-app-language';
const initialPage=location.hash.slice(1);
let language='zh',page=['home','recipes','pantry'].includes(initialPage)?initialPage:'home',recipeTab='all',storageError=false;
let cuisineFilter='all',searchQuery='',records=[],recipeLoadError=false;
try{const result=loadRecipes(localStorage);records=result.recipes;recipeLoadError=result.error;}catch{recipeLoadError=true;}
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
        <section class="menu-section"><div class="section-heading"><h1>${c.today}</h1><button type="button" class="text-link" data-page="recipes">${c.browse} <span aria-hidden="true">↗</span></button></div>
          <div class="tablecloth">${[c.lunch,c.dinner].map(meal=>`<div class="meal"><span class="meal-label">${meal}</span><div class="plate" role="img" aria-label="${c.plate}"><span aria-hidden="true">—</span></div><p>${c.noMeal}</p></div>`).join('')}</div>
        </section>
        <section class="menu-section tomorrow"><h2>${c.tomorrow}</h2><div class="tomorrow-empty"><div class="mini-plate" aria-hidden="true"></div><p>${c.noTomorrow}</p></div></section>`:
      page==='recipes'?`
        ${libraryHTML()}`:
      `<section class="library"><h1>${c.pantryTitle}</h1><div class="empty-state">${icon('pantry')}<h2>${c.noIngredients}</h2><p>${c.pantryHint}</p></div></section>`}
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
