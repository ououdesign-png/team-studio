import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect();const {run,call}=c;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expr){for(let i=0;i<150;i++){if(await run(expr))return;await pause(100)}throw Error('Timed out: '+expr)}
const F=async expr=>{const tree=await call('Page.getFrameTree');return run(expr,c.contexts.get(tree.frameTree.childFrames[0].frame.id))};
const click=selector=>F(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function upload(images,{drop=false}={}){await F(`(async()=>{const dt=new DataTransfer();for(const [name,w,h] of ${JSON.stringify(images)}){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#eee';ctx.fillRect(0,0,w,h);const blob=await new Promise(r=>canvas.toBlob(r));dt.items.add(new File([blob],name,{type:'image/png'}))}if(${drop}){document.querySelector('[data-product-add]').dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}))}else{const el=document.querySelector('#product-file-input');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}))}})()`);await pause(100);await wait('!engineSummary.busy')}
const draft=()=>run('engineCall("draft")');
await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:8765/'});await wait('typeof startTask==="function"');await run('dirty=false;startTask("product")');await wait('engineReady&&!engineLoading');
await F(`const el=document.querySelector('#product-line');el.value='207189';el.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#continue-upload').click();for(const el of document.querySelectorAll('[data-product-choice]')){el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('#product-begin').click()`);
assert.equal(await F('document.querySelector("#product-generate")?.disabled??true'),true);
await upload([['pc.png',2400,240],['tablet.png',1952,240],['phone.png',764,240]]);
assert.deepEqual((await draft()).productImages.map(x=>x.device),['desktop','tablet','mobile']);
await upload([['duplicate-pc.png',2400,240]]);assert.equal((await draft()).productImages.length,3);assert.ok(await F('document.querySelector("#status-text").textContent.includes("该端已有")'));
await click('[data-product-upload-step="1"]');await upload([['single-1.png',1800,900],['single-2.png',1800,900]]);await upload([['single-3.png',1800,900]],{drop:true});assert.equal((await draft()).productImages.filter(x=>x.role==='single').length,3);
await click('[data-product-remove="'+(await draft()).productImages.find(x=>x.name==='single-2.png').id+'"]');assert.equal((await draft()).productImages.filter(x=>x.role==='single').length,2);
await click('[data-product-upload-step="2"]');await upload([['pair.png',840,632]]);
await click('[data-product-upload-step="3"]');await upload([['detail.png',468,336],['main.png',1800,1400],['detail-2.png',468,336]]);assert.deepEqual((await draft()).productImages.filter(x=>x.role==='triple').map(x=>x.productPart),['main','detail','detail']);
for(const step of [4,5]){await click(`[data-product-upload-step="${step}"]`);await upload([[`block-${step}.png`,900,600]])}
assert.equal(await F('document.querySelector("#product-generate").disabled'),false);
assert.equal(await F('document.querySelector("#product-upload-screen .studio-title-row .workflow")!==null'),true);
assert.equal(await F('document.querySelector("#product-upload-screen .studio-change-mockup").textContent.trim()'),'调整所选板块');
await call('Page.captureScreenshot',{format:'png'}).then(x=>fs.writeFile('/Users/fs/样机/team-studio/qa/template-updates.png',Buffer.from(x.data,'base64')));
await click('#product-generate');await wait('engineSummary.view==="preview"');
const snapshot=await draft();assert.equal(snapshot.productImages.length,11);
for(const device of ['desktop','tablet','mobile']){await click(`[data-device="${device}"]`);const image=snapshot.productImages.find(x=>x.role==='waterfall'&&x.device===device);assert.ok(await F(`document.querySelector('#preview-canvas [data-image-id="${image.id}"]')!==null`))}
// Restore a pre-update draft with fixed slots and no productPart metadata.
const legacy=structuredClone(snapshot);legacy.productImages=legacy.productImages.map(({productPart,...image})=>image);legacy.state.productSetup.variants={pair:2,triple:4,features:3,combination:4};await run(`engineCall('restore',${JSON.stringify(legacy)})`);assert.equal((await draft()).productImages.length,11);assert.equal(await run('engineSummary.view'),'preview');
await run('dirty=false');await call('Page.navigate',{url:'file:///Users/fs/%E6%A0%B7%E6%9C%BA/%E5%8D%95%E6%96%87%E4%BB%B6%E4%BA%A4%E4%BB%98/%E8%A7%86%E8%A7%89%E8%AE%BE%E8%AE%A1%E6%A0%B7%E6%9C%BA%E5%B9%B3%E5%8F%B0-%E5%8D%95%E6%96%87%E4%BB%B6%E7%89%88.html'});await wait('typeof startTask==="function"');await run('startTask("product")');await wait('engineReady&&!engineLoading');assert.equal(await run('engineSummary.business'),'product');
assert.deepEqual(c.errors,[]);console.log('PASS: three-device banners, duplicate prevention, append/drop/remove, main-detail grouping, retained UX, old draft restore, packaged offline bridge');c.close();
