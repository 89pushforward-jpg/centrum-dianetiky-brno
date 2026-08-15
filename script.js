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

// formuláře (ukázka — naživo půjde na e-mail)
document.querySelectorAll('form[data-demo]').forEach(f=>{
  f.addEventListener('submit',function(e){
    e.preventDefault();
    this.innerHTML='<div style="padding:26px 4px"><h3 style="font-size:19px;font-weight:800">Děkujeme za Vaši zprávu</h3><p style="font-size:14.5px;color:#666;margin-top:8px">Ozveme se Vám co nejdříve to bude možné.<br><small style="color:#8a8a8a">(Náhledová ukázka — na ostrém webu zpráva dorazí přímo na e-mail centra.)</small></p></div>';
  });
});
