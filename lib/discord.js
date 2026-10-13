const labels={order:'🛒 Nouvelle commande',sell:'📦 Proposition de vente',source:'🔎 Recherche personnalisée'};
const short=(value,max=900)=>String(value??'—').replace(/@/g,'＠').slice(0,max);
const dollars=value=>'$'+Number(value||0).toLocaleString('en-US',{maximumFractionDigits:2});
async function orderLines(data,result){
  // Prefer the accepted order's persisted item snapshot when supplied.
  if(Array.isArray(result.items)&&result.items.length){
    return result.items.map(i=>String(i.quantity)+' × '+short(i.name||'Article',150)+' — '+dollars(i.price)+' / unité');
  }
  // Otherwise resolve product names server-side; never trust names/prices sent by browser.
  const items=Array.isArray(data.items)?data.items:[];
  if(!items.length)return [];
  try{
    const ids=[...new Set(items.map(i=>i.id))];
    const endpoint=process.env.SUPABASE_URL+'/rest/v1/products?select=id,name,price,size&id=in.('+ids.join(',')+')';
    const response=await fetch(endpoint,{headers:{
      apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY
    },signal:AbortSignal.timeout(2500)});
    if(!response.ok)throw Error('Product lookup HTTP '+response.status);
    const products=await response.json();
    const byId=new Map(products.map(p=>[p.id,p]));
    return items.map(i=>{
      const p=byId.get(i.id);
      return i.quantity+' × '+(p?short(p.name,130)+(p.size?' ('+short(p.size,40)+')':''):'Réf. '+i.id)+' — '+(p?dollars(p.price)+' / unité':'prix indisponible');
    });
  }catch(error){
    console.error('STASH Discord products lookup failed',error instanceof Error?error.message:'unknown');
    return items.map(i=>i.quantity+' × Réf. '+i.id);
  }
}

export async function notifyDiscord(data,result){
  const url=process.env.DISCORD_WEBHOOK_URL;
  if(!url||!labels[data.type])return;
  const fields=[
    {name:'Référence',value:short(result.reference,100),inline:true},
    {name:'Client RP',value:short(data.name,100),inline:true},
    {name:'Téléphone IG',value:short(data.phone,30),inline:true}
  ];
  if(data.type==='order'){
    fields.push({name:'Total',value:dollars(result.total),inline:true});
    fields.push({name:'Remise',value:data.fulfillment==='delivery'?'Livraison':'Retrait',inline:true});
    fields.push({name:'Articles / quantités',value:short((await orderLines(data,result)).join('\n'),1000)});
    if(data.address&&data.fulfillment==='delivery')fields.push({name:'Point de rendez-vous IG',value:short(data.address,300)});
    if(data.delivery_slot)fields.push({name:'Créneau',value:short(data.delivery_slot,150)});
    if(data.details)fields.push({name:'Consignes',value:short(data.details)});
  }else{
    if(data.type==='source')fields.push({name:'Budget',value:dollars(data.budget),inline:true});
    if(data.type==='sell')fields.push({name:'Opération',value:short(data.deal||'Rachat',100),inline:true});
    fields.push({name:'Description',value:short(data.details)});
  }
  try{
    const response=await fetch(url,{method:'POST',signal:AbortSignal.timeout(3000),
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:'STASH Notifications',allowed_mentions:{parse:[]},embeds:[{
        title:labels[data.type],color:15816751,fields,
        footer:{text:'STASH Pawnshop • GTA RP'},timestamp:new Date().toISOString()
      }]})});
    if(!response.ok)console.error('STASH Discord alert HTTP',response.status);
  }catch(error){console.error('STASH Discord alert failed',error instanceof Error?error.message:'unknown');}
}
