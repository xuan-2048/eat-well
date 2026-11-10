import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';

async function files(directory) {
 const entries=await readdir(directory,{withFileTypes:true});
 return (await Promise.all(entries.map(entry=>entry.isDirectory()?files(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]))).flat();
}
test('shared rules have no browser/storage/server dependencies; frontend cannot import server modules',async()=>{
 for(const path of await files('shared')){
  const source=await readFile(path,'utf8');
  assert.doesNotMatch(source,/\b(?:window|document|localStorage)\s*\./,path);
  for(const match of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)){
   const imported=resolve(dirname(path),match[1]);assert.ok(imported.startsWith(resolve('shared')+'/'),`${path} imports ${match[1]}`);
  }
 }
 for(const path of await files('src')){
  if(!/\.(js|ts|tsx)$/.test(path))continue;
  const source=await readFile(path,'utf8');assert.doesNotMatch(source,/from\s+['"][^'"]*server\//,path);
 }
});
