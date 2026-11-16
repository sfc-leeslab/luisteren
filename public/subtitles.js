/* SFC LuisterLab: convert a legitimately obtained SRT, VTT or TXT file into plain text.
   This script NEVER downloads or scrapes videos or captions from video providers. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SFCSubtitles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function clean(s){
    return String(s||'').replace(/\uFEFF/g,'').replace(/<[^>]*>/g,'')
      .replace(/\{\\an\d+\}/g,'').replace(/&amp;/g,'&')
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
      .replace(/&#39;|&apos;/g,"'").replace(/[\t ]+/g,' ').trim();
  }
  function parseCaptions(input,filename=''){
    const raw=String(input||'').replace(/\r\n?/g,'\n');
    const ext=String(filename).toLowerCase().split('.').pop();
    const isTimed=/^\s*WEBVTT(?:\s|$)/i.test(raw)||/\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s*-->\s*\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}/.test(raw)||['srt','vtt'].includes(ext);
    if(!isTimed)return clean(raw).replace(/\n{3,}/g,'\n\n').slice(0,14000);
    const out=[];
    // Per block: ignore cue indices, timing lines, metadata and WebVTT comments.
    for(const block of raw.split(/\n\s*\n/)){
      const lines=block.split('\n');
      if(/^\s*(WEBVTT|NOTE(?:\s|$)|STYLE(?:\s|$)|REGION(?:\s|$))/i.test(lines[0]||''))continue;
      const timing=lines.findIndex(line=>/\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s*-->\s*\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}/.test(line));
      if(timing<0)continue;
      for(const line of lines.slice(timing+1)){
        const value=clean(line.replace(/^\s*-\s*/,''));
        if(!value||/^\[(?:music|muziek|applaus|gelach|laughter|silence)\]$/i.test(value))continue;
        const prev=out[out.length-1]||'';
        // Caption tracks often overlap and repeat consecutive lines.
        if(value===prev)continue;
        if(prev&&prev.endsWith(value))continue;
        out.push(value);
      }
    }
    return out.join(' ').replace(/\s+/g,' ').trim().slice(0,14000);
  }
  return {parseCaptions};
});
