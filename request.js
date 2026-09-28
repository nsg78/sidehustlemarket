import {prepare,body,phone,text,rpc,limit,failure} from '../lib/server.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req,res){if(!prepare(req,res))return;try{const b=body(req);const customer=phone(b.phone);
if(b.website||!['order','sell','source'].includes(b.type)||!text(b.name,100)||customer.length<3||customer.length>20||!text(b.details??'',2000,false)||!uuid.test(b.idempotency_key))throw Error('INVALID');
if(b.type==='order'&&(!['delivery','pickup'].includes(b.fulfillment)||!text(b.delivery_slot??'',150,false)||(b.fulfillment==='delivery'&&!text(b.address,300))||!Array.isArray(b.items)||!b.items.length||b.items.length>30||b.items.some(i=>!uuid.test(i.id)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>999)||!Number.isFinite(b.expected_total)||b.expected_total<0))throw Error('INVALID');
if(b.type!=='order'&&!text(b.details,2000))throw Error('INVALID');
if(b.type==='source'&&(!Number.isFinite(Number(b.budget))||Number(b.budget)<=0||Number(b.budget)>1e8))throw Error('INVALID');
await limit(req,'submit',12);
const result=await rpc('checkout_v2',{payload:{type:b.type,name:b.name.trim(),phone:customer,details:(b.details||'').trim(),budget:b.type==='source'?Number(b.budget):null,fulfillment:b.type==='order'?b.fulfillment:null,address:b.type==='order'&&b.fulfillment==='delivery'?b.address.trim():null,delivery_slot:b.type==='order'?(b.delivery_slot||'').trim():'',deal:b.type==='sell'&&['Rachat','Dépôt-vente','Échange'].includes(b.deal)?b.deal:null,items:b.type==='order'?b.items:[],expected_total:b.expected_total,idempotency_key:b.idempotency_key}});
res.status(201).json(result);
}catch(e){failure(res,e);}}
