import {createHmac,randomUUID} from 'node:crypto';

const origin=new URL(process.env.WEBSITE_URL||'https://dianetikabrnojizni.cz');
const allowed=['dianetikabrnojizni.cz','dianetika-brno-jizni.centrum-dianetiky-brno.workers.dev'];
if(origin.protocol!=='https:'||!allowed.includes(origin.hostname))throw Error('Unexpected destination');
const secret=process.env.PICKUP_SYNC_SECRET;
if(!secret)throw Error('Missing directory synchronization key');
const config=await fetch(new URL('/api/config',origin),{redirect:'error',signal:AbortSignal.timeout(20000)}).then(async r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json();});
if(!/^[a-f0-9]{16}$/.test(config.packetaKey||''))throw Error('Packeta public key is not configured');
const points=new Map();
for(const kind of ['branch','box']){
  const url=`https://pickup-point.api.packeta.com/v5/${config.packetaKey}/${kind}/json?country=CZ`;
  const response=await fetch(url,{headers:{'Accept-Encoding':'br'},redirect:'error',signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error(`Packeta ${kind} feed returned ${response.status}`);
  const feed=await response.json();if(!Array.isArray(feed))throw Error('Invalid feed format');
  for(const p of feed){
    if(String(p.country).toLowerCase()!=='cz'||String(p.displayFrontend)!=='1'||String(p.status?.statusId)!=='1')continue;
    const maxGrams=Math.min(15000,Math.round(Number(p.maxWeight)*1000));
    if(!/^\d{1,10}$/.test(String(p.id))||typeof p.name!=='string'||!Number.isInteger(maxGrams)||maxGrams<1)throw Error('Invalid point in source');
    points.set(String(p.id),{id:String(p.id),name:p.name.slice(0,200),country:'cz',kind,maxGrams});
  }
}
const entries=[...points.values()];if(entries.length<1000||entries.length>12000)throw Error('Unexpected directory size');
const generation=randomUUID();
async function send(data){
  const body=JSON.stringify({...data,generation}),timestamp=Math.floor(Date.now()/1000);
  const signature=createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex');
  const response=await fetch(new URL('/api/internal/pickups',origin),{method:'POST',headers:{'Content-Type':'application/json','X-Pickup-Signature':`t=${timestamp},v1=${signature}`},body,redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`Directory update failed (${response.status})`);
}
await send({action:'begin',count:entries.length});
for(let i=0;i<entries.length;i+=100)await send({action:'chunk',points:entries.slice(i,i+100)});
await send({action:'commit'});
console.log(`Updated ${entries.length} active Czech pickup points. Generation ${generation}.`);
