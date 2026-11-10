import {PLATE_KEY,PLATE_STYLES,validPlateStyle} from './plate-data.js';
const copy={zh:{title:'挑一个餐盘',open:'餐盘样式',hint:'选好后自动保存，菜单和取景预览会一起更新。',close:'完成',saved:'餐盘样式已保存',error:'暂时无法保存餐盘样式。',porcelain:'素白瓷盘',sage:'鼠尾草绿边',sky:'浅蓝细边',fluted:'奶白波纹'},en:{title:'Choose your plate',open:'Plate style',hint:'Your choice saves automatically for menus and photo framing.',close:'Done',saved:'Plate style saved',error:'Could not save the plate style.',porcelain:'White porcelain',sage:'Sage rim',sky:'Soft blue rim',fluted:'Fluted ivory'}};
export function applyPlateStyle(storage){let style='porcelain';try{const saved=storage.getItem(PLATE_KEY);if(validPlateStyle(saved))style=saved;}catch{}document.documentElement.dataset.plate=style;return style;}
export function createPlateUI({storage,getLanguage,toast}){
  const dialog=document.getElementById('plate-dialog');
  function render(){const c=copy[getLanguage()],current=applyPlateStyle(storage);dialog.innerHTML=`<div class="dialog-header"><h2 id="plate-title">${c.title}</h2><button type="button" data-plate-close aria-label="${c.close}">×</button></div><p class="form-note">${c.hint}</p><div class="plate-options" role="group" aria-label="${c.title}">${PLATE_STYLES.map(style=>`<button type="button" data-plate-choice="${style}" aria-pressed="${current===style}"><span class="plate-sample" data-plate="${style}"><svg class="plate-sprig" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M15 30c2-8 5-16 12-21M18 23c-7 0-9-5-9-8 7 0 11 3 9 8Zm4-7c-1-6 3-10 8-11 1 6-1 11-8 11Zm-5 10c4 2 10 0 12-4-6-3-10-2-12 4Z"/></svg></span><span>${c[style]}</span></button>`).join('')}</div><p id="plate-error" class="form-error" role="alert"></p><button type="button" class="secondary full" data-plate-close>${c.close}</button>`;}
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-plate-open],[data-plate-close],[data-plate-choice]');if(!button)return;
    if(button.hasAttribute('data-plate-open')){render();dialog.showModal();return;}
    if(button.hasAttribute('data-plate-close')){dialog.close();return;}
    try{storage.setItem(PLATE_KEY,button.dataset.plateChoice);render();dialog.querySelector(`[data-plate-choice="${button.dataset.plateChoice}"]`).focus();toast(copy[getLanguage()].saved);}
    catch{dialog.querySelector('#plate-error').textContent=copy[getLanguage()].error;}
  });
}
