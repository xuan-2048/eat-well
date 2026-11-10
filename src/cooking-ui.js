import {dishIllustration} from './dish-art.js';
import {editPhoto} from './photo-editor.js';
import {cookingCopy} from './cooking-copy.js';
import {recipeCopy} from './recipe-copy.js';
import {pantryCopy} from './pantry-copy.js';
import {workflowCopy} from './workflow-copy.js';
import {loadRecipes} from './recipes.js';
import {loadPlans,localDay,MEALS,scaleIngredients} from './plans.js';
import {pantryName} from './foods.js';
import {loadCooking,saveCookingRecord,consumptionPreview,applyConsumption,undoConsumption,deleteCookingRecord} from './cooking.js';
import {compressPhoto} from './photos.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createCookingUI({storage,getLanguage,onSaved,navigate,toast,uid}){
  const formDialog=document.getElementById('cooking-editor'),detailDialog=document.getElementById('cooking-detail'),useDialog=document.getElementById('cooking-use'),actionDialog=document.getElementById('cooking-action');
  let records=[],loadError=false,dateFilter='',mealFilter='all',editing=null,sourcePlan=null,snapshot=null,photo='',photoEdit=null,photoPending=false,photoGeneration=0,editorRecipes=[],usePreview=null,action=null;
  const C=()=>cookingCopy[getLanguage()],R=()=>recipeCopy[getLanguage()],F=()=>pantryCopy[getLanguage()];
  const portions=n=>getLanguage()==='en'&&n===1?'1 serving':`${n} ${R().servingSuffix}`;
  const dateLabel=day=>new Intl.DateTimeFormat(getLanguage()==='zh'?'zh-CN':'en-US',{year:'numeric',month:'long',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`));
  const quantity=(amount,unit)=>unit==='toTaste'?R().units.toTaste:`${new Intl.NumberFormat(getLanguage()==='zh'?'zh-CN':'en-US',{maximumFractionDigits:6}).format(amount)} ${getLanguage()==='en'&&amount===1&&['piece','pack','bottle'].includes(unit)?({piece:'pc',pack:'pack',bottle:'bottle'})[unit]:(R().units[unit]??F().units[unit]??unit)}`;
  function sync(){const result=loadCooking(storage);records=result.records;loadError=result.error;}
  function latest(id){sync();if(loadError)throw new Error('Unreadable kitchen data');const record=records.find(r=>r.id===id);if(!record)throw new Error('Record removed');return record;}
  function errorText(error){const c=C();return ({'Record changed':c.changed,'Record removed':c.removed,'Already recorded':c.duplicate,'Undo first':c.locked,'Invalid record':c.invalid,'Inventory changed':c.inventoryChanged,'Invalid usage':c.invalidUse,'Unreadable kitchen data':c.loadError,'Restore conflict':c.restoreError})[error.message]??c.error;}
  function planButton(plan,recipe){
    const old=records.find(r=>r.sourcePlanId===plan.id),c=C();if(!old&&!recipe)return '';
    return `<button type="button" class="log-dish" ${old?`data-cooking-open="${escape(old.id)}"`:`data-cooking-plan="${escape(plan.id)}"`} aria-label="${escape(`${recipe?.name??old.recipeSnapshot.name} · ${old?c.view:c.log}`)}" ${loadError?'disabled':''}>${old?c.view:c.log} ↗</button>`;
  }
  function html(){
    const c=C(),visible=records.filter(r=>(!dateFilter||r.date===dateFilter)&&(mealFilter==='all'||r.meal===mealFilter)).sort((a,b)=>b.date.localeCompare(a.date)||MEALS.indexOf(a.meal)-MEALS.indexOf(b.meal)||b.updatedAt.localeCompare(a.updatedAt));
    const days=[...new Set(visible.map(r=>r.date))];
    return `<section class="library cooking-library"><div class="section-heading"><h1>${c.history}</h1><button type="button" class="primary" data-cooking-add ${loadError?'disabled':''}>＋ ${c.add}</button></div><div class="history-filters"><label for="history-date">${c.filterDate}<input id="history-date" type="date" min="1000-01-01" max="${localDay()}" value="${dateFilter}"></label><label for="history-meal">${c.meal}<select id="history-meal"><option value="all">${c.allMeals}</option>${MEALS.map(meal=>`<option value="${meal}" ${mealFilter===meal?'selected':''}>${c[meal]}</option>`).join('')}</select></label></div>${dateFilter||mealFilter!=='all'?`<button type="button" class="text-link" data-history-all>${c.all}</button>`:''}${loadError?`<p class="form-error" role="alert">${c.loadError}</p>`:visible.length?days.map(day=>`<section class="history-day"><h2>${dateLabel(day)}</h2>${visible.filter(r=>r.date===day).map(record=>`<button type="button" class="history-card" data-cooking-open="${escape(record.id)}">${record.photo?`<img src="${record.photo}" alt="" loading="lazy">`:`<span class="history-initial" aria-hidden="true">${dishIllustration(record.recipeSnapshot)}</span>`}<span class="history-card-content"><small>${c[record.meal]}</small><strong>${escape(record.recipeSnapshot.name)}</strong><span>${c.cooked}: ${portions(record.cookedServings)}</span><span>${c.ateLabel}: ${record.eatenServings===null?c.unknown:portions(record.eatenServings)}</span><small class="stock-status ${record.stock.status}">${c[record.stock.status]}</small>${record.notes?`<span class="history-notes">${escape(record.notes.slice(0,140))}</span>`:''}</span><span aria-hidden="true">↗</span></button>`).join('')}</section>`).join(''):`<div class="empty-state"><h2>${records.length?c.noneMatch:c.empty}</h2><p>${c.emptyHint}</p></div>`}<p class="local-note">${c.local}</p></section>`;
  }
  function photoHTML(){return photo?`<img src="${photo}" alt=""><button type="button" class="text-link" data-cook-photo-edit>${getLanguage()==='zh'?'调整取景':'Adjust crop'}</button><button type="button" class="text-link" data-cook-photo-remove>${C().removePhoto}</button>`:'';}
  function openEditor({record=null,plan=null}={}){
    const library=loadRecipes(storage);if(library.error){toast(C().loadError);return;}editorRecipes=library.recipes;
    editing=record;sourcePlan=plan;snapshot=record?.recipeSnapshot??(plan?editorRecipes.find(r=>r.id===plan.recipeId):null);photo=record?.photo??'';photoEdit=record?.photoEdit??null;photoPending=false;photoGeneration++;
    const c=C(),date=record?.date??(plan&&plan.date<=localDay()?plan.date:localDay()),meal=record?.meal??plan?.meal??'lunch',cooked=record?.cookedServings??plan?.servings??1;
    formDialog.innerHTML=`<form id="cooking-form"><div class="dialog-header"><h2 id="cooking-editor-title">${record?c.edit:c.add}</h2><button type="button" data-cook-editor-close aria-label="${c.close}">×</button></div>${record?`<h3 class="record-name">${escape(record.recipeSnapshot.name)}</h3><p class="form-note">${c.snapshotHint}</p>`:`<label for="cooked-recipe">${c.recipe}<select id="cooked-recipe" required><option value="">${c.choose}</option>${editorRecipes.map(recipe=>`<option value="${escape(recipe.id)}" ${snapshot?.id===recipe.id?'selected':''}>${escape(recipe.name)}</option>`).join('')}</select></label>${!editorRecipes.length?`<p class="form-note">${c.noRecipe}</p>`:''}`}
      <div class="form-pair"><label for="cooked-date">${c.date}<input id="cooked-date" type="date" min="1000-01-01" max="${localDay()}" value="${date}" required></label><label for="cooked-meal">${c.meal}<select id="cooked-meal">${MEALS.map(id=>`<option value="${id}" ${meal===id?'selected':''}>${c[id]}</option>`).join('')}</select></label></div><div class="form-pair"><label for="cooked-servings">${c.cooked}<input id="cooked-servings" type="number" inputmode="decimal" min="0.25" max="100" step="0.25" value="${cooked}" ${record?.stock.status==='applied'?'readonly':''} required></label><label for="eaten-servings">${c.eaten}<input id="eaten-servings" type="number" inputmode="decimal" min="0" max="${cooked}" step="0.25" value="${record?.eatenServings??''}"></label></div><p class="form-note">${record?.stock.status==='applied'?c.locked:c.portionHint}</p><label for="cooking-notes">${c.notes}<textarea id="cooking-notes" rows="3" maxlength="2000">${escape(record?.notes??'')}</textarea></label><label for="cooking-photo">${c.photo}<input id="cooking-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="cook-photo-help"></label><p id="cook-photo-help" class="form-note">${c.photoHint}</p><div id="cooking-photo-preview">${photoHTML()}</div><p id="cooking-photo-status" class="form-note" role="status"></p><p class="form-error" id="cooking-form-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-cook-editor-close>${c.cancel}</button><button type="submit" class="primary" id="cooking-save" ${!record&&!editorRecipes.length?'disabled':''}>${c.save}</button></div></form>`;
    formDialog.setAttribute('aria-labelledby','cooking-editor-title');if(detailDialog.open)detailDialog.close();formDialog.showModal();
  }
  function openFromPlan(id){
    sync();if(loadError){toast(C().loadError);return;}const old=records.find(r=>r.sourcePlanId===id);if(old){openDetails(old.id);return;}
    const data=loadPlans(storage),plan=data.plans.find(p=>p.id===id);if(data.error||!plan){toast(C().removed);return;}openEditor({plan});
  }
  function openDetails(id){
    let record;try{record=latest(id);}catch(error){toast(errorText(error));return;}const c=C();
    detailDialog.dataset.recordId=id;
    detailDialog.innerHTML=`<div class="dialog-header"><span>${c.title}</span><button type="button" data-cook-detail-close aria-label="${c.close}">×</button></div><p class="detail-meta">${dateLabel(record.date)} · ${c[record.meal]}</p><h2 id="cooking-detail-title">${escape(record.recipeSnapshot.name)}</h2>${record.photo?`<img class="detail-photo" src="${record.photo}" alt="">`:''}<dl class="record-portions"><div><dt>${c.cooked}</dt><dd>${portions(record.cookedServings)}</dd></div><div><dt>${c.ateLabel}</dt><dd>${record.eatenServings===null?c.unknown:portions(record.eatenServings)}</dd></div></dl><p class="stock-status ${record.stock.status}">${c[record.stock.status]}</p>${record.notes?`<h3>${c.notes}</h3><p class="record-notes">${escape(record.notes)}</p>`:''}<div class="record-stock-actions">${record.stock.status==='applied'?`<button type="button" class="secondary" data-cook-action="undo" data-record-id="${escape(id)}">${c.undo}</button>`:`<button type="button" class="primary" data-cook-use="${escape(id)}">${c.consume}</button>`}</div>${record.stock.status!=='none'?`<h3>${record.stock.status==='undone'?c.previousUse:c.used}</h3><ul class="ingredient-detail">${record.stock.lines.map(line=>`<li><span>${escape(pantryName(line.batch,getLanguage()))}</span><b>${quantity(line.amount,line.batch.unit)}</b></li>`).join('')}</ul>`:''}<h3>${c.ingredients}</h3><p class="form-note">${c.snapshotHint}</p><ul class="ingredient-detail">${scaleIngredients(record.recipeSnapshot,record.cookedServings).map(i=>`<li><span>${escape(i.name)}</span><b>${i.amount===null?R().units.toTaste:quantity(i.amount,i.unit)}</b></li>`).join('')}</ul><h3>${c.steps}</h3><ol class="step-list">${record.recipeSnapshot.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol><div class="detail-actions"><button type="button" class="secondary" data-cook-edit="${escape(id)}">${c.edit}</button><button type="button" class="danger" data-cook-action="delete" data-record-id="${escape(id)}">${c.delete}</button></div>`;
    detailDialog.setAttribute('aria-labelledby','cooking-detail-title');if(!detailDialog.open)detailDialog.showModal();
  }
  function openUse(id){
    try{usePreview=consumptionPreview(storage,id);}catch(error){toast(errorText(error));return;}const c=C(),w=workflowCopy[getLanguage()];
    if(usePreview.record.stock.status==='applied'){openDetails(id);return;}
    useDialog.innerHTML=`<form id="cooking-use-form"><div class="dialog-header"><h2 id="cooking-use-title">${c.consumeTitle}</h2><button type="button" data-cook-use-close aria-label="${c.close}">×</button></div><p class="detail-meta">${escape(usePreview.record.recipeSnapshot.name)} · ${c.cooked}: ${portions(usePreview.record.cookedServings)}</p><p class="form-note">${c.consumeHint}</p><div class="use-needs">${usePreview.rows.map(row=>`<div><strong>${escape(row.name)}</strong><span>${c.need}: ${quantity(row.required,row.unit)}</span>${row.status==='review'?`<small>${c.review}: ${row.reasons.map(reason=>w.reason[reason]).join(' ')}</small>`:''}${row.status==='missing'?`<small>${c.available}: ${quantity(row.available,row.unit)}</small>`:''}</div>`).join('')}</div><h3>${c.stock}</h3>${usePreview.items.length?usePreview.items.map(({item,amount},index)=>`<div class="use-batch"><div><strong>${escape(pantryName(item,getLanguage()))}</strong><p>${quantity(item.amount,item.unit)} · ${F().locations[item.location]} · ${R().states[item.state??'unspecified']}${item.date?` · ${item.date}`:''}</p></div><label for="used-${index}">${c.using} (${F().units[item.unit]})<input id="used-${index}" data-use-batch="${escape(item.id)}" type="number" inputmode="decimal" min="0" max="${item.amount}" step="any" value="${amount}"></label><small class="use-remaining" data-use-remaining="${escape(item.id)}">${c.remaining}: ${quantity(Math.max(0,item.amount-amount),item.unit)}</small></div>`).join(''):`<p class="form-note">${c.noStock}</p>`}<label class="use-ack"><input type="checkbox" id="cooking-use-ack" required> ${c.ack}</label><p class="form-error" id="cooking-use-error" role="alert"></p><button type="button" class="text-link" data-cook-refresh hidden>${c.refresh}</button><div class="form-actions"><button type="button" class="secondary" data-cook-use-close>${c.cancel}</button><button type="submit" class="primary" ${!usePreview.items.length?'disabled':''}>${c.confirmUse}</button></div></form>`;
    useDialog.setAttribute('aria-labelledby','cooking-use-title');if(detailDialog.open)detailDialog.close();if(!useDialog.open)useDialog.showModal();
  }
  function openAction(kind,id){
    let record;try{record=latest(id);}catch(error){toast(errorText(error));return;}action={kind,record};const c=C();
    actionDialog.innerHTML=`<form id="cooking-action-form"><h2 id="cooking-action-title">${kind==='undo'?c.undoTitle:c.deleteTitle}</h2><p class="delete-name">${escape(record.recipeSnapshot.name)}</p><p class="form-note">${kind==='undo'?c.undoHint:`${c.deleteHint} ${record.stock.status==='applied'?c.deleteStockHint+' '+c.undoHint:''}`}</p><p class="form-error" id="cooking-action-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-cook-action-cancel>${c.cancel}</button><button type="submit" class="${kind==='delete'?'danger':'primary'}">${kind==='undo'?c.undo:c.delete}</button></div></form>`;
    actionDialog.setAttribute('aria-labelledby','cooking-action-title');if(detailDialog.open)detailDialog.close();actionDialog.showModal();
  }
  function closeEditor(){photoGeneration++;photoPending=false;formDialog.close();if(editing)openDetails(editing.id);}
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-cooking-add'))openEditor();
    else if(button.dataset.cookingPlan)openFromPlan(button.dataset.cookingPlan);
    else if(button.dataset.cookingOpen)openDetails(button.dataset.cookingOpen);
    else if(button.dataset.cookEdit){try{openEditor({record:latest(button.dataset.cookEdit)});}catch(error){toast(errorText(error));}}
    else if(button.hasAttribute('data-cook-editor-close'))closeEditor();
    else if(button.hasAttribute('data-cook-detail-close'))detailDialog.close();
    else if(button.hasAttribute('data-cook-photo-remove')){photoGeneration++;photo='';photoEdit=null;photoPending=false;formDialog.querySelector('#cooking-photo').value='';formDialog.querySelector('#cooking-photo-preview').innerHTML='';formDialog.querySelector('#cooking-photo-status').textContent='';formDialog.querySelector('#cooking-save').disabled=false;}
    else if(button.dataset.cookUse)openUse(button.dataset.cookUse);
    else if(button.hasAttribute('data-cook-refresh'))openUse(usePreview.record.id);
    else if(button.hasAttribute('data-cook-use-close')){useDialog.close();openDetails(usePreview.record.id);}
    else if(button.dataset.cookAction)openAction(button.dataset.cookAction,button.dataset.recordId);
    else if(button.hasAttribute('data-cook-action-cancel')){actionDialog.close();openDetails(action.record.id);}
    else if(button.hasAttribute('data-history-all')){dateFilter='';mealFilter='all';navigate();}
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='cooked-servings')formDialog.querySelector('#eaten-servings').max=event.target.value;
    if(event.target.dataset.useBatch){const entry=usePreview.items.find(i=>i.item.id===event.target.dataset.useBatch);const out=[...useDialog.querySelectorAll('[data-use-remaining]')].find(el=>el.dataset.useRemaining===entry.item.id);out.textContent=`${C().remaining}: ${quantity(Math.max(0,entry.item.amount-Number(event.target.value)),entry.item.unit)}`;}
  });
  document.addEventListener('click',async event=>{
    if(!event.target.closest('[data-cook-photo-edit]')||photoPending||!photo)return;
    const generation=++photoGeneration;photoPending=true;formDialog.querySelector('#cooking-save').disabled=true;
    try{const result=await editPhoto(photoEdit?.source??photo,{language:getLanguage(),frame:photoEdit});if(result&&generation===photoGeneration&&formDialog.open){photo=result.photo;photoEdit=result.photoEdit;formDialog.querySelector('#cooking-photo-preview').innerHTML=photoHTML();}}
    catch{if(formDialog.open)formDialog.querySelector('#cooking-form-error').textContent=C().photoError;}
    finally{if(generation===photoGeneration&&formDialog.open){photoPending=false;formDialog.querySelector('#cooking-save').disabled=false;}}
  });
  document.addEventListener('change',async event=>{
    if(event.target.id==='history-date'){dateFilter=event.target.value;navigate();}
    else if(event.target.id==='history-meal'){mealFilter=event.target.value;navigate();}
    else if(event.target.id==='cooked-recipe'){snapshot=editorRecipes.find(r=>r.id===event.target.value)??null;if(snapshot){formDialog.querySelector('#cooked-servings').value=snapshot.servings;formDialog.querySelector('#eaten-servings').max=snapshot.servings;}}
    else if(event.target.id==='cooking-photo'){
      const file=event.target.files?.[0];if(!file)return;const generation=++photoGeneration;photoPending=true;formDialog.querySelector('#cooking-save').disabled=true;formDialog.querySelector('#cooking-photo-status').textContent=C().photoBusy;
      try{const source=await compressPhoto(file);if(generation!==photoGeneration||!formDialog.open)return;const result=await editPhoto(source,{language:getLanguage()});if(result&&generation===photoGeneration&&formDialog.open){photo=result.photo;photoEdit=result.photoEdit;formDialog.querySelector('#cooking-photo-preview').innerHTML=photoHTML();formDialog.querySelector('#cooking-form-error').textContent='';}}
      catch{if(generation===photoGeneration&&formDialog.open)formDialog.querySelector('#cooking-form-error').textContent=C().photoError;}
      finally{if(generation===photoGeneration&&formDialog.open){photoPending=false;formDialog.querySelector('#cooking-save').disabled=false;formDialog.querySelector('#cooking-photo-status').textContent='';}}
    }
  });
  formDialog.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});
  formDialog.addEventListener('submit',event=>{
    if(event.target.id!=='cooking-form')return;event.preventDefault();if(photoPending)return;
    const value=id=>formDialog.querySelector(`#${id}`).value;
    const draft={id:editing?.id??uid(),sourcePlanId:editing?.sourcePlanId??sourcePlan?.id??null,recipeSnapshot:snapshot,date:value('cooked-date'),meal:value('cooked-meal'),cookedServings:Number(value('cooked-servings')),eatenServings:value('eaten-servings')===''?null:Number(value('eaten-servings')),notes:value('cooking-notes').trim(),photo,photoEdit};
    try{
      const result=saveCookingRecord(storage,draft,{expectedRevision:editing?.revision??null});photoGeneration++;formDialog.close();onSaved();openDetails(result.record.id);toast(C().saved);
    }catch(error){formDialog.querySelector('#cooking-form-error').textContent=errorText(error);}
  });
  useDialog.addEventListener('submit',event=>{
    if(event.target.id!=='cooking-use-form')return;event.preventDefault();
    const usage=[...useDialog.querySelectorAll('[data-use-batch]')].map(input=>({batchId:input.dataset.useBatch,amount:Number(input.value)})).filter(entry=>entry.amount>0);
    try{const id=usePreview.record.id;applyConsumption(storage,id,usage,usePreview.signature);useDialog.close();onSaved();openDetails(id);toast(C().deducted);}
    catch(error){useDialog.querySelector('#cooking-use-error').textContent=errorText(error);if(error.message==='Inventory changed')useDialog.querySelector('[data-cook-refresh]').hidden=false;}
  });
  actionDialog.addEventListener('submit',event=>{
    if(event.target.id!=='cooking-action-form')return;event.preventDefault();
    try{const {kind,record}=action;if(kind==='undo')undoConsumption(storage,record.id,record.revision);else deleteCookingRecord(storage,record.id,record.revision);actionDialog.close();onSaved();if(kind==='undo')openDetails(record.id);toast(kind==='undo'?C().undoneToast:C().deleted);}
    catch(error){actionDialog.querySelector('#cooking-action-error').textContent=errorText(error);}
  });
  return {sync,html,planButton,get loadError(){return loadError;},get hasOpenDialog(){return [formDialog,detailDialog,useDialog,actionDialog].some(d=>d.open)||photoPending;}};
}
