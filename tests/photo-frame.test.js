import test from 'node:test';
import assert from 'node:assert/strict';
import {cropRect,moveFrame,validPhotoEdit} from '../src/photo-frame.js';
import {validRecipe,validRecipeSource,ingredientKey,saveRecipes,loadRecipes} from '../src/recipes.js';
import {saveCookingRecord} from '../src/cooking.js';
const source='data:image/jpeg;base64,/9j/2Q==',now='2026-11-09T12:00:00Z';
const recipe={id:'r',name:'Egg',cuisine:'everyday',servings:1,wanted:true,cooked:false,ingredients:[{name:'Egg',key:ingredientKey('Egg'),amount:1,unit:'piece',state:'raw'}],steps:['Cook.'],photo:source,photoEdit:{source,zoom:1.8,x:0.5,y:0.45},createdAt:now,updatedAt:now};
test('portrait and landscape framing stays square and clamps safely at every image edge',()=>{
 assert.deepEqual(cropRect(1920,2560),{x:0,y:320,size:1920});assert.deepEqual(cropRect(2560,1920),{x:320,y:0,size:1920});
 for(const w of [400,1920])for(const h of [400,2560])for(const zoom of [1,1.8,4])for(const x of [0,.5,1])for(const y of [0,.5,1]){const r=cropRect(w,h,{zoom,x,y});assert.ok(r.x>=0&&r.y>=0&&r.x+r.size<=w+1e-8&&r.y+r.size<=h+1e-8);}
});
test('dragging moves the photo in the pointer direction and never exposes blank space',()=>{
 const initial={zoom:2,x:.5,y:.5};const moved=moveFrame(1000,1500,initial,50,20,250);assert.ok(moved.x<initial.x&&moved.y<initial.y);
 const edge=moveFrame(1000,1500,initial,50000,-50000,250),r=cropRect(1000,1500,edge);assert.equal(r.x,0);assert.equal(r.y+r.size,1500);
});
test('invalid image dimensions, zoom and editing metadata are rejected',()=>{
 for(const args of [[0,2],[2,NaN],[2,2,{zoom:0}],[2,2,{zoom:5}]])assert.throws(()=>cropRect(...args));
 assert.ok(validPhotoEdit(recipe.photoEdit));for(const edits of [{zoom:5},{x:-1},{y:2},{source:'https://example.com/a.jpg'}])assert.equal(validPhotoEdit({...recipe.photoEdit,...edits}),false);
 assert.equal(validRecipe({...recipe,photo:'',photoEdit:recipe.photoEdit}),false);
});
test('recipe photos retain original source and crop metadata through persistence and editing',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};saveRecipes(storage,[recipe]);assert.deepEqual(loadRecipes(storage).recipes[0].photoEdit,recipe.photoEdit);
 const record=saveCookingRecord(storage,{id:'c',sourcePlanId:null,date:'2026-11-09',meal:'lunch',recipeSnapshot:recipe,cookedServings:1,eatenServings:1,notes:'',photo:source,photoEdit:recipe.photoEdit},{now}).record;
 assert.deepEqual(record.photoEdit,recipe.photoEdit);assert.equal(record.recipeSnapshot.photo,'');assert.equal(record.recipeSnapshot.photoEdit,null);
});
test('source links permit HTTPS provenance but reject executable or malformed URLs',()=>{
 assert.ok(validRecipeSource({title:'Recipe author',url:'https://example.com/recipe'}));
 for(const url of ['javascript:alert(1)','http://example.com','https://','data:text/html,test'])assert.equal(validRecipeSource({title:'Bad',url}),false);
 assert.equal(validRecipeSource({title:'Recipe',url:'https://example.com',imageTitle:'Incomplete'}),false);
});
