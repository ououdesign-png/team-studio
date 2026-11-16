// Injected inside the original bundle closure. The renderer and editing handlers remain intact.
const studioInitial=structuredClone(Y);
const studioEmbedded=window.parent!==window;
if(studioEmbedded)document.body.classList.add('studio-embedded');
/* STUDIO_THEME */
let studioFingerprint='',studioRevision=0;
const studioSources=new Map();let studioSourceRevision=0;
function studioDraft(){const {history,busy,readonly,...state}=Y;return {version:1,state:structuredClone(state),productImages:structuredClone(tA),uploadStep:S1,customBlockOrder:rS}}
function studioSocialChoices(){
 const images=a0(Y.images,'social',Y.device);
 return Y.platforms.map(id=>({id,enabled:!!NA[id]?.available&&jg(images,id,Y.postMode).length>0})).sort((a,b)=>Number(b.enabled)-Number(a.enabled));
}
function studioExportModels(){return Y.business==='social'?studioSocialChoices().filter(choice=>choice.enabled).map(choice=>choice.id):Zc()}
function studioNotify(){
 const allImages=[...Y.images,...tA],activeIds=new Set(allImages.map(x=>x.id));for(const id of studioSources.keys())if(!activeIds.has(id))studioSources.delete(id);
 const images=allImages.map(({src,...x})=>{let previous=studioSources.get(x.id);if(!previous||previous.src!==src){previous={src,key:++studioSourceRevision};studioSources.set(x.id,previous)}return {...x,source:previous.key}});
 const signature=JSON.stringify({business:Y.business,category:Y.category,articleView:Y.articleView,articlePage:Y.articlePage,solutionView:Y.solutionView,postMode:Y.postMode,platforms:Y.platforms,device:Y.device,presentation:Y.presentation,frame:Y.frame,productSetup:Y.productSetup,images});
 if(signature!==studioFingerprint){studioRevision++;studioFingerprint=signature}
 const models=studioExportModels();
 const data={business:Y.business,view:Y.view,count:Y.images.length+tA.length,busy:Y.busy,readonly:Y.readonly,revision:studioRevision,canShare:Y.view==='preview'&&!Ue('#open-share').disabled,canExport:Y.view==='preview'&&(Na()?yd():!!models.length&&models.every(x=>NA[x]?.available))};
 if(studioEmbedded)parent.postMessage({type:'studio-engine-update',data},location.protocol==='file:'?'*':location.origin);
 const generic=Ue('#studio-export');if(generic){generic.hidden=Na();generic.disabled=Y.busy||!data.canExport}
}
const studioBusinessTitle=Ue('#business-screen .setup-title h2').textContent;
const studioBusinessDescription=Ue('#business-screen .setup-title p').textContent;
const studioChangeBusiness=document.createElement('button');studioChangeBusiness.type='button';studioChangeBusiness.dataset.view='business';studioChangeBusiness.textContent='更换样机';Ue('#business-screen .setup-title').append(studioChangeBusiness);
// Keep the scene switch beside the current scene title, where users look first.
for(const title of [Ue('#business-screen .setup-title'),Ue('#upload-screen .setup-title')]){
 const heading=title.querySelector('h2'),button=title.querySelector('[data-view="business"]'),row=document.createElement('div');
 row.className='studio-title-row';heading.parentElement.classList.add('studio-title-content');heading.before(row);row.append(heading,button);
}
const studioSwitchIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg>';
for(const button of [studioChangeBusiness,Ue('#upload-screen [data-view="business"]'),Ue('.legacy-preview-action[data-view="business"]')]){
 button.classList.add('studio-change-mockup');button.innerHTML=studioSwitchIcon+'<span>更换样机</span>';
}
document.querySelectorAll('[data-action="clear"],[data-undo]').forEach(button=>button.remove());
const studioWorkflow=Ue('#workspace-heading .workflow');
const studioOpenPlacements=new Set();
const studioMaterialSelections=new Map();
function studioMaterialSelection(list){
 let selected=studioMaterialSelections.get(list.id);
 if(!selected){selected=new Set();studioMaterialSelections.set(list.id,selected)}
 const rows=[...list.querySelectorAll('.studio-material-row')],ids=new Set(rows.map(row=>row.dataset.materialId));
 for(const id of selected)if(!ids.has(id))selected.delete(id);
 let toolbar=list.querySelector('.studio-material-actions');
 if(!rows.length){toolbar?.remove();return}
 if(!toolbar){
  toolbar=document.createElement('div');toolbar.className='studio-image-actions studio-material-actions';
  toolbar.innerHTML='<label><input type="checkbox" data-studio-material-all>全选当前列表</label><span class="studio-selection-count" role="status" aria-live="polite"></span><button type="button" data-studio-material-delete>删除所选</button>';
  list.prepend(toolbar);
 }
 for(const row of rows){
  let checkbox=row.querySelector('[data-studio-material-select]');
  if(!checkbox){
   const label=document.createElement('label');label.className='studio-image-select';checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.studioMaterialSelect=row.dataset.materialId;
   checkbox.setAttribute('aria-label','选择 '+row.querySelector('.material-heading b').textContent);label.append(checkbox);row.prepend(label);
  }
  checkbox.checked=selected.has(row.dataset.materialId);row.classList.toggle('studio-image-selected',checkbox.checked);
 }
 const count=selected.size,all=toolbar.querySelector('[data-studio-material-all]');
 toolbar.hidden=count<2;all.checked=count===rows.length;all.indeterminate=count>0&&count<rows.length;
 toolbar.querySelector('.studio-selection-count').textContent='已选 '+count+' / '+rows.length+' 张';
 const remove=toolbar.querySelector('[data-studio-material-delete]');remove.disabled=!count;remove.textContent='删除所选（'+count+'）';
}
for(const list of [Ue('#material-editor'),Ue('#image-list')]){
 let dragged=null,dropRow=null,dropAfter=false,dragBlocked=false;
 function clearDrag(){
  list.querySelectorAll('[data-studio-material-drop]').forEach(row=>row.removeAttribute('data-studio-material-drop'));
  list.querySelectorAll('.studio-material-dragging').forEach(row=>row.classList.remove('studio-material-dragging'));
  dragged=null;dropRow=null;
 }
 list.addEventListener('pointerdown',event=>{dragBlocked=!!event.target.closest('button,input,select,summary,.placement-fields')});
 list.addEventListener('dragstart',event=>{
  const row=event.target.closest('.studio-material-row');
  if(!row)return;
  if(Y.busy||Y.readonly||dragBlocked||!row.draggable){event.preventDefault();return}
  dragged=Y.images.find(image=>image.id===row.dataset.materialId);row.classList.add('studio-material-dragging');
  event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragged.id);
 });
 list.addEventListener('dragover',event=>{
  if(!dragged||Y.busy||Y.readonly)return;
  dropRow?.removeAttribute('data-studio-material-drop');dropRow=null;
  const row=event.target.closest('.studio-material-row'),image=Y.images.find(image=>image.id===row?.dataset.materialId);
  if(!image||image.id===dragged.id||image.business!==dragged.business||image.role!==dragged.role||image.device!==dragged.device)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';dropRow=row;
  const rect=row.getBoundingClientRect();dropAfter=event.clientY>rect.top+rect.height/2;row.dataset.studioMaterialDrop=dropAfter?'after':'before';
 });
 list.addEventListener('dragleave',event=>{if(!list.contains(event.relatedTarget)){dropRow?.removeAttribute('data-studio-material-drop');dropRow=null}});
 list.addEventListener('drop',event=>{
  if(!dragged)return;
  event.preventDefault();if(dropRow&&!Y.busy&&!Y.readonly)lS(dragged.id,dropRow.dataset.materialId,dropAfter);clearDrag();
 });
 list.addEventListener('dragend',clearDrag);
 list.addEventListener('keydown',event=>{
  if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key)||event.target.closest('input,select,button,summary')||Y.busy||Y.readonly)return;
  const row=event.target.closest('.studio-material-row'),image=Y.images.find(image=>image.id===row?.dataset.materialId);if(!image||image.role==='support')return;
  const group=Y.images.filter(item=>item.business===image.business&&item.role===image.role&&item.device===image.device),index=group.indexOf(image),after=event.key==='ArrowDown',target=group[index+(after?1:-1)];
  event.preventDefault();if(target){lS(image.id,target.id,after);[...list.querySelectorAll('.studio-material-row')].find(row=>row.dataset.materialId===image.id)?.focus()}
 });
 list.addEventListener('change',event=>{
  const input=event.target;if(Y.busy||Y.readonly)return;
  const selected=studioMaterialSelections.get(list.id);
  if(input.hasAttribute('data-studio-material-all')){
   selected.clear();if(input.checked)for(const row of list.querySelectorAll('.studio-material-row'))selected.add(row.dataset.materialId);
  }else if(input.hasAttribute('data-studio-material-select')){
   if(input.checked)selected.add(input.dataset.studioMaterialSelect);else selected.delete(input.dataset.studioMaterialSelect);
  }else return;
  studioMaterialSelection(list);
 });
 list.addEventListener('click',event=>{
  if(!event.target.closest('[data-studio-material-delete]')||Y.busy||Y.readonly)return;
  const selected=studioMaterialSelections.get(list.id),ids=new Set([...list.querySelectorAll('.studio-material-row')].map(row=>row.dataset.materialId));
  const count=Y.images.filter(image=>ids.has(image.id)&&selected.has(image.id)).length;if(!count)return;
  o2();Y.images=Y.images.filter(image=>!ids.has(image.id)||!selected.has(image.id));selected.clear();kn();ni('已删除 '+count+' 张图片，可撤销。');
 });
}
function studioMaterialLayout(){
 for(const row of document.querySelectorAll('.material-row:not(.studio-material-row)')){
  row.classList.add('studio-material-row');
  row.draggable=Y.images.find(image=>image.id===row.dataset.materialId)?.role!=='support';row.tabIndex=0;
  if(row.draggable)row.title='拖动卡片调整同类图片顺序；Alt + ↑ / ↓ 也可排序';
  row.querySelector('img').draggable=false;
  const fields=row.querySelector('.material-fields'),placement=row.querySelector('.placement-fields'),reason=row.querySelector('.placement-reason'),buttons=row.querySelector('.material-buttons');
  const details=document.createElement('details'),summary=document.createElement('summary'),description=document.createElement('span'),edit=document.createElement('span');
  const key=row.parentElement.id+':'+row.dataset.materialId;
  details.className='studio-placement';details.open=studioOpenPlacements.has(key);
  description.className='studio-placement-summary';
  description.textContent=[...placement.querySelectorAll('select')].map(select=>select.selectedOptions[0]?.textContent).concat('位置 '+placement.querySelector('input').value).join(' · ');
  edit.className='studio-placement-edit';edit.innerHTML='调整位置<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  summary.append(description,edit);details.append(summary,placement,reason);fields.append(details);row.append(buttons);
  details.addEventListener('toggle',()=>{if(details.isConnected){if(details.open)studioOpenPlacements.add(key);else studioOpenPlacements.delete(key)}});
  for(const button of buttons.querySelectorAll('button')){
   const label=button.textContent.trim();let path;
   if(button.hasAttribute('data-step')){button.remove();continue}
   if(button.hasAttribute('data-replace')){button.textContent='替换图片';button.title='替换图片，保留位置设置';button.setAttribute('aria-label','替换图片 '+row.querySelector('.material-heading b').textContent);continue}
   path='m6 6 12 12M18 6 6 18';button.classList.add('studio-image-remove');row.append(button);
   button.title=label;button.setAttribute('aria-label',label+' '+row.querySelector('.material-heading b').textContent);
   button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
  }
 }
 for(const list of [Ue('#material-editor'),Ue('#image-list')])studioMaterialSelection(list);
}
const studioMaterialRender=hee;hee=function(){studioMaterialRender();studioMaterialLayout()};
const studioPreviewToolbar=Ue('#preview-toolbar');
studioPreviewToolbar.append(studioPreviewToolbar.querySelector('.preview-options'),studioPreviewToolbar.querySelector('.toolbar-end'),Ue('#hide-toolbar'));
studioPreviewToolbar.append(Ue('#model-tabs'));
Ue('#preview-screen').append(Ue('#viewport-label'));
for(const [id,label,path] of [['hide-toolbar','收起工具栏','m7 14 5-5 5 5'],['show-toolbar','展开工具栏','m7 10 5 5 5-5']]){
 const button=Ue('#'+id);button.classList.add('studio-toolbar-toggle');button.title=label;button.setAttribute('aria-label',label);
 button.setAttribute('aria-controls','preview-toolbar');button.setAttribute('aria-expanded',String(id==='hide-toolbar'));
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
}
const studioSelectedImages=new Set();
let studioSelectionBlock='';
function studioProductSelection(screen){
 const grid=screen.querySelector('.product-upload-grid'),block=Y.productSetup.blocks[S1];
 if(studioSelectionBlock!==block){studioSelectedImages.clear();studioSelectionBlock=block}
 const buttons=[...screen.querySelectorAll('[data-product-remove]')],ids=new Set(buttons.map(button=>button.dataset.productRemove));
 for(const id of studioSelectedImages)if(!ids.has(id))studioSelectedImages.delete(id);
 if(!grid)return;
 let toolbar=screen.querySelector('.studio-image-actions');
 if(!toolbar){
  toolbar=document.createElement('div');toolbar.className='studio-image-actions';
  toolbar.innerHTML='<label><input type="checkbox" data-studio-select-all>全选当前板块</label><span class="studio-selection-count" role="status" aria-live="polite"></span><button type="button" data-studio-delete-selected>删除所选</button>';
  grid.before(toolbar);
 }
 for(const button of buttons){
  const card=button.closest('.product-upload-image'),id=button.dataset.productRemove;
  button.classList.add('studio-image-remove');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';button.title=button.getAttribute('aria-label');
  let checkbox=card.querySelector('[data-studio-select-image]');
  if(!checkbox){
   const label=document.createElement('label');label.className='studio-image-select';
   checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.studioSelectImage=id;
   checkbox.setAttribute('aria-label','选择 '+card.querySelector('strong').textContent);
   label.append(checkbox);card.prepend(label);
  }
  checkbox.checked=studioSelectedImages.has(id);card.classList.toggle('studio-image-selected',checkbox.checked);
 }
 const count=studioSelectedImages.size,all=toolbar.querySelector('[data-studio-select-all]');
 toolbar.hidden=count<2;
 all.checked=count===ids.size;all.indeterminate=count>0&&count<ids.size;
 toolbar.querySelector('.studio-selection-count').textContent='已选 '+count+' / '+ids.size+' 张';
 const remove=toolbar.querySelector('[data-studio-delete-selected]');remove.disabled=!count;remove.textContent=count?'删除所选（'+count+'）':'删除所选';
}
Ue('#product-upload-screen').addEventListener('change',event=>{
 const input=event.target;if(Y.busy||Y.readonly)return;
 if(input.hasAttribute('data-studio-select-all')){
  studioSelectedImages.clear();
  if(input.checked)for(const button of Ue('#product-upload-screen').querySelectorAll('[data-product-remove]'))studioSelectedImages.add(button.dataset.productRemove);
 }else if(input.hasAttribute('data-studio-select-image')){
  if(input.checked)studioSelectedImages.add(input.dataset.studioSelectImage);else studioSelectedImages.delete(input.dataset.studioSelectImage);
 }else return;
 studioProductSelection(Ue('#product-upload-screen'));
});
Ue('#product-upload-screen').addEventListener('click',event=>{
 if(!event.target.closest('[data-studio-delete-selected]')||Y.busy||Y.readonly)return;
 const block=Y.productSetup.blocks[S1],count=tA.filter(image=>image.role===block&&studioSelectedImages.has(image.id)).length;
 if(!count)return;
 tA=tA.filter(image=>image.role!==block||!studioSelectedImages.has(image.id));studioSelectedImages.clear();
 kn();ni('已删除当前板块的 '+count+' 张图片。');
});
function studioParkWorkflow(){Ue('#workspace-heading').append(studioWorkflow)}
function studioPlaceWorkflow(){
 const title=document.querySelector('.setup-screen:not([hidden]) .setup-title');
 if(!title||['home','preview'].includes(Y.view)){studioParkWorkflow();return}
 const heading=title.querySelector('h2');if(!heading)return;
 let row=heading.closest('.studio-title-row');
 if(!row){row=document.createElement('div');row.className='studio-title-row';heading.parentElement.classList.add('studio-title-content');heading.before(row);row.append(heading)}
 row.parentElement.classList.add('studio-title-content');
 const screen=title.closest('.setup-screen');
 // Configuration changes share the title row; sequential Previous/Next stays in the footer.
 for(const button of screen.querySelectorAll('.setup-title button[data-view],.setup-actions>button[data-view="business"]')){
  button.classList.add('studio-change-mockup');
  if(button.dataset.view==='product-blocks'&&!button.querySelector('svg'))button.innerHTML=studioSwitchIcon+'<span>调整所选板块</span>';
  row.append(button);
 }
 row.append(studioWorkflow);
 if(screen.id==='product-upload-screen'){
  const generate=screen.querySelector('.setup-actions .action-group>button.primary');
  generate.id='product-generate';generate.removeAttribute('data-product-upload-step');
  generate.textContent='生成整页';generate.disabled=!yd();
  studioProductSelection(screen);
  screen.querySelectorAll('.product-upload-progress button').forEach((button,index)=>{
   if(button.querySelector('.studio-block-name'))return;
   const status=button.querySelector('small'),name=document.createElement('span'),number=document.createElement('span');
   name.className='studio-block-name';name.textContent=[...button.childNodes].filter(node=>node.nodeType===3).map(node=>node.textContent).join('').trim();
   number.className='studio-block-index';number.textContent=String(index+1);number.setAttribute('aria-hidden','true');
   button.replaceChildren(number,name);if(status)button.append(status);
  });
  const summary=screen.querySelector(':scope>.caption'),slots=hs(Y.productSetup,tA,Y.productSetup.blocks[S1]);
  if(summary){
   const count=slots.length,total=Y.productSetup.blocks.length,complete=Y.productSetup.blocks.filter(role=>hs(Y.productSetup,tA,role).length).length;
   summary.classList.add('studio-upload-summary');
   summary.innerHTML='<span class="studio-upload-count"><strong>'+count+'</strong><span>张已添加</span></span><progress max="'+total+'" value="'+complete+'" aria-label="已有图片的板块进度"></progress><span class="studio-upload-formats">PNG、JPG、WebP</span>';
  }
 }
}
function studioEntryLayout(){
 const direct=!!Y.studioDirect,product=direct&&Y.business==='product';
 studioChangeBusiness.hidden=!product;
 Ue('#workspace-heading h1').textContent=direct?Ys.find(s=>s.id===Y.business).name+' · 制作样机':'选择场景，放入设计，交付样机';
 Ue('#step-business').textContent=direct?'样机设置':'选择样机';
 Ue('#business-screen .business-grid').hidden=product;
 Ue('#business-screen .setup-title h2').textContent=product?'产品详情页':studioBusinessTitle;
 Ue('#business-screen .setup-title p').textContent=product?'选择产线，配置要展示的板块，再放入设计素材。':studioBusinessDescription;
 const destination=direct&&Y.business!=='product'&&Y.view==='upload'?Ue('#upload-screen'):Ue('#business-screen');
 const anchor=destination.id==='upload-screen'?Ue('#dropzone'):destination.querySelector('.setup-actions');
 for(const id of ['scene-options','source-summary'])destination.insertBefore(Ue('#'+id),anchor);
 studioPlaceWorkflow();
}
const studioRender=kn;kn=function(){studioParkWorkflow();studioRender();studioEntryLayout();studioNotify()};
const studioProductRender=Wc;Wc=function(){studioParkWorkflow();studioProductRender();studioPlaceWorkflow()};
// A manual request to change mockup type still opens the complete chooser.
document.addEventListener('click',event=>{if(event.target.closest('[data-view="business"]'))Y.studioDirect=false},true);
const studioPreview=a2;a2=function(){
 const choices=Y.business==='social'?studioSocialChoices():null;
 if(choices&&!choices.some(choice=>choice.enabled&&choice.id===Y.active))Y.active=choices.find(choice=>choice.enabled)?.id||'';
 studioPreview();
 if(choices){
  const tabs=Ue('#model-tabs'),buttons=[...tabs.querySelectorAll('[data-model]')],hasImages=choices.some(choice=>choice.enabled);
  if(!hasImages)Y.active='';
  for(const choice of choices){
   const button=buttons.find(button=>button.dataset.model===choice.id);if(!button)continue;
   button.disabled=!choice.enabled;button.setAttribute('aria-disabled',String(!choice.enabled));button.setAttribute('aria-pressed',String(choice.enabled&&choice.id===Y.active));
   button.title=choice.enabled?C1[choice.id]:'当前端口暂无匹配图片';tabs.append(button);
  }
  if(!hasImages){
   Ue('#preview-canvas').innerHTML='<p class="studio-social-empty">当前端口暂无匹配的平台图片，请添加图片或调整素材的适用端口。</p>';
   Ue('#preview-notice').textContent='暂无可预览的平台';Ue('#open-share').disabled=true;Ue('#social-export').hidden=true;
  }
 }
 studioNotify();
};
const studioSize=s2;s2=function(){studioSize();studioNotify()};
const studioStatus=pa;pa=function(busy){studioStatus(busy);studioNotify()};
async function studioExport(){
 if(Y.busy)throw Error('正在处理图片，请稍候。');
 if(Y.view!=='preview')throw Error('请先进入页面预览。');
 if(Na()){if(!yd())throw Error('请先补齐产品板块图片。');await vee();return}
 const models=studioExportModels();if(!models.length||models.some(x=>!NA[x]?.available))throw Error(Y.business==='social'?'当前端口暂无可导出的匹配图片，请添加图片或调整适用端口。':'当前模板仍有待补来源，请切换到可用模板后导出。');
 const state=structuredClone(Y),width=Ue('#preview-canvas').offsetWidth;
 pa(true);try{await ed(models.map(id=>({model:{id,name:C1[id]+'-'+mA[state.device].name},id})),width,ni,entry=>md(entry.id,state,{editable:false}));ni('已导出完整页面 JPG 和 PDF。')}catch(error){ni(error.message,true);throw error}finally{pa(false)}
}
const studioExportButton=document.createElement('button');studioExportButton.id='studio-export';studioExportButton.textContent='导出 JPG / PDF';studioExportButton.onclick=()=>studioExport().catch(()=>{});Ue('.toolbar-end').insertBefore(studioExportButton,Ue('#open-share'));
function studioRestore(draft){
 if(draft?.version!==1||!draft.state||!Ys.some(s=>s.id===draft.state.business)||!Array.isArray(draft.state.images)||!Array.isArray(draft.productImages))throw Error('草稿格式无效，无法读取。');
 Object.assign(Y,structuredClone(studioInitial),{studioDirect:false},structuredClone(draft.state),{readonly:false,busy:false,history:[]});tA=structuredClone(draft.productImages);S1=draft.uploadStep||0;rS=!!draft.customBlockOrder;
 if(!Y.productSetup)Y.productSetup=structuredClone(studioInitial.productSetup);
 Pa(Y.view==='home'?'business':Y.view,true);studioNotify();return true;
}
function studioCreate(business){
 if(!Ys.some(s=>s.id===business))throw Error('业务场景无效。');
 Object.assign(Y,structuredClone(studioInitial),{business,view:business==='product'?'business':'upload',workspace:business==='product'?'business':'upload',studioDirect:true});tA=[];S1=0;rS=false;Pa(Y.view,true);studioNotify();return true;
}
function studioImportPrototype(task){
 studioCreate(task.scene);Y.productDemo=task.scene==='product';
 Y.images=task.items.map((x,i)=>({id:'migrated-'+i,name:x.name,src:x.data,width:x.width,height:x.height,business:task.scene,role:P6(x,task.scene).role,device:'all',position:i+1}));
 Pa('upload',true);return true;
}
const studioCommands={
 ready:()=>{studioNotify();return true},create:studioCreate,draft:studioDraft,restore:studioRestore,importPrototype:studioImportPrototype,
 preview:()=>{Pa('preview');return Y.view},share:()=>{if(Ue('#open-share').disabled||Y.view!=='preview')throw Error('请先完善样机并进入预览，再生成分享版本。');return bee()},
 export:studioExport,help:()=>Ue('#help-dialog').showModal(),resize:()=>s2()
};
window.addEventListener('message',async event=>{
 if(!studioEmbedded||event.source!==parent||event.origin!==(location.protocol==='file:'?'null':location.origin)||event.data?.type!=='studio-engine-command')return;
 const {id,command,args=[]}=event.data;let result,error;
 try{if(!Object.hasOwn(studioCommands,command))throw Error('不支持的操作。');result=await studioCommands[command](...args)}catch(e){error=e.message}
 parent.postMessage({type:'studio-engine-result',id,result,error},location.protocol==='file:'?'*':location.origin);
});
// Keep the outer platform as the only home navigation when embedded.
if(studioEmbedded)document.addEventListener('click',event=>{if(event.target.closest('[data-route="home"]')){event.stopImmediatePropagation();event.preventDefault();parent.postMessage({type:'studio-engine-home'},location.protocol==='file:'?'*':location.origin)}},true);
document.addEventListener('change',()=>setTimeout(studioNotify,0));document.addEventListener('click',()=>setTimeout(studioNotify,0));
const studioShareCaption=Ue('#share-dialog .caption');studioShareCaption.textContent='每次保存生成独立只读版本，不覆盖旧链接。访问权限与当前平台一致；请仅向有平台访问权限的同事分享。';
if(studioEmbedded){Ue('#workspace-heading .section-label').textContent='MOCKUP WORKSPACE';Ue('#workspace-heading h1').textContent='选择场景，放入设计，交付样机';}
