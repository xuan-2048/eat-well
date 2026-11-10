export {validPhoto,validPhotoEdit} from '../shared/photo-validation.js';
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
