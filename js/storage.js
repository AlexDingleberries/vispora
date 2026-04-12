const KEYS = {
  THEME:'vispora_theme', ACCENT:'vispora_accent', FONT_SIZE:'vispora_fontsize',
  CLOAK_MODE:'vispora_cloak_mode', CLOAK_URL:'vispora_cloak_url',
  AUTO_CLOAK:'vispora_auto_cloak', PANIC_KEY:'vispora_panic_key',
  FAVORITES:'vispora_favorites', HISTORY:'vispora_history', PLAYTIME:'vispora_playtime',
  PARTICLES:'vispora_particles',
  MEDIA_FAVS:'vispora_media_favs',  // [{id, type:'movie'|'tv'}]
  MEDIA_HIST:'vispora_media_hist',  // [{id, type, title, poster_path, lastPlayed}]
  TV_PROG:'vispora_tv_prog',        // {showId: {season, episode}}
};

function get(k,d=null){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch{return d;}}
function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function remove(k){try{localStorage.removeItem(k);}catch{}}

/* ---- Theme / Appearance ---- */
function getTheme(){return get(KEYS.THEME,'dark');}
function setTheme(v){set(KEYS.THEME,v);}
function getAccent(){return get(KEYS.ACCENT,'#ffffff');}
function setAccent(v){set(KEYS.ACCENT,v);}
function getFontSize(){return get(KEYS.FONT_SIZE,'medium');}
function setFontSize(v){set(KEYS.FONT_SIZE,v);}

/* ---- Cloak / Panic ---- */
function getCloakMode(){return get(KEYS.CLOAK_MODE,'google');}
function setCloakMode(v){set(KEYS.CLOAK_MODE,v);}
function getCloakUrl(){return get(KEYS.CLOAK_URL,'');}
function setCloakUrl(v){set(KEYS.CLOAK_URL,v);}
function getAutoCloak(){return get(KEYS.AUTO_CLOAK,false);}
function setAutoCloak(v){set(KEYS.AUTO_CLOAK,v);}
function getPanicKey(){return get(KEYS.PANIC_KEY,'BracketRight');}
function setPanicKey(v){set(KEYS.PANIC_KEY,v);}

/* ---- Visp favorites ---- */
function getFavorites(){return get(KEYS.FAVORITES,[]);}
function isFavorite(id){return getFavorites().includes(Number(id));}
function toggleFavorite(id){
  id=Number(id);const favs=getFavorites();const i=favs.indexOf(id);
  if(i===-1)favs.push(id);else favs.splice(i,1);set(KEYS.FAVORITES,favs);return i===-1;
}

/* ---- Visp history ---- */
function getHistory(){return get(KEYS.HISTORY,[]);}
function addToHistory(visp){
  let h=getHistory().filter(x=>x.id!==visp.id);
  h.unshift({id:visp.id,name:visp.name,cover:visp.cover,lastPlayed:Date.now(),totalPlaytime:getPlaytime(visp.id)});
  if(h.length>50)h=h.slice(0,50);set(KEYS.HISTORY,h);
}
function removeFromHistory(id){set(KEYS.HISTORY,getHistory().filter(h=>h.id!==Number(id)));}

/* ---- Playtime ---- */
function getPlaytime(id){return(get(KEYS.PLAYTIME,{})[String(id)])||0;}
function addPlaytime(id,ms){
  const d=get(KEYS.PLAYTIME,{});d[String(id)]=(d[String(id)]||0)+ms;set(KEYS.PLAYTIME,d);
  const h=getHistory();const e=h.find(x=>x.id===Number(id));if(e){e.totalPlaytime=d[String(id)];set(KEYS.HISTORY,h);}
  return d[String(id)];
}
function getAllPlaytime(){return get(KEYS.PLAYTIME,{});}

/* ---- Particles ---- */
function getParticlesConfig(){
  return get(KEYS.PARTICLES,{enabled:true,count:40,speed:0.6,size:1.5,opacity:0.25,linked:true,color:'accent'});
}
function setParticlesConfig(v){set(KEYS.PARTICLES,v);}

/* ================================================================
   UNIFIED MEDIA (Movies + TV treated identically)
   ================================================================ */

/* Favorites — [{id:Number, type:'movie'|'tv'}] */
function getMediaFavorites(){return get(KEYS.MEDIA_FAVS,[]);}
function isMediaFavorite(id,type){
  return getMediaFavorites().some(f=>f.id===Number(id)&&f.type===type);
}
function toggleMediaFavorite(id,type){
  id=Number(id);
  const favs=getMediaFavorites();
  const idx=favs.findIndex(f=>f.id===id&&f.type===type);
  if(idx===-1)favs.push({id,type});
  else favs.splice(idx,1);
  set(KEYS.MEDIA_FAVS,favs);
  return idx===-1;
}

/* History — [{id, type, title, poster_path, lastPlayed}] */
function getMediaHistory(){return get(KEYS.MEDIA_HIST,[]);}
function addToMediaHistory(media,type){
  // media: TMDB object (movie has .title, tv has .name)
  const id=Number(media.id);
  const title=media.title||media.name||'Unknown';
  let h=getMediaHistory().filter(x=>!(x.id===id&&x.type===type));
  h.unshift({id,type,title,poster_path:media.poster_path||null,lastPlayed:Date.now()});
  if(h.length>100)h=h.slice(0,100);
  set(KEYS.MEDIA_HIST,h);
}

/* TV episode progress — per show */
function getTVProgress(showId){return(get(KEYS.TV_PROG,{})[String(showId)])||{season:1,episode:1};}
function setTVProgress(showId,season,episode){
  const d=get(KEYS.TV_PROG,{});
  d[String(showId)]={season:Number(season),episode:Number(episode)};
  set(KEYS.TV_PROG,d);
}

/* ---- Utilities ---- */
function formatTime(ms){
  if(!ms||ms<5000)return'';
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  if(h>0)return m>0?`${h}h ${m}m`:`${h}h`;
  return`${m}m`;
}
function exportData(){
  const d={};Object.values(KEYS).forEach(k=>{const v=localStorage.getItem(k);if(v!==null)d[k]=JSON.parse(v);});
  return JSON.stringify(d,null,2);
}
function importData(json){const d=JSON.parse(json);Object.entries(d).forEach(([k,v])=>set(k,v));}
function clearAll(){Object.values(KEYS).forEach(k=>remove(k));}

window.VStorage={
  KEYS,get,set,remove,
  getTheme,setTheme,getAccent,setAccent,getFontSize,setFontSize,
  getCloakMode,setCloakMode,getCloakUrl,setCloakUrl,getAutoCloak,setAutoCloak,getPanicKey,setPanicKey,
  getFavorites,isFavorite,toggleFavorite,
  getHistory,addToHistory,removeFromHistory,
  getPlaytime,addPlaytime,getAllPlaytime,
  getParticlesConfig,setParticlesConfig,
  formatTime,exportData,importData,clearAll,
  /* Media */
  getMediaFavorites,isMediaFavorite,toggleMediaFavorite,
  getMediaHistory,addToMediaHistory,
  getTVProgress,setTVProgress,
};