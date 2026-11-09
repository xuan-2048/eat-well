import test from 'node:test';import assert from 'node:assert/strict';
import {scaleIngredients} from '../src/plans.js';
import {buildShortages} from '../src/shortages.js';
import {foodIdentity} from '../src/pantry.js';
const recipe={id:'r',name:'Tomato eggs',servings:2,ingredients:[{name:'西红柿',amount:300,unit:'g',state:'raw'},{name:'鸡蛋',amount:2,unit:'piece',state:'raw'},{name:'盐',amount:null,unit:'toTaste',state:'unspecified'}]};
const plan=(changes={})=>({id:'a',date:'2026-11-10',meal:'lunch',recipeId:'r',servings:3,...changes});
const stock=(name,amount,unit='g',extra={})=>({id:name,name,...foodIdentity(name),amount,unit,state:'raw',date:'',...extra});
test('servings scale measured ingredients but never convert unmeasured amounts to zero',()=>{
 const scaled=scaleIngredients(recipe,3);assert.equal(scaled[0].amount,450);assert.equal(scaled[1].amount,3);assert.equal(scaled[2].amount,null);assert.equal(recipe.ingredients[0].amount,300);
});
test('aliases and kg/g conversion produce an exact shortage',()=>{
 const {rows}=buildShortages([plan()],[recipe],[stock('Tomatoes',0.2,'kg'),stock('eggs',1,'piece')],['2026-11-10']);
 assert.equal(rows.find(r=>r.foodId==='tomato').missing,250);assert.equal(rows.find(r=>r.foodId==='egg').missing,2);assert.equal(rows.find(r=>r.foodId==='salt').status,'review');
});
test('stock is allocated once across dishes and dates; dates on the stock are respected per meal date',()=>{
 const plans=[plan({servings:2}),plan({id:'b',date:'2026-11-11',servings:2})];
 const result=buildShortages(plans,[recipe],[stock('tomato',500,'g',{date:'2026-11-10'})],['2026-11-10','2026-11-11']);
 const row=result.rows.find(r=>r.foodId==='tomato');assert.equal(row.required,600);assert.equal(row.available,300);assert.equal(row.missing,300);assert.ok(row.reasons.includes('date'));
});
test('pieces vs weight, spoons vs volume and unspecified preparation need review',()=>{
 let rows=buildShortages([plan()],[recipe],[stock('tomato',2,'piece')],['2026-11-10']).rows;
 assert.equal(rows.find(r=>r.foodId==='tomato').status,'review');assert.ok(rows[0].reasons.includes('unit'));
 rows=buildShortages([plan()],[recipe],[stock('tomato',500,'g',{state:undefined})],['2026-11-10']).rows;
 assert.ok(rows.find(r=>r.foodId==='tomato').reasons.includes('state'));
 const oil={...recipe,ingredients:[{name:'oil',amount:1,unit:'tbsp',state:'unspecified'}]};
 assert.equal(buildShortages([plan()],[oil],[stock('oil',500,'ml')],['2026-11-10']).rows[0].status,'review');
});
test('missing recipe references are shown as warnings, not silently treated as complete',()=>{
 const result=buildShortages([plan()],[],[],['2026-11-10']);assert.equal(result.rows.length,0);assert.equal(result.warnings.length,1);
});
