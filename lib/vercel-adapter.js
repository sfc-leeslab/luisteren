"use strict";
const {processRequest}=require('./luisterlab');
async function handler(req,res,mode){
 try{
  const method=req.method||'GET';
  const host=req.headers?.host||'localhost';
  const scheme=req.headers?.['x-forwarded-proto']==='http'?'http':'https';
  const headers=new Headers();
  for(const [k,v] of Object.entries(req.headers||{})){if(v!==undefined) headers.set(k,Array.isArray(v)?v.join(', '):String(v));}
  let body;
  if(method!=='GET'&&method!=='HEAD'){
   if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
   else{let chunks=[],len=0;for await(const c of req){const b=Buffer.from(c);len+=b.length;if(len>65000)throw Error('De aanvraag bevat te veel tekst.');chunks.push(b)}body=Buffer.concat(chunks).toString('utf8');}
   if(Buffer.byteLength(body||'','utf8')>65000)throw Error('De aanvraag bevat te veel tekst.');
  }
  const url=new URL(req.url||'/',`${scheme}://${host}`).href;
  const request=new Request(url,{method,headers,...(body===undefined?{}:{body})});
  const output=await processRequest(request,mode);
  for(const [key,value] of output.headers)res.setHeader(key,value);
  res.statusCode=output.status;
  res.end(await output.text());
 }catch(e){console.error('LuisterLab Vercel-adapter:',e.message);res.statusCode=e.message.includes('te veel tekst')?413:500;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:e.message.includes('te veel tekst')?e.message:'De server kon de aanvraag niet verwerken.'}));}
}
module.exports={handler};
