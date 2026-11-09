import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeCopy} from '../src/recipe-copy.js';
import {CUISINES,UNITS,STATES} from '../src/recipes.js';
test('recipe forms and dictionary options have equivalent English and Chinese coverage',()=>{
  assert.deepEqual(Object.keys(recipeCopy.zh).sort(),Object.keys(recipeCopy.en).sort());
  for(const lang of ['zh','en']){
    for(const id of CUISINES)assert.ok(recipeCopy[lang].cuisines[id]);
    for(const id of UNITS)assert.ok(recipeCopy[lang].units[id]);
    for(const id of STATES)assert.ok(recipeCopy[lang].states[id]);
  }
});
