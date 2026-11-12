import {dailyNutrition,dailyNutrients} from '../../../shared/daily-nutrition.ts';
import type {IntakeRecord,IntakeRow,Meal} from '../../../shared/daily-nutrition.ts';
import type {Language,Nutrient,NutrientValues} from '../../../shared/contracts.ts';
import {cookingCopy} from '../../cooking-copy.js';
import {nutritionCopy} from '../../nutrition-copy.js';
import {dishIllustration} from '../../dish-art.js';
import {dailyCopy} from './daily-copy.ts';

export interface CookingRecordView extends IntakeRecord {
  updatedAt:string;notes:string;photo:string;stock:{status:'none'|'applied'|'undone'};
}
export interface CookingViewState {view:'daily'|'records';day:string;dateFilter:string;meal:'all'|Meal}
export interface CookingPageProps {
  records:CookingRecordView[];loadError:boolean;language:Language;today:string;state:CookingViewState;
  onChange:(next:Partial<CookingViewState>)=>void;onShift:(offset:number)=>void;onOpen:(id:string)=>void;onAdd:()=>void;
}
const number=(n:number|null)=>n===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
const unit=(key:Nutrient)=>key==='energy'?'kcal':'g';
const dateLabel=(day:string,language:Language)=>new Intl.DateTimeFormat(language==='zh'?'zh-CN':'en-US',{year:'numeric',month:'short',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`));

function Nutrients({values,known,completeCounts,total,language}:{values:NutrientValues;known:Record<Nutrient,number>;completeCounts:Record<Nutrient,number>;total:number;language:Language}){
 const c=dailyCopy[language],n=nutritionCopy[language];
 return <dl className="nutrition-values daily-values" aria-label={c.title}>{dailyNutrients.map(key=><div key={key}>
  <dt>{n.nutrients[key]}</dt><dd>{number(values[key])}<small>{unit(key)}</small></dd>
  {known[key]<total?<small>{c.coverage(known[key],total)}</small>:completeCounts[key]<total&&<small>{c.partial}</small>}
 </div>)}</dl>;
}
function IntakeDish({row,language,onOpen}:{row:IntakeRow;language:Language;onOpen:(id:string)=>void}){
 const c=dailyCopy[language];
 const status={complete:c.completeRow,partial:c.partialRow,unavailable:c.unavailable,unrecorded:c.noIntake,notEaten:c.notEaten}[row.status];
 return <article className="daily-dish"><div className="daily-dish-heading"><h3>{row.name}</h3><button type="button" className="text-link" onClick={()=>onOpen(row.id)} aria-label={`${c.showRecord} · ${row.name}`}>{c.showRecord} ↗</button></div>
  <p>{c.made} {number(row.cookedServings)} {c.servings} · {c.ate} {row.eatenServings===null?c.noIntake:`${number(row.eatenServings)} ${c.servings}`}</p>
  <p className={row.status==='complete'||row.status==='notEaten'?'daily-complete':'daily-incomplete'}>{status}</p>
  <div className="nutrition-row-values">{dailyNutrients.map(key=><span key={key}>{nutritionCopy[language].nutrients[key]} <b>{number(row.values[key])}</b> {unit(key)}</span>)}</div>
  <details className="nutrition-reference"><summary>{c.basis}</summary><p>{row.basisKind==='frozen'?c.frozen:c.recipeBasis}</p>
   <p>{c.included(row.includedIngredients,row.ingredientCount)}</p><p>{row.dataVersion}</p>{row.capturedAt&&<p>{new Intl.DateTimeFormat(language==='zh'?'zh-CN':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(row.capturedAt))}</p>}
  </details>
 </article>;
}
export function CookingPage({records,loadError,language,today,state,onChange,onShift,onOpen,onAdd}:CookingPageProps){
 const c=cookingCopy[language],d=dailyCopy[language];
 const visible=records.filter(r=>(!state.dateFilter||r.date===state.dateFilter)&&(state.meal==='all'||r.meal===state.meal)).sort((a,b)=>b.date.localeCompare(a.date)||(['lunch','dinner'].indexOf(a.meal)-['lunch','dinner'].indexOf(b.meal))||b.updatedAt.localeCompare(a.updatedAt));
 const report=!loadError?dailyNutrition(records,state.day):null;
 return <section className="library cooking-library" data-cooking-react="true">
  <div className="section-heading"><h1>{c.history}</h1><button type="button" className="primary" onClick={onAdd} disabled={loadError}>＋ {c.add}</button></div>
  <div className="cooking-views" role="group" aria-label={d.view}>{(['daily','records'] as const).map(view=><button type="button" key={view} aria-pressed={state.view===view} onClick={()=>onChange({view})}>{view==='daily'?d.daily:d.records}</button>)}</div>
  {loadError?<p className="form-error" role="alert">{c.loadError}</p>:state.view==='daily'&&report?<>
   <div className="daily-date-controls"><button type="button" className="week-arrow" aria-label={d.previous} disabled={state.day==='1000-01-01'} onClick={()=>onShift(-1)}>‹</button>
    <label htmlFor="daily-nutrition-date"><span className="sr-only">{d.date}</span><input id="daily-nutrition-date" type="date" min="1000-01-01" max={today} value={state.day} onChange={event=>{const day=event.target.value;if(day&&day>= '1000-01-01'&&day<=today)onChange({day});}}/></label>
    <button type="button" className="week-arrow" aria-label={d.next} disabled={state.day>=today} onClick={()=>onShift(1)}>›</button>
    <button type="button" className="text-link" onClick={()=>onChange({day:today})}>{d.today}</button>
   </div>
   <section className="daily-summary" aria-labelledby="daily-summary-title"><h2 id="daily-summary-title">{d.title}</h2><p className="daily-day-label">{dateLabel(state.day,language)}</p>
    {report.total>0?<><p className={`nutrition-status ${report.complete?'complete':'partial'}`}>{report.complete?d.complete:d.partial}</p>
     <Nutrients values={report.values} known={report.known} completeCounts={report.completeCounts} total={report.total} language={language}/>
     {!report.complete&&<p className="form-note">{d.unknown}</p>}
     {report.unrecorded>0&&<p className="daily-alert">{d.unrecorded(report.unrecorded)}</p>}{report.partial>0&&<p className="daily-alert">{d.partialDishes(report.partial)}</p>}
     {report.legacy>0&&<p className="form-note">{d.legacy}</p>}
    </>:<div className="daily-empty"><p>{d.empty}</p><small>{d.emptyHint}</small></div>}
    <p className="daily-scope">{d.scope}</p>
   </section>
   {report.meals.map(meal=><details className="daily-meal" key={meal.meal}><summary><span>{c[meal.meal]} <small>{meal.total}</small></span><span>{meal.total?`${number(meal.values.energy)} kcal`:d.mealEmpty}</span></summary>
    {meal.total>0?<><p className="form-note">{d.contribution} · {meal.complete?d.complete:d.partial}</p><Nutrients values={meal.values} known={meal.known} completeCounts={meal.completeCounts} total={meal.total} language={language}/>{meal.rows.map(row=><IntakeDish key={row.id} row={row} language={language} onOpen={onOpen}/>)}</>:<p className="form-note">{d.mealEmpty}</p>}
   </details>)}<p className="local-note">{d.editIntake}</p>
  </>:<>
   <div className="history-filters"><label htmlFor="record-date-filter">{c.filterDate}<input id="record-date-filter" type="date" min="1000-01-01" max={today} value={state.dateFilter} onChange={e=>onChange({dateFilter:e.target.value})}/></label><div><span className="record-meal-label">{c.meal}</span><div className="record-meal-filters" role="group" aria-label={c.meal}>{(['all','lunch','dinner'] as const).map(meal=><button key={meal} type="button" aria-pressed={state.meal===meal} onClick={()=>onChange({meal})}>{meal==='all'?c.allMeals:c[meal]}</button>)}</div></div></div>
   {(state.dateFilter||state.meal!=='all')&&<button type="button" className="text-link" onClick={()=>onChange({dateFilter:'',meal:'all'})}>{d.clear}</button>}
   {visible.length?[...new Set(visible.map(r=>r.date))].map(day=><section className="history-day" key={day}><h2>{dateLabel(day,language)}</h2>{visible.filter(r=>r.date===day).map(record=><button type="button" className="history-card" key={record.id} onClick={()=>onOpen(record.id)}>
    {record.photo?<img src={record.photo} alt="" loading="lazy"/>:<span className="history-initial" aria-hidden="true" dangerouslySetInnerHTML={{__html:dishIllustration(record.recipeSnapshot)}}/>}
    <span className="history-card-content"><small>{c[record.meal]}</small><strong>{record.recipeSnapshot.name}</strong><span>{c.cooked}: {record.cookedServings} {d.servings}</span><span>{c.ateLabel}: {record.eatenServings===null?c.unknown:`${record.eatenServings} ${d.servings}`}</span><small className={`stock-status ${record.stock.status}`}>{c[record.stock.status]}</small>{record.notes&&<span className="history-notes">{record.notes.slice(0,140)}</span>}</span><span aria-hidden="true">↗</span>
   </button>)}</section>):<div className="empty-state"><h2>{records.length?c.noneMatch:c.empty}</h2><p>{c.emptyHint}</p></div>}
  </>}
  <p className="local-note">{c.local}</p>
 </section>;
}
