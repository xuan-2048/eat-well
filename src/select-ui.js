// Keep native select values and form validation; render one consistent popup UI.
let installed=false;
export function installSelectUI(){
  if(installed)return;installed=true;
  const instances=new WeakMap();let active=null,sequence=0,typeBuffer='',lastTyped=0,typedFor=null;
  const enabled=select=>[...select.options].map((option,index)=>({option,index})).filter(({option})=>!option.disabled&&!option.hidden&&!option.parentElement.disabled).map(({index})=>index);
  function close(){
    if(!active)return;const {instance,panel}=active;active=null;
    instance.button.setAttribute('aria-expanded','false');instance.button.removeAttribute('aria-activedescendant');
    try{panel.hidePopover?.();}catch{}panel.remove();
  }
  function move(index){
    if(!active)return;const choices=enabled(active.instance.select);if(!choices.includes(index))index=choices[0];
    active.index=index??-1;
    for(const option of active.panel.querySelectorAll('[role=option]')){
      const focused=Number(option.dataset.optionIndex)===active.index;
      option.toggleAttribute('data-active',focused);option.setAttribute('aria-selected',String(focused));
    }
    const option=active.panel.querySelector(`[data-option-index="${active.index}"]`);
    if(option){active.instance.button.setAttribute('aria-activedescendant',option.id);option.scrollIntoView({block:'nearest'});}
  }
  function focusAfterRender(instance,direction=0){
    queueMicrotask(()=>{
      const button=document.getElementById(instance.button.id);if(!button)return;
      if(!direction){button.focus();return;}
      const root=button.closest('dialog[open]')??document;
      const fields=[...root.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
      const index=fields.indexOf(button),target=fields[index+direction]??fields[direction>0?0:fields.length-1];target?.focus();
    });
  }
  function choose(instance,index,direction=0){
    if(!enabled(instance.select).includes(index))return;
    const changed=instance.select.selectedIndex!==index;close();instance.select.selectedIndex=index;instance.refresh();
    instance.button.removeAttribute('aria-invalid');instance.error.textContent='';
    if(changed){instance.select.dispatchEvent(new Event('input',{bubbles:true}));instance.select.dispatchEvent(new Event('change',{bubbles:true}));}
    focusAfterRender(instance,direction);
  }
  function open(instance,index=instance.select.selectedIndex){
    if(instance.select.disabled)return;close();
    const panel=document.createElement('div');panel.id=instance.listId;panel.className='select-popup';panel.setAttribute('role','listbox');panel.setAttribute('aria-label',instance.button.getAttribute('aria-label'));
    [...instance.select.options].forEach((option,i)=>{
      if(option.hidden)return;const row=document.createElement('div');row.id=`${instance.listId}-${i}`;row.className='select-option';row.dataset.optionIndex=i;row.setAttribute('role','option');
      const disabled=option.disabled||Boolean(option.parentElement.disabled);if(disabled)row.setAttribute('aria-disabled','true');
      const text=document.createElement('span');text.textContent=option.text;
      const tick=document.createElement('span');tick.className='select-tick';tick.setAttribute('aria-hidden','true');tick.textContent=i===instance.select.selectedIndex?'✓':'';
      row.append(text,tick);row.addEventListener('pointerdown',event=>event.preventDefault());row.addEventListener('click',()=>{if(!disabled)choose(instance,i);});panel.append(row);
    });
    active={instance,panel,index:-1};
    const host=instance.select.closest('dialog[open]')??document.body;
    if(typeof panel.showPopover==='function')panel.setAttribute('popover','manual');host.append(panel);
    try{panel.showPopover?.();}catch{panel.removeAttribute('popover');}
    const box=instance.button.getBoundingClientRect(),width=Math.min(Math.max(box.width,180),innerWidth-16);
    const below=innerHeight-box.bottom-8,above=box.top-8,up=below<150&&above>below;
    const height=Math.max(50,Math.min(280,up?above:below));
    panel.style.width=`${width}px`;panel.style.maxHeight=`${height}px`;panel.style.left=`${Math.max(8,Math.min(box.left,innerWidth-width-8))}px`;
    const actualHeight=Math.min(panel.scrollHeight,height);panel.style.top=`${up?Math.max(8,box.top-actualHeight-5):box.bottom+5}px`;
    instance.button.setAttribute('aria-controls',panel.id);instance.button.setAttribute('aria-expanded','true');move(index);
  }
  function keydown(event,instance){
    const isOpen=active?.instance===instance,choices=enabled(instance.select);
    if(event.key==='Escape'&&isOpen){event.preventDefault();event.stopPropagation();close();instance.button.focus();return;}
    if(event.key==='Tab'&&isOpen){event.preventDefault();const direction=event.shiftKey?-1:1;if(choices.includes(active.index))choose(instance,active.index,direction);else{close();focusAfterRender(instance,direction);}return;}
    if(!choices.length)return;
    if(['Enter',' '].includes(event.key)){event.preventDefault();if(isOpen)choose(instance,active.index);else open(instance);return;}
    if(['ArrowDown','ArrowUp','Home','End','PageDown','PageUp'].includes(event.key)){
      event.preventDefault();
      if(event.altKey&&event.key==='ArrowUp'&&isOpen){choose(instance,active.index);return;}
      if(!isOpen)open(instance);
      if(event.key==='Home')move(choices[0]);else if(event.key==='End')move(choices.at(-1));
      else if(isOpen){const step=event.key==='PageDown'?10:event.key==='PageUp'?-10:event.key==='ArrowDown'?1:-1;move(choices[Math.max(0,Math.min(choices.length-1,choices.indexOf(active.index)+step))]);}
      return;
    }
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();if(typedFor!==instance){typeBuffer='';lastTyped=0;typedFor=instance;}const now=Date.now();typeBuffer=now-lastTyped<700?typeBuffer+event.key:event.key;lastTyped=now;
      if(!isOpen)open(instance);
      const repeated=[...typeBuffer].every(char=>char===typeBuffer[0]),query=(repeated?typeBuffer[0]:typeBuffer).normalize('NFKC').toLowerCase();
      const start=repeated?choices.indexOf(active.index)+1:0,ordered=[...choices.slice(start),...choices.slice(0,start)];
      const match=ordered.find(i=>instance.select.options[i].text.normalize('NFKC').trim().toLowerCase().startsWith(query));if(match!==undefined)move(match);
    }
  }
  function enhance(select){
    if(instances.has(select)||select.multiple||select.size>1||select.hidden)return;
    if(!select.id)select.id=`select-native-${++sequence}`;
    const wrapper=document.createElement('span');wrapper.className='select-field';
    const button=document.createElement('button');button.type='button';button.id=`${select.id}-trigger`;button.className='select-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const value=document.createElement('span');value.className='select-value';
    const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('viewBox','0 0 16 16');arrow.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m3 6 5 5 5-5');arrow.append(path);button.append(value,arrow);
    const error=document.createElement('span');error.id=`${select.id}-validation`;error.className='select-validation';error.setAttribute('role','alert');
    const label=select.labels?.[0],labelText=label?[...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join(' ').trim():'';
    button.setAttribute('aria-label',select.getAttribute('aria-label')||labelText||select.name||select.options[select.selectedIndex]?.text||'');
    const instance={select,button,error,listId:`${select.id}-options`,refresh(){
      value.textContent=select.options[select.selectedIndex]?.text??'';button.title=value.textContent;button.disabled=select.disabled;
      button.setAttribute('aria-required',String(select.required));button.setAttribute('aria-describedby',[select.getAttribute('aria-describedby'),error.id].filter(Boolean).join(' '));
      if(select.validity.valid){button.removeAttribute('aria-invalid');error.textContent='';}
      if(active?.instance===instance)close();
    }};
    instances.set(select,instance);select.before(wrapper);wrapper.append(select,button,error);
    select.classList.add('select-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    button.addEventListener('click',()=>{if(active?.instance===instance)close();else open(instance);});button.addEventListener('keydown',event=>keydown(event,instance));
    select.addEventListener('change',()=>instance.refresh());
    select.addEventListener('invalid',event=>{event.preventDefault();button.setAttribute('aria-invalid','true');error.textContent=select.validity.valueMissing?(document.documentElement.lang.startsWith('zh')?'请选择一项。':'Choose an option.'):select.validationMessage;button.focus();});
    label?.addEventListener('click',event=>{if(!event.target.closest('button,input,select,textarea,a')){event.preventDefault();button.focus();}});
    instance.refresh();
  }
  const observer=new MutationObserver(changes=>{
    for(const change of changes){
      const select=change.target instanceof Element?change.target.closest('select'):change.target.parentElement?.closest('select');
      if(select&&instances.has(select))instances.get(select).refresh();
      if(change.type==='childList')for(const node of change.addedNodes)if(node instanceof Element){if(node.matches('select'))enhance(node);node.querySelectorAll('select').forEach(enhance);}
    }
    if(active&&!active.instance.select.isConnected)close();
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','required','selected','label']});
  document.querySelectorAll('select').forEach(enhance);
  document.addEventListener('pointerdown',event=>{if(active&&!active.panel.contains(event.target)&&!active.instance.button.contains(event.target))close();},true);
  document.addEventListener('focusin',event=>{if(active&&!active.panel.contains(event.target)&&event.target!==active.instance.button)close();});
  document.addEventListener('scroll',event=>{if(active&&!active.panel.contains(event.target))close();},true);
  document.addEventListener('close',()=>{if(active&&!active.instance.button.closest('dialog[open]')&&active.panel.closest('dialog'))close();},true);
  window.addEventListener('resize',close);
}
