import test from 'node:test';import assert from 'node:assert/strict';
import {addManualShopping,shoppingFromShortages,loadShopping,saveShopping,receiveShopping,SHOPPING_KEY} from '../src/shopping.js';
import {loadPantry,PANTRY_KEY} from '../src/pantry.js';
import {buildShortages} from '../src/shortages.js';
const recipe={id:'r',name:'Tomatoes',servings:1,ingredients:[{name:'tomato',amount:300,unit:'g',state:'raw'}]};
const rows=()=>buildShortages([{id:'a',date:'2026-11-10',meal:'lunch',recipeId:'r',servings:1}],[recipe],[],['2026-11-10']).rows;
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('regenerating menu shortages is idempotent; pending manual amounts count and purchased lines survive',()=>{
 let list=shoppingFromShortages([],rows(),()=> 'one');assert.equal(list[0].amount,300);
 list=shoppingFromShortages(list,rows(),()=> 'two');assert.equal(list.length,1);assert.equal(list[0].id,'one');
 list=addManualShopping(list,{name:'西红柿',amount:0.1,unit:'kg',state:'raw'},()=> 'manual');
 list=shoppingFromShortages(list,rows(),()=> 'auto');assert.equal(list.find(i=>i.source==='menu').amount,200);
 list=list.map(i=>i.source==='menu'?{...i,bought:true}:i);list=shoppingFromShortages(list,rows(),()=> 'three');assert.equal(list.length,2);
});
test('manual entries merge only compatible quantities and preparation states',()=>{
 let list=addManualShopping([],{name:'Tomatoes',amount:1,unit:'kg',state:'raw'},()=> 'one');
 list=addManualShopping(list,{name:'西红柿',amount:200,unit:'g',state:'raw'},()=> 'two');assert.equal(list.length,1);assert.equal(list[0].amount,1200);
 list=addManualShopping(list,{name:'Tomatoes',amount:2,unit:'piece',state:'raw'},()=> 'three');assert.equal(list.length,2);
});
test('receipt confirmation retries cannot duplicate inventory even if the second write fails',()=>{
 const store=memory();let list=shoppingFromShortages([],rows(),()=> 'purchase');list[0].bought=true;saveShopping(store,list);
 const details={name:'tomato',amount:500,unit:'g',state:'raw',location:'fridge',date:''};
 let fail=true;const flaky={getItem:store.getItem,setItem(k,v){if(k===SHOPPING_KEY&&fail){fail=false;throw new Error('quota');}store.setItem(k,v);}};
 assert.throws(()=>receiveShopping(flaky,'purchase',details),/quota/);assert.equal(loadPantry(store).items.length,1);assert.equal(loadShopping(store).items[0].received,false);
 receiveShopping(store,'purchase',details);receiveShopping(store,'purchase',details);assert.equal(loadPantry(store).items.length,1);assert.equal(loadShopping(store).items[0].received,true);
});
test('unbought items and corrupt storage do not enter inventory',()=>{
 const store=memory();saveShopping(store,shoppingFromShortages([],rows(),()=> 'one'));
 assert.throws(()=>receiveShopping(store,'one',{}));assert.equal(store.getItem(PANTRY_KEY),null);
 store.setItem(SHOPPING_KEY,'broken');assert.equal(loadShopping(store).error,true);assert.equal(store.getItem(SHOPPING_KEY),'broken');
});
test('unquantified manual duplicates are deduplicated without inventing an amount',()=>{
 const one=addManualShopping([],{name:'Salt',amount:null,unit:'g',state:'unspecified'},()=> 'a');
 const two=addManualShopping(one,{name:'盐',amount:null,unit:'g',state:'unspecified'},()=> 'b');assert.equal(two.length,1);assert.equal(two[0].amount,null);
});
test('fully covered requirements remove stale unpurchased menu items but preserve manual entries',()=>{
 const pending=shoppingFromShortages([],rows(),()=> 'pending');
 const manual=addManualShopping(pending,{name:'Salt',amount:1,unit:'bottle',state:'unspecified'},()=> 'manual');
 const next=shoppingFromShortages(manual,rows().map(r=>({...r,status:'covered',missing:0})),()=> 'unused');
 assert.equal(next.length,1);assert.equal(next[0].source,'manual');
});
test('confirmed actual receipt amount is stored separately from the planned purchase amount',()=>{
 const store=memory(),items=shoppingFromShortages([],rows(),()=> 'receipt');items[0].bought=true;saveShopping(store,items);
 receiveShopping(store,'receipt',{name:'Tomatoes',amount:500,unit:'g',state:'raw',location:'fridge',date:''});
 const item=loadShopping(store).items[0];assert.equal(item.amount,300);assert.equal(item.receipt.amount,500);
});
test('retry after partial receipt records the original stored batch rather than a changed draft',()=>{
 const store=memory(),items=shoppingFromShortages([],rows(),()=> 'retry');items[0].bought=true;saveShopping(store,items);
 let fail=true;const flaky={getItem:store.getItem,setItem(k,v){if(k===SHOPPING_KEY&&fail){fail=false;throw new Error('quota');}store.setItem(k,v);}};
 const detail={name:'Tomatoes',amount:500,unit:'g',state:'raw',location:'fridge',date:''};
 assert.throws(()=>receiveShopping(flaky,'retry',detail));receiveShopping(store,'retry',{...detail,amount:200});
 assert.equal(loadPantry(store).items[0].amount,500);assert.equal(loadShopping(store).items[0].receipt.amount,500);
});

test('merging a stored kilogram shopping entry uses canonical quantities',()=>{
 const items=addManualShopping([],{name:'Tomatoes',amount:1000,unit:'g',state:'raw'},()=> 'one');
 items[0].amount=1;items[0].unit='kg';
 const next=addManualShopping(items,{name:'西红柿',amount:200,unit:'g',state:'raw'},()=> 'two');
 assert.equal(next.length,1);assert.equal(next[0].unit,'g');assert.equal(next[0].amount,1200);
});
