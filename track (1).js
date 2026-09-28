import {prepare,body,phone,rpc,limit,failure} from '../lib/server.js';
export default async function handler(req,res){if(!prepare(req,res))return;try{const b=body(req),p=phone(b.phone);if(p.length<3||p.length>20)throw Error('INVALID');await limit(req,'track',20);const result=await rpc('track_v2',{customer_phone:p});res.status(200).json(result);}catch(e){failure(res,e);}}
