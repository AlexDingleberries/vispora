(function () {
  const LINKS_URL = 'https://vispora-links.alexdingleberries.workers.dev';

  const CACHE_KEY = 'vispora_ai_models_v1';
  const TTL_MS = 24 * 60 * 60 * 1000;

  const DEFAULT_MODELS = [
    { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', group: 'Fast', default: true },
    { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B', group: 'Powerful', vision: true },
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', group: 'Powerful' },
  ];

  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY));
      return c && Array.isArray(c.models) && c.models.length ? c : null;
    } catch { return null; }
  }

  function writeCache(models) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ models, fetched: Date.now() }));
    } catch (e) { console.warn('[VAI] cache write failed:', e); }
  }

  function isValid(list) {
    return Array.isArray(list) && list.length > 0 &&
      list.every(m => m && m.id && m.name);
  }

  function diffModels(oldList, newList) {
    const oldMap = new Map((oldList || []).map(m => [m.id, m]));
    const newMap = new Map(newList.map(m => [m.id, m]));
    let added = 0, removed = 0, updated = 0;
    newMap.forEach((m, id) => {
      const o = oldMap.get(id);
      if (!o) added++;
      else if (o.name !== m.name || o.group !== m.group || !!o.vision !== !!m.vision || !!o.default !== !!m.default) updated++;
    });
    oldMap.forEach((_, id) => { if (!newMap.has(id)) removed++; });
    return { added, removed, updated };
  }

  function describeModelsDiff(d) {
    const parts = [];
    if (d.added) parts.push(`${d.added} added`);
    if (d.removed) parts.push(`${d.removed} removed`);
    if (d.updated) parts.push(`${d.updated} updated`);
    return parts.length ? parts.join(', ') : 'no changes';
  }

  function cachedModels() {
    const cached = readCache();
    return cached ? cached.models : DEFAULT_MODELS;
  }

  async function fetchModelsConfig(force) {
    const cached = readCache();
    if (!force && cached && Date.now() - cached.fetched < TTL_MS) {
      return { models: cached.models, first: false, changed: false, diff: { added: 0, removed: 0, updated: 0 }, cached: true };
    }
    const res = await fetch(`${LINKS_URL}/?type=ai`, { cache: force ? 'reload' : 'default' });
    if (!res.ok) throw new Error('ai models fetch failed: ' + res.status);
    const data = await res.json();
    if (!isValid(data.models)) throw new Error('ai models response invalid');

    const diff = diffModels(cached && cached.models, data.models);
    const changed = !cached || diff.added + diff.removed + diff.updated > 0;
    writeCache(data.models);
    return { models: data.models, first: !cached, changed, diff, cached: false };
  }

  async function getModels() {
    try {
      return (await fetchModelsConfig(false)).models;
    } catch (e) {
      console.warn('[VAI] using fallback:', e);
      return cachedModels();
    }
  }

  window.VAI = { fetchModelsConfig, describeModelsDiff, getModels, cachedModels, CACHE_KEY };
})();
