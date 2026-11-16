// Injected inside the original bundle closure. The renderer and editing handlers remain intact.
const studioInitial=structuredClone(Y);
const studioEmbedded=window.parent!==window;
if(studioEmbedded)document.body.classList.add('studio-embedded');
/* STUDIO_THEME */
let studioFingerprint='',studioRevision=0;
const studioSources=new Map();let studioSourceRevision=0;
function studioDraft(){const {history,busy,readonly,...state}=Y;return {version:1,state:structuredClone(state),productImages:structuredClone(tA),uploadStep:S1,customBlockOrder:rS}}
function studioNotify(){
 const allImages=[...Y.images,...tA],activeIds=new Set(allImages.map(x=>x.id));for(const id of studioSources.keys())if(!activeIds.has(id))studioSources.delete(id);
 const images=allImages.map(({src,...x})=>{let previous=studioSources.get(x.id);if(!previous||previous.src!==src){previous={src,key:++studioSourceRevision};studioSources.set(x.id,previous)}return {...x,source:previous.key}});
 const signature=JSON.stringify({business:Y.business,category:Y.category,articleView:Y.articleView,articlePage:Y.articlePage,solutionView:Y.solutionView,postMode:Y.postMode,platforms:Y.platforms,device:Y.device,presentation:Y.presentation,frame:Y.frame,productSetup:Y.productSetup,images});
 if(signature!==studioFingerprint){studioRevision++;studioFingerprint=signature}
 const data={business:Y.business,view:Y.view,count:Y.images.length+tA.length,busy:Y.busy,readonly:Y.readonly,revision:studioRevision,canShare:Y.view==='preview'&&!Ue('#open-share').disabled,canExport:Y.view==='preview'&&(Na()?yd():!!Zc().length&&Zc().every(x=>NA[x]?.available))};
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
const studioWorkflow=Ue('#workspace-heading .workflow');
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
const studioPreview=a2;a2=function(){studioPreview();studioNotify()};
const studioSize=s2;s2=function(){studioSize();studioNotify()};
const studioStatus=pa;pa=function(busy){studioStatus(busy);studioNotify()};
async function studioExport(){
 if(Y.busy)throw Error('正在处理图片，请稍候。');
 if(Y.view!=='preview')throw Error('请先进入页面预览。');
 if(Na()){if(!yd())throw Error('请先补齐产品板块图片。');await vee();return}
 const models=Zc();if(!models.length||models.some(x=>!NA[x]?.available))throw Error('当前模板仍有待补来源，请切换到可用模板后导出。');
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
