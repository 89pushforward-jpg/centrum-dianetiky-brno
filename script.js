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
