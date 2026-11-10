export const validPhoto=value=>value===''||(typeof value==='string'&&value.length<=400000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value));
export const validPhotoEdit=value=>Boolean(value&&validPhoto(value.source)&&value.source!==''&&Number.isFinite(value.zoom)&&value.zoom>=1&&value.zoom<=4&&Number.isFinite(value.x)&&value.x>=0&&value.x<=1&&Number.isFinite(value.y)&&value.y>=0&&value.y<=1);
export function cropRect(width,height,{zoom=1,x=0.5,y=0.5}={}){
  if(![width,height,zoom,x,y].every(Number.isFinite)||width<=0||height<=0||zoom<1||zoom>4)throw new Error('Invalid crop');
  const size=Math.min(width,height)/zoom;
  return {x:Math.max(0,Math.min(width-size,x*width-size/2)),y:Math.max(0,Math.min(height-size,y*height-size/2)),size};
}
export function moveFrame(width,height,frame,dx,dy,displaySize){
  const rect=cropRect(width,height,frame);
  const x=Math.max(0,Math.min(width-rect.size,rect.x-dx*rect.size/displaySize));
  const y=Math.max(0,Math.min(height-rect.size,rect.y-dy*rect.size/displaySize));
  return {...frame,x:(x+rect.size/2)/width,y:(y+rect.size/2)/height};
}
