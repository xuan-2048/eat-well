import {cropRect} from './photo-frame.js';
export async function compressPhoto(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Invalid photo');
  let bitmap;
  try{
    bitmap=await createImageBitmap(file);
    const scale=Math.min(1,720/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let photo=canvas.toDataURL('image/jpeg',0.75);
    if(photo.length>400000)photo=canvas.toDataURL('image/jpeg',0.45);
    if(photo.length>400000)throw new Error('Photo too large');return photo;
  }finally{bitmap?.close();}
}

export async function cropPhoto(source,frame){
  const image=new Image();image.src=source;await image.decode();
  const rect=cropRect(image.naturalWidth,image.naturalHeight,frame);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=640;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,640,640);ctx.drawImage(image,rect.x,rect.y,rect.size,rect.size,0,0,640,640);
  let photo=canvas.toDataURL('image/jpeg',0.8);if(photo.length>400000)photo=canvas.toDataURL('image/jpeg',0.45);if(photo.length>400000)throw new Error('Photo too large');return photo;
}
