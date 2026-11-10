import {PLATE_KEY} from './plate-data.js';
export {PLATE_KEY} from './plate-data.js';
// After a restore, all app collections share one atomic localStorage envelope.
export const LANGUAGE_KEY='fridge-helper-app-language';
export const DATA_KEYS=['eat-well-recipes-v1','eat-well-meal-plans-v1','eat-well-pantry-v1','eat-well-shopping-v1',LANGUAGE_KEY,PLATE_KEY];
export const ROOT_KEY='eat-well-data-v1';
export function validEntries(entries,{legacy=false}={}){
  if(!entries||typeof entries!=='object'||Array.isArray(entries))return false;
  const keys=legacy&&Object.keys(entries).length===DATA_KEYS.length-1?DATA_KEYS.filter(key=>key!==PLATE_KEY):DATA_KEYS;
  return Object.keys(entries).length===keys.length&&keys.every(key=>Object.hasOwn(entries,key)&&(entries[key]===null||typeof entries[key]==='string'));
}
export function normalizeEntries(entries){if(!validEntries(entries,{legacy:true}))throw new Error('Invalid backup');return Object.fromEntries(DATA_KEYS.map(key=>[key,entries[key]??null]));}
export function createAppStorage(raw){
  function root(){
    const value=raw.getItem(ROOT_KEY);if(value===null)return null;
    const data=JSON.parse(value);
    if(data?.version!==1||!Number.isSafeInteger(data.generation)||data.generation<1||!validEntries(data.entries,{legacy:true})||!data.previous||!validEntries(data.previous.entries,{legacy:true})||typeof data.previous.createdAt!=='string'||!Number.isFinite(Date.parse(data.previous.createdAt)))throw new Error('Unreadable restored data');
    return {...data,entries:normalizeEntries(data.entries),previous:{...data.previous,entries:normalizeEntries(data.previous.entries)}};
  }
  function capture(){const saved=root();return saved?saved.entries:Object.fromEntries(DATA_KEYS.map(key=>[key,raw.getItem(key)]));}
  return {
    getItem(key){if(!DATA_KEYS.includes(key))return raw.getItem(key);return capture()[key];},
    setItem(key,value){
      if(!DATA_KEYS.includes(key)){raw.setItem(key,value);return;}
      const saved=root();if(!saved){raw.setItem(key,value);return;}
      raw.setItem(ROOT_KEY,JSON.stringify({...saved,entries:{...saved.entries,[key]:String(value)}}));
    },
    capture,
    recovery(){return root()?.previous??null;},
    replace(entries,expected,now=new Date().toISOString()){
      if(!validEntries(entries)||!Number.isFinite(Date.parse(now)))throw new Error('Invalid restore');
      const before=capture();if(JSON.stringify(before)!==expected)throw new Error('Data changed');
      // Target and recovery copy become visible together, or neither does.
      raw.setItem(ROOT_KEY,JSON.stringify({version:1,generation:(root()?.generation??0)+1,entries,previous:{entries:before,createdAt:now}}));
      // Legacy values are no longer authoritative. Cleanup is optional and safe to retry.
      for(const key of DATA_KEYS)try{raw.removeItem(key);}catch{}
    }
  };
}
