import {useEffect, useMemo, useState} from 'react';
import type {EstimateResult, FoodReference, Language, Nutrient, NutrientValues, SavedRecipe} from '../../../shared/contracts.ts';
import {nutritionSource} from '../../../shared/nutrition.js';
import {nutritionCopy} from '../../nutrition-copy.js';
import {createNutritionClient} from '../../api/nutrition-client.ts';

export type NutritionMode = 'serving' | 'whole' | 'current';
const nutrients: Nutrient[] = ['energy', 'protein', 'carbs', 'fat', 'fiber'];
const number = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('en-US', {maximumFractionDigits: 1}).format(value);
const unit = (key: Nutrient) => key === 'energy' ? 'kcal' : 'g';
const client = createNutritionClient();

interface Props {
  recipe: SavedRecipe;
  selected: number;
  language: Language;
  mode: NutritionMode;
  onMode: (mode: NutritionMode) => void;
  onEdit: (index: number) => void;
}

function Values({values, language}: {values: NutrientValues; language: Language}) {
  return <>{nutrients.map(key => <span key={key}>{nutritionCopy[language].nutrients[key]} <b>{number(values[key])}</b> {unit(key)}</span>)}</>;
}

export function ReferenceDetails({food, language}: {food: FoodReference | null; language: Language}) {
  if (!food) return null;
  const c = nutritionCopy[language];
  return <details className="nutrition-reference">
    <summary>{c.details} · FDC {food.fdcId}</summary>
    <p>{food.name[language]}</p>
    {language === 'zh' && <p lang="en">{food.name.en}</p>}
    <p>{c.per100}</p>
    <div className="nutrition-reference-values"><Values values={food.per100g} language={language}/></div>
  </details>;
}

export function NutritionPanel({recipe, selected, language, mode, onMode, onEdit}: Props) {
  const c = nutritionCopy[language];
  const servings = mode === 'whole' ? recipe.servings : mode === 'current' ? selected : 1;
  const key = useMemo(() => JSON.stringify([recipe.servings, recipe.ingredients, recipe.nutrition, servings]), [recipe, servings]);
  const [loaded, setLoaded] = useState<{key: string; value: EstimateResult} | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    client.estimate(recipe, servings, controller.signal).then(value => {
      if (!controller.signal.aborted) setLoaded({key, value});
    }).catch(() => {if (!controller.signal.aborted) setFailed(key);});
    return () => controller.abort();
  }, [key, recipe, servings]);
  const value = loaded?.key === key ? loaded.value : null;
  const result = value?.result;
  const modes: [NutritionMode, string][] = [['serving', c.perServing], ['whole', c.whole], ['current', c.current]];
  return <section className="nutrition-panel" aria-labelledby="nutrition-heading" data-estimate-via={value?.via ?? 'pending'}>
    <h3 id="nutrition-heading" tabIndex={-1}>{c.title}</h3>
    <div className="nutrition-modes" role="group" aria-label={c.title}>
      {modes.map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => onMode(id)}>{label}</button>)}
    </div>
    <p className="nutrition-basis">{c.basis(servings)}</p>
    {!result ? <p className="form-note" role="status">{failed === key ? c.error : c.loading}</p> : <>
      <p className={`nutrition-status ${result.complete ? 'complete' : 'partial'}`}>{result.complete ? c.complete : c.partial}</p>
      <p className="nutrition-coverage">{c.coverage(result.included, result.total)}</p>
      {value.via === 'local' && <p className="form-note" role="status">{c.localEstimate}</p>}
      <dl className="nutrition-values" aria-label={c.title}>
        {nutrients.map(key => <div key={key}><dt>{c.nutrients[key]}</dt><dd>{number(result.values[key])}<small>{unit(key)}</small></dd>
          {result.coverage[key] < result.included && <small>{c.dataPartial(result.coverage[key])}</small>}
        </div>)}
      </dl>
      {!result.complete && <p className="form-note">{c.missing}</p>}
      <details className="nutrition-ingredients"><summary>{c.ingredients}</summary>
        {result.rows.map(row => <article className="nutrition-row" key={row.index}>
          <div className="nutrition-row-heading"><strong>{row.ingredient.name}</strong>
            <button type="button" className="text-link" onClick={() => onEdit(row.index)} aria-label={`${row.status === 'included' ? c.adjust : c.completeRow} · ${row.ingredient.name}`}>{row.status === 'included' ? c.adjust : c.completeRow}</button>
          </div>
          <p>{c.status[row.status]}{row.grams === null ? '' : ` · ${number(row.grams * servings / recipe.servings)} g`}</p>
          {row.status === 'included' && <>
            <p>{row.reference?.name[language]}</p>
            <div className="nutrition-row-values"><span>{c.contribution} · {c.basis(servings)}</span>
              <Values language={language} values={Object.fromEntries(nutrients.map(key => [key, row.nutrients[key] === null ? null : row.nutrients[key] * servings / recipe.servings])) as NutrientValues}/>
            </div>
          </>}
          <ReferenceDetails food={row.reference} language={language}/>
        </article>)}
      </details>
    </>}
    <p className="nutrition-footnote">{c.note}</p>
    <p className="nutrition-footnote">{c.source}: <a href={nutritionSource.documentationUrl} target="_blank" rel="noopener noreferrer">USDA FoodData Central</a>. {c.sourceNote}</p>
  </section>;
}
