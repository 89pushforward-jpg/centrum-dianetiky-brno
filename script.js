// mobilní menu
const burger=document.getElementById('burger'),navLinks=document.getElementById('navLinks');
if(burger&&navLinks){
  burger.addEventListener('click',()=>navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));
}

// živý stav — Po–Pá 9:00–17:00 (čas ČR)
(function(){
  const parts=new Intl.DateTimeFormat('cs-CZ',{timeZone:'Europe/Prague',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value;
  const day=(get('weekday')||'').toLowerCase().replace('.','');
  const now=Number(get('hour'))+Number(get('minute'))/60;
  const workday=['po','út','st','čt','pá'].includes(day);
  const open=workday&&now>=9&&now<17;
  const dot=document.getElementById('topDot'),st=document.getElementById('topStatus'),note=document.getElementById('todayNote');
  if(!dot||!st||!note)return;
  if(open){st.textContent='Otevřeno';note.textContent='— dnes do 17:00';}
  else{
    dot.classList.add('shut');st.textContent='Zavřeno';
    if(workday&&now<9)note.textContent='— otevíráme dnes v 9:00';
    else if(day==='pá'||day==='so')note.textContent='— otevíráme v pondělí v 9:00';
    else note.textContent='— otevíráme zítra v 9:00';
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
