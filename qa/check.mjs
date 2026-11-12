import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const tabs=await (await fetch('http://127.0.0.1:9227/json')).json();
const ws=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map();const errors=[];
ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result)}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const k=++id;pending.set(k,{resolve,reject});ws.send(JSON.stringify({id:k,method,params}))})}
async function run(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:8765/'});
for(let i=0;i<60;i++){if(await run('typeof startTask === "function"'))break;await new Promise(r=>setTimeout(r,100))}
await run('localStorage.removeItem("studio.tasks.v2");saved=[];render()');
assert.equal(await run('document.querySelectorAll(".tool-card").length'),4);
assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true);
await fs.writeFile('/Users/fs/样机/team-studio/qa/home.png',Buffer.from((await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
await run('startTask("article")');await new Promise(r=>setTimeout(r,150));
assert.equal(await run('document.querySelector("#exportBtn").disabled'),true);
await run(`(async()=>{const c=document.createElement('canvas');c.width=800;c.height=400;const cx=c.getContext('2d');cx.fillStyle='#254e7f';cx.fillRect(0,0,800,400);cx.fillStyle='#fff';cx.font='42px Arial';cx.fillText('Connect what comes next.',60,210);const b=await new Promise(r=>c.toBlob(r));await addFiles([new File([b],'design-one.png',{type:'image/png'}),new File([b],'design-two.png',{type:'image/png'}),new File(['bad'],'invalid.txt',{type:'text/plain'})])})()`);
assert.equal(await run('items.length'),2);assert.equal(await run('document.querySelector("#exportBtn").disabled'),false);
assert.match(await run('document.querySelector("#toast").textContent'),/1 个文件未添加/);
await run('move(0,1)');assert.equal(await run('items[0].name'),'design-two.png');
await run(`document.querySelector('[data-device="phone"]').click()`);assert.equal(await run('document.querySelector("#webPreview").classList.contains("phone")'),true);
await run('taskName="QA 文章样机";document.querySelector("#taskName").value=taskName;saveTask()');assert.equal(await run('saved.length'),1);
await run(`location.hash='tasks'`);await new Promise(r=>setTimeout(r,100));assert.match(await run('document.querySelector("main").innerText'),/QA 文章样机/);
await run('openTask(saved[0].id)');await new Promise(r=>setTimeout(r,100));assert.equal(await run('items.length'),2);
await run(`(async()=>{window.exported=[];download=async(blob,name)=>{window.exported.push({name,size:blob.size,head:await blob.slice(0,8).text()})};format='jpg';await exportSample();format='pdf';await exportSample()})()`);
const exported=await run('exported');assert.equal(exported.length,2);assert.match(exported[0].name,/\.jpg$/);assert.ok(exported[0].size>1000);assert.match(exported[1].head,/%PDF-1.4/);
await fs.writeFile('/Users/fs/样机/team-studio/qa/workspace.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
for(const sid of ['product','article','social','solution','case']){await run(`currentScene='${sid}';position=scene().position[0];render()`);assert.ok(await run('document.querySelector("#webPreview").children.length>0'))}
await run('dirty=false;location.hash="templates"');await new Promise(r=>setTimeout(r,100));await run(`document.querySelector('[data-filter="social"]').click()`);assert.equal(await run('document.querySelectorAll("#templateGrid .template-card").length'),1);await run('document.querySelector("#templateSearch").value="无匹配";document.querySelector("#templateSearch").dispatchEvent(new Event("input"))');assert.match(await run('document.querySelector("#templateGrid").innerText'),/没有找到/);
await run('location.hash="home"');await new Promise(r=>setTimeout(r,100));await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,300));assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true);await fs.writeFile('/Users/fs/样机/team-studio/qa/mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
await run('openTask(saved[0].id)');await new Promise(r=>setTimeout(r,100));assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true);
await call('Page.reload');await new Promise(r=>setTimeout(r,400));assert.equal(await run('saved.length'),1);await run('openTask(saved[0].id)');await new Promise(r=>setTimeout(r,100));assert.equal(await run('items.length'),2);
assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile layout, upload validation, reorder, 5 scenes, device switch, local save/reload, template filtering, JPG/PDF output, no runtime exceptions.');ws.close();
