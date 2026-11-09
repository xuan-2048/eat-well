import {copy} from './copy.js';
const app=document.getElementById('app');
const LANGUAGE_KEY='fridge-helper-app-language';
let language='zh',page='home',storageError=false;
try{language=localStorage.getItem(LANGUAGE_KEY)==='en'?'en':'zh';}catch{storageError=true;}
const lines=value=>value.split('\n').join('<br>');
const bowl=`<svg class="bowl" viewBox="0 0 240 180" aria-hidden="true"><ellipse cx="120" cy="157" rx="65" ry="8" fill="#ead9ca"/><path d="M47 75h146c-4 49-29 74-73 74S51 124 47 75Z" fill="#f7eee4" stroke="#b84f32" stroke-width="2"/><ellipse cx="120" cy="75" rx="73" ry="19" fill="#fffbf5" stroke="#b84f32" stroke-width="2"/><path d="M73 79c0-24 11-33 27-31 6 16 0 27-13 32m56-5c-2-23 6-38 22-44 11 21 5 36-12 45" fill="#a3ac85"/><circle cx="117" cy="73" r="19" fill="#d88763"/><path d="m114 53 4 9 8-8m-9 7-10-5" fill="none" stroke="#737f55" stroke-width="3" stroke-linecap="round"/><path d="M91 34c-8-11 9-14 2-26m35 24c-8-11 9-14 2-26" fill="none" stroke="#baa18c" stroke-width="2" stroke-linecap="round"/><path d="M88 110c18 15 46 16 65 0" fill="none" stroke="#e5c3ad" stroke-width="2" stroke-linecap="round"/></svg>`;
function render({focusHeading=false}={}){
  const c=copy[language];
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.title=language==='zh'?'冰箱食材助手 · Fridge Helper':'Fridge Helper';
  const nav=[['home',c.home],['pantry',c.pantry],['shopping',c.shopping]];
  app.innerHTML=`<div class="shell"><header><a class="brand" href="#home" data-page="home"><img src="./mark.svg" width="38" height="38" alt=""><span>${c.title}<small>${c.subtitle}</small></span></a><button class="language" type="button" data-language aria-label="${c.switchLabel}">${c.switchText}<span aria-hidden="true"> ↔</span></button></header>
    <nav aria-label="${c.nav}">${nav.map(([id,label])=>`<button type="button" data-page="${id}" ${page===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>
    <p class="preview">${c.preview}</p>
    <main id="main">
      ${page==='home'?`<section class="welcome"><div class="welcome-copy"><p class="eyebrow">${c.greeting}</p><h1>${lines(c.headline)}</h1><p class="intro">${lines(c.intro)}</p></div><div class="illustration">${bowl}<p>${lines(c.aside)}</p></div></section>
      <section class="empty"><div class="empty-mark" aria-hidden="true">＋</div><h2>${c.emptyTitle}</h2><p>${c.emptyBody}</p><span class="coming">${c.upcoming}</span><small>${c.previewNote}</small></section><p class="gentle">${lines(c.gentle)}</p>`:
      `<section class="subpage"><p class="eyebrow">${page==='pantry'?c.pantry:c.shopping}</p><h1>${page==='pantry'?c.pantryTitle:c.shoppingTitle}</h1><p class="intro">${page==='pantry'?c.pantryIntro:c.shoppingIntro}</p><div class="empty"><div class="empty-mark" aria-hidden="true">${page==='pantry'?'＋':'✓'}</div><h2>${page==='pantry'?c.pantryEmpty:c.shoppingEmpty}</h2><p>${page==='pantry'?c.pantryBody:c.shoppingBody}</p><button class="back" type="button" data-page="home">${c.back} <span aria-hidden="true">↗</span></button></div></section>`}
    </main>
    <footer><p>${c.footer}</p><small ${storageError?'role="status"':''}>${storageError?c.storageError:c.storage}</small></footer></div>`;
  if(focusHeading)document.querySelector('h1')?.scrollIntoView({block:'nearest'});
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-language],[data-page]');
  if(!target)return;
  if(target.hasAttribute('data-language')){
    language=language==='zh'?'en':'zh';
    try{localStorage.setItem(LANGUAGE_KEY,language);storageError=false;}catch{storageError=true;}
    render();
    document.querySelector('[data-language]').focus();
    return;
  }
  event.preventDefault();
  page=target.dataset.page;
  render({focusHeading:true});
  document.querySelector(`nav [data-page="${page}"]`).focus();
});
render();
