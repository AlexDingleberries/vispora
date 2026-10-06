(function () {
  const LINKS_URL = 'https://vispora-links.alexdingleberries.workers.dev';

  const CACHE_KEY = 'vispora_games_config_v1';
  const TTL_MS = 24 * 60 * 60 * 1000;

  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      return c && Array.isArray(c.games) && c.games.length ? c : null;
    } catch { return null; }
  }

  function writeCache(games) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ games, fetched: Date.now() }));
    } catch (e) { console.warn('[VGames] cache write failed:', e); }
  }

  function isValid(list) {
    return Array.isArray(list) && list.length > 0 &&
      list.every(g => g && g.id !== undefined && g.name && g.url);
  }

  function diffGames(oldList, newList) {
    const oldMap = new Map((oldList || []).map(g => [g.id, g]));
    const newMap = new Map(newList.map(g => [g.id, g]));
    let added = 0, removed = 0, updated = 0;
    newMap.forEach((g, id) => {
      const o = oldMap.get(id);
      if (!o) added++;
      else if (o.name !== g.name || o.url !== g.url || o.cover !== g.cover) updated++;
    });
    oldMap.forEach((_, id) => { if (!newMap.has(id)) removed++; });
    return { added, removed, updated };
  }

  function describeGamesDiff(d) {
    const parts = [];
    if (d.added) parts.push(`${d.added} added`);
    if (d.removed) parts.push(`${d.removed} removed`);
    if (d.updated) parts.push(`${d.updated} updated`);
    return parts.length ? parts.join(', ') : 'no changes';
  }

  async function fetchGamesConfig(force) {
    const cached = readCache();
    if (!force && cached && Date.now() - cached.fetched < TTL_MS) {
      return { games: cached.games, first: false, changed: false, diff: { added: 0, removed: 0, updated: 0 }, cached: true };
    }
    const res = await fetch(`${LINKS_URL}/?type=games`, { cache: force ? 'reload' : 'default' });
    if (!res.ok) throw new Error('games fetch failed: ' + res.status);
    const data = await res.json();
    if (!isValid(data.games)) throw new Error('games response invalid');

    const diff = diffGames(cached && cached.games, data.games);
    const changed = !cached || diff.added + diff.removed + diff.updated > 0;
    writeCache(data.games);
    return { games: data.games, first: !cached, changed, diff, cached: false };
  }

  async function getGames() {
    try {
      return (await fetchGamesConfig(false)).games;
    } catch (e) {
      console.warn('[VGames] using fallback:', e);
      const cached = readCache();
      return cached ? cached.games : null;
    }
  }

  window.VGames = { fetchGamesConfig, describeGamesDiff, getGames, CACHE_KEY };
})();