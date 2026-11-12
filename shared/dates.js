export const MEALS=['lunch','dinner'];
export function localDay(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDay(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [y,m,d]=value.split('-').map(Number);if(y<1000)return false;
  const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
export function followingDay(day){
  if(!validDay(day))throw new Error('Invalid date');
  const [y,m,d]=day.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10);
}
