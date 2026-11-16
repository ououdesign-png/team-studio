import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),{run,call}=c;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(expr){for(let i=0;i<150;i++){if(await run(expr))return;await pause(100)}throw Error('Timed out: '+expr)}
let offlineSession;
const F=async expr=>{
 const tree=await call('Page.getFrameTree'),child=tree.frameTree.childFrames?.[0];
 if(child)return run(expr,c.contexts.get(child.frame.id));
 if(!offlineSession){
  const {targetInfos}=await call('Target.getTargets'),target=targetInfos.find(target=>target.type==='iframe'&&target.parentId===tree.frameTree.frame.id);
  ({sessionId:offlineSession}=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true}));
  await call('Runtime.enable',{},offlineSession);
 }
 return run(expr,undefined,offlineSession);
};
const click=selector=>F(`document.querySelector(${JSON.stringify(selector)}).click()`);
const draft=()=>run('engineCall("draft")');
async function restore(value){await run(`engineCall('restore',${JSON.stringify(value)})`)}
async function hover(selector){const rect=await F(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);const offset=await run(`(()=>{const r=frame.getBoundingClientRect();return {x:r.x,y:r.y}})()`);await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:offset.x+rect.x,y:offset.y+rect.y});await pause(200)}
await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await call('Emulation.setTouchEmulationEnabled',{enabled:false});await call('Page.navigate',{url:'http://127.0.0.1:8765/'});await wait('typeof startTask==="function"');await run('dirty=false;startTask("product")');await wait('engineReady&&!engineLoading');
const fixture=await draft();fixture.state.productSetup={line:'207189',blocks:['single','pair'],variants:{features:3}};fixture.state.view='upload';
const source=await F(`(()=>{const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=900;const ctx=canvas.getContext('2d');ctx.fillStyle='#edf1f4';ctx.fillRect(0,0,1800,900);ctx.fillStyle='#30363e';ctx.fillRect(500,250,800,300);ctx.fillStyle='#80b8e5';for(let i=0;i<8;i++)ctx.fillRect(560+i*85,345,50,60);return canvas.toDataURL()})()`);
fixture.productImages=[...Array.from({length:3},(_,i)=>({id:'card-'+i,name:'设计图片-'+(i+1)+'.png',business:'product',role:'single',position:i+1,device:'all',width:1800,height:900,src:source})),{id:'other-block',name:'其他板块.png',business:'product',role:'pair',position:1,device:'all',width:840,height:632,src:source}];
await restore(fixture);
assert.equal(await F('document.querySelector("#product-generate").textContent'),'生成整页');
assert.equal(await F('document.querySelector("#product-generate").disabled'),false);
assert.equal(await F('getComputedStyle(document.querySelector("#product-generate")).backgroundColor'),'rgb(192, 0, 0)');
await click('#product-generate');await wait('engineSummary.view==="preview"');
const incomplete=structuredClone(fixture);incomplete.productImages=incomplete.productImages.filter(image=>image.id!=='other-block');await restore(incomplete);
assert.equal(await F('document.querySelector("#product-generate").disabled'),true);
assert.equal(await F('getComputedStyle(document.querySelector("#product-generate")).backgroundColor'),'rgb(229, 229, 229)');
await click('#product-generate');assert.equal(await run('engineSummary.view'),'upload');
await click('[data-product-upload-step="1"]');assert.equal(await F('document.querySelector("#product-generate").disabled'),true);
await restore(fixture);await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
assert.equal(await F('document.querySelectorAll(".studio-image-remove").length'),3);assert.equal(await F('document.querySelector(".studio-image-actions").hidden'),true);
assert.equal(await F('getComputedStyle(document.querySelector(".studio-image-remove")).visibility'),'hidden');
await hover('.product-upload-image');assert.equal(await F('getComputedStyle(document.querySelector(".studio-image-remove")).visibility'),'visible');
await hover('.studio-image-remove');assert.equal(await F('getComputedStyle(document.querySelector(".product-upload-image")).animationName'),'studio-card-shake');
assert.equal(await F('getComputedStyle(document.querySelector(".product-upload-image:nth-child(2)")).animationName'),'none');
assert.ok(await F('document.querySelector(".studio-image-remove").getBoundingClientRect().width>=36'));
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await F('getComputedStyle(document.querySelector(".product-upload-image")).animationName'),'none');assert.ok(await F('(()=>{const button=document.querySelector(".studio-image-remove").getBoundingClientRect(),svg=document.querySelector(".studio-image-remove svg").getBoundingClientRect();return Math.abs(button.x+button.width/2-svg.x-svg.width/2)<.1&&Math.abs(button.y+button.height/2-svg.y-svg.height/2)<.1})()'));await call('Emulation.setEmulatedMedia',{features:[]});
await click('[data-studio-select-image="card-0"]');assert.equal(await F('document.querySelector("[data-studio-select-all]").indeterminate'),true);assert.equal(await F('document.querySelector(".studio-image-actions").hidden'),true);
await click('[data-product-upload-step="1"]');assert.equal(await F('document.querySelectorAll(".studio-image-selected").length'),0);assert.equal(await F('document.querySelector("[data-studio-select-all]").checked'),false);
await click('[data-product-upload-step="0"]');assert.equal(await F('document.querySelectorAll(".studio-image-selected").length'),0);
await click('[data-studio-select-image="card-0"]');assert.equal(await F('document.querySelector(".studio-image-actions").hidden'),true);await click('[data-studio-select-image="card-1"]');assert.equal(await F('document.querySelector(".studio-image-actions").hidden'),false);await click('[data-studio-select-all]');assert.equal(await F('document.querySelectorAll(".studio-image-selected").length'),3);assert.equal(await F('document.querySelector("[data-studio-delete-selected]").textContent'),'删除所选（3）');
await hover('.studio-image-remove');await call('Page.captureScreenshot',{format:'png'}).then(result=>fs.writeFile('/Users/fs/样机/team-studio/qa/card-delete-desktop.png',Buffer.from(result.data,'base64')));
await click('[data-studio-select-image="card-0"]');await click('[data-studio-select-image="card-1"]');assert.equal(await F('document.querySelector(".studio-image-actions").hidden'),true);await click('[data-studio-select-image="card-1"]');assert.equal(await F('document.querySelector(".studio-image-actions").hidden'),false);await click('[data-studio-delete-selected]');assert.deepEqual((await draft()).productImages.map(image=>image.id),['card-0','other-block']);assert.equal(await F('document.querySelector("[data-studio-delete-selected]").disabled'),true);
await run('saveTask()');const savedId=await run('taskId');await run(`dirty=false;openTask(${JSON.stringify(savedId)})`);await wait('!engineLoading');assert.equal((await draft()).productImages.length,2);
await click('[data-product-remove="card-0"]');assert.deepEqual((await draft()).productImages.map(image=>image.id),['other-block']);assert.equal(await F('document.querySelector(".studio-image-actions")===null'),true);assert.equal(await F('document.querySelector("#product-generate").disabled'),true);await run('engineCall("preview")');assert.equal(await run('engineSummary.view'),'upload');
// The portable delivery uses the same behavior inside its opaque-origin frame.
await run('dirty=false');await call('Page.navigate',{url:'file:///Users/fs/样机/单文件交付/视觉设计样机平台-单文件版.html'});await wait('typeof startTask==="function"');await run('startTask("product")');await wait('engineReady&&!engineLoading');await restore(fixture);
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await F('document.querySelector(".product-upload-grid").scrollIntoView({block:"start"})');await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1},offlineSession);await pause(200);
assert.ok(await F('document.documentElement.scrollWidth<=innerWidth'));assert.equal(await F('getComputedStyle(document.querySelector(".studio-image-remove")).visibility'),'visible');
await call('Page.captureScreenshot',{format:'png'}).then(result=>fs.writeFile('/Users/fs/样机/team-studio/qa/card-delete-mobile.png',Buffer.from(result.data,'base64')));
await click('[data-studio-select-image="card-0"]');await click('[data-studio-select-image="card-1"]');await click('[data-studio-select-all]');await click('[data-studio-delete-selected]');assert.deepEqual((await draft()).productImages.map(image=>image.id),['other-block']);
assert.deepEqual(c.errors,[]);console.log('PASS: hover cross, isolated shake, reduced motion, per-block selection, select-all/partial delete, single delete, draft persistence, preview guard, all-block generation and gray/red state, offline/mobile');c.close();
