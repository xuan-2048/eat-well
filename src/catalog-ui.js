import {dishIllustration} from './dish-art.js';
import {examples,addExamples} from './catalog.js';
import {loadRecipes} from './recipes.js';
export function createCatalogUI({storage,getLanguage,onSaved,toast}){
  const dialog=document.getElementById('catalog-dialog');let busy=false;
  const text=()=>getLanguage()==='zh'?{title:'示例菜谱',hint:'参考网上做法整理，份量有调整；不预置照片。保存后可以自行编辑。',save:'保存',saved:'已保存',all:'全部加入菜谱库',close:'关闭',error:'暂时无法保存，原有菜谱没有变化，请检查存储空间。',busy:'正在保存…',done:'道示例菜谱已加入'}:{title:'Sample recipes',hint:'Adapted from online recipes, with adjusted portions and no preset photos. Edit after saving.',save:'Save',saved:'Saved',all:'Save all recipes',close:'Close',error:'Could not save. Existing recipes were left unchanged; check storage space.',busy:'Saving…',done:'sample recipes added'};
  function render(){const c=text(),saved=loadRecipes(storage).recipes;dialog.innerHTML=`<div class="dialog-header"><h2 id="catalog-title">${c.title}</h2><button type="button" data-catalog-close aria-label="${c.close}">×</button></div><p class="form-note">${c.hint}</p><div class="catalog-grid">${examples.map(entry=>{const added=saved.some(r=>r.catalogId===entry.key||r.id===`example-${entry.key}`);return `<article><span class="catalog-dish-placeholder" aria-hidden="true">${dishIllustration({name:entry.name[getLanguage()]})}</span><h3>${entry.name[getLanguage()]}</h3><button type="button" class="secondary" data-catalog-save="${entry.key}" ${added||busy?'disabled':''}>${added?c.saved:c.save}</button></article>`;}).join('')}</div><button type="button" class="primary full" data-catalog-all ${busy||examples.every(e=>saved.some(r=>r.catalogId===e.key||r.id===`example-${e.key}`))?'disabled':''}>${busy?c.busy:c.all}</button><p class="form-error" role="alert" id="catalog-error"></p>`;}
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-catalog-open],[data-catalog-close],[data-catalog-save],[data-catalog-all]');if(!button)return;
    if(button.hasAttribute('data-catalog-open')){render();dialog.showModal();return;}
    if(button.hasAttribute('data-catalog-close')){if(!busy)dialog.close();return;}
    if(busy)return;busy=true;render();
    try{const count=await addExamples(storage,getLanguage(),button.dataset.catalogSave?[button.dataset.catalogSave]:undefined);onSaved();toast(`${count} ${text().done}`);}
    catch{dialog.querySelector('#catalog-error').textContent=text().error;busy=false;dialog.querySelectorAll('button').forEach(el=>el.disabled=false);return;}
    busy=false;render();
  });
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
}
