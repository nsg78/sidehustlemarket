const labels={order:'🛒 Nouvelle commande',sell:'📦 Proposition de vente',source:'🔎 Recherche personnalisée'};
const short=(value,max=900)=>String(value??'—').replace(/@/g,'＠').slice(0,max);
const dollars=value=>'$'+Number(value||0).toLocaleString('en-US',{maximumFractionDigits:2});
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
    fields.push({name:'Articles / quantités',value:short((data.items||[]).map(i=>i.quantity+' × '+i.id).join('\n'))});
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
