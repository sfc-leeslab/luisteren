"use strict";
module.exports=(req,res)=>{
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.statusCode=200;
 res.end(JSON.stringify({ai:!!process.env.OPENAI_API_KEY,model:['gpt-4o-mini','gpt-4.1-mini'].includes(process.env.OPENAI_MODEL)?process.env.OPENAI_MODEL:'gpt-4o-mini',online:true}));
};
