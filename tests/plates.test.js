import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppStorage,DATA_KEYS,ROOT_KEY,LANGUAGE_KEY} from '../src/storage.js';
import {PLATE_KEY,PLATE_STYLES} from '../src/plate-data.js';
import {exportBackup,parseBackup,restoreBackup} from '../src/backup.js';
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
const sig=store=>JSON.stringify(store.capture());
test('all plate choices persist in complete backups and recover with the rest of the data',()=>{
 for(const style of PLATE_STYLES){const original=createAppStorage(memory());original.setItem(PLATE_KEY,style);const file=exportBackup(original);assert.equal(file.version,2);const target=createAppStorage(memory());restoreBackup(target,parseBackup(JSON.stringify(file)),sig(target));assert.equal(target.getItem(PLATE_KEY),style);target.setItem(LANGUAGE_KEY,'en');assert.equal(target.getItem(PLATE_KEY),style);}
});
test('version-1 files without appearance restore with the default plate, and unknown styles are rejected',()=>{
 const empty=createAppStorage(memory()),file=exportBackup(empty);file.version=1;delete file.entries[PLATE_KEY];const parsed=parseBackup(JSON.stringify(file));assert.equal(parsed.entries[PLATE_KEY],null);assert.equal(Object.keys(parsed.entries).length,DATA_KEYS.length);
 const bad=exportBackup(empty);bad.entries[PLATE_KEY]='unexpected';assert.throws(()=>parseBackup(JSON.stringify(bad)));
});
test('old atomic envelopes keep their data and recovery when a plate preference is first saved',()=>{
 const raw=memory(),entries=Object.fromEntries(DATA_KEYS.filter(key=>key!==PLATE_KEY).map(key=>[key,null]));entries[LANGUAGE_KEY]='en';raw.setItem(ROOT_KEY,JSON.stringify({version:1,generation:1,entries,previous:{entries,createdAt:'2026-11-09T12:00:00Z'}}));
 const storage=createAppStorage(raw);assert.equal(storage.getItem(LANGUAGE_KEY),'en');storage.setItem(PLATE_KEY,'sage');assert.equal(storage.getItem(PLATE_KEY),'sage');assert.equal(storage.recovery().entries[LANGUAGE_KEY],'en');assert.equal(storage.recovery().entries[PLATE_KEY],null);
});
