const KEYS = {
  THEME: 'vispora_theme', ACCENT: 'vispora_accent', FONT_SIZE: 'vispora_fontsize',
  CLOAK_MODE: 'vispora_cloak_mode', CLOAK_URL: 'vispora_cloak_url',
  AUTO_CLOAK: 'vispora_auto_cloak', PANIC_KEY: 'vispora_panic_key',
  FAVORITES: 'vispora_favorites', HISTORY: 'vispora_history', PLAYTIME: 'vispora_playtime',
  PARTICLES: 'vispora_particles',
  MEDIA_FAVS: 'vispora_media_favs',
  MEDIA_HIST: 'vispora_media_hist',
  MEDIA_TIME: 'vispora_media_time',
  TV_PROG: 'vispora_tv_prog',
  ANIME_PROG: 'vispora_anime_prog',
  AI_CHATS: 'vispora_ai_chats',
  AI_FAVS: 'vispora_ai_favs',
  MEDIA_PROG: 'vispora_media_prog',
  GROQ_KEY: 'vispora_groq_key',
  LEAVE_PREVENTION: 'vispora_leave_prevention',
  NAV_STYLE: 'vispora_nav_style',
  NAV_SIDEBAR_COLLAPSED: 'vispora_nav_sidebar_collapsed',
  FONT_FAMILY: 'vispora_font_family',
  CUSTOM_THEMES: 'vispora_custom_themes',
  USER_UID: 'vispora_user_uid',
  USER_DISPLAY_NAME: 'vispora_user_name',
  USER_EMAIL: 'vispora_user_email',
  TOUR: 'vispora_tour',
  PROFANITY: 'vispora_profanity_filter', LINK_PREVIEWS: 'vispora_link_previews', SHOW_ACTIVITY: 'vispora_show_activity',
  AUDIO_LEVELS: 'vispora_audio_levels', NOTIF_DISABLED: 'vispora_notif_disabled', BG_CONFIG: 'vispora_bg_image_config',
  LIVE_FAVS: 'vispora_live_favs',
  LIVE_HIST: 'vispora_live_hist',
};
const CLOUD_SYNC_KEYS = [
  'THEME', 'ACCENT', 'FONT_SIZE',
  'CLOAK_MODE', 'CLOAK_URL', 'AUTO_CLOAK', 'PANIC_KEY',
  'FAVORITES', 'PLAYTIME', 'PARTICLES',
  'MEDIA_FAVS', 'TV_PROG', 'ANIME_PROG',
  'LEAVE_PREVENTION', 'GROQ_KEY', 'NAV_STYLE', 'FONT_FAMILY', 'CUSTOM_THEMES',
  'HISTORY', 'MEDIA_HIST', 'MEDIA_TIME', 'MEDIA_PROG', 'AI_CHATS', 'AI_FAVS', 'TOUR',
  'PROFANITY', 'LINK_PREVIEWS', 'SHOW_ACTIVITY', 'AUDIO_LEVELS', 'NOTIF_DISABLED', 'BG_CONFIG',
  'LIVE_FAVS', 'LIVE_HIST',
];
const CACHE_OWNER_KEY = 'vispora_cache_owner';
const TS_KEY = 'vispora_key_ts';
const _dirty = new Set();
function _readTs() {
  const m = get(TS_KEY, {});
  return m && typeof m === 'object' ? m : {};
}
function _stamp(name) {
  const m = _readTs();
  m[name] = Date.now();
  try { localStorage.setItem(TS_KEY, JSON.stringify(m)); } catch { }
  _dirty.add(name);
}
function get(k, d = null) {
  try {
    const v = localStorage.getItem(k);
    if (v === null || v === undefined || v === 'undefined') return d;
    return JSON.parse(v);
  } catch { return d; }
}
function set(k, v) {
  try {
    if (v === undefined) { remove(k); return; }
    const json = JSON.stringify(v);
    if (json === undefined) { remove(k); return; }
    localStorage.setItem(k, json);
  } catch (e) { console.warn('[VStorage] set failed for', k, e); }
  try {
    const name = Object.keys(KEYS).find(n => KEYS[n] === k);
    if (name && CLOUD_SYNC_KEYS.includes(name)) {
      _stamp(name);
      if (_cloudEnabled()) _scheduleSyncToCloud();
    }
  } catch (e) { console.warn('[VStorage] cloud schedule failed:', e); }
}
function remove(k) { try { localStorage.removeItem(k); } catch { }; }
let _db = null, _uid = null, _syncTimer = null;
function _cloudEnabled() { return !!(_db && _uid); }
function _scheduleSyncToCloud() { clearTimeout(_syncTimer); _syncTimer = setTimeout(_flushToCloud, 2000); }
async function _flushToCloud() {
  if (!_cloudEnabled() || !_dirty.size) return;
  const names = [..._dirty];
  names.forEach(n => _dirty.delete(n));
  const ts = _readTs();
  const changes = {};
  names.forEach(name => {
    try {
      const raw = localStorage.getItem(KEYS[name]);
      if (raw === null || raw === undefined || raw === 'undefined') return;
      const parsed = JSON.parse(raw);
      if (parsed === undefined) return;
      changes[name] = { value: parsed, ts: ts[name] || Date.now() };
    } catch (e) {
      console.warn('[VStorage] skipping corrupt key during sync:', name, e);
    }
  });
  const found = Object.keys(changes);
  if (!found.length) return;
  const now = Date.now();
  const ref = _db.collection('users').doc(_uid);
  const paths = { 'settings._updated': now };
  found.forEach(name => {
    paths['settings.' + name] = changes[name].value;
    paths['settings._ts.' + name] = changes[name].ts;
  });
  try {
    await ref.update(paths);
  } catch (e) {
    try {
      const payload = { _updated: now, _ts: {} };
      found.forEach(name => {
        payload[name] = changes[name].value;
        payload._ts[name] = changes[name].ts;
      });
      await ref.set({ settings: payload }, { merge: true });
    } catch (err) {
      names.forEach(n => _dirty.add(n));
      console.warn('[VStorage] flush failed:', err);
    }
  }
}
async function syncFromCloud(db, uid) {
  _db = db; _uid = uid;
  const result = { applied: 0, pushed: 0 };
  const prevOwner = localStorage.getItem(CACHE_OWNER_KEY);
  if (prevOwner !== uid) {
    CLOUD_SYNC_KEYS.forEach(name => remove(KEYS[name]));
    remove(TS_KEY);
    remove(KEYS.USER_DISPLAY_NAME);
    remove(KEYS.USER_EMAIL);
    _dirty.clear();
  }
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (snap.exists) {
      const data = snap.data() || {};
      const cloud = data.settings || {};
      const cloudTs = cloud._ts || {};
      const fallbackTs = cloud._updated || 0;
      const localTs = _readTs();
      const merged = { ...localTs };
      CLOUD_SYNC_KEYS.forEach(name => {
        try {
          const hasCloud = cloud[name] !== undefined;
          const hasLocal = localStorage.getItem(KEYS[name]) !== null;
          const cts = hasCloud ? (cloudTs[name] || fallbackTs) : 0;
          const lts = localTs[name] || 0;
          if (hasCloud && (!hasLocal || cts > lts)) {
            localStorage.setItem(KEYS[name], JSON.stringify(cloud[name]));
            merged[name] = cts;
            result.applied++;
          } else if (hasLocal && (!hasCloud || lts > cts)) {
            if (!lts) merged[name] = Date.now();
            _dirty.add(name);
            result.pushed++;
          }
        } catch (e) { console.warn('[VStorage] skipping corrupt cloud key:', name, e); }
      });
      try { localStorage.setItem(TS_KEY, JSON.stringify(merged)); } catch { }
      if (data.displayName) set(KEYS.USER_DISPLAY_NAME, data.displayName);
      if (data.email) set(KEYS.USER_EMAIL, data.email);
    }
    localStorage.setItem(CACHE_OWNER_KEY, uid);
    set(KEYS.USER_UID, uid);
    if (_dirty.size) _scheduleSyncToCloud();
  } catch (e) { console.warn('[VStorage] syncFromCloud failed:', e); }
  return result;
}
async function resetCloudSync() {
  clearTimeout(_syncTimer);
  _dirty.clear();
  CLOUD_SYNC_KEYS.forEach(name => remove(KEYS[name]));
  remove(TS_KEY);
  remove(KEYS.USER_UID); remove(KEYS.USER_DISPLAY_NAME); remove(KEYS.USER_EMAIL);
  localStorage.removeItem(CACHE_OWNER_KEY);
  _db = null; _uid = null;
}
async function resetAll() {
  clearTimeout(_syncTimer);
  _dirty.clear();
  const db = _db, uid = _uid;
  Object.keys(localStorage).filter(k => k.indexOf('vispora') === 0).forEach(remove);
  try { await deleteBackgroundImage(); } catch { }
  if (db && uid) {
    try {
      await db.collection('users').doc(uid).set({ settings: firebase.firestore.FieldValue.delete() }, { merge: true });
    } catch (e) { console.warn('[VStorage] cloud reset failed:', e); }
  }
  await resetCloudSync();
}
async function syncToCloud() { clearTimeout(_syncTimer); await _flushToCloud(); }
function getUserProfile() {
  return {
    uid: get(KEYS.USER_UID, null),
    displayName: get(KEYS.USER_DISPLAY_NAME, null),
    email: get(KEYS.USER_EMAIL, null),
  };
}
async function saveUserProfile({ displayName } = {}) {
  if (displayName !== undefined) set(KEYS.USER_DISPLAY_NAME, displayName);
  if (_cloudEnabled()) {
    try {
      const update = { _profileUpdated: Date.now() };
      if (displayName !== undefined) update.displayName = displayName;
      await _db.collection('users').doc(_uid).set(update, { merge: true });
    } catch (e) { console.warn('[VStorage] saveUserProfile failed:', e); }
  }
}
function isTourDone(name) { const d = get(KEYS.TOUR, {}); return !!(d && d[name]); }
function setTourDone(name) { const d = get(KEYS.TOUR, {}) || {}; d[name] = true; set(KEYS.TOUR, d); }
function getTheme() { return get(KEYS.THEME, 'dark'); }
function setTheme(v) { set(KEYS.THEME, v); }
function getAccent() { return get(KEYS.ACCENT, '#ffffff'); }
function setAccent(v) { set(KEYS.ACCENT, v); }
function getFontSize() { return get(KEYS.FONT_SIZE, 'medium'); }
function setFontSize(v) { set(KEYS.FONT_SIZE, v); }
function getCloakMode() { return get(KEYS.CLOAK_MODE, 'google'); }
function setCloakMode(v) { set(KEYS.CLOAK_MODE, v); }
function getCloakUrl() { return get(KEYS.CLOAK_URL, ''); }
function setCloakUrl(v) { set(KEYS.CLOAK_URL, v); }
function getAutoCloak() { return get(KEYS.AUTO_CLOAK, false); }
function setAutoCloak(v) { set(KEYS.AUTO_CLOAK, v); }
function getPanicKey() { return get(KEYS.PANIC_KEY, 'BracketRight'); }
function setPanicKey(v) { set(KEYS.PANIC_KEY, v); }
function getFavorites() { return get(KEYS.FAVORITES, []); }
function isFavorite(id) { return getFavorites().includes(Number(id)); }
function toggleFavorite(id) {
  id = Number(id); const favs = getFavorites(); const i = favs.indexOf(id);
  if (i === -1) favs.push(id); else favs.splice(i, 1); set(KEYS.FAVORITES, favs); return i === -1;
}
function getHistory() { return get(KEYS.HISTORY, []); }
function addToHistory(game) {
  let h = getHistory().filter(x => x.id !== game.id);
  h.unshift({ id: game.id, name: game.name, cover: game.cover, lastPlayed: Date.now(), totalPlaytime: getPlaytime(game.id) });
  if (h.length > 50) h = h.slice(0, 50); set(KEYS.HISTORY, h);
}
function removeFromHistory(id) { set(KEYS.HISTORY, getHistory().filter(h => h.id !== Number(id))); }
function getPlaytime(id) { return (get(KEYS.PLAYTIME, {})[String(id)]) || 0; }
function addPlaytime(id, ms) {
  const d = get(KEYS.PLAYTIME, {}); d[String(id)] = (d[String(id)] || 0) + ms; set(KEYS.PLAYTIME, d);
  const h = getHistory(); const e = h.find(x => x.id === Number(id)); if (e) { e.totalPlaytime = d[String(id)]; set(KEYS.HISTORY, h); }
  return d[String(id)];
}
function resetPlaytime(id) {
  const d = get(KEYS.PLAYTIME, {}); delete d[String(id)]; set(KEYS.PLAYTIME, d);
  const h = getHistory(); const e = h.find(x => x.id === Number(id)); if (e) { e.totalPlaytime = 0; set(KEYS.HISTORY, h); }
}
function getAllPlaytime() { return get(KEYS.PLAYTIME, {}); }
function getParticlesConfig() {
  return get(KEYS.PARTICLES, { enabled: true, count: 40, speed: 0.6, size: 1.5, opacity: 0.25, linked: true, color: 'accent', shape: 'circle', direction: 'none' });
}
function setParticlesConfig(v) { set(KEYS.PARTICLES, v); }
function getMediaFavorites() { return get(KEYS.MEDIA_FAVS, []); }
function isMediaFavorite(id, type) { return getMediaFavorites().some(f => f.id === Number(id) && f.type === type); }
function toggleMediaFavorite(id, type) {
  id = Number(id); const favs = getMediaFavorites();
  const idx = favs.findIndex(f => f.id === id && f.type === type);
  if (idx === -1) favs.push({ id, type }); else favs.splice(idx, 1);
  set(KEYS.MEDIA_FAVS, favs); return idx === -1;
}
function getMediaHistory() { return get(KEYS.MEDIA_HIST, []); }
function addToMediaHistory(media, type) {
  const id = Number(media.id);
  const title = media.title || media.name || 'Unknown';
  const poster = media.poster_path || media.coverImage?.large || media._cover || null;
  const backdrop = media.backdrop_path || media.bannerImage || media._backdrop || null;
  const kitsuId = media.kitsuId || null;
  let h = getMediaHistory().filter(x => !(x.id === id && x.type === type));
  h.unshift({ id, type, title, poster_path: poster, backdrop_path: backdrop, kitsuId, lastPlayed: Date.now() });
  if (h.length > 100) h = h.slice(0, 100); set(KEYS.MEDIA_HIST, h);
}
function removeFromMediaHistory(id, type) {
  set(KEYS.MEDIA_HIST, getMediaHistory().filter(h => !(h.id === Number(id) && h.type === type)));
}
function getMediaWatchTime(id, type) { return (get(KEYS.MEDIA_TIME, {})[`${type}_${id}`]) || 0; }
function addMediaWatchTime(id, type, ms) {
  if (!ms || ms < 2000) return 0;
  const d = get(KEYS.MEDIA_TIME, {}); const key = `${type}_${id}`;
  d[key] = (d[key] || 0) + ms; set(KEYS.MEDIA_TIME, d); return d[key];
}
function getMediaProgress(id, type) { return (get(KEYS.MEDIA_PROG, {})[`${type}_${id}`]) || null; }
function setMediaProgress(id, type, currentTime, duration) {
  const d = get(KEYS.MEDIA_PROG, {}); const key = `${type}_${id}`;
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  d[key] = { currentTime: Math.round(currentTime), duration: Math.round(duration), percent, updated: Date.now() };
  set(KEYS.MEDIA_PROG, d); return d[key];
}
function clearMediaProgress(id, type) { const d = get(KEYS.MEDIA_PROG, {}); delete d[`${type}_${id}`]; set(KEYS.MEDIA_PROG, d); }
function getTVProgress(showId) { return (get(KEYS.TV_PROG, {})[String(showId)]) || { season: 1, episode: 1 }; }
function setTVProgress(showId, season, episode) {
  const d = get(KEYS.TV_PROG, {}); d[String(showId)] = { season: Number(season), episode: Number(episode) }; set(KEYS.TV_PROG, d);
}
function getAnimeProgress(animeId) { return (get(KEYS.ANIME_PROG, {})[String(animeId)]) || { episode: 1 }; }
function setAnimeProgress(animeId, episode) {
  const d = get(KEYS.ANIME_PROG, {}); d[String(animeId)] = { episode: Number(episode) }; set(KEYS.ANIME_PROG, d);
}
const LIVE_EVENT_WINDOW = 4 * 3600e3;
function getLiveFavorites() {
  const favs = get(KEYS.LIVE_FAVS, []);
  if (!Array.isArray(favs)) return [];
  const now = Date.now();
  const kept = favs.filter(f => { const t = f.date || f.savedAt || 0; return !t || now - t < LIVE_EVENT_WINDOW; });
  if (kept.length !== favs.length) set(KEYS.LIVE_FAVS, kept);
  return kept;
}
function isLiveFavorite(id) { return getLiveFavorites().some(f => f.id === String(id)); }
function toggleLiveFavorite(match) {
  const id = String(match && match.id);
  if (!id || id === 'undefined') return false;
  const favs = getLiveFavorites();
  const idx = favs.findIndex(f => f.id === id);
  if (idx === -1) {
    favs.unshift({
      id,
      title: match.title || 'Live Event',
      category: match.category || '',
      date: match.date || 0,
      poster: match.poster || null,
      teams: match.teams || null,
      sources: Array.isArray(match.sources) ? match.sources : [],
      savedAt: Date.now(),
    });
    if (favs.length > 100) favs.splice(100);
  } else {
    favs.splice(idx, 1);
  }
  set(KEYS.LIVE_FAVS, favs);
  return idx === -1;
}
function getLiveHistory() { const h = get(KEYS.LIVE_HIST, []); return Array.isArray(h) ? h : []; }
function addToLiveHistory(match) {
  if (!match || !match.id) return;
  const id = String(match.id);
  const h = getLiveHistory().filter(x => x.id !== id);
  h.unshift({ id, title: match.title || 'Live Event', category: match.category || '', date: match.date || 0, poster: match.poster || null, teams: match.teams || null, sources: Array.isArray(match.sources) ? match.sources : [], watchedAt: Date.now() });
  if (h.length > 30) h.length = 30;
  set(KEYS.LIVE_HIST, h);
}
function removeFromLiveHistory(id) { set(KEYS.LIVE_HIST, getLiveHistory().filter(x => x.id !== String(id))); }
function clearLiveHistory() { set(KEYS.LIVE_HIST, []); }
function getAIChats() { return get(KEYS.AI_CHATS, []); }
function saveAIChat(title, model, messages) {
  if (!messages || !messages.length) return null;
  const chats = getAIChats();
  const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  chats.unshift({ id, title: title || 'Untitled Chat', model: model || '', date: Date.now(), messageCount: messages.length, messages });
  if (chats.length > 50) chats.splice(50); set(KEYS.AI_CHATS, chats); return id;
}
function deleteAIChat(id) {
  set(KEYS.AI_CHATS, getAIChats().filter(c => c.id !== id));
  set(KEYS.AI_FAVS, getAIFavs().filter(f => f.chatId !== id));
}
function getAIChatById(id) { return getAIChats().find(c => c.id === id) || null; }
function getAIFavs() { return get(KEYS.AI_FAVS, []); }
function addAIFav(content, model, chatId) {
  const favs = getAIFavs(); const id = 'fav_' + Date.now();
  favs.unshift({ id, content, model: model || '', chatId: chatId || null, date: Date.now() });
  if (favs.length > 200) favs.splice(200); set(KEYS.AI_FAVS, favs); return id;
}
function removeAIFav(id) { set(KEYS.AI_FAVS, getAIFavs().filter(f => f.id !== id)); }
function isAIFavContent(content) { return getAIFavs().some(f => f.content === content); }
function getGroqKey() { return get(KEYS.GROQ_KEY, null); }
function setGroqKey(v) { if (v) set(KEYS.GROQ_KEY, v); else remove(KEYS.GROQ_KEY); }
function getLeavePrevention() { return get(KEYS.LEAVE_PREVENTION, false); }
function setLeavePrevention(v) { set(KEYS.LEAVE_PREVENTION, !!v); }
function getNavStyle() { return get(KEYS.NAV_STYLE, 'topbar'); }
function setNavStyle(v) { set(KEYS.NAV_STYLE, v); }
function getNavSidebarCollapsed() { return get(KEYS.NAV_SIDEBAR_COLLAPSED, false); }
function setNavSidebarCollapsed(v) { set(KEYS.NAV_SIDEBAR_COLLAPSED, !!v); }
function getFontFamily() { return get(KEYS.FONT_FAMILY, 'outfit'); }
function setFontFamily(v) { set(KEYS.FONT_FAMILY, v); }
function getCustomThemes() { return get(KEYS.CUSTOM_THEMES, []); }
function saveCustomTheme(theme) {
  const list = getCustomThemes();
  if (!theme.id) theme.id = 'custom:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const i = list.findIndex(t => t.id === theme.id);
  if (i === -1) list.push(theme); else list[i] = theme;
  set(KEYS.CUSTOM_THEMES, list);
  return theme.id;
}
function deleteCustomTheme(id) { set(KEYS.CUSTOM_THEMES, getCustomThemes().filter(t => t.id !== id)); }
const BG_DB_NAME = 'vispora_bg', BG_STORE = 'images', BG_CONFIG_KEY = 'vispora_bg_image_config';
function _bgDbOpen() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('IndexedDB not available')); return; }
    const req = indexedDB.open(BG_DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(BG_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveBackgroundImage(blob) {
  const db = await _bgDbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE, 'readwrite');
    tx.objectStore(BG_STORE).put(blob, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function getBackgroundImage() {
  try {
    const db = await _bgDbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(BG_STORE, 'readonly');
      const req = tx.objectStore(BG_STORE).get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}
async function deleteBackgroundImage() {
  const db = await _bgDbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE, 'readwrite');
    tx.objectStore(BG_STORE).delete('current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function getBgImageConfig() { return get(BG_CONFIG_KEY, { enabled: false, opacity: 0.35, blur: 0, darken: 0.35, size: 'cover', position: 'center' }); }
function setBgImageConfig(v) { set(BG_CONFIG_KEY, v); }
function formatTime(ms) {
  if (!ms || ms < 5000) return '';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`; return `${m}m`;
}
function formatSeconds(secs) {
  if (!secs || secs < 5) return '';
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${s}s`; return `${s}s`;
}
const LINKS_CACHE = 'vispora_links_config_v1';
const GAMES_CACHE = 'vispora_games_config_v1';
const AI_CACHE = 'vispora_ai_models_v1';
const EXPORT_SKIP = new Set([CACHE_OWNER_KEY, TS_KEY, LINKS_CACHE, GAMES_CACHE, AI_CACHE, 'vispora_seen_version', KEYS.USER_UID, KEYS.USER_DISPLAY_NAME, KEYS.USER_EMAIL]);
function _exportable(k) { return k.indexOf('vispora') === 0 && !EXPORT_SKIP.has(k); }
function exportData() {
  const d = {};
  Object.keys(localStorage).filter(_exportable).forEach(k => {
    const raw = localStorage.getItem(k);
    try { d[k] = JSON.parse(raw); } catch { d[k] = raw; }
  });
  return JSON.stringify(d, null, 2);
}
function importData(json) {
  const d = JSON.parse(json);
  if (!d || typeof d !== 'object') throw new Error('invalid');
  Object.entries(d).forEach(([k, v]) => { if (_exportable(k)) set(k, v); });
}
function clearAll() { Object.values(KEYS).forEach(k => remove(k)); }
window.VStorage = {
  KEYS, get, set, remove,
  getTheme, setTheme, getAccent, setAccent, getFontSize, setFontSize,
  getCloakMode, setCloakMode, getCloakUrl, setCloakUrl, getAutoCloak, setAutoCloak, getPanicKey, setPanicKey,
  getFavorites, isFavorite, toggleFavorite,
  getHistory, addToHistory, removeFromHistory,
  getPlaytime, addPlaytime, resetPlaytime, getAllPlaytime,
  getParticlesConfig, setParticlesConfig,
  formatTime, formatSeconds, exportData, importData, clearAll,
  getMediaFavorites, isMediaFavorite, toggleMediaFavorite,
  getMediaHistory, addToMediaHistory, removeFromMediaHistory,
  getMediaWatchTime, addMediaWatchTime,
  getMediaProgress, setMediaProgress, clearMediaProgress,
  getTVProgress, setTVProgress,
  getAnimeProgress, setAnimeProgress,
  getLiveFavorites, isLiveFavorite, toggleLiveFavorite,
  getLiveHistory, addToLiveHistory, removeFromLiveHistory, clearLiveHistory,
  getAIChats, saveAIChat, deleteAIChat, getAIChatById,
  getAIFavs, addAIFav, removeAIFav, isAIFavContent,
  getGroqKey, setGroqKey,
  getLeavePrevention, setLeavePrevention,
  getNavStyle, setNavStyle, getNavSidebarCollapsed, setNavSidebarCollapsed,
  getFontFamily, setFontFamily,
  getCustomThemes, saveCustomTheme, deleteCustomTheme,
  saveBackgroundImage, getBackgroundImage, deleteBackgroundImage,
  getBgImageConfig, setBgImageConfig,
  syncFromCloud, syncToCloud, resetAll, isTourDone, setTourDone,
  getUserProfile, saveUserProfile, resetCloudSync,
};