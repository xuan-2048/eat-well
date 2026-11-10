import {backupCopy} from './backup-copy.js';
import {MAX_BACKUP_BYTES,clearPhotos,exportBackup,parseBackup,restoreBackup,recoveryBackup,inspectEntries} from './backup.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=['recipes','plans','pantry','records','shopping','photos'];
export function createBackupUI({storage,getLanguage,onRestored,toast}){
  const dialog=document.getElementById('backup-dialog');let preview=null,expected='',generation=0,recoveryMode=false,clearingPhotos=false;
  const C=()=>backupCopy[getLanguage()];
  const stamp=value=>new Intl.DateTimeFormat(getLanguage()==='zh'?'zh-CN':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
  function countsHTML(counts){return `<dl class="backup-counts">${categories.map(key=>`<div><dt>${C()[key]}</dt><dd>${counts[key]}</dd></div>`).join('')}</dl>`;}
  function header(title){return `<div class="dialog-header"><h2 id="backup-title">${title}</h2><button type="button" data-backup-close aria-label="${C().close}">×</button></div>`;}
  function error(message){dialog.querySelector('#backup-error').textContent=message;}
  function currentCounts(){try{return countsHTML(inspectEntries(storage.capture()));}catch{return `<p class="form-note">${C().unreadable}</p>`;}}
  function open(){
    generation++;preview=null;clearingPhotos=false;const c=C();let previous=null;try{previous=storage.recovery();}catch{}
    dialog.innerHTML=`${header(c.title)}<p class="backup-intro">${c.intro}</p><h3>${c.current}</h3>${currentCounts()}<button type="button" class="primary full" data-backup-export>${c.export}</button><p class="form-note">${c.exportNote}</p><label class="backup-file" for="backup-file">${c.import}<input type="file" id="backup-file" accept="application/json,.json" aria-label="${c.file}"></label><p class="form-note">${c.importNote}</p><section class="backup-recovery"><h3>${c.previous}</h3>${previous?`<p class="detail-meta">${escape(stamp(previous.createdAt))}</p><div class="form-actions"><button type="button" class="secondary" data-backup-recovery>${c.undo}</button><button type="button" class="secondary" data-backup-download-previous>${c.downloadPrevious}</button></div><p class="form-note">${c.previousNote}</p>`:`<p class="form-note">${c.emptyPrevious}</p>`}</section><button type="button" class="danger full clear-photos-button" data-backup-clear-photos>${c.clearPhotos}</button><p class="form-error" id="backup-error" role="alert"></p>`;
    if(!dialog.open)dialog.showModal();
  }
  function showPreview(data,recovery=false){
    preview=data;expected=JSON.stringify(storage.capture());recoveryMode=recovery;const c=C();
    dialog.innerHTML=`${header(recovery?c.undoTitle:c.preview)}<p class="detail-meta">${c.created}: ${escape(stamp(data.exportedAt))}</p><h3>${c.incoming}</h3>${countsHTML(data.counts)}${data.counts.missingRecipes?`<p class="missing-plan-note">${c.missing}</p>`:''}<h3>${c.current}</h3>${currentCounts()}<form id="backup-restore-form"><label class="use-ack"><input type="checkbox" required>${recovery?c.undoAck:c.ack}</label><p class="form-error" id="backup-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-backup-back>${c.cancel}</button><button type="submit" class="primary">${c.confirm}</button></div></form>`;
    dialog.scrollTop=0;dialog.querySelector('[data-backup-close]').focus();
  }
  function download(data){
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`eat-well-backup-${data.exportedAt.replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast(C().downloaded);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-backup-open],[data-backup-close],[data-backup-back],[data-backup-export],[data-backup-recovery],[data-backup-download-previous],[data-backup-clear-photos]');if(!button)return;
    if(button.hasAttribute('data-backup-open')){open();return;}
    if(button.hasAttribute('data-backup-close')){dialog.close();return;}
    if(button.hasAttribute('data-backup-back')){open();return;}
    if(button.hasAttribute('data-backup-clear-photos')){
      expected=JSON.stringify(storage.capture());clearingPhotos=true;const c=C();
      dialog.innerHTML=`${header(c.clearPhotos)}<p class="backup-intro">${c.clearPhotoHint}</p><form id="backup-restore-form"><label class="use-ack"><input type="checkbox" required>${c.clearPhotoAck}</label><p class="form-error" id="backup-error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-backup-back>${c.cancel}</button><button type="submit" class="danger">${c.clearPhotos}</button></div></form>`;dialog.scrollTop=0;return;
    }
    try{
      if(button.hasAttribute('data-backup-export'))download(exportBackup(storage));
      else if(button.hasAttribute('data-backup-download-previous')){
        const previous=storage.recovery();if(!previous)throw new Error('Missing recovery');
        download({format:'eat-well-backup',version:2,exportedAt:previous.createdAt,entries:previous.entries});
      }else{
        const previous=recoveryBackup(storage);if(!previous)throw new Error('Missing recovery');
        showPreview({entries:previous.entries,exportedAt:previous.createdAt,counts:previous.counts},true);
      }
    }catch{error(C().exportError);}
  });
  document.addEventListener('change',async event=>{
    if(event.target.id!=='backup-file')return;const file=event.target.files[0],token=++generation;if(!file)return;
    if(file.size>MAX_BACKUP_BYTES){error(C().large);return;}
    try{const data=parseBackup(await file.text());if(token!==generation||!dialog.open)return;showPreview(data);}
    catch{if(token===generation&&dialog.open){error(C().invalid);event.target.value='';}}
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='backup-restore-form')return;event.preventDefault();
    try{
      if(clearingPhotos){clearPhotos(storage,expected);const message=C().photosCleared;dialog.close();onRestored();toast(message);return;}
      if(!preview)throw new Error('Invalid preview');
      // Re-read the recovery copy in case another tab restored while this dialog was open.
      if(recoveryMode&&JSON.stringify(storage.recovery()?.entries)!==JSON.stringify(preview.entries))throw new Error('Data changed');
      restoreBackup(storage,preview,expected);
    }catch(e){error(e.message==='Data changed'?C().changed:C().error);return;}
    const message=C().saved;dialog.close();onRestored();toast(message);
  });
  dialog.addEventListener('close',()=>{generation++;preview=null;});
  return {get hasOpenDialog(){return dialog.open;}};
}
