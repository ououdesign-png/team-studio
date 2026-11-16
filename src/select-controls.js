// Keep the original selects as the data/event contract; render their entire UI in the FS theme.
(()=>{
 const controls=new WeakMap();let sequence=0,opened=null;
 const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
 const check='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
 function labelFor(select){
  if(select.getAttribute('aria-label'))return select.getAttribute('aria-label');
  const label=select.labels?.[0];if(!label)return select.name||'请选择';
  const clone=label.cloneNode(true);clone.querySelectorAll('select,button,svg,.fs-select').forEach(el=>el.remove());return clone.textContent.trim()||'请选择';
 }
 function restoreTarget(select){
  if(select.id)return ()=>document.getElementById(select.id);
  const scope=select.closest('[id]'),attrs=[...select.attributes].filter(x=>x.name.startsWith('data-')).map(x=>[x.name,x.value]);
  return ()=>scope?.isConnected?[...scope.querySelectorAll('select')].find(el=>attrs.length&&attrs.every(([name,value])=>el.getAttribute(name)===value)):null;
 }
 function close(focus=false){
  if(!opened)return;const control=opened;opened=null;control.menu?.remove();control.menu=null;
  control.button.setAttribute('aria-expanded','false');control.button.removeAttribute('aria-activedescendant');
  if(focus&&control.button.isConnected)control.button.focus();
 }
 function available(control,index){const option=control.select.options[index];return option&&!option.disabled&&!option.closest('optgroup[disabled]')}
 function activate(control,index){
  control.active=index;control.button.setAttribute('aria-activedescendant',control.key+'-option-'+index);
  control.menu.querySelectorAll('[data-index]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.index)===index));
  control.menu.querySelector('[data-index="'+index+'"]')?.scrollIntoView({block:'nearest'});
 }
 function move(control,direction){
  const count=control.select.options.length;for(let step=1;step<=count;step++){const index=(control.active+direction*step+count)%count;if(available(control,index)){activate(control,index);return}}
 }
 function commit(control,index){
  if(!available(control,index))return;const select=control.select,findReplacement=restoreTarget(select),changed=select.selectedIndex!==index;
  select.selectedIndex=index;close();control.sync();
  if(changed){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}))}
  // Original editor renders some fields again synchronously after a selection.
  queueMicrotask(()=>{const replacement=select.isConnected?select:findReplacement();if(replacement){enhance(replacement);controls.get(replacement)?.button.focus()}});
 }
 function open(control,direction=1){
  if(control.button.disabled)return;close();opened=control;
  const menu=document.createElement('div');menu.className='fs-select-menu';menu.id=control.key+'-list';menu.setAttribute('role','listbox');menu.setAttribute('aria-label',control.label);
  let group=null;
  [...control.select.options].forEach((option,index)=>{
   const parent=option.parentElement;
   if(parent.tagName==='OPTGROUP'&&parent!==group){group=parent;const heading=document.createElement('div');heading.className='fs-select-group';heading.textContent=parent.label;menu.append(heading)}
   const item=document.createElement('div');item.className='fs-select-option';item.id=control.key+'-option-'+index;item.dataset.index=index;item.setAttribute('role','option');
   item.setAttribute('aria-selected',String(index===control.select.selectedIndex));item.setAttribute('aria-disabled',String(!available(control,index)));item.title=option.text;
   const text=document.createElement('span');text.className='fs-select-option-text';text.textContent=option.text;item.append(text);
   if(index===control.select.selectedIndex){const mark=document.createElement('span');mark.className='fs-select-check';mark.innerHTML=check;item.append(mark)}
   item.addEventListener('pointermove',()=>{if(available(control,index))activate(control,index)});
   item.addEventListener('pointerdown',event=>event.preventDefault());item.addEventListener('click',()=>commit(control,index));menu.append(item);
  });
  (control.select.closest('dialog[open]')||document.body).append(menu);control.menu=menu;
  const rect=control.button.getBoundingClientRect(),edge=8,gap=6,viewport=document.documentElement.clientWidth;
  const below=window.innerHeight-rect.bottom-edge-gap,above=rect.top-edge-gap,up=below<160&&above>below;
  menu.style.width=Math.min(rect.width,viewport-2*edge)+'px';menu.style.maxHeight=Math.max(36,Math.min(288,up?above:below))+'px';
  menu.style.left=Math.max(edge,Math.min(rect.left,viewport-rect.width-edge))+'px';
  if(up)menu.style.bottom=window.innerHeight-rect.top+gap+'px';else menu.style.top=rect.bottom+gap+'px';
  control.button.setAttribute('aria-expanded','true');
  control.active=control.select.selectedIndex;
  if(!available(control,control.active)){control.active=direction>0?-1:0;move(control,direction)}else activate(control,control.active);
 }
 function enhance(select){
  if(select.tagName!=='SELECT'||select.multiple||controls.has(select)||select.closest('.template'))return;
  const label=labelFor(select),wrapper=document.createElement('span'),button=document.createElement('button'),text=document.createElement('span');
  wrapper.className='fs-select';button.className='fs-select-trigger';button.type='button';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  const key='fs-select-'+(++sequence);button.id=key+'-trigger';button.setAttribute('aria-controls',key+'-list');
  text.className='fs-select-value';const chevron=document.createElement('span');chevron.className='fs-select-arrow';chevron.innerHTML=arrow;button.append(text,chevron);
  const control={select,wrapper,button,label,key,active:0,menu:null,sync(){
   const value=select.selectedOptions[0]?.text||'请选择';if(text.textContent!==value)text.textContent=value;
   button.title=value;button.setAttribute('aria-label',label+'：'+value);button.disabled=select.matches(':disabled')||!select.options.length;
   if(button.disabled&&opened===control)close();
  }};
  controls.set(select,control);select.before(wrapper);wrapper.append(select,button);select.classList.add('fs-native-select');select.setAttribute('aria-hidden','true');select.tabIndex=-1;
  control.sync();
  button.addEventListener('click',()=>opened===control?close():open(control));
  let typed='',lastTyped=0;
  button.addEventListener('keydown',event=>{
   if(event.altKey||event.ctrlKey||event.metaKey||event.isComposing)return;
   const key=event.key;
   if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape','Tab'].includes(key)){
    if(key==='Tab'){close();return}
    if(key==='Escape'){if(opened===control){event.preventDefault();event.stopPropagation();close(true)}return}
    event.preventDefault();event.stopPropagation();
    if(key==='Enter'||key===' '){if(opened===control)commit(control,control.active);else open(control);return}
    const wasOpen=opened===control;if(!wasOpen)open(control,key==='ArrowUp'?-1:1);
    if(key==='Home'||key==='End'){control.active=key==='Home'?-1:0;move(control,key==='Home'?1:-1)}
    else if(wasOpen)move(control,key==='ArrowDown'?1:-1);
   }else if(key.length===1){
    const now=Date.now();typed=(now-lastTyped<600?typed:'')+key.toLocaleLowerCase();lastTyped=now;
    if(opened!==control)open(control);const index=[...select.options].findIndex((option,i)=>available(control,i)&&option.text.trim().toLocaleLowerCase().startsWith(typed));if(index>=0)activate(control,index);
   }
  });
 }
 function scan(root){if(root.nodeType!==1&&root.nodeType!==9)return;if(root.tagName==='SELECT')enhance(root);root.querySelectorAll('select:not([multiple])').forEach(enhance)}
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.wrapper.contains(event.target)&&!opened.menu?.contains(event.target))close()},true);
 document.addEventListener('change',event=>{if(event.target.tagName==='SELECT')controls.get(event.target)?.sync()},true);
 window.addEventListener('resize',()=>close());window.addEventListener('blur',()=>close());
 window.addEventListener('scroll',event=>{if(opened&&!opened.menu?.contains(event.target))close()},true);
 new MutationObserver(changes=>{
  if(opened&&!opened.select.isConnected)close();
  for(const change of changes){
   if(change.type==='childList')change.addedNodes.forEach(scan);
   const select=change.target.tagName==='SELECT'?change.target:change.target.closest?.('select');
   if(select){if(!controls.has(select))enhance(select);else controls.get(select).sync()}
   if(change.target.tagName==='FIELDSET')change.target.querySelectorAll('select').forEach(el=>controls.get(el)?.sync());
  }
 }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label','aria-label']});
 scan(document);
})();
