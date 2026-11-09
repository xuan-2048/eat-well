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

import {workflowCopy} from '../src/workflow-copy.js';
test('menu and shopping text has equivalent bilingual coverage, including review reasons',()=>{
  assert.deepEqual(Object.keys(workflowCopy.zh).sort(),Object.keys(workflowCopy.en).sort());
  assert.deepEqual(Object.keys(workflowCopy.zh.reason).sort(),Object.keys(workflowCopy.en.reason).sort());
  for(const lang of ['en','zh']){
    for(const value of Object.values(workflowCopy[lang])){
      if(typeof value==='string')assert.ok(value.trim());
      else for(const message of Object.values(value))assert.ok(message.trim());
    }
  }
});
