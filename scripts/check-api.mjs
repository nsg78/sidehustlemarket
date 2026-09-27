import assert from 'node:assert/strict';import handler from '../api/request.js';
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const valid={type:'order',name:'Test',phone:'5551234',details:'',fulfillment:'pickup',items:[{id:'11111111-1111-4111-8111-111111111111',quantity:1}]};
let submitted;global.fetch=async(url,opts)=>{submitted=JSON.parse(opts.body);return {ok:true,json:async()=> 'SH-TEST'};};
async function call(body,method='POST'){let status,out;await handler({method,body},{setHeader(){},status(n){status=n;return this;},json(v){out=v;return this;}});return {status,out};}
assert.equal((await call(valid,'GET')).status,405);
assert.equal((await call({...valid,name:''})).status,400);
assert.equal((await call({...valid,fulfillment:'delivery'})).status,400);
assert.equal((await call({...valid,items:[]})).status,400);
assert.equal((await call({...valid,total:1})).status,201);
assert.equal(submitted.payload.total,undefined);
assert.equal((await call({...valid,type:'source',budget:'oops'})).status,400);
global.fetch=async()=>({ok:false,json:async()=>({message:'STOCK_CHANGED'})});assert.equal((await call(valid)).status,409);
global.fetch=async()=>({ok:false,json:async()=>({message:'RATE_LIMIT'})});assert.equal((await call(valid)).status,429);
console.log('API: method, validation, delivery, empty basket, server total boundary, budget, stock conflict, rate limit verified.');
