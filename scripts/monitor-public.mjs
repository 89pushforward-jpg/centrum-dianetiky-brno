import assert from 'node:assert/strict';

// Independent, credential-free checks. Never submits a contact or creates a payment.
const site='https://dianetikabrnojizni.cz';
const survey='https://inspiria.onquanda.com/survey/db80d49c81501bb3f0f61db77910e596/';
let failures=0;
async function check(label,run){
  try{await run();console.log(`PASS ${label}`);}
  catch(error){failures++;console.error(`FAIL ${label}: ${error.message}`);}
}
async function request(url,status=200,options={}){
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),...options});
  assert.equal(response.status,status,'Unexpected HTTP status');
  if(url.startsWith(site+'/')){
    assert.equal(response.headers.get('x-content-type-options'),'nosniff','Missing nosniff');
    assert.match(response.headers.get('strict-transport-security')||'',/max-age=31536000/,'Missing HSTS');
  }
  return response;
}
async function body(response){
  const reader=response.body.getReader(),chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>500000){await reader.cancel();throw Error('Unexpected response size');}chunks.push(value);}
  return Buffer.concat(chunks).toString('utf8');
}
await check('HTTPS home and canonical',async()=>{
  const response=await request(site+'/');
  assert.ok(!(response.headers.get('x-robots-tag')||'').includes('noindex'),'Home must be indexable');
  assert.match(await body(response),/rel="canonical" href="https:\/\/dianetikabrnojizni.cz\/"/);
});
await check('www redirect',async()=>{
  const response=await request('https://www.dianetikabrnojizni.cz/',308);
  assert.equal(response.headers.get('location'),site+'/');
});
for(const path of ['/eshop.html','/objednavka.html','/registrace.html','/styles.css','/script.js?v=13']){
  await check(path,async()=>{await body(await request(site+path));});
}
await check('Health',async()=>{assert.equal(JSON.parse(await body(await request(site+'/api/health'))).ok,true);});
await check('Checkout public configuration',async()=>{
  const config=JSON.parse(await body(await request(site+'/api/config')));
  assert.equal(config.checkoutEnabled,true);assert.equal(config.adminAuthEnabled,true);
  assert.equal(config.products.length,12);assert.equal(config.products.find(p=>p.id==='p1')?.price,47500);
  assert.ok(config.slots.length>=8);assert.match(config.turnstileSiteKey,/^0x[A-Za-z0-9_-]+$/);
});
await check('Shipping tariff still usable (calculation only)',async()=>{
  const response=await request(site+'/api/shipping',200,{method:'POST',headers:{Origin:site,'Content-Type':'application/json'},body:JSON.stringify({items:[{id:'p1',quantity:1}]})});
  const quote=JSON.parse(await body(response));assert.ok(Number.isSafeInteger(quote.amount)&&quote.amount>0);
  assert.match(quote.tariffUntil||'',/^20\d{2}-\d{2}-\d{2}$/);
  assert.ok(Date.parse(quote.tariffUntil+'T23:59:59Z')-Date.now()>3*86400000,'Shipping tariff expires within 3 days; update the verified tariff');
});
await check('Admin rejects anonymous access',async()=>{
  await body(await request(site+'/api/admin/overview',401));
  const response=await request(site+'/admin.html',303);assert.equal(response.headers.get('location'),site+'/admin-prihlaseni.html');
});
await check('Sitemap',async()=>{
  const xml=await body(await request(site+'/sitemap.xml'));
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.ok(urls.length>=14);assert.ok(urls.every(url=>url.startsWith(site+'/')));
});
await check('Quanda consent and new-tab entry',async()=>{
  const html=await body(await request(site+'/test-osobnosti.html'));
  assert.match(html,/id="ocaConsent"[^>]*required/);
  assert.match(html,/id="ocaGate"[^>]*target="_blank"/);assert.ok(html.includes(survey));
});
await check('External Quanda welcome (no answers submitted)',async()=>{
  assert.match(await body(await request(survey)),/<title>Osobnostní dotazník<\/title>/);
});
console.log(`${new Date().toISOString()}: ${failures?'FAILED':'All public checks passed'}. No orders, messages or shipments created.`);
process.exitCode=failures?1:0;
