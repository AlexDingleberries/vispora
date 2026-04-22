const KEYS = {
  THEME:'vispora_theme', ACCENT:'vispora_accent', FONT_SIZE:'vispora_fontsize',
  CLOAK_MODE:'vispora_cloak_mode', CLOAK_URL:'vispora_cloak_url',
  AUTO_CLOAK:'vispora_auto_cloak', PANIC_KEY:'vispora_panic_key',
  FAVORITES:'vispora_favorites', HISTORY:'vispora_history', PLAYTIME:'vispora_playtime',
  PARTICLES:'vispora_particles',
  MEDIA_FAVS:'vispora_media_favs',
  MEDIA_HIST:'vispora_media_hist',
  MEDIA_TIME:'vispora_media_time',
  TV_PROG:'vispora_tv_prog',
  ANIME_PROG:'vispora_anime_prog',
  AI_CHATS:'vispora_ai_chats',
  AI_FAVS:'vispora_ai_favs',
  MEDIA_PROG:'vispora_media_prog',
  MUSIC_FAVS:'vispora_music_favs',
  MUSIC_QUEUE:'vispora_music_queue',
  MUSIC_PLAYLIST:'vispora_music_playlist',
  MUSIC_STATE:'vispora_music_state',
};

function get(k,d=null){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch{return d;}}
function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function remove(k){try{localStorage.removeItem(k);}catch{}}

function getTheme(){return get(KEYS.THEME,'dark');}
function setTheme(v){set(KEYS.THEME,v);}
function getAccent(){return get(KEYS.ACCENT,'#ffffff');}
function setAccent(v){set(KEYS.ACCENT,v);}
function getFontSize(){return get(KEYS.FONT_SIZE,'medium');}
function setFontSize(v){set(KEYS.FONT_SIZE,v);}
function getCloakMode(){return get(KEYS.CLOAK_MODE,'google');}
function setCloakMode(v){set(KEYS.CLOAK_MODE,v);}
function getCloakUrl(){return get(KEYS.CLOAK_URL,'');}
function setCloakUrl(v){set(KEYS.CLOAK_URL,v);}
function getAutoCloak(){return get(KEYS.AUTO_CLOAK,false);}
function setAutoCloak(v){set(KEYS.AUTO_CLOAK,v);}
function getPanicKey(){return get(KEYS.PANIC_KEY,'BracketRight');}
function setPanicKey(v){set(KEYS.PANIC_KEY,v);}

function getFavorites(){return get(KEYS.FAVORITES,[]);}
function isFavorite(id){return getFavorites().includes(Number(id));}
function toggleFavorite(id){
  id=Number(id);const favs=getFavorites();const i=favs.indexOf(id);
  if(i===-1)favs.push(id);else favs.splice(i,1);set(KEYS.FAVORITES,favs);return i===-1;
}

function getHistory(){return get(KEYS.HISTORY,[]);}
function addToHistory(game){
  let h=getHistory().filter(x=>x.id!==game.id);
  h.unshift({id:game.id,name:game.name,cover:game.cover,lastPlayed:Date.now(),totalPlaytime:getPlaytime(game.id)});
  if(h.length>50)h=h.slice(0,50);set(KEYS.HISTORY,h);
}
function removeFromHistory(id){set(KEYS.HISTORY,getHistory().filter(h=>h.id!==Number(id)));}

function getPlaytime(id){return(get(KEYS.PLAYTIME,{})[String(id)])||0;}
function addPlaytime(id,ms){
  const d=get(KEYS.PLAYTIME,{});d[String(id)]=(d[String(id)]||0)+ms;set(KEYS.PLAYTIME,d);
  const h=getHistory();const e=h.find(x=>x.id===Number(id));if(e){e.totalPlaytime=d[String(id)];set(KEYS.HISTORY,h);}
  return d[String(id)];
}
function resetPlaytime(id){
  const d=get(KEYS.PLAYTIME,{});delete d[String(id)];set(KEYS.PLAYTIME,d);
  const h=getHistory();const e=h.find(x=>x.id===Number(id));if(e){e.totalPlaytime=0;set(KEYS.HISTORY,h);}
}
function getAllPlaytime(){return get(KEYS.PLAYTIME,{});}

function getParticlesConfig(){
  return get(KEYS.PARTICLES,{enabled:true,count:40,speed:0.6,size:1.5,opacity:0.25,linked:true,color:'accent'});
}
function setParticlesConfig(v){set(KEYS.PARTICLES,v);}

/* ---- Media ---- */
function getMediaFavorites(){return get(KEYS.MEDIA_FAVS,[]);}
function isMediaFavorite(id,type){return getMediaFavorites().some(f=>f.id===Number(id)&&f.type===type);}
function toggleMediaFavorite(id,type){
  id=Number(id);const favs=getMediaFavorites();
  const idx=favs.findIndex(f=>f.id===id&&f.type===type);
  if(idx===-1)favs.push({id,type});else favs.splice(idx,1);
  set(KEYS.MEDIA_FAVS,favs);return idx===-1;
}
function getMediaHistory(){return get(KEYS.MEDIA_HIST,[]);}
function addToMediaHistory(media,type){
  const id=Number(media.id);
  const title=media.title||media.name||'Unknown';
  const poster=media.poster_path||media._cover||null;
  let h=getMediaHistory().filter(x=>!(x.id===id&&x.type===type));
  h.unshift({id,type,title,poster_path:poster,lastPlayed:Date.now()});
  if(h.length>100)h=h.slice(0,100);set(KEYS.MEDIA_HIST,h);
}
function removeFromMediaHistory(id,type){
  set(KEYS.MEDIA_HIST,getMediaHistory().filter(h=>!(h.id===Number(id)&&h.type===type)));
}
function getMediaWatchTime(id,type){return(get(KEYS.MEDIA_TIME,{})[`${type}_${id}`])||0;}
function addMediaWatchTime(id,type,ms){
  if(!ms||ms<2000)return 0;
  const d=get(KEYS.MEDIA_TIME,{});const key=`${type}_${id}`;
  d[key]=(d[key]||0)+ms;set(KEYS.MEDIA_TIME,d);return d[key];
}

/* Media progress tracking (from postMessage) */
function getMediaProgress(id,type){return(get(KEYS.MEDIA_PROG,{})[`${type}_${id}`])||null;}
function setMediaProgress(id,type,currentTime,duration){
  const d=get(KEYS.MEDIA_PROG,{});const key=`${type}_${id}`;
  const percent=duration>0?Math.round((currentTime/duration)*100):0;
  d[key]={currentTime:Math.round(currentTime),duration:Math.round(duration),percent,updated:Date.now()};
  set(KEYS.MEDIA_PROG,d);return d[key];
}
function clearMediaProgress(id,type){const d=get(KEYS.MEDIA_PROG,{});delete d[`${type}_${id}`];set(KEYS.MEDIA_PROG,d);}

function getTVProgress(showId){return(get(KEYS.TV_PROG,{})[String(showId)])||{season:1,episode:1};}
function setTVProgress(showId,season,episode){
  const d=get(KEYS.TV_PROG,{});d[String(showId)]={season:Number(season),episode:Number(episode)};set(KEYS.TV_PROG,d);
}
function getAnimeProgress(animeId){return(get(KEYS.ANIME_PROG,{})[String(animeId)])||{episode:1};}
function setAnimeProgress(animeId,episode){
  const d=get(KEYS.ANIME_PROG,{});d[String(animeId)]={episode:Number(episode)};set(KEYS.ANIME_PROG,d);
}

/* ---- AI Chat Storage ---- */
function getAIChats(){return get(KEYS.AI_CHATS,[]);}
function saveAIChat(title,model,messages){
  if(!messages||!messages.length)return null;
  const chats=getAIChats();
  const id='chat_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  chats.unshift({id,title:title||'Untitled Chat',model:model||'',date:Date.now(),messageCount:messages.length,messages});
  if(chats.length>50)chats.splice(50);set(KEYS.AI_CHATS,chats);return id;
}
function deleteAIChat(id){
  set(KEYS.AI_CHATS,getAIChats().filter(c=>c.id!==id));
  set(KEYS.AI_FAVS,getAIFavs().filter(f=>f.chatId!==id));
}
function getAIChatById(id){return getAIChats().find(c=>c.id===id)||null;}

function getAIFavs(){return get(KEYS.AI_FAVS,[]);}
function addAIFav(content,model,chatId){
  const favs=getAIFavs();
  const id='fav_'+Date.now();
  favs.unshift({id,content,model:model||'',chatId:chatId||null,date:Date.now()});
  if(favs.length>200)favs.splice(200);set(KEYS.AI_FAVS,favs);return id;
}
function removeAIFav(id){set(KEYS.AI_FAVS,getAIFavs().filter(f=>f.id!==id));}
function isAIFavContent(content){return getAIFavs().some(f=>f.content===content);}

/* ---- Music ---- */
function getMusicFavorites(){return get(KEYS.MUSIC_FAVS,[]);}
function isMusicFavorite(id){return getMusicFavorites().some(x=>String(x)===String(id));}
function toggleMusicFavorite(id){
  const key=String(id);const favs=getMusicFavorites();const idx=favs.findIndex(x=>String(x)===key);
  if(idx===-1)favs.unshift(key);else favs.splice(idx,1);
  set(KEYS.MUSIC_FAVS,favs);return idx===-1;
}
function getMusicQueue(){return get(KEYS.MUSIC_QUEUE,[]);}
function setMusicQueue(v){set(KEYS.MUSIC_QUEUE,Array.isArray(v)?v:[]);}
function getMusicPlaylist(){return get(KEYS.MUSIC_PLAYLIST,[]);}
function setMusicPlaylist(v){set(KEYS.MUSIC_PLAYLIST,Array.isArray(v)?v:[]);}
function getMusicState(){return get(KEYS.MUSIC_STATE,{repeat:'off',volume:0.8,lastTrack:null,lastSource:'search'});}
function setMusicState(v){set(KEYS.MUSIC_STATE,v||{});}

/* ---- Utilities ---- */
function formatTime(ms){
  if(!ms||ms<5000)return'';
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  if(h>0)return m>0?`${h}h ${m}m`:`${h}h`;return`${m}m`;
}
function formatSeconds(secs){
  if(!secs||secs<5)return'';
  const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=Math.floor(secs%60);
  if(h>0)return`${h}h ${m}m`;if(m>0)return`${m}m ${s}s`;return`${s}s`;
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
  getPlaytime,addPlaytime,resetPlaytime,getAllPlaytime,
  getParticlesConfig,setParticlesConfig,
  formatTime,formatSeconds,exportData,importData,clearAll,
  getMediaFavorites,isMediaFavorite,toggleMediaFavorite,
  getMediaHistory,addToMediaHistory,removeFromMediaHistory,
  getMediaWatchTime,addMediaWatchTime,
  getMediaProgress,setMediaProgress,clearMediaProgress,
  getTVProgress,setTVProgress,
  getAnimeProgress,setAnimeProgress,
  getAIChats,saveAIChat,deleteAIChat,getAIChatById,
  getAIFavs,addAIFav,removeAIFav,isAIFavContent,
  getMusicFavorites,isMusicFavorite,toggleMusicFavorite,
  getMusicQueue,setMusicQueue,getMusicPlaylist,setMusicPlaylist,
  getMusicState,setMusicState,
};