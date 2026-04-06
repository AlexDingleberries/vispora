// ===== VISPORA STORAGE MODULE =====

const KEYS = {
  THEME:       'vispora_theme',
  ACCENT:      'vispora_accent',
  FONT_SIZE:   'vispora_fontsize',
  CLOAK_MODE:  'vispora_cloak_mode',
  CLOAK_URL:   'vispora_cloak_url',
  AUTO_CLOAK:  'vispora_auto_cloak',
  PANIC_KEY:   'vispora_panic_key',
  FAVORITES:   'vispora_favorites',
  HISTORY:     'vispora_history',
  PLAYTIME:    'vispora_playtime',
};

function get(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val);
  } catch { return fallback; }
}

function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// --- Theme ---
function getTheme()      { return get(KEYS.THEME, 'dark'); }
function setTheme(v)     { set(KEYS.THEME, v); }

// --- Accent ---
function getAccent()     { return get(KEYS.ACCENT, '#00e5ff'); }
function setAccent(v)    { set(KEYS.ACCENT, v); }

// --- Font size ---
function getFontSize()   { return get(KEYS.FONT_SIZE, 'medium'); }
function setFontSize(v)  { set(KEYS.FONT_SIZE, v); }

// --- Cloak ---
function getCloakMode()  { return get(KEYS.CLOAK_MODE, 'none'); }
function setCloakMode(v) { set(KEYS.CLOAK_MODE, v); }
function getCloakUrl()   { return get(KEYS.CLOAK_URL, 'https://docs.google.com/'); }
function setCloakUrl(v)  { set(KEYS.CLOAK_URL, v); }
function getAutoCloak()  { return get(KEYS.AUTO_CLOAK, false); }
function setAutoCloak(v) { set(KEYS.AUTO_CLOAK, v); }
function getPanicKey()   { return get(KEYS.PANIC_KEY, 'Escape'); }
function setPanicKey(v)  { set(KEYS.PANIC_KEY, v); }

// --- Favorites ---
function getFavorites()        { return get(KEYS.FAVORITES, []); }
function isFavorite(id)        { return getFavorites().includes(Number(id)); }
function toggleFavorite(id) {
  id = Number(id);
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx === -1) favs.push(id);
  else favs.splice(idx, 1);
  set(KEYS.FAVORITES, favs);
  return idx === -1;
}

// --- History ---
function getHistory()          { return get(KEYS.HISTORY, []); }
function addToHistory(game) {
  let history = getHistory();
  // Remove existing entry for this game
  history = history.filter(h => h.id !== game.id);
  // Add to front
  history.unshift({
    id: game.id,
    name: game.name,
    cover: game.cover,
    lastPlayed: Date.now(),
    totalPlaytime: getPlaytime(game.id),
  });
  // Keep max 50
  if (history.length > 50) history = history.slice(0, 50);
  set(KEYS.HISTORY, history);
}
function removeFromHistory(id) {
  const history = getHistory().filter(h => h.id !== Number(id));
  set(KEYS.HISTORY, history);
}

// --- Playtime ---
function getPlaytime(id)  { return (get(KEYS.PLAYTIME, {}))[String(id)] || 0; }
function addPlaytime(id, ms) {
  const data = get(KEYS.PLAYTIME, {});
  data[String(id)] = (data[String(id)] || 0) + ms;
  set(KEYS.PLAYTIME, data);
  // Update history entry
  const history = getHistory();
  const entry = history.find(h => h.id === Number(id));
  if (entry) {
    entry.totalPlaytime = data[String(id)];
    set(KEYS.HISTORY, history);
  }
  return data[String(id)];
}
function getAllPlaytime()  { return get(KEYS.PLAYTIME, {}); }

// --- Format time ---
function formatTime(ms) {
  if (!ms || ms < 60000) return ms >= 1000 ? `${Math.floor(ms/1000)}s` : '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

// --- Export / Import ---
function exportData() {
  const data = {};
  Object.values(KEYS).forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = JSON.parse(v);
  });
  return JSON.stringify(data, null, 2);
}

function importData(jsonStr) {
  const data = JSON.parse(jsonStr);
  Object.entries(data).forEach(([k, v]) => {
    set(k, v);
  });
}

function clearAll() {
  Object.values(KEYS).forEach(k => remove(k));
}

window.VStorage = {
  KEYS,
  get, set, remove,
  getTheme, setTheme,
  getAccent, setAccent,
  getFontSize, setFontSize,
  getCloakMode, setCloakMode,
  getCloakUrl, setCloakUrl,
  getAutoCloak, setAutoCloak,
  getPanicKey, setPanicKey,
  getFavorites, isFavorite, toggleFavorite,
  getHistory, addToHistory, removeFromHistory,
  getPlaytime, addPlaytime, getAllPlaytime,
  formatTime,
  exportData, importData, clearAll,
};
