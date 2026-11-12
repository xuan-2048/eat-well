import {createRoot} from 'react-dom/client';
import type {Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {CookingPage} from './CookingPage.tsx';
import type {CookingRecordView,CookingViewState} from './CookingPage.tsx';
import type {Language} from '../../../shared/contracts.ts';
import {localDay,validDay} from '../../../shared/dates.js';
import {shiftDay} from '../../plans.js';
import {createCookingDialogs} from './cooking-dialogs.js';

interface Options {
 storage:{getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
 getLanguage:()=>Language;onSaved:()=>void;navigate:()=>void;toast:(message:string)=>void;uid:()=>string;
}
export function createCookingUI(options:Options){
 let root:Root|null=null;
 let lastToday=localDay(),followToday=true;
 let state:CookingViewState={view:'daily',day:lastToday,dateFilter:'',meal:'all'};
 const dialogs=createCookingDialogs({...options,onSaved:(record?:CookingRecordView)=>{
  if(record){state={...state,day:record.date};followToday=record.date===localDay();}
  options.onSaved();
 }});
 function sync(){
  dialogs.sync();const today=localDay();
  if(lastToday!==today&&followToday)state={...state,day:today};
  if(state.day>today)state={...state,day:today};
  lastToday=today;
 }
 function render(){
  if(!root)return;sync();
  flushSync(()=>root!.render(<CookingPage records={dialogs.records as CookingRecordView[]} loadError={dialogs.loadError} language={options.getLanguage()} today={localDay()} state={state}
   onChange={next=>{if(next.day&&!validDay(next.day))return;if(next.day)followToday=next.day===localDay();state={...state,...next};render();}}
   onShift={offset=>{const day=shiftDay(state.day,offset);if(validDay(day)&&day<=localDay()){state={...state,day};followToday=day===localDay();render();}}}
   onAdd={()=>dialogs.openEditor()} onOpen={id=>dialogs.openDetails(id)}/>));
 }
 return {
  sync,html:()=>'<div id="cooking-page"></div>',planButton:dialogs.planButton,
  mount(element:HTMLElement){root?.unmount();root=createRoot(element);render();},
  unmount(){root?.unmount();root=null;},
  get loadError(){return dialogs.loadError;},get hasOpenDialog(){return dialogs.hasOpenDialog;}
 };
}
