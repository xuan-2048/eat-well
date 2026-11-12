import {createRoot} from 'react-dom/client';
import type {Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {localDay,followingDay} from '../../../shared/dates.js';
import type {Language} from '../../../shared/contracts.ts';
import type {RecommendationOptions} from '../../../shared/recommendations.ts';
import {recommendationPreview,planRecommendation,shopRecommendation} from '../../services/recommendations.ts';
import type {RecommendationStorage} from '../../services/recommendations.ts';
import {RecommendationPanel} from './RecommendationPanel.tsx';
import {recommendationCopy} from './recommendation-copy.ts';
interface Options {
 storage:RecommendationStorage;getLanguage:()=>Language;uid:()=>string;onChanged:()=>void;
 onRecipe:(id:string,edit:boolean)=>void;onRecipes:()=>void;onShopping:()=>void;
}
export function createRecommendationUI(deps:Options){
 const dialog=document.getElementById('recommendation-dialog') as HTMLDialogElement;
 let root:Root|null=null,selected='',seen=new Set<string>(),notice='';
 let options:RecommendationOptions={cuisine:'all',maxMinutes:null,date:localDay(),meal:'lunch',servings:1};
 const C=()=>recommendationCopy[deps.getLanguage()];
 function close(){dialog.close();}
 function render(){
  if(!root)return;
  const today=localDay();
  if(![today,followingDay(today)].includes(options.date)){options={...options,date:today};notice=C().changed;}
  let preview:ReturnType<typeof recommendationPreview>|null=null,error=false;
  try{preview=recommendationPreview(deps.storage,options,today);}catch{error=true;}
  const ranked=preview?.ranked??[];
  if(!ranked.some(item=>item.recipe.id===selected))selected=ranked[0]?.recipe.id??'';
  const current=ranked.find(item=>item.recipe.id===selected)??null;
  if(current)seen.add(selected);
  function action(kind:'plan'|'shop'){
   if(!current||!preview)return;
   try{
    if(kind==='plan'){
     const result=planRecommendation(deps.storage,current.recipe.id,options,preview.signature,deps.uid);
     notice=result.already?C().planAlready(result.servings):C().planSaved;
    }else{
     const result=shopRecommendation(deps.storage,current.recipe.id,options,preview.signature,deps.uid);
     notice=result.added?C().shoppingAdded(result.added):result.already?C().shoppingAlready:C().noMissing;
     if(result.review)notice+=' · '+C().reviewNote(result.review);
    }
    deps.onChanged();
   }catch(e){notice=e instanceof Error&&['Recommendation changed','Invalid recommendation options'].includes(e.message)?C().changed:C().saveError;}
   render();
  }
  flushSync(()=>root!.render(<RecommendationPanel language={deps.getLanguage()} today={today} options={options} candidate={current}
   total={ranked.length} libraryCount={preview?.recipes.length??0} unknownTime={preview?.unknownTime??0} error={error} notice={notice}
   onOptions={change=>{options={...options,...change};seen=new Set();selected='';notice='';render();}}
   onNext={()=>{let next=ranked.find(item=>!seen.has(item.recipe.id));notice='';if(!next){seen=new Set();next=ranked.find(item=>item.recipe.id!==selected);notice=C().cycle;}if(next)selected=next.recipe.id;render();}}
   onClose={close} onRecipe={(id,edit=false)=>{close();deps.onRecipe(id,edit);}}
   onPlan={()=>action('plan')} onShop={()=>action('shop')}
   onRecipes={()=>{close();deps.onRecipes();}} onShopping={()=>{close();deps.onShopping();}}/>));
 }
 function open(){
  root?.unmount();root=createRoot(dialog);notice='';render();
  dialog.setAttribute('aria-labelledby','recommendation-title');dialog.showModal();
 }
 dialog.addEventListener('close',()=>{if(!dialog.open){root?.unmount();root=null;}});
 document.addEventListener('click',event=>{if((event.target as Element).closest('[data-recommendation-open]'))open();});
 return {refresh(){if(dialog.open)render();},get hasOpenDialog(){return dialog.open;}};
}
