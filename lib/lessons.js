'use strict';
const crypto=require('node:crypto');
const {processRequest}=require('./luisterlab');
const BASE=process.env.UPSTASH_REDIS_REST_URL||'';
const TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||'';
const TTL=60*60*24*30; // gedeelde opdrachten vervallen na 30 dagen
function json(res,status,data){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.status(status).end(JSON.stringify(data))}
async function redis(...cmd){if(!BASE||!TOKEN)throw Error('Upstash is niet ingesteld.');const r=await fetch(BASE.replace(/\/$/,'')+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+TOKEN,'Content-Type':'application/json'},body:JSON.stringify([cmd]),signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Opslag is tijdelijk niet beschikbaar.');const o=await r.json();if(o[0]?.error)throw Error('Opslagfout.');return o[0]?.result}
function validVideo(raw){try{const u=new URL(raw);if(u.protocol!=='https:')return null;const h=u.hostname.toLowerCase().replace(/^www\./,'');if(h==='youtube.com'||h==='m.youtube.com'||h==='youtube-nocookie.com'){let id=u.searchParams.get('v');if(!id)id=u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1];return /^[\w-]{11}$/.test(id||'')?{kind:'youtube',url:'https://www.youtube.com/watch?v='+id,id}:null}if(h==='youtu.be'){const id=u.pathname.slice(1).split('/')[0];return /^[\w-]{11}$/.test(id)?{kind:'youtube',url:'https://www.youtube.com/watch?v='+id,id}:null}if(h==='vrt.be'||h.endsWith('.vrt.be'))return {kind:'vrt',url:u.href};return null}catch{return null}}
async function invoke(mode,data){const req=new Request('https://localhost/api/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await processRequest(req,mode);const body=await out.json();if(!out.ok){const e=new Error(body.error||'AI-aanvraag mislukt.');e.status=out.status;throw e}return body}
async function load(id){if(!/^[0-9a-f]{24}$/.test(id||''))return null;const v=await redis('GET','sfc-luisterlab:lesson:'+id);if(!v)return null;try{return JSON.parse(v)}catch{return null}}
async function readBody(req){let o=req.body;if(typeof o==='string')o=JSON.parse(o);if(!o){let s='';for await(const c of req){s+=c;if(s.length>55000)throw Error('Aanvraag te groot.')}o=JSON.parse(s)}if(JSON.stringify(o).length>55000)throw Error('Aanvraag te groot.');return o}
async function main(req,res,operation){try{const origin=req.headers.origin;if(origin&&origin!==('https://' + req.headers.host)&&origin!==('http://' + req.headers.host))return json(res,403,{error:'Ongeldige herkomst.'});
 if(operation==='lesson'&&req.method==='GET'){const lesson=await load(new URL(req.url,'https://localhost').searchParams.get('id'));if(!lesson)return json(res,404,{error:'Deze oefening bestaat niet (meer).'});return json(res,200,{title:lesson.title,video:lesson.video,level:lesson.level,count:lesson.count,views:lesson.views,questions:lesson.questions.map(({question,type})=>({question,type}))})}
 if(req.method!=='POST')return json(res,405,{error:'Alleen POST toegestaan.'});const b=await readBody(req);
 if(operation==='lesson'){
  const video=validVideo(b.url);if(!video) return json(res,400,{error:'Gebruik een geldige YouTube- of VRT-link.'});
  if(typeof b.text!=='string'||b.text.trim().length<200||b.text.length>14000)return json(res,400,{error:'Vul een transcript van 200 tot 14.000 tekens in.'});
  const title=String(b.title||'Luisteroefening').trim().slice(0,120)||'Luisteroefening';
  const count=[5,8,10].includes(b.count)?b.count:10;const level=['basis','gemiddeld','uitdagend'].includes(b.level)?b.level:'gemiddeld';const views=[1,2,3].includes(b.views)?b.views:2;
  const generated=await invoke('generate',{text:b.text,count,level});const id=crypto.randomBytes(12).toString('hex');
  const doc={title,video,text:b.text,questions:generated.questions,level,count,views};await redis('SET','sfc-luisterlab:lesson:'+id,JSON.stringify(doc),'EX',TTL);
  return json(res,200,{id,url:'/\?les='+id,questions:generated.questions.length});
 }
 if(operation==='assessment'){
  const lesson=await load(b.id);if(!lesson)return json(res,404,{error:'Deze oefening bestaat niet (meer).'});
  if(!Array.isArray(b.answers)||b.answers.length!==lesson.questions.length||b.answers.some(x=>typeof x!=='string'||x.length>1500||!x.trim()))return json(res,400,{error:'Beantwoord eerst alle vragen.'});
  const result=await invoke('grade',{text:lesson.text,questions:lesson.questions.map((q,i)=>({question:q.question,answer:q.answer,student:b.answers[i]}))});return json(res,200,result);
 }
 return json(res,404,{error:'Niet gevonden.'});
 }catch(e){console.error('LuisterLab',operation,e.message);return json(res,e.status|| (e.message.includes('groot')?413:502),{error:e.message||'Serverfout.'})}}
module.exports={main,validVideo};
