const IC = {
  home: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  grid: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  film: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,
  tv: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  settings: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  star: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  x: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  maximize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
  minimize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`,
  reload: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  camera: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  chevronLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  search: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  alert: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  key: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  zap: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

// ---- Toast ----
function showToast(msg, type='info', duration=3000){
  let c=document.getElementById('toast-container');
  if(!c){c=document.createElement('div');c.id='toast-container';document.body.appendChild(c);}
  const t=document.createElement('div');
  t.className=`toast${type!=='info'?` toast-${type}`:''}`;
  t.textContent=msg;c.appendChild(t);
  setTimeout(()=>{t.classList.add('toast-out');setTimeout(()=>t.remove(),220);},duration);
}

// ---- Modal ----
function showModal({title,message,confirmText='Confirm',cancelText='Cancel',dangerous=false}){
  return new Promise(resolve=>{
    const o=document.createElement('div');
    o.className='modal-overlay';
    o.style.zIndex='30000';
    o.innerHTML=`<div class="modal" role="dialog" aria-modal="true">
      <h3>${esc(title)}</h3><p>${esc(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary modal-cancel">${esc(cancelText)}</button>
        <button class="btn ${dangerous?'btn-danger':'btn-primary'} modal-confirm">${esc(confirmText)}</button>
      </div></div>`;
    o.querySelector('.modal-cancel').onclick=()=>{o.remove();resolve(false);};
    o.querySelector('.modal-confirm').onclick=()=>{o.remove();resolve(true);};
    o.onclick=e=>{if(e.target===o){o.remove();resolve(false);}};
    document.body.appendChild(o);o.querySelector('.modal-confirm').focus();
  });
}

// ---- Escape HTML ----
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ---- Visp card HTML ----
function makeCard(visp,opts={}){
  const{showRemove=false,linkToPlayer=true}=opts;
  const pt=VStorage.getPlaytime(visp.id);
  const timeStr=VStorage.formatTime(pt);
  const isFav=VStorage.isFavorite(visp.id);
  const tag=linkToPlayer?'a':'div';
  const href=linkToPlayer?`player.html?id=${visp.id}`:'#';
  return`<${tag} ${linkToPlayer?`href="${href}"`:''}
    class="visp-card" data-id="${visp.id}" tabindex="0"
    aria-label="${esc(visp.name)}" role="${linkToPlayer?'link':'article'}">
    <img class="visp-card-img" src="${esc(visp.cover||'')}" alt="${esc(visp.name)}"
      loading="lazy" decoding="async"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="visp-card-placeholder" style="display:none;position:absolute;inset:0">🎮</div>
    <div class="visp-card-overlay">
      <div class="visp-card-title">${esc(visp.name)}</div>
      ${timeStr?`<div class="visp-card-playtime">${IC.clock} ${timeStr}</div>`:''}
    </div>
    <button class="visp-card-star${isFav?' favorited':''}" data-id="${visp.id}"
      aria-label="${isFav?'Unfavorite':'Favorite'} ${esc(visp.name)}" type="button">
      ${isFav?IC.starFilled:IC.star}
    </button>
    ${showRemove?`<button class="visp-card-remove" data-id="${visp.id}" aria-label="Remove from history" type="button">${IC.x}</button>`:''}
  </${tag}>`;
}

// ---- Star ----
function initStars(container){
  container.addEventListener('click',e=>{
    const btn=e.target.closest('.visp-card-star');
    if(!btn)return;e.preventDefault();e.stopPropagation();
    const id=Number(btn.dataset.id);
    const added=VStorage.toggleFavorite(id);
    btn.classList.toggle('favorited',added);
    btn.innerHTML=added?IC.starFilled:IC.star;
    btn.setAttribute('aria-label',`${added?'Unfavorite':'Favorite'} visp`);
    showToast(added?'Added to favorites':'Removed from favorites');
  });
}

// ---- Datetime ----
function startDatetime(el){
  function up(){
    const n=new Date();
    const d=n.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    const t=n.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    el.innerHTML=`${d}&nbsp;&nbsp;${t}`;
  }up();return setInterval(up,1000);
}

// ---- Load visps ----
async function loadVisps(){
  try{const r=await fetch('data/visps.json');const d=await r.json();return Array.isArray(d)?d:(d.visps||d);}
  catch(e){console.error(e);return[];}
}

// ---- Nav HTML ----
function navHTML(active){
  return`<nav class="nav" role="navigation" aria-label="Main">
    <a href="home.html" class="nav-logo">vispora</a>
    <ul class="nav-links">
      <li><a href="home.html" ${active==='home'?'class="active"':''}>
        <span class="nav-icon">${IC.home}</span><span>Home</span></a></li>
      <li><a href="visps.html" ${active==='visps'?'class="active"':''}>
        <span class="nav-icon">${IC.grid}</span><span>Visps</span></a></li>
      <li><a href="movies.html" ${active==='movies'?'class="active"':''}>
        <span class="nav-icon">${IC.film}</span><span>Movies</span></a></li>
      <li><a href="tv.html" ${active==='tv'?'class="active"':''}>
        <span class="nav-icon">${IC.tv}</span><span>TV</span></a></li>
      <li><a href="settings.html" ${active==='settings'?'class="active"':''}>
        <span class="nav-icon">${IC.settings}</span><span>Settings</span></a></li>
    </ul>
    <div class="nav-right">
      <div class="nav-datetime" id="nav-datetime"></div>
      <button class="btn-panic" id="nav-panic" type="button">${IC.alert} PANIC</button>
    </div>
  </nav>`;
}

// ---- Panic btn ----
function initPanic(){
  document.querySelectorAll('#nav-panic,.btn-panic').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const m=VStorage.getCloakMode(),cu=VStorage.getCloakUrl();
      if(m==='google')window.location.replace(VCloak.CLOAK_TARGETS.google.url);
      else if(m==='custom'&&cu)window.location.replace(cu);
      else{VCloak.cloakTab('google');showToast('Tab cloaked');}
    });
  });
}

// ---- Particles ----
function initParticles(){
  const cfg=VStorage.getParticlesConfig();
  if(!cfg.enabled){const el=document.getElementById('particles-js');if(el)el.style.display='none';return;}
  const accent=VStorage.getAccent();
  const color=cfg.color==='accent'?accent:'#ffffff';
  if(window.particlesJS){
    particlesJS('particles-js',{
      particles:{
        number:{value:cfg.count,density:{enable:true,value_area:800}},
        color:{value:color},shape:{type:'circle'},
        opacity:{value:cfg.opacity,random:true},
        size:{value:cfg.size,random:true},
        line_linked:{enable:cfg.linked,distance:150,color:color,opacity:cfg.opacity*0.5,width:1},
        move:{enable:true,speed:cfg.speed,direction:'none',random:true,out_mode:'out'},
      },
      interactivity:{detect_on:'canvas',events:{onhover:{enable:true,mode:'repulse'},onclick:{enable:true,mode:'push'},resize:true},modes:{repulse:{distance:80},push:{particles_nb:2}}},
      retina_detect:true
    });
  }
}

function reloadParticles(){
  if(window.pJSDom&&window.pJSDom.length>0){
    window.pJSDom.forEach(p=>{try{p.pJS.fn.vendors.destroypJS();}catch(e){}});
    window.pJSDom=[];
  }
  initParticles();
}

window.VApp={IC,esc,showToast,showModal,makeCard,initStars,startDatetime,loadVisps,navHTML,initPanic,initParticles,reloadParticles};