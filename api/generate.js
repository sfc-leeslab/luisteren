"use strict";
const {handler}=require('../lib/vercel-adapter');
module.exports=(req,res)=>handler(req,res,'generate');
