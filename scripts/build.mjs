import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const original=await fs.readFile(path.join(root,'src/legacy.html'),'utf8');
const theme=await fs.readFile(path.join(root,'src/editor-theme.css'),'utf8');
const bridge=(await fs.readFile(path.join(root,'src/engine-bridge.js'),'utf8')).replace('/* STUDIO_THEME */','const studioTheme=document.createElement("style");studioTheme.textContent='+JSON.stringify(theme)+';document.head.append(studioTheme);');
const marker='tX();})();';if(original.split(marker).length!==2)throw Error('Original engine entrypoint changed; review bridge integration.');
const editor=original.replace('!re.readonly&&(re.images.length||ka.length)', 'window.parent===window&&!re.readonly&&(re.images.length||ka.length)').replace(marker,bridge+'\ntX();})();');
await fs.writeFile(path.join(root,'dist/editor.html'),editor);
const assetFiles=['index.html','style.css','app.js','editor.html'];
const mime={'html':'text/html; charset=utf-8','css':'text/css; charset=utf-8','js':'text/javascript; charset=utf-8'};
const assets={};for(const name of assetFiles){const data=await fs.readFile(path.join(root,'dist',name));assets['/'+name]={type:mime[name.split('.').pop()],data:gzipSync(data,{level:9}).toString('base64')}}
const worker=await fs.readFile(path.join(root,'worker/index.js'),'utf8');
await fs.mkdir(path.join(root,'dist/server'),{recursive:true});
await fs.writeFile(path.join(root,'dist/server/index.js'),'const STATIC_ASSETS='+JSON.stringify(assets)+';\n'+worker);
console.log('Built original renderer + themed editor + persistent version service.');
