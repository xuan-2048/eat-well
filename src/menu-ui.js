// Native horizontal scrolling on phones; explicit controls for mouse and keyboard.
const expandedMeals=new Set();let resizeObserver=null;
export function syncMealCarousels(root){
  resizeObserver?.disconnect();
  const rails=[...root.querySelectorAll('[data-meal-rail]')];
  function update(rail){
    const meal=rail.closest('.meal'),expanded=expandedMeals.has(rail.id),overflow=rail.scrollWidth>rail.clientWidth+2;
    const previous=meal.querySelector('[data-meal-previous]'),next=meal.querySelector('[data-meal-next]');
    if(previous){previous.hidden=expanded||!overflow;previous.disabled=rail.scrollLeft<=2;}
    if(next){next.hidden=expanded||!overflow;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;}
    rail.tabIndex=!expanded&&overflow?0:-1;
  }
  function scroll(rail,direction){
    const card=rail.querySelector('.planned-dish'),distance=(card?.getBoundingClientRect().width??132)+16;
    rail.scrollBy({left:direction*distance,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  for(const rail of rails){
    const meal=rail.closest('.meal'),toggle=meal.querySelector('[data-meal-all]');
    function setView(){
      const expanded=expandedMeals.has(rail.id);rail.classList.toggle('show-all',expanded);
      if(toggle){toggle.setAttribute('aria-pressed',String(expanded));toggle.textContent=expanded?toggle.dataset.rowLabel:toggle.dataset.allLabel;}
      update(rail);
    }
    setView();rail.addEventListener('scroll',()=>update(rail),{passive:true});
    meal.querySelector('[data-meal-previous]')?.addEventListener('click',()=>scroll(rail,-1));
    meal.querySelector('[data-meal-next]')?.addEventListener('click',()=>scroll(rail,1));
    toggle?.addEventListener('click',()=>{if(expandedMeals.has(rail.id))expandedMeals.delete(rail.id);else expandedMeals.add(rail.id);setView();});
    rail.addEventListener('keydown',event=>{
      if(event.target!==rail||expandedMeals.has(rail.id))return;
      if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();scroll(rail,event.key==='ArrowLeft'?-1:1);}
      else if(event.key==='Home'||event.key==='End'){event.preventDefault();rail.scrollTo({left:event.key==='Home'?0:rail.scrollWidth,behavior:'instant'});}
    });
  }
  if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(entries=>entries.forEach(({target})=>update(target)));rails.forEach(rail=>resizeObserver.observe(rail));}
}
