const fail=(res,status,error)=>res.status(status).json({error});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(res,405,'Méthode non autorisée.');}
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return fail(res,503,'La boutique n’est pas encore connectée.');
 try{
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(!b||typeof b!=='object'||JSON.stringify(b).length>12000)return fail(res,400,'Demande invalide.');
 if(b.website)return fail(res,400,'Demande invalide.');
 const str=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(!['order','sell','source','offer'].includes(b.type)||!str(b.name,100)||!str(b.phone,30)||!/^[+\d\s().-]{3,30}$/.test(b.phone))return fail(res,400,'Vérifiez le nom et le téléphone.');
 if(b.phone.replace(/[^\d]/g,'').length<3)return fail(res,400,'Indiquez un téléphone valide.');
 if(typeof b.details!=='string'||b.details.length>2000||(b.type!=='order'&&!b.details.trim()))return fail(res,400,'Précisez votre demande (2 000 caractères maximum).');
 if(b.type==='order'&&(!['pickup','delivery'].includes(b.fulfillment)||(b.fulfillment==='delivery'&&!str(b.address,300))||!Array.isArray(b.items)||!b.items.length||b.items.length>30))return fail(res,400,'Vérifiez le panier et l’adresse.');
 if(b.type!=='order'&&(!Number.isFinite(Number(b.budget))||Number(b.budget)<1||Number(b.budget)>100000000))return fail(res,400,'Indiquez un budget valide.');
 const payload={type:b.type,name:b.name.trim(),phone:b.phone.replace(/[^+\d]/g,''),details:b.details.trim(),budget:b.type==='order'?null:Number(b.budget),fulfillment:b.type==='order'?b.fulfillment:null,address:b.fulfillment==='delivery'?b.address?.trim():null,deal:['Rachat','Dépôt-vente','Échange + cash'].includes(b.deal)?b.deal:null,product_id:b.product_id||null,items:b.type==='order'?b.items:[]};
 const r=await fetch(process.env.SUPABASE_URL+'/rest/v1/rpc/submit_request',{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({payload})});
 const result=await r.json();if(!r.ok){const msg=result.message||'';if(msg.includes('RATE_LIMIT'))return fail(res,429,'Patientez une minute avant une nouvelle demande.');if(msg.includes('STOCK_CHANGED'))return fail(res,409,'Le stock a changé. Rechargez la boutique et vérifiez votre panier.');return fail(res,400,'La demande n’a pas pu être enregistrée. Vérifiez vos informations.');}
 return res.status(201).json({reference:result});
 }catch{return fail(res,500,'Service indisponible. Réessayez dans un instant.');}
}
