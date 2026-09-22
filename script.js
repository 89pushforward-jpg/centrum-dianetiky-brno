// mobilní menu
const burger=document.getElementById('burger'),navLinks=document.getElementById('navLinks');
if(burger&&navLinks){
  burger.addEventListener('click',()=>navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));
}

// živý stav — úterý–sobota 9:00–18:00 (čas ČR)
(function(){
  const OPEN=9, CLOSE=18;
  const order=['po','út','st','čt','pá','so','ne'];
  const openDays=['út','st','čt','pá','so'];
  const locative={'út':'v úterý','st':'ve středu','čt':'ve čtvrtek','pá':'v pátek','so':'v sobotu'};
  const parts=new Intl.DateTimeFormat('cs-CZ',{timeZone:'Europe/Prague',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value;
  const day=(get('weekday')||'').toLowerCase().replace('.','');
  const now=Number(get('hour'))+Number(get('minute'))/60;
  const workday=openDays.includes(day);
  const open=workday&&now>=OPEN&&now<CLOSE;
  const dot=document.getElementById('topDot'),st=document.getElementById('topStatus'),note=document.getElementById('todayNote');
  if(!dot||!st||!note)return;
  if(open){st.textContent='Otevřeno';note.textContent='— dnes do 18:00';}
  else{
    dot.classList.add('shut');st.textContent='Zavřeno';
    if(workday&&now<OPEN){note.textContent='— otevíráme dnes v 9:00';}
    else{
      const i=order.indexOf(day);
      for(let s=1;s<=7;s++){
        const d=order[(i+s)%7];
        if(openDays.includes(d)){note.textContent='— otevíráme '+(s===1?'zítra':locative[d])+' v 9:00';break;}
      }
    }
  }
})();

// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// záložky (dianetika)
document.querySelectorAll('.tabs button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    document.getElementById(b.dataset.pane).classList.add('on');
  });
});

// ---- rozvrh kurzovky — pravidelný týdenní rozvrh (propojeno s administrací) ----
(function(){
  const el=document.getElementById('weekSched');
  if(!el)return;
  const dayNames=['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];
  function defaultWeek(){
    // dokud si admin nevytvoří vlastní rozvrh — ukázkové pravidelné hodiny
    return {
      0:[{time:'17:00–19:00',what:'Kurzy na zlepšení života'}],
      1:[{time:'09:30–12:30',what:'Hubbardův dianetický seminář'}],
      2:[],
      3:[{time:'17:00–19:00',what:'Kurz osobní efektivity'}],
      4:[],
      5:[{time:'09:30–13:00',what:'Hubbardův dianetický seminář'},{time:'14:00–16:00',what:'Kurz Komunikací k úspěchu'}],
      6:[],
    };
  }
  let week;
  try{week=JSON.parse(localStorage.getItem('cdb_admin_week'));}catch(e){week=null;}
  if(!week||typeof week!=='object')week=defaultWeek();
  const head='<div class="head"><b>Rozvrh kurzovky</b><span>Pravidelné hodiny v týdnu</span></div>';
  const body=dayNames.map((name,i)=>{
    const slots=week[i]||[];
    const inner=slots.length
      ? slots.map(s=>`<div class="slot"><span class="time">${s.time}</span><span class="what">${s.what}</span></div>`).join('')
      : '<div class="none">Bez pravidelné výuky</div>';
    return `<div class="day"><div class="dname">${name}</div>${inner}</div>`;
  }).join('');
  el.innerHTML=head+body;
})();

// ---- rozvrh termínů/seminářů na stránce Kontakt (propojeno s administrací přes localStorage) ----
(function(){
  const el=document.getElementById('sched');
  if(!el)return;
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const nextDow=(from,dow)=>{const d=new Date(from);d.setHours(0,0,0,0);do{d.setDate(d.getDate()+1);}while(d.getDay()!==dow);return d;};
  // výchozí termíny (dokud admin nevytvoří vlastní) — vždy relativní k dnešku
  function defaultEvents(){
    const t=new Date(),sat1=nextDow(t,6),sat2=nextDow(sat1,6),sat3=nextDow(sat2,6),tue=nextDow(t,2);
    return [
      {date:iso(sat1),title:'Hubbardův dianetický seminář'},
      {date:iso(tue),title:'Kurz osobní efektivity'},
      {date:iso(sat2),title:'Den otevřených dveří'},
      {date:iso(sat3),title:'Hubbardův dianetický seminář'},
    ];
  }
  let events;
  try{events=JSON.parse(localStorage.getItem('cdb_admin_events'));}catch(e){events=null;}
  if(!Array.isArray(events)||!events.length)events=defaultEvents();
  const today=new Date();today.setHours(0,0,0,0);
  const months=['led','úno','bře','dub','kvě','čvn','čvc','srp','zář','říj','lis','pro'];
  const dows=['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
  const upcoming=events.map(e=>({...e,d:new Date(e.date+'T00:00:00')}))
    .filter(e=>!isNaN(e.d)&&e.d>=today).sort((a,b)=>a.d-b.d).slice(0,6);
  const head='<div class="head"><b>Rozvrh — nejbližší termíny</b><span>Semináře a jednorázové akce centra</span></div>';
  const body=upcoming.length
    ? upcoming.map(e=>`<div class="item"><div class="date"><b>${e.d.getDate()}</b><span>${months[e.d.getMonth()]}</span></div><div class="info"><b>${e.title}</b><span>${dows[e.d.getDay()]}</span></div></div>`).join('')
    : '<div class="empty">Aktuálně nejsou vypsané žádné termíny.<br>Ozvěte se nám a rádi Vám poradíme.</div>';
  el.innerHTML=head+body;
})();

// formuláře (ukázka — naživo půjde na e-mail)
document.querySelectorAll('form[data-demo]').forEach(f=>{
  f.addEventListener('submit',function(e){
    e.preventDefault();
    this.innerHTML='<div style="padding:26px 4px"><h3 style="font-size:19px;font-weight:800">Děkujeme za Vaši zprávu</h3><p style="font-size:14.5px;color:#666;margin-top:8px">Ozveme se Vám co nejdříve to bude možné.<br><small style="color:#8a8a8a">(Náhledová ukázka — na ostrém webu zpráva dorazí přímo na e-mail centra.)</small></p></div>';
  });
});

// registrace kurzů: statický web předá vyplněnou přihlášku do e-mailu centra
(function(){
  const form=document.querySelector('form[data-registration]');
  if(!form)return;
  const course=new URLSearchParams(location.search).get('kurz')||'Kurz';
  const title=document.getElementById('registrationCourse');
  if(title)title.textContent=course;
  const subject=document.getElementById('registrationSubject');
  if(subject)subject.value=course;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const body=['Dobrý den,','','chci se přihlásit na: '+data.get('course'),'','Jméno: '+data.get('name'),'E-mail: '+data.get('email'),'Telefon: '+data.get('phone'),'','Poznámka: '+(data.get('message')||''),'','Souhlas se zpracováním osobních údajů: ano'].join('\n');
    const href='mailto:info@centrum-inspiria.cz?subject='+encodeURIComponent('Přihláška: '+data.get('course'))+'&body='+encodeURIComponent(body);
    const note=document.getElementById('registrationFeedback');
    if(note){note.hidden=false;note.textContent='Otevřeme Vám e-mailovou zprávu s vyplněnou přihláškou. Před odesláním ji můžete zkontrolovat.';}
    location.href=href;
  });
})();

// OCA: návštěvník nejdřív výslovně odsouhlasí předání na existující dotazník.
(function(){
  const consent=document.getElementById('ocaConsent'),button=document.getElementById('ocaStart'),frame=document.getElementById('ocaFrame');
  if(!consent||!button||!frame)return;
  button.addEventListener('click',()=>{
    if(!consent.checked){consent.focus();return;}
    frame.src='https://inspiria.onquanda.com/survey/db80d49c81501bb3f0f61db77910e596/';
    frame.hidden=false;button.closest('.oca-gate').hidden=true;
  });
})();


// e-shop — lokální košík. Platba a doprava se doplní po napojení bezpečného backendu.
(function(){
  const grid=document.getElementById('eshopGrid');
  const panel=document.getElementById('cartPanel');
  if(!grid||!panel)return;
  const itemsEl=document.getElementById('cartItems');
  const emptyEl=document.getElementById('cartEmpty');
  const totalEl=document.getElementById('cartTotal');
  const countEl=document.getElementById('cartCount');
  const triggerCountEl=document.getElementById('cartTriggerCount');
  const toggle=document.getElementById('cartToggle');
  const close=document.getElementById('cartClose');
  const backdrop=document.getElementById('cartBackdrop');
  const summaryEl=document.getElementById('cartSummary');
  const format=new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0});
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem('cdb_cart_v1'))||[];}catch(e){cart=[];}
  const save=()=>localStorage.setItem('cdb_cart_v1',JSON.stringify(cart));
  const render=()=>{
    const amount=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
    const count=cart.reduce((sum,item)=>sum+item.quantity,0);
    countEl.textContent=count;triggerCountEl.textContent=count;
    emptyEl.hidden=Boolean(cart.length);itemsEl.hidden=!cart.length;summaryEl.hidden=!cart.length;
    itemsEl.innerHTML=cart.map(item=>`<div class="cart-item"><div><b>${item.name}</b><div class="cart-quantity"><button type="button" data-cart-action="decrease" data-id="${item.id}" aria-label="Odebrat jeden kus">−</button><span>${item.quantity} ks</span><button type="button" data-cart-action="increase" data-id="${item.id}" aria-label="Přidat jeden kus">+</button></div></div><div class="cart-item-price"><b>${format.format(item.price*item.quantity)}</b><button type="button" class="cart-remove" data-cart-action="remove" data-id="${item.id}">Odstranit</button></div></div>`).join('');
    totalEl.textContent=format.format(amount);save();
  };
  const openCart=()=>{panel.classList.add('open');panel.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');backdrop.hidden=false;};
  const closeCart=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false');backdrop.hidden=true;};
  toggle.addEventListener('click',openCart);close.addEventListener('click',closeCart);backdrop.addEventListener('click',closeCart);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart();});
  const addProduct=card=>{
    const id=card.dataset.productId;let item=cart.find(x=>x.id===id);
    if(item)item.quantity+=1;else cart.push({id,name:card.dataset.productName,price:Number(card.dataset.productPrice),quantity:1});
    render();
  };
  grid.addEventListener('click',e=>{
    const button=e.target.closest('.add-to-cart');if(!button)return;
    addProduct(button.closest('.product-card'));openCart();button.textContent='Přidáno';setTimeout(()=>button.textContent='Do košíku',900);
  });
  itemsEl.addEventListener('click',e=>{
    const button=e.target.closest('[data-cart-action]');if(!button)return;
    const index=cart.findIndex(x=>x.id===button.dataset.id);if(index<0)return;
    if(button.dataset.cartAction==='increase')cart[index].quantity+=1;
    if(button.dataset.cartAction==='decrease')cart[index].quantity-=1;
    if(button.dataset.cartAction==='remove'||cart[index]?.quantity<1)cart.splice(index,1);
    render();
  });
  document.getElementById('cartCheckout').addEventListener('click',()=>{
    const summary=cart.map(i=>`${i.name} — ${i.quantity} ks — ${format.format(i.price*i.quantity)}`).join('\n');
    const total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
    alert(`Objednávka bude v dalším kroku doplněna o dopravu Zásilkovnou a bezpečnou platbu Stripe.\n\n${summary}\n\nCelkem: ${format.format(total)}`);
  });
  render();
  const requestedProduct=new URLSearchParams(location.search).get('add');
  if(requestedProduct){
    const requestedCard=grid.querySelector(`[data-product-id="${requestedProduct}"]`);
    if(requestedCard){addProduct(requestedCard);openCart();history.replaceState(null,'',location.pathname);}
  }
})();
