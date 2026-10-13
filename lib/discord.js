const labels={order:'Nouvelle commande',sell:'Proposition de vente',source:'Recherche personnalisée'};
export async function notifyDiscord(data,result){
  const url=process.env.DISCORD_WEBHOOK_URL;
  if(!url||!labels[data.type])return;
  const fields=[{name:'Référence',value:String(result.reference||'Non disponible').slice(0,100),inline:true}];
  if(data.type==='order'){
    fields.push({name:'Montant',value:'$'+Number(result.total||0).toLocaleString('en-US'),inline:true});
    fields.push({name:'Articles',value:String(data.items?.length||0),inline:true});
  }else if(data.type==='source'){
    fields.push({name:'Budget',value:'$'+Number(data.budget||0).toLocaleString('en-US'),inline:true});
  }else{
    fields.push({name:'Opération',value:['Rachat','Dépôt-vente','Échange'].includes(data.deal)?data.deal:'Vente',inline:true});
  }
  try{
    const r=await fetch(url,{method:'POST',signal:AbortSignal.timeout(3000),
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:'STASH Notifications',allowed_mentions:{parse:[]},embeds:[{
        title:labels[data.type],color:15816751,fields,
        description:'Nouvelle activité à consulter dans le panneau administrateur STASH.',
        timestamp:new Date().toISOString()
      }]})});
    if(!r.ok)console.error('Discord notification status',r.status);
  }catch(e){console.error('Discord notification unavailable',e.message);}
}
