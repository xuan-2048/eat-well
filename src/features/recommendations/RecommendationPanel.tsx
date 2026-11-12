import {useEffect,useState} from 'react';
import {CUISINES} from '../../../shared/recipes.js';
import {followingDay} from '../../../shared/dates.js';
import {nutritionStamp} from '../../../shared/nutrition.js';
import type {RecommendationOptions,RecommendationRecipe,RankedCandidate} from '../../../shared/recommendations.ts';
import type {Language,EstimateResult,Nutrient} from '../../../shared/contracts.ts';
import {recipeCopy} from '../../recipe-copy.js';
import {workflowCopy} from '../../workflow-copy.js';
import {nutritionCopy} from '../../nutrition-copy.js';
import {dishIllustration} from '../../dish-art.js';
import {createNutritionClient} from '../../api/nutrition-client.ts';
import {recommendationCopy} from './recommendation-copy.ts';
const nutrients:Nutrient[]=['energy','protein','carbs','fat','fiber'];
const client=createNutritionClient();
const number=(n:number|null)=>n===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
const quantity=(n:number|null,unit:string,language:Language)=>unit==='toTaste'?recipeCopy[language].units.toTaste:n===null?'—':`${number(n)} ${recipeCopy[language].units[unit as keyof typeof recipeCopy.en.units]??unit}`;

function PerServing({recipe,language}:{recipe:RecommendationRecipe;language:Language}){
 const c=recommendationCopy[language],stamp=nutritionStamp(recipe);
 const [loaded,setLoaded]=useState<{stamp:string;value:EstimateResult}|null>(null);
 useEffect(()=>{const controller=new AbortController();client.estimate(recipe,1,controller.signal).then(value=>{if(!controller.signal.aborted)setLoaded({stamp,value});}).catch(()=>{});return()=>controller.abort();},[recipe,stamp]);
 const result=loaded?.stamp===stamp?loaded.value.result:null;
 return <details className="rec-nutrition"><summary>{c.nutrition}</summary>{result?<>
  <p className="form-note">{result.complete?c.completeNutrition:c.partialNutrition}</p>
  <dl className="nutrition-values">{nutrients.map(key=><div key={key}><dt>{nutritionCopy[language].nutrients[key]}</dt><dd>{result.values[key]===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(result.values[key])}<small>{key==='energy'?'kcal':'g'}</small></dd></div>)}</dl>
  {!result.complete&&<p className="form-note">{c.nutritionNote}</p>}
 </>:<p className="form-note" role="status">{c.nutritionLoading}</p>}</details>;
}
interface Props {
 language:Language;today:string;options:RecommendationOptions;candidate:RankedCandidate|null;total:number;libraryCount:number;unknownTime:number;error:boolean;notice:string;
 onOptions:(change:Partial<RecommendationOptions>)=>void;onNext:()=>void;onClose:()=>void;onRecipe:(id:string,edit?:boolean)=>void;onPlan:()=>void;onShop:()=>void;onRecipes:()=>void;onShopping:()=>void;
}
export function RecommendationPanel(p:Props){
 const {language,options,candidate}=p,c=recommendationCopy[language],r=recipeCopy[language];
 const [servings,setServings]=useState(String(options.servings));
 useEffect(()=>setServings(String(options.servings)),[options.servings]);
 const n=Number(servings),valid=servings.trim()!==''&&Number.isFinite(n)&&n>=.25&&n<=100&&Number.isInteger(n*4);
 const recipe=candidate?.recipe;
 return <section className="recommendation-panel"><div className="dialog-header"><h2 id="recommendation-title">{c.title}</h2><button type="button" onClick={p.onClose} aria-label={c.close}>×</button></div>
  <details className="rec-filters"><summary>{c.filters}</summary><fieldset><legend>{c.cuisine}</legend><div className="rec-chips">{['all',...CUISINES].map(cuisine=><button type="button" key={cuisine} aria-pressed={options.cuisine===cuisine} onClick={()=>p.onOptions({cuisine})}>{cuisine==='all'?c.anyCuisine:r.cuisines[cuisine as keyof typeof r.cuisines]}</button>)}</div></fieldset>
   <fieldset><legend>{c.time}</legend><div className="rec-chips">{[null,15,30,45,60].map(minutes=><button type="button" key={minutes??'any'} aria-pressed={options.maxMinutes===minutes} onClick={()=>p.onOptions({maxMinutes:minutes})}>{minutes===null?c.anyTime:`${minutes} ${c.minutes}`}</button>)}</div></fieldset>
  </details>
  <div className="rec-target"><div><span>{c.target}</span><div className="rec-chips">{[p.today,followingDay(p.today)].map(date=><button type="button" key={date} aria-pressed={options.date===date} onClick={()=>p.onOptions({date})}>{date===p.today?c.today:c.tomorrow}</button>)}</div></div>
   <div><span>{c.meal}</span><div className="rec-chips">{(['lunch','dinner'] as const).map(meal=><button key={meal} type="button" aria-pressed={options.meal===meal} onClick={()=>p.onOptions({meal})}>{c[meal]}</button>)}</div></div>
   <label htmlFor="recommendation-servings">{c.servings}<input id="recommendation-servings" type="number" inputMode="decimal" min="0.25" max="100" step="0.25" value={servings} onChange={e=>{const value=e.target.value;setServings(value);const amount=Number(value);if(value&&amount>=.25&&amount<=100&&Number.isInteger(amount*4))p.onOptions({servings:amount});}}/></label>
  </div>{!valid&&<p className="form-error">{c.portionHint}</p>}
  {p.error?<p className="form-error" role="alert">{c.loadError}</p>:!candidate?<div className="rec-empty"><h3>{p.libraryCount?c.noMatch:c.emptyLibrary}</h3><p>{p.libraryCount?c.noMatchHint:c.emptyLibraryHint}</p>{p.unknownTime>0&&<p>{c.unknownExcluded(p.unknownTime)}</p>}<button type="button" className="secondary" onClick={p.onRecipes}>{c.goRecipes}</button></div>:recipe&&<>
   <article className="rec-dish"><div className="rec-dish-heading"><span className="rec-art">{recipe.photo?<img src={recipe.photo} alt=""/>:<span dangerouslySetInnerHTML={{__html:dishIllustration(recipe)}}/>}</span><div><small>{r.cuisines[recipe.cuisine as keyof typeof r.cuisines]} · {recipe.cookMinutes==null?c.unknownTime:`${recipe.cookMinutes} ${c.minutes}`}</small><h3>{recipe.name}</h3><button type="button" className="text-link" onClick={()=>p.onRecipe(recipe.id,recipe.cookMinutes==null)}>{recipe.cookMinutes==null?c.editTime:c.viewRecipe}</button></div></div>
    <ul className="rec-reasons"><li>{candidate.covered>0?c.ready(candidate.covered,candidate.rows.length):candidate.rows.some(row=>row.available>0)?c.partialStock:c.sourceReason}</li>
     {candidate.recent?<li>{c.recent}</li>:recipe.cookMinutes!=null?<li>{c.timeReason(recipe.cookMinutes)}</li>:null}</ul>
    <button type="button" className="secondary rec-next" onClick={p.onNext} disabled={p.total<=1}>{c.next}</button>{p.total<=1&&<p className="form-note">{c.only}</p>}
    <details className="rec-stock"><summary>{c.stockTitle} · {candidate.covered}/{candidate.rows.length}</summary>{candidate.rows.map(row=><div className="rec-stock-row" key={row.id}><strong>{row.name}</strong><small>{row.status==='covered'?c.covered:row.status==='review'?c.review:c.missingLabel}</small><p>{c.required}: {quantity(row.required,row.unit,language)} · {c.counted}: {quantity(row.available,row.unit,language)} · {c.missing}: {quantity(row.missing,row.unit,language)}</p>{row.reasons.length>0&&<p className="rec-warning">{row.reasons.map(reason=>workflowCopy[language].reason[reason as keyof typeof workflowCopy.en.reason]).join(' ')}</p>}</div>)}</details>
    <p className="rec-stock-note">{c.stockNote}</p>
    <PerServing key={recipe.id} recipe={recipe} language={language}/>
    <div className="rec-actions"><button type="button" className="primary" disabled={!valid} onClick={p.onPlan}>{c.plan}</button><button type="button" className="secondary" disabled={!valid||candidate.missing===0} onClick={p.onShop}>{c.shop}</button></div>
    {candidate.review>0&&<p className="form-note">{c.reviewNote(candidate.review)}</p>}
    <button type="button" className="text-link" onClick={()=>p.onRecipe(recipe.id)}>{c.viewRecipe}</button>
   </article>
  </>}
  {p.unknownTime>0&&candidate&&<p className="form-note">{c.unknownExcluded(p.unknownTime)}</p>}
  <p className="rec-notice" role="status" aria-live="polite">{p.notice}</p><button type="button" className="text-link" onClick={p.onShopping}>{c.goShopping}</button><p className="local-note">{c.local}</p>
 </section>;
}
