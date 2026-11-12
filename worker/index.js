const MAX_SNAPSHOT_BYTES=100*1024*1024;
const REVIEW_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// R2 stores the canonical JSON produced by the original composition validator.
// Streaming keeps the original 100 MB limit without holding 100 MB JSON in Worker memory.
function wrapComposition(body,createdAt){
 const reader=body.getReader(),encode=new TextEncoder();let first=true;
 return new ReadableStream({async pull(controller){
  if(first){first=false;controller.enqueue(encode.encode('{"createdAt":'+JSON.stringify(createdAt)+',"composition":'));return}
  try{const chunk=await reader.read();if(chunk.done){controller.enqueue(encode.encode('}'));controller.close();reader.releaseLock()}else controller.enqueue(chunk.value)}catch(error){controller.error(error)}
 },cancel(reason){return reader.cancel(reason)}});
}
const assetCache=new Map();
function asset(path,request){
 const record=STATIC_ASSETS[path];if(!record)return new Response('Not found',{status:404});
 let bytes=assetCache.get(path);if(!bytes){const binary=atob(record.data);bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);assetCache.set(path,bytes)}
 return new Response(request.method==='HEAD'?null:bytes,{encodeBody:'manual',headers:{'Content-Type':record.type,'Content-Encoding':'gzip','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"frame-ancestors 'self'"}});
}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 try{
  if(path==='/api/health')return json({ok:!!env.BUCKET,retention:'固定版本保存在平台存储中，后续改稿不覆盖旧版本。访问权限与本平台一致。'} ,env.BUCKET?200:503);
  if(path==='/api/previews'){
   if(request.method!=='POST')return json({error:'不支持的请求方式。'},405);
   if(!env.BUCKET)return json({error:'版本存储未连接，请联系管理员。'},503);
   if(request.headers.get('X-Mockup-Request')!=='save'||request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'保存请求格式无效。'},400);
   if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'不允许跨站保存。'},403);
   const size=Number(request.headers.get('Content-Length'));
   if(!Number.isSafeInteger(size)||size<2)return json({error:'请提供完整的作品数据。'},411);
   if(size>MAX_SNAPSHOT_BYTES)return json({error:'作品超过 100 MB，请减少或压缩图片。'},413);
   const id=crypto.randomUUID(),createdAt=new Date().toISOString();
   await env.BUCKET.put('reviews/'+id+'.json',request.body,{httpMetadata:{contentType:'application/json'},customMetadata:{createdAt},onlyIf:{etagDoesNotMatch:'*'}});
   return json({id,path:'/review/'+id},201);
  }
  if(path.startsWith('/api/previews/')){
   if(request.method!=='GET')return json({error:'评审版本只读，不能修改。'},405);
   const id=path.slice('/api/previews/'.length);if(!REVIEW_ID.test(id))return json({error:'版本地址无效。'},400);
   if(!env.BUCKET)return json({error:'版本存储未连接。'},503);
   const object=await env.BUCKET.get('reviews/'+id+'.json');if(!object)return json({error:'未找到此评审版本，请核对链接。'},404);
   return new Response(wrapComposition(object.body,object.customMetadata?.createdAt||null),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(path.startsWith('/api/'))return json({error:'接口不存在。'},404);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(path.startsWith('/review/')){
   if(!REVIEW_ID.test(path.slice('/review/'.length)))return new Response('评审链接无效。',{status:404});
   return asset('/editor.html',request);
  }
  return asset(path==='/'?'/index.html':path,request);
 }catch{return json({error:'保存服务暂时不可用，当前编辑内容仍然保留，请稍后重试。'},503)}
}};
