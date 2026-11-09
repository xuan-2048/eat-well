import {copy} from './copy.js';
const app=document.getElementById('app');
const LANGUAGE_KEY='fridge-helper-app-language';
let language='zh',page='home',recipeTab='wanted',storageError=false;
try{language=localStorage.getItem(LANGUAGE_KEY)==='en'?'en':'zh';}catch{storageError=true;}
const icons={
  home:'<path d="M5 3v6m3-6v6M2 3v6c0 3 6 3 6 0M5 12v9M17 3c-4 5-4 10 0 10h2M19 3v18"/>',
  recipes:'<path d="M5 3h13a2 2 0 0 1 2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 0v18M11 8h5m-5 4h5"/>',
  pantry:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M8 5v2m0 7v4"/>'
};
const icon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg>`;
function render(){
  const c=copy[language];
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.title=language==='zh'?'冰箱食材助手 · Fridge Helper':'Fridge Helper';
  const date=new Intl.DateTimeFormat(c.dateLocale,{month:'long',day:'numeric',weekday:'short'}).format(new Date());
  const nav=[['home',c.home],['recipes',c.recipes],['pantry',c.pantry]];
  app.innerHTML=`<div class="shell"><header><a class="brand" href="#home" data-page="home"><img src="./mark.svg" width="30" height="30" alt=""><span>${c.title}</span></a><button class="language" type="button" data-language aria-label="${c.switchLabel}">${c.switchText}</button></header>
    <main><div class="date-row"><span>${date}</span><small>${c.preview}</small></div>
      ${page==='home'?`
        <div class="quick-links"><button type="button" data-library="wanted"><span aria-hidden="true">♡</span> ${c.wanted}</button><button type="button" data-library="cooked"><span aria-hidden="true">✓</span> ${c.cooked}</button></div>
        <section class="menu-section"><div class="section-heading"><h1>${c.today}</h1><button type="button" class="text-link" data-page="recipes">${c.browse} <span aria-hidden="true">↗</span></button></div>
          <div class="tablecloth">${[c.lunch,c.dinner].map(meal=>`<div class="meal"><span class="meal-label">${meal}</span><div class="plate" role="img" aria-label="${c.plate}"><span aria-hidden="true">—</span></div><p>${c.noMeal}</p></div>`).join('')}</div>
        </section>
        <section class="menu-section tomorrow"><h2>${c.tomorrow}</h2><div class="tomorrow-empty"><div class="mini-plate" aria-hidden="true"></div><p>${c.noTomorrow}</p></div></section>`:
      page==='recipes'?`
        <section class="library"><h1>${c.library}</h1><div class="recipe-tabs" role="group" aria-label="${c.library}">${['wanted','cooked'].map(id=>`<button type="button" data-recipe-tab="${id}" aria-pressed="${recipeTab===id}">${c[id]}</button>`).join('')}</div><div class="empty-state">${icon('recipes')}<h2>${recipeTab==='cooked'?c.noCooked:c.noRecipes}</h2><p>${c.recipeHint}</p></div></section>`:
      `<section class="library"><h1>${c.pantryTitle}</h1><div class="empty-state">${icon('pantry')}<h2>${c.noIngredients}</h2><p>${c.pantryHint}</p></div></section>`}
      ${storageError?`<p class="storage-error" role="status">${c.storageError}</p>`:''}
    </main>
    <nav aria-label="${c.nav}">${nav.map(([id,label])=>`<button type="button" data-page="${id}" ${page===id?'aria-current="page"':''}>${icon(id)}<span>${label}</span></button>`).join('')}</nav></div>`;
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-language],[data-page],[data-library],[data-recipe-tab]');
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
