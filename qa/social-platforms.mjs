import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {connect} from './cdp.mjs';
const c=await connect(),{run,call}=c;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(expr){for(let i=0;i<200;i++){if(await run(expr))return;await pause(100)}throw Error('Timed out: '+expr)}
const F=async expr=>{const {frameTree}=await call('Page.getFrameTree');return run(expr,c.contexts.get(frameTree.childFrames[0].frame.id))};
const click=selector=>F(`document.querySelector(${JSON.stringify(selector)}).click()`);
const snapshot=()=>run('engineCall("draft")');
const enabled=()=>F('[...document.querySelectorAll("#model-tabs button:not(:disabled)")].map(button=>button.dataset.model)');
await call('Runtime.enable');await call('Page.enable');await run('if(location.protocol!=="about:")sessionStorage.removeItem("studio.activeTask");if(typeof dirty!=="undefined")dirty=false');
await call('Emulation.setDeviceMetricsOverride',{width:1320,height:838,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:8765/'});await wait('typeof startTask==="function"');await run('dirty=false;startTask("social")');await wait('engineReady&&!engineLoading&&engineSummary.business==="social"');
const fixture=await snapshot();fixture.state.view='preview';fixture.state.postMode='single';fixture.state.active='instagram';
const src=await F('(()=>{const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=630;const ctx=canvas.getContext("2d");ctx.fillStyle="#315d8d";ctx.fillRect(0,0,1200,630);ctx.fillStyle="#fff";ctx.font="48px Arial";ctx.fillText("Platform preview",60,300);return canvas.toDataURL()})()');
fixture.state.images=[
 {id:'facebook-image',name:'Facebook.png',src,width:1200,height:630,business:'social',role:'post',device:'all',position:1,socialPlatform:'facebook'},
 {id:'instagram-image',name:'Instagram.png',src,width:1080,height:1080,business:'social',role:'post',device:'mobile',position:2,socialPlatform:'instagram'},
 {id:'video-image',name:'Video.png',src,width:1280,height:720,business:'social',role:'video',device:'all',position:3}
];
await run(`engineCall('restore',${JSON.stringify(fixture)})`);
assert.deepEqual(await enabled(),['facebook','youtube-video']);assert.equal((await snapshot()).state.active,'facebook');
assert.deepEqual(await F('[...document.querySelectorAll("#model-tabs button")].slice(0,2).map(button=>button.dataset.model)'),['facebook','youtube-video']);
assert.equal(await F('document.querySelectorAll("#model-tabs button:disabled").length'),fixture.state.platforms.length-2);
assert.equal(await F('getComputedStyle(document.querySelector("#model-tabs [data-model=instagram]")).opacity'),'0.45');
await click('#model-tabs [data-model=instagram]');assert.equal((await snapshot()).state.active,'facebook');
await click('#model-tabs [data-model=youtube-video]');assert.equal((await snapshot()).state.active,'youtube-video');assert.deepEqual(await F('[...document.querySelectorAll("#preview-canvas .design-image")].map(image=>image.dataset.imageId)'),['video-image']);
await call('Page.captureScreenshot',{format:'png'}).then(result=>fs.writeFile('/tmp/social-platform-availability.png',Buffer.from(result.data,'base64')));
await click('[data-device=mobile]');assert.deepEqual(await enabled(),['facebook','instagram','youtube-video']);assert.equal((await snapshot()).state.active,'youtube-video');
await click('#model-tabs [data-model=instagram]');await click('#manage-images');await click('#image-list [data-remove=instagram-image]');assert.deepEqual(await enabled(),['facebook','youtube-video']);assert.equal((await snapshot()).state.active,'facebook');
await F('document.body.dispatchEvent(new KeyboardEvent("keydown",{key:"z",ctrlKey:true,bubbles:true,cancelable:true}))');assert.deepEqual(await enabled(),['facebook','instagram','youtube-video']);await click('[data-close=image-drawer]');
const mobileOnly=structuredClone(fixture);mobileOnly.state.images=mobileOnly.state.images.filter(image=>image.id==='instagram-image');await run(`engineCall('restore',${JSON.stringify(mobileOnly)})`);
assert.deepEqual(await enabled(),[]);assert.equal((await snapshot()).state.active,'');assert.equal(await run('engineSummary.canExport||engineSummary.canShare'),false);assert.equal(await F('document.querySelectorAll("#model-tabs [aria-pressed=true]").length'),0);assert.ok(await F('document.querySelector(".studio-social-empty").textContent.includes("暂无匹配")'));
await click('[data-device=mobile]');assert.deepEqual(await enabled(),['instagram']);assert.equal((await snapshot()).state.active,'instagram');assert.equal(await run('engineSummary.canExport'),true);
// Check the export target before the unchanged native rasterizer runs.
const exportFixture=structuredClone(fixture);exportFixture.state.images=exportFixture.state.images.filter(image=>image.id==='facebook-image');await run(`engineCall('restore',${JSON.stringify(exportFixture)})`);assert.deepEqual(await enabled(),['facebook']);
await run('window.__socialExport=engineCall("export").catch(()=>null);true');await wait('!!frame.contentDocument.querySelector(".export-host .template-facebook")');
assert.ok(await F('document.querySelector("#status-text").textContent.includes("1/1")'));
assert.equal(await F('document.querySelectorAll(".export-host .template").length'),1);
assert.deepEqual(c.errors,[]);await run('dirty=false');await call('Page.navigate',{url:'http://127.0.0.1:8765/#home'});
console.log('PASS: matched platforms first, empty platforms disabled, disabled click blocked, automatic fallback, per-device refresh, delete/undo refresh, all-empty state, re-enable on device change, export targets matched platforms.');c.close();
