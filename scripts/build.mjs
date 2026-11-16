import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let original=await fs.readFile(path.join(root,'src/legacy.html'),'utf8');
const brand=await fs.readFile(path.join(root,'src/brand.css'),'utf8');
const selects=await fs.readFile(path.join(root,'src/select-controls.js'),'utf8');
await fs.writeFile(path.join(root,'dist/select-controls.js'),selects);
await fs.writeFile(path.join(root,'dist/brand.css'),brand);
const theme=(await fs.readFile(path.join(root,'src/editor-theme.css'),'utf8'))+'\n'+brand;
const bridge=(await fs.readFile(path.join(root,'src/engine-bridge.js'),'utf8')).replace('/* STUDIO_THEME */','const studioTheme=document.createElement("style");studioTheme.textContent='+JSON.stringify(theme)+';document.head.append(studioTheme);\n'+selects);
// Place the upload configuration action in the title markup before any rendering.
const uploadAction=String.raw`<h2>${'${A.name}'}</h2></div>
    <button data-view="product-blocks">\u8C03\u6574\u6240\u9009\u677F\u5757</button></div>`;
const uploadTitle=String.raw`<div class="studio-title-row"><h2>${'${A.name}'}</h2><button data-view="product-blocks" class="studio-change-mockup">\u8C03\u6574\u6240\u9009\u677F\u5757</button></div></div></div>`;
if(original.split(uploadAction).length!==2)throw Error('Upload title changed; review action placement.');
original=original.replace(uploadAction,()=>uploadTitle);
const marker='Qee();})();';if(original.split(marker).length!==2)throw Error('Original engine entrypoint changed; review bridge integration.');
const editor=original.replace('!Y.readonly&&(Y.images.length||tA.length)', 'window.parent===window&&!Y.readonly&&(Y.images.length||tA.length)').replace(marker,bridge+'\nQee();})();');
await fs.writeFile(path.join(root,'dist/editor.html'),editor);
const assetFiles=['index.html','style.css','brand.css','select-controls.js','app.js','editor.html'];
const mime={'html':'text/html; charset=utf-8','css':'text/css; charset=utf-8','js':'text/javascript; charset=utf-8'};
const assets={};for(const name of assetFiles){const data=await fs.readFile(path.join(root,'dist',name));assets['/'+name]={type:mime[name.split('.').pop()],data:gzipSync(data,{level:9}).toString('base64')}}
const worker=await fs.readFile(path.join(root,'worker/index.js'),'utf8');
await fs.mkdir(path.join(root,'dist/server'),{recursive:true});
await fs.writeFile(path.join(root,'dist/server/index.js'),'const STATIC_ASSETS='+JSON.stringify(assets)+';\n'+worker);
console.log('Built original renderer + themed editor + persistent version service.');
