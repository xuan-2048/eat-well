import {loadKitchen} from '../pantry.js';
export function loadCooking(storage){const data=loadKitchen(storage);return {records:data.records,error:data.error};}
