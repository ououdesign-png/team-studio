// Injected inside the original bundle closure. The renderer and editing handlers remain intact.
const studioInitial=structuredClone(re);
const studioEmbedded=window.parent!==window;
if(studioEmbedded)document.body.classList.add('studio-embedded');
/* STUDIO_THEME */
let studioFingerprint='',studioRevision=0;
const studioSources=new Map();let studioSourceRevision=0;
function studioDraft(){const {history,busy,readonly,...state}=re;return {version:1,state:structuredClone(state),productImages:structuredClone(ka),uploadStep:a2,customBlockOrder:cS}}
function studioNotify(){
 const allImages=[...re.images,...ka],activeIds=new Set(allImages.map(x=>x.id));for(const id of studioSources.keys())if(!activeIds.has(id))studioSources.delete(id);
 const images=allImages.map(({src,...x})=>{let previous=studioSources.get(x.id);if(!previous||previous.src!==src){previous={src,key:++studioSourceRevision};studioSources.set(x.id,previous)}return {...x,source:previous.key}});
 const signature=JSON.stringify({business:re.business,category:re.category,articleView:re.articleView,solutionView:re.solutionView,postMode:re.postMode,platforms:re.platforms,device:re.device,presentation:re.presentation,frame:re.frame,productSetup:re.productSetup,images});
 if(signature!==studioFingerprint){studioRevision++;studioFingerprint=signature}
 const data={business:re.business,view:re.view,count:re.images.length+ka.length,busy:re.busy,readonly:re.readonly,revision:studioRevision,canShare:re.view==='preview'&&!je('#open-share').disabled,canExport:re.view==='preview'&&(Pa()?rd():!!U6().length&&U6().every(x=>ca[x]?.available))};
 if(studioEmbedded)parent.postMessage({type:'studio-engine-update',data},location.protocol==='file:'?'*':location.origin);
 const generic=je('#studio-export');if(generic){generic.hidden=Pa();generic.disabled=re.busy||!data.canExport}
}
const studioRender=$A;$A=function(){studioRender();studioNotify()};
const studioPreview=t3;t3=function(){studioPreview();studioNotify()};
const studioSize=s2;s2=function(){studioSize();studioNotify()};
const studioStatus=po;po=function(busy){studioStatus(busy);studioNotify()};
async function studioExport(){
 if(re.busy)throw Error('正在处理图片，请稍候。');
 if(re.view!=='preview')throw Error('请先进入页面预览。');
 if(Pa()){if(!rd())throw Error('请先补齐产品板块图片。');await WY();return}
 const models=U6();if(!models.length||models.some(x=>!ca[x]?.available))throw Error('当前模板仍有待补来源，请切换到可用模板后导出。');
 const state=structuredClone(re),width=je('#preview-canvas').offsetWidth;
 po(true);try{await qF(models.map(id=>({model:{id,name:i2[id]+'-'+Ea[state.device].name},id})),width,Fi,entry=>tS(entry.id,state,{editable:false}));Fi('已导出完整页面 JPG 和 PDF。')}catch(error){Fi(error.message,true);throw error}finally{po(false)}
}
const studioExportButton=document.createElement('button');studioExportButton.id='studio-export';studioExportButton.textContent='导出 JPG / PDF';studioExportButton.onclick=()=>studioExport().catch(()=>{});je('.toolbar-end').insertBefore(studioExportButton,je('#open-share'));
function studioRestore(draft){
 if(draft?.version!==1||!draft.state||!Ys.some(s=>s.id===draft.state.business)||!Array.isArray(draft.state.images)||!Array.isArray(draft.productImages))throw Error('草稿格式无效，无法读取。');
 Object.assign(re,structuredClone(studioInitial),structuredClone(draft.state),{readonly:false,busy:false,history:[]});ka=structuredClone(draft.productImages);a2=draft.uploadStep||0;cS=!!draft.customBlockOrder;
 if(!re.productSetup)re.productSetup=structuredClone(studioInitial.productSetup);
 Ha(re.view==='home'?'business':re.view,true);studioNotify();return true;
}
function studioCreate(business){
 if(!Ys.some(s=>s.id===business))throw Error('业务场景无效。');
 Object.assign(re,structuredClone(studioInitial),{business,view:'business',workspace:'business'});ka=[];a2=0;cS=false;Ha('business',true);studioNotify();return true;
}
function studioImportPrototype(task){
 studioCreate(task.scene);re.productDemo=task.scene==='product';
 re.images=task.items.map((x,i)=>({id:'migrated-'+i,name:x.name,src:x.data,width:x.width,height:x.height,business:task.scene,role:Fc(x,task.scene).role,device:'all',position:i+1}));
 Ha('upload',true);return true;
}
const studioCommands={
 ready:()=>{studioNotify();return true},create:studioCreate,draft:studioDraft,restore:studioRestore,importPrototype:studioImportPrototype,
 preview:()=>{Ha('preview');return re.view},share:()=>{if(je('#open-share').disabled||re.view!=='preview')throw Error('请先完善样机并进入预览，再生成分享版本。');return YY()},
 export:studioExport,help:()=>je('#help-dialog').showModal(),resize:()=>s2()
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
const studioShareCaption=je('#share-dialog .caption');studioShareCaption.textContent='每次保存生成独立只读版本，不覆盖旧链接。访问权限与当前平台一致；请仅向有平台访问权限的同事分享。';
if(studioEmbedded){je('#workspace-heading .section-label').textContent='MOCKUP WORKSPACE';je('#workspace-heading h1').textContent='选择场景，放入设计，交付样机';}
