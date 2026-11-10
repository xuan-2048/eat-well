import {cropRect,moveFrame} from './photo-frame.js';
const copy={
 zh:{title:'调整照片',hint:'拖动照片，把菜放进圆盘；用滑块或双指缩放。',zoom:'缩放',left:'向左移动照片',right:'向右移动照片',up:'向上移动照片',down:'向下移动照片',reset:'重置',cancel:'取消',save:'使用这张照片',preview:'餐盘取景预览，可用方向键移动照片',error:'照片处理失败，请重试。'},
 en:{title:'Adjust photo',hint:'Drag the photo to frame your dish. Use the slider or pinch to zoom.',zoom:'Zoom',left:'Move photo left',right:'Move photo right',up:'Move photo up',down:'Move photo down',reset:'Reset',cancel:'Cancel',save:'Use photo',preview:'Plate crop preview. Use arrow keys to move the photo.',error:'Could not prepare this photo. Try again.'}
};
export async function editPhoto(source,{language='zh',frame}={}){
  const image=new Image();image.src=source;await image.decode();
  const dialog=document.getElementById('photo-editor'),c=copy[language];
  if(dialog.open)throw new Error('Photo editor busy');
  let current=frame?{zoom:frame.zoom,x:frame.x,y:frame.y}:{zoom:1,x:0.5,y:0.5};
  dialog.innerHTML=`<div class="dialog-header"><h2 id="photo-editor-title">${c.title}</h2><button type="button" data-crop-cancel aria-label="${c.cancel}">×</button></div><p class="form-note">${c.hint}</p><div class="crop-plate"><canvas width="640" height="640" tabindex="0" role="img" aria-label="${c.preview}"></canvas></div><label class="crop-zoom">${c.zoom} <output></output><input type="range" id="crop-zoom" min="1" max="4" step="0.01" value="${current.zoom}" aria-label="${c.zoom}"></label><div class="crop-move"><button type="button" data-crop-move="left" aria-label="${c.left}">←</button><button type="button" data-crop-move="up" aria-label="${c.up}">↑</button><button type="button" data-crop-move="down" aria-label="${c.down}">↓</button><button type="button" data-crop-move="right" aria-label="${c.right}">→</button><button type="button" data-crop-reset>${c.reset}</button></div><p class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-crop-cancel>${c.cancel}</button><button type="button" class="primary" data-crop-save>${c.save}</button></div>`;
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=dialog.querySelector('input'),pointers=new Map();let drag=null;
  function draw(){const rect=cropRect(image.naturalWidth,image.naturalHeight,current);current.x=(rect.x+rect.size/2)/image.naturalWidth;current.y=(rect.y+rect.size/2)/image.naturalHeight;ctx.fillStyle='#fff';ctx.fillRect(0,0,640,640);ctx.drawImage(image,rect.x,rect.y,rect.size,rect.size,0,0,640,640);slider.value=current.zoom;dialog.querySelector('output').textContent=`${current.zoom.toFixed(2)}×`;}
  function move(dx,dy){current=moveFrame(image.naturalWidth,image.naturalHeight,current,dx,dy,canvas.getBoundingClientRect().width);draw();}
  function zoom(value){current.zoom=Math.max(1,Math.min(4,value));draw();}
  function distance(){const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
  function startDrag(){const point=[...pointers.values()][0];drag=point?{...point,distance:distance(),zoom:current.zoom}:null;}
  canvas.onpointerdown=event=>{event.preventDefault();canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});startDrag();};
  canvas.onpointermove=event=>{if(!pointers.has(event.pointerId)||!drag)return;event.preventDefault();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size>1){if(drag.distance>0)zoom(drag.zoom*distance()/drag.distance);}else{move(event.clientX-drag.x,event.clientY-drag.y);drag.x=event.clientX;drag.y=event.clientY;}};
  canvas.onpointerup=canvas.onpointercancel=event=>{pointers.delete(event.pointerId);startDrag();};
  canvas.onkeydown=event=>{const steps={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};if(steps[event.key]){event.preventDefault();move(...steps[event.key]);}};
  slider.oninput=()=>zoom(Number(slider.value));
  draw();dialog.showModal();
  return new Promise(resolve=>{
    let result=null;
    const close=()=>dialog.close();
    const onCancel=event=>{event.preventDefault();close();};
    const onClick=event=>{
      if(event.target.closest('[data-crop-cancel]'))close();
      else if(event.target.closest('[data-crop-reset]')){current={zoom:1,x:0.5,y:0.5};draw();}
      else if(event.target.closest('[data-crop-move]')){const direction=event.target.closest('[data-crop-move]').dataset.cropMove;move(...({left:[-12,0],right:[12,0],up:[0,-12],down:[0,12]})[direction]);}
      else if(event.target.closest('[data-crop-save]')){
        try{draw();let photo=canvas.toDataURL('image/jpeg',0.8);if(photo.length>400000)photo=canvas.toDataURL('image/jpeg',0.45);if(photo.length>400000)throw new Error('Photo too large');result={photo,photoEdit:{source,...current}};close();}
        catch{dialog.querySelector('.form-error').textContent=c.error;}
      }
    };
    dialog.addEventListener('click',onClick);dialog.addEventListener('cancel',onCancel);
    dialog.addEventListener('close',()=>{dialog.removeEventListener('click',onClick);dialog.removeEventListener('cancel',onCancel);resolve(result);},{once:true});
  });
}
