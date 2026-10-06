'use strict';
const MEDIA_WORKER_URL = 'https://corsime.alexdingleberries.workers.dev';
async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${MEDIA_WORKER_URL}/tmdb${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`TMDB ${r.status}: ${endpoint}`);
  return r.json();
}
async function kitsuFetch(endpoint, params = {}) {
  const url = new URL(`${MEDIA_WORKER_URL}/kitsu${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`Kitsu ${r.status}: ${endpoint}`);
  return r.json();
}
const LINKS_WORKER_URL = 'https://vispora-links.alexdingleberries.workers.dev';
const LINKS_CACHE_KEY = 'vispora_links_config_v1';
const LINKS_CACHE_TTL = 24 * 60 * 60 * 1000;
function _readLinksCache() {
  try {
    const raw = localStorage.getItem(LINKS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.cfg || !parsed.ts) return null;
    return parsed;
  } catch { return null; }
}
function _writeLinksCache(cfg) {
  try { localStorage.setItem(LINKS_CACHE_KEY, JSON.stringify({ cfg, ts: Date.now() })); } catch { }
}
function _diffServers(prevCfg, nextCfg) {
  const touched = { updated: {}, added: {}, removed: {} };
  const mark = (bucket, name, kind) => { (touched[bucket][name] = touched[bucket][name] || []).push(kind); };
  ['movie', 'tv', 'anime'].forEach(kind => {
    const a = new Map(((prevCfg && prevCfg[kind]) || []).map(s => [s.name, s[kind]]));
    const b = new Map(((nextCfg && nextCfg[kind]) || []).map(s => [s.name, s[kind]]));
    b.forEach((tpl, name) => {
      if (!a.has(name)) mark('added', name, kind);
      else if (a.get(name) !== tpl) mark('updated', name, kind);
    });
    a.forEach((tpl, name) => { if (!b.has(name)) mark('removed', name, kind); });
  });
  const fmt = bucket => Object.keys(touched[bucket]).map(n => `${n} (${touched[bucket][n].join(', ')})`);
  const diff = { updated: fmt('updated'), added: fmt('added'), removed: fmt('removed') };
  diff.any = diff.updated.length + diff.added.length + diff.removed.length > 0;
  return diff;
}
function describeServerDiff(diff) {
  if (!diff || !diff.any) return 'no servers changed';
  const part = (label, list) => list.length
    ? `${label}: ${list.slice(0, 4).join(', ')}${list.length > 4 ? ` +${list.length - 4} more` : ''}`
    : '';
  return [part('Updated', diff.updated), part('Added', diff.added), part('Removed', diff.removed)].filter(Boolean).join(' · ');
}
async function fetchServerConfig(silent) {
  if (!LINKS_WORKER_URL) throw new Error('No links worker configured');
  const res = await fetch(LINKS_WORKER_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`links ${res.status}`);
  const cfg = await res.json();
  const prev = _readLinksCache();
  const diff = prev ? _diffServers(prev.cfg, cfg) : null;
  const changed = !!(diff && diff.any);
  _writeLinksCache(cfg);
  if (changed && !silent) {
    try {
      VApp.showToast(`Servers updated: ${describeServerDiff(diff)}`, 'info', 7000);
      document.dispatchEvent(new CustomEvent('vispora:servers-changed', { detail: diff }));
    } catch { }
  }
  return { cfg, changed, diff, first: !prev };
}
async function getServerConfig() {
  if (!LINKS_WORKER_URL) return null;
  const cached = _readLinksCache();
  if (cached && (Date.now() - cached.ts) < LINKS_CACHE_TTL) return cached.cfg;
  try {
    return (await fetchServerConfig()).cfg;
  } catch (e) {
    console.warn('[VMedia] links fetch failed, using stale/default config:', e);
    return cached ? cached.cfg : null;
  }
}
const KITSU_PAGE_SIZE = 20;
function _kitsuPageParams(page) {
  return { 'page[limit]': KITSU_PAGE_SIZE, 'page[offset]': (Math.max(1, page) - 1) * KITSU_PAGE_SIZE };
}
function _mapKitsuStatus(s) {
  const map = { current: 'RELEASING', finished: 'FINISHED', upcoming: 'NOT_YET_RELEASED', unreleased: 'NOT_YET_RELEASED', tba: 'NOT_YET_RELEASED' };
  return map[s] || String(s || '').toUpperCase();
}
function _kitsuMalId(res, included) {
  const refs = res.relationships?.mappings?.data || [];
  for (const ref of refs) {
    const rec = (included || []).find(inc => inc.type === 'mappings' && inc.id === ref.id);
    const site = rec?.attributes?.externalSite || '';
    if (site.startsWith('myanimelist')) {
      const n = parseInt(rec.attributes.externalId, 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}
function _mapKitsuAnime(res, included) {
  const malId = _kitsuMalId(res, included);
  if (!malId) return null;
  const a = res.attributes || {};
  const genreIds = (res.relationships?.genres?.data || []).map(g => g.id);
  const genres = genreIds
    .map(gid => (included || []).find(inc => inc.type === 'genres' && inc.id === gid)?.attributes?.name)
    .filter(Boolean);
  return {
    id: malId,
    kitsuId: res.id,
    title: { english: a.titles?.en || null, romaji: a.titles?.en_jp || a.canonicalTitle || 'Unknown' },
    coverImage: {
      large: a.posterImage?.large || a.posterImage?.medium || a.posterImage?.small || '',
      extraLarge: a.posterImage?.large || a.posterImage?.original || '',
    },
    bannerImage: a.coverImage?.large || a.coverImage?.original || '',
    description: a.synopsis || '',
    genres,
    averageScore: a.averageRating ? Math.round(parseFloat(a.averageRating)) : null,
    episodes: a.episodeCount || null,
    status: _mapKitsuStatus(a.status),
    season: null,
    seasonYear: a.startDate ? Number(a.startDate.slice(0, 4)) : null,
    studios: { nodes: [] },
  };
}
function _wrapKitsuPage(json, page) {
  const total = json.meta?.count ?? (json.data || []).length;
  const media = (json.data || []).map(res => _mapKitsuAnime(res, json.included)).filter(Boolean);
  return {
    pageInfo: { total, currentPage: page, lastPage: Math.max(1, Math.ceil(total / KITSU_PAGE_SIZE)) },
    media,
  };
}
async function getPopularAnime(page = 1) {
  const json = await kitsuFetch('/anime', { sort: '-userCount', include: 'genres,mappings', ..._kitsuPageParams(page) });
  return _wrapKitsuPage(json, page);
}
async function getAiringAnime(page = 1) {
  const json = await kitsuFetch('/anime', { 'filter[status]': 'current', sort: '-userCount', include: 'genres,mappings', ..._kitsuPageParams(page) });
  return _wrapKitsuPage(json, page);
}
async function getTopAnime(page = 1, sortMode) {
  const params = { include: 'genres,mappings', ..._kitsuPageParams(page) };
  if (sortMode === 'airing') { params['filter[status]'] = 'current'; params.sort = '-userCount'; }
  else if (sortMode === 'favorite') { params.sort = '-favoritesCount'; }
  else if (sortMode === 'bypopularity') { params.sort = '-userCount'; }
  else { params.sort = '-averageRating'; }
  const json = await kitsuFetch('/anime', params);
  return _wrapKitsuPage(json, page);
}
async function searchAnime(query, page = 1) {
  const json = await kitsuFetch('/anime', { 'filter[text]': query, include: 'genres,mappings', ..._kitsuPageParams(page) });
  return _wrapKitsuPage(json, page);
}
const _deadMalIds = new Set();
async function _kitsuIdForMalId(malId) {
  if (_deadMalIds.has(malId)) throw new Error(`No Kitsu mapping for MAL id ${malId}`);
  const json = await kitsuFetch('/mappings', {
    'filter[externalSite]': 'myanimelist/anime',
    'filter[externalId]': malId,
    include: 'item',
  });
  const rel = json.data?.[0]?.relationships?.item?.data;
  if (!rel) { _deadMalIds.add(malId); throw new Error(`No Kitsu mapping for MAL id ${malId}`); }
  return rel.id;
}
const _anilistIdCache = new Map();
async function getAnilistIdForMal(malId) {
  if (_anilistIdCache.has(malId)) return _anilistIdCache.get(malId);
  const query = `query ($id: Int) { Media(idMal: $id, type: ANIME) { id } }`;
  try {
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { id: malId } }),
    });
    if (!r.ok) throw new Error(`AniList ${r.status}`);
    const json = await r.json();
    const anilistId = json.data?.Media?.id || null;
    _anilistIdCache.set(malId, anilistId);
    return anilistId;
  } catch (e) {
    console.warn('[VMedia] AniList id lookup failed:', e);
    _anilistIdCache.set(malId, null);
    return null;
  }
}
function _mapKitsuFull(json, malId) {
  const res = json.data;
  const included = json.included || [];
  const a = res.attributes || {};
  const genreIds = (res.relationships?.genres?.data || []).map(g => g.id);
  const catIds = (res.relationships?.categories?.data || []).map(g => g.id);
  const genres = [...new Set([...genreIds, ...catIds])]
    .map(gid => included.find(inc => (inc.type === 'genres' || inc.type === 'categories') && inc.id === gid)?.attributes?.name)
    .filter(Boolean);
  return {
    id: malId,
    kitsuId: res.id,
    title: { english: a.titles?.en || null, romaji: a.titles?.en_jp || a.canonicalTitle || 'Unknown' },
    coverImage: {
      large: a.posterImage?.large || a.posterImage?.medium || a.posterImage?.small || '',
      extraLarge: a.posterImage?.large || a.posterImage?.original || '',
    },
    bannerImage: a.coverImage?.large || a.coverImage?.original || '',
    description: a.synopsis || '',
    genres,
    averageScore: a.averageRating ? Math.round(parseFloat(a.averageRating)) : null,
    episodes: a.episodeCount || null,
    status: _mapKitsuStatus(a.status),
    season: null,
    seasonYear: a.startDate ? Number(a.startDate.slice(0, 4)) : null,
    studios: { nodes: [] },
  };
}
function _mapKitsuCharacters(json) {
  if (!json) return { edges: [] };
  const included = json.included || [];
  const edges = (json.data || []).slice(0, 10).map(c => {
    const charRef = c.relationships?.character?.data;
    const personRef = c.relationships?.person?.data;
    const charRec = included.find(i => i.type === 'characters' && i.id === charRef?.id);
    const personRec = included.find(i => i.type === 'people' && i.id === personRef?.id);
    return {
      node: {
        name: { full: charRec?.attributes?.name || '' },
        image: { medium: charRec?.attributes?.image?.original || charRec?.attributes?.image?.small || '' },
      },
      voiceActors: personRec ? [{
        name: { full: personRec.attributes?.name || '' },
        image: { medium: personRec.attributes?.image?.original || '' },
      }] : [],
    };
  });
  return { edges };
}
async function _kitsuSimilar(genres, excludeMalId) {
  if (!genres || !genres.length) return [];
  const slug = genres[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const json = await kitsuFetch('/anime', {
    'filter[categories]': slug,
    sort: '-userCount',
    include: 'genres,mappings',
    'page[limit]': 15,
  }).catch(() => null);
  if (!json) return [];
  return (json.data || [])
    .map(res => _mapKitsuAnime(res, json.included))
    .filter(a => a && a.id !== excludeMalId)
    .slice(0, 8);
}
async function getAnimeById(id, knownKitsuId) {
  const kitsuId = knownKitsuId || await _kitsuIdForMalId(id);
  const [detailJson, castJson] = await Promise.all([
    kitsuFetch(`/anime/${kitsuId}`, { include: 'genres,categories' }),
    kitsuFetch(`/anime/${kitsuId}/castings`, { include: 'character,person', 'filter[language]': 'Japanese' }).catch(() => null),
  ]);
  const anime = _mapKitsuFull(detailJson, id);
  anime.characters = _mapKitsuCharacters(castJson);
  const similar = await _kitsuSimilar(anime.genres, id);
  anime.recommendations = { nodes: similar.map(a => ({ mediaRecommendation: a })) };
  return anime;
}
async function getAnimeRelations(id, knownKitsuId) {
  const kitsuId = knownKitsuId || await _kitsuIdForMalId(id).catch(() => null);
  if (!kitsuId) return [];
  const relJson = await kitsuFetch(`/anime/${kitsuId}/media-relationships`, { include: 'destination' }).catch(() => null);
  if (!relJson) return [];
  const order = ['prequel', 'sequel', 'parent_story', 'side_story', 'alternative_version', 'alternative_setting', 'spinoff', 'full_story', 'summary', 'other'];
  const rankOf = t => { const i = order.indexOf(t); return i === -1 ? 99 : i; };
  const included = relJson.included || [];
  const rows = (relJson.data || []).map(rel => {
    const role = rel.attributes?.role || 'other';
    if (!['prequel', 'sequel', 'spinoff', 'spin_off'].includes(role)) return null;
    const destRef = rel.relationships?.destination?.data;
    if (!destRef || destRef.type !== 'anime') return null;
    const dest = included.find(inc => inc.type === 'anime' && inc.id === destRef.id);
    if (!dest) return null;
    const da = dest.attributes || {};
    return {
      relationType: role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      kitsuId: dest.id,
      title: da.titles?.en || da.canonicalTitle || 'Unknown',
      coverImage: { large: da.posterImage?.large || da.posterImage?.medium || '' },
      averageScore: da.averageRating ? Math.round(parseFloat(da.averageRating)) : null,
      seasonYear: da.startDate ? Number(da.startDate.slice(0, 4)) : null,
      _rank: rankOf(role),
    };
  }).filter(Boolean).filter(r => r.coverImage.large);
  rows.sort((a, b) => a._rank - b._rank);
  const capped = rows.slice(0, 8);
  const mapRes = await Promise.allSettled(capped.map(r => kitsuFetch(`/anime/${r.kitsuId}/mappings`)));
  return capped.map((r, i) => {
    const m = mapRes[i];
    const list = m.status === 'fulfilled' ? (m.value.data || []) : [];
    const malRec = list.find(x => (x.attributes?.externalSite || '').startsWith('myanimelist'));
    const malId = malRec ? parseInt(malRec.attributes.externalId, 10) : null;
    return {
      relationType: r.relationType,
      id: malId || r.kitsuId,
      kitsuId: r.kitsuId,
      title: r.title,
      coverImage: r.coverImage,
      averageScore: r.averageScore,
      seasonYear: r.seasonYear,
    };
  }).filter(r => r.id);
}
function getAccentHex() { return (VStorage.getAccent() || '#ffffff').replace('#', ''); }
function getProxyUrl(type, serverName, params = {}) {
  const url = new URL(`${LINKS_WORKER_URL}/proxy`);
  url.searchParams.set('type', type);
  url.searchParams.set('server', serverName);
  const all = Object.assign({ color: getAccentHex() }, params);
  for (const [k, v] of Object.entries(all)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}
function posterUrl(path, size = 'w500') { return path ? `https://image.tmdb.org/t/p/${size}${path}` : ''; }
function backdropUrl(path, size = 'w1280') { return path ? `https://image.tmdb.org/t/p/${size}${path}` : ''; }
function moviePlayerUrl(id) { return `https://player.videasy.net/movie/${id}?color=${getAccentHex()}`; }
function tvPlayerUrl(id, s, ep) { return `https://player.videasy.net/tv/${id}/${s}/${ep}/english?color=${getAccentHex()}`; }
function animePlayerUrl(id, ep) { return `https://player.videasy.net/anime/${id}/${ep || 1}?color=${getAccentHex()}`; }
function animeTitle(a) { return a.title?.english || a.title?.romaji || 'Unknown'; }
function _e(s) {
  return VApp?.esc ? VApp.esc(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function _strip(s) { return String(s || '').replace(/<[^>]*>/g, ''); }
function _ensureInfoModal() {
  let o = document.getElementById('nf-info-overlay');
  if (!o) {
    o = document.createElement('div');
    o.id = 'nf-info-overlay';
    o.className = 'nf-info-overlay';
    o.style.display = 'none';
    o.innerHTML = `<div class="nf-info-modal" id="nf-info-modal">
      <button class="nf-info-close" id="nf-info-close" aria-label="Close">✕</button>
      <div id="nf-info-content"></div>
    </div>`;
    document.body.appendChild(o);
    document.getElementById('nf-info-close').onclick = closeInfoModal;
    o.addEventListener('click', e => { if (e.target === o) closeInfoModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfoModal(); });
  }
  return o;
}
function closeInfoModal() {
  const o = document.getElementById('nf-info-overlay');
  if (o) o.style.display = 'none';
}
async function showInfoModal(id, type, knownKitsuId) {
  const overlay = _ensureInfoModal();
  const content = document.getElementById('nf-info-content');
  overlay.style.display = 'flex';
  content.innerHTML = `<div class="nf-info-loading"><div class="nf-info-spinner"></div><span>Loading…</span></div>`;
  try {
    let title, backdrop, poster, year, score, genres = [], overview = '', extra = [], detailUrl;
    if (type === 'movie') {
      const m = await tmdbFetch(`/movie/${id}`);
      title = m.title || 'Untitled'; backdrop = backdropUrl(m.backdrop_path, 'w1280');
      poster = posterUrl(m.poster_path); year = (m.release_date || '').slice(0, 4);
      score = m.vote_average ? Number(m.vote_average).toFixed(1) : 'N/A';
      genres = (m.genres || []).map(g => g.name); overview = m.overview || '';
      extra = [m.runtime ? `${m.runtime} min` : '', m.status || ''].filter(Boolean);
      detailUrl = `media.html?type=movie&id=${id}`;
    } else if (type === 'tv') {
      const s = await tmdbFetch(`/tv/${id}`);
      title = s.name || 'Untitled'; backdrop = backdropUrl(s.backdrop_path, 'w1280');
      poster = posterUrl(s.poster_path); year = (s.first_air_date || '').slice(0, 4);
      score = s.vote_average ? Number(s.vote_average).toFixed(1) : 'N/A';
      genres = (s.genres || []).map(g => g.name); overview = s.overview || '';
      extra = [s.number_of_seasons ? `${s.number_of_seasons} Season${s.number_of_seasons > 1 ? 's' : ''}` : '', s.number_of_episodes ? `${s.number_of_episodes} Eps` : '', s.status || ''].filter(Boolean);
      detailUrl = `media.html?type=tv&id=${id}`;
    } else {
      const a = await getAnimeById(id, knownKitsuId);
      title = animeTitle(a); backdrop = a.bannerImage || '';
      poster = a.coverImage?.extraLarge || a.coverImage?.large || '';
      year = String(a.seasonYear || ''); score = a.averageScore ? (a.averageScore / 10).toFixed(1) : 'N/A';
      genres = a.genres || []; overview = _strip(a.description || '');
      extra = [a.episodes ? `${a.episodes} Episodes` : '', a.status ? a.status.replace(/_/g, ' ') : ''].filter(Boolean);
      detailUrl = `media.html?type=anime&id=${id}${a.kitsuId ? `&kid=${a.kitsuId}` : ''}`;
    }
    const isFav = VStorage.isMediaFavorite(id, type);
    const icon = type === 'movie' ? '' : type === 'tv' ? '' : '';
    content.innerHTML = `
      ${backdrop ? `<img class="nf-info-backdrop" src="${_e(backdrop)}" alt="${_e(title)}">` : `<div class="nf-info-backdrop-fallback">${icon}</div>`}
      <div class="nf-info-body">
        <div class="nf-info-title">${_e(title)}</div>
        <div class="nf-info-chips">
          ${year ? `<span class="nf-info-chip">${_e(year)}</span>` : ''}
          <span class="nf-info-chip">★ ${_e(score)}</span>
          ${extra.map(x => `<span class="nf-info-chip">${_e(x)}</span>`).join('')}
        </div>
        ${genres.length ? `<div class="nf-info-genres">${genres.map(g => `<span class="nf-info-genre">${_e(g)}</span>`).join('')}</div>` : ''}
        ${overview ? `<p class="nf-info-overview">${_e(overview)}</p>` : ''}
        <div class="nf-info-actions">
          <a href="${_e(detailUrl)}" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Now
          </a>
          <button class="btn btn-secondary nf-modal-fav-btn${isFav ? ' favorited' : ''}"
            data-modal-id="${id}" data-modal-type="${_e(type)}" type="button">
            ${isFav ? VApp.IC.starFilled : VApp.IC.star}
            <span>${isFav ? 'In My List' : 'Add to My List'}</span>
          </button>
        </div>
      </div>`;
    content.querySelector('.nf-modal-fav-btn')?.addEventListener('click', function () {
      const mid = Number(this.dataset.modalId), mtype = this.dataset.modalType;
      const added = VStorage.toggleMediaFavorite(mid, mtype);
      this.classList.toggle('favorited', added);
      this.innerHTML = `${added ? VApp.IC.starFilled : VApp.IC.star}<span>${added ? 'In My List' : 'Add to My List'}</span>`;
      VApp.showToast(added ? 'Added to My List' : 'Removed from My List');
      document.dispatchEvent(new CustomEvent('vispora:media-favs-changed', { detail: { id: mid, type: mtype, added } }));
    });
  } catch (err) {
    console.error(err);
    const notFound = /No Kitsu mapping/.test(err.message || '');
    content.innerHTML = `<div class="nf-info-loading"><span>${notFound ? "This title isn't in our anime database yet." : 'Failed to load. Please try again.'}</span></div>`;
  }
}
let _nfPop = null, _nfShowT = null, _nfHideT = null, _nfActiveCard = null;
function initNFPopupSystem() {
  if (_nfPop) return;
  _nfPop = document.createElement('div');
  _nfPop.className = 'nf-popup-global';
  _nfPop.style.display = 'none';
  document.body.appendChild(_nfPop);
  _nfPop.addEventListener('mouseenter', () => clearTimeout(_nfHideT));
  _nfPop.addEventListener('mouseleave', () => { _nfHideT = setTimeout(_hideNFPop, 130); });
  _nfPop.addEventListener('click', e => {
    const ib = e.target.closest('.nf-popup-btn-info');
    if (ib) { e.preventDefault(); _hideNFPop(); showInfoModal(Number(ib.dataset.id), ib.dataset.type, ib.dataset.kitsuId ? Number(ib.dataset.kitsuId) : null); return; }
    const st = e.target.closest('.nf-popup-star');
    if (st) {
      e.preventDefault();
      const sid = Number(st.dataset.id), stype = st.dataset.mediaType;
      let added;
      if (stype === 'game') {
        added = VStorage.toggleFavorite(sid);
        document.dispatchEvent(new CustomEvent('vispora:game-favs-changed', { detail: { id: sid, added } }));
      } else {
        added = VStorage.toggleMediaFavorite(sid, stype);
        document.dispatchEvent(new CustomEvent('vispora:media-favs-changed', { detail: { id: sid, type: stype, added } }));
      }
      st.classList.toggle('favorited', added);
      st.innerHTML = added ? VApp.IC.starFilled : VApp.IC.star;
      st.setAttribute('aria-label', added ? 'In My List' : 'Add to My List');
      VApp.showToast(added ? 'Added to My List' : 'Removed from My List');
      if (_nfActiveCard) {
        const cs = _nfActiveCard.querySelector('.nf-card-star');
        if (cs) { cs.classList.toggle('favorited', added); cs.innerHTML = added ? VApp.IC.starFilled : VApp.IC.star; }
      }
    }
    const wa = e.target.closest('.nf-popup-btn-watch');
    if (wa && wa.tagName !== 'A') { e.preventDefault(); window.location.href = wa.dataset.href || '#'; }
  });
}
function _showNFPop(card) {
  _nfActiveCard = card;
  const id = card.dataset.id;
  const type = card.dataset.type;
  const kitsuId = card.getAttribute('data-kitsu-id') || '';
  const title = card.getAttribute('data-title') || '';
  const backdrop = card.getAttribute('data-backdrop') || '';
  const poster = card.getAttribute('data-poster') || '';
  const overview = card.getAttribute('data-overview') || '';
  const meta = card.getAttribute('data-meta') || '';
  let isFav, detailUrl, playBtnHtml, infoBtnHtml;
  if (type === 'game') {
    isFav = VStorage.isFavorite(Number(id));
    detailUrl = `player.html?id=${id}`;
    playBtnHtml = `<a href="${_e(detailUrl)}" class="nf-popup-btn nf-popup-btn-watch"><svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</a>`;
    infoBtnHtml = '';
  } else {
    isFav = VStorage.isMediaFavorite(Number(id), type);
    detailUrl = `${pfx}media.html?type=${type}&id=${id}${kitsuId ? `&kid=${kitsuId}` : ''}`;
    playBtnHtml = `<a href="${_e(detailUrl)}" class="nf-popup-btn nf-popup-btn-watch"><svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><polygon points="5 3 19 12 5 21 5 3"/></svg> Watch</a>`;
    infoBtnHtml = `<button class="nf-popup-btn nf-popup-btn-info" data-id="${id}" data-type="${_e(type)}" data-kitsu-id="${_e(kitsuId)}" type="button">ⓘ Info</button>`;
  }
  const icon = type === 'movie' ? '' : type === 'tv' ? '' : type === 'anime' ? '' : '';
  _nfPop.innerHTML = `
    ${backdrop ? `<img class="nf-popup-backdrop" src="${_e(backdrop)}" alt="${_e(title)}" loading="lazy">`
      : poster ? `<div class="nf-popup-no-backdrop"><img src="${_e(poster)}" alt="${_e(title)}" loading="lazy"></div>`
        : `<div class="nf-popup-no-backdrop">${icon}</div>`}
    <div class="nf-popup-body">
      <div class="nf-popup-title">${_e(title)}</div>
      ${meta ? `<div class="nf-popup-meta">${_e(meta)}</div>` : ''}
      ${overview ? `<p class="nf-popup-overview">${_e(overview.slice(0, 160))}${overview.length > 160 ? '…' : ''}</p>` : ''}
      <div class="nf-popup-actions">
        ${playBtnHtml}
        ${infoBtnHtml}
        <button class="nf-popup-star${isFav ? ' favorited' : ''}" data-id="${id}" data-media-type="${_e(type)}"
          aria-label="${isFav ? 'In My List' : 'Add to My List'}" type="button">
          ${isFav ? VApp.IC.starFilled : VApp.IC.star}
        </button>
      </div>
    </div>`;
  const rect = card.getBoundingClientRect();
  const pw = 310;
  let left = rect.left + rect.width / 2 - pw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  const spaceBelow = window.innerHeight - rect.bottom;
  const top = (spaceBelow > 270 ? rect.bottom - 8 : rect.top - 270) + window.scrollY;
  _nfPop.style.cssText = `display:block;left:${left}px;top:${top}px;`;
}
function _hideNFPop() {
  if (_nfPop) _nfPop.style.display = 'none';
  _nfActiveCard = null;
}
function initNFRowCards(container) {
  initNFStars(container);
  initGridInfoBtns(container);
}
function initNFCards(container) {
  initNFPopupSystem();
  container.querySelectorAll('.nf-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      clearTimeout(_nfHideT); clearTimeout(_nfShowT);
      _nfShowT = setTimeout(() => _showNFPop(card), 280);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(_nfShowT);
      _nfHideT = setTimeout(() => { if (!_nfPop?.matches(':hover')) _hideNFPop(); }, 130);
    });
  });
  initNFStars(container);
}
function initNFStars(container) {
  container.addEventListener('click', e => {
    const b = e.target.closest('.nf-card-star');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const id = Number(b.dataset.id), type = b.dataset.mediaType;
    let added;
    if (type === 'game') {
      added = VStorage.toggleFavorite(id);
      document.dispatchEvent(new CustomEvent('vispora:game-favs-changed', { detail: { id, added } }));
    } else {
      added = VStorage.toggleMediaFavorite(id, type);
      document.dispatchEvent(new CustomEvent('vispora:media-favs-changed', { detail: { id, type, added } }));
    }
    b.classList.toggle('favorited', added);
    b.innerHTML = added ? VApp.IC.starFilled : VApp.IC.star;
    b.setAttribute('aria-label', added ? 'In My List' : 'Add to My List');
    VApp.showToast(added ? 'Added to My List' : 'Removed from My List');
  });
}
function makeNFRowCard(item, type) {
  let id, title, year, score, poster, backdrop, overview, epBadge;
  if (type === 'movie') {
    id = item.id; title = item.title || 'Untitled';
    year = (item.release_date || '').slice(0, 4);
    score = item.vote_average ? Number(item.vote_average).toFixed(1) : '';
    poster = posterUrl(item.poster_path, 'w342'); backdrop = backdropUrl(item.backdrop_path, 'w780');
    overview = item.overview || ''; epBadge = '';
  } else if (type === 'tv') {
    id = item.id; title = item.name || 'Untitled';
    year = (item.first_air_date || '').slice(0, 4);
    score = item.vote_average ? Number(item.vote_average).toFixed(1) : '';
    poster = posterUrl(item.poster_path, 'w342'); backdrop = backdropUrl(item.backdrop_path, 'w780');
    overview = item.overview || '';
    const p = VStorage.getTVProgress(item.id);
    epBadge = p && (p.season > 1 || p.episode > 1) ? `<div class="nf-card-progress">S${p.season} E${p.episode}</div>` : '';
  } else {
    id = item.id; title = animeTitle(item);
    year = String(item.seasonYear || '');
    score = item.averageScore ? (item.averageScore / 10).toFixed(1) : '';
    poster = item.coverImage?.large || ''; backdrop = item.bannerImage || item.coverImage?.extraLarge || '';
    overview = _strip(item.description || '');
    const p = VStorage.getAnimeProgress(item.id);
    epBadge = p && p.episode > 1 ? `<div class="nf-card-progress">Ep ${p.episode}</div>` : '';
  }
  const kitsuId = type === 'anime' ? (item.kitsuId || '') : '';
  const isFav = VStorage.isMediaFavorite(id, type);
  const meta = [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · ');
  const detailUrl = `media.html?type=${type}&id=${id}${kitsuId ? `&kid=${kitsuId}` : ''}`;
  const icon = type === 'movie' ? '' : type === 'tv' ? '' : '';
  return `<div class="nf-card"
      data-id="${id}" data-type="${_e(type)}" data-kitsu-id="${_e(String(kitsuId))}"
      data-title="${_e(title)}" data-backdrop="${_e(backdrop)}"
      data-poster="${_e(poster)}" data-overview="${_e(overview.slice(0, 200))}"
      data-meta="${_e(meta)}">
    <a href="${_e(detailUrl)}" class="nf-card-link" tabindex="0" aria-label="${_e(title)}" draggable="false">
      ${poster ? `<img class="nf-card-poster" src="${_e(poster)}" alt="${_e(title)}" loading="lazy" decoding="async">` : `<div class="nf-card-noposter">${icon}</div>`}
      <div class="nf-card-overlay">
        <div class="nf-card-title-text">${_e(title)}</div>
        ${meta ? `<div class="nf-card-meta-text">${_e(meta)}</div>` : ''}
      </div>
    </a>
    ${epBadge}
    <button class="nf-card-star${isFav ? ' favorited' : ''}"
      data-id="${id}" data-media-type="${_e(type)}"
      aria-label="${isFav ? 'In My List' : 'Add to My List'}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
    <button class="nf-card-info-btn" onclick="event.preventDefault();event.stopPropagation();VMedia.showInfoModal(${id},'${_e(type)}',${kitsuId || 'null'})" aria-label="More info" type="button">ⓘ</button>
  </div>`;
}
function _gridCard({ id, type, href, imgSrc, imgAlt, epBadge, title, meta, isFav, showRemove, compact, removeMode, kitsuId }) {
  return `<a href="${_e(href)}" class="media-card${compact ? ' media-card-compact' : ''}" data-id="${id}" data-media-type="${_e(type)}" tabindex="0" aria-label="${_e(imgAlt)}">
    ${imgSrc ? `<img src="${_e(imgSrc)}" alt="${_e(imgAlt)}" loading="lazy" decoding="async">` : `<div class="media-card-noposter">${type === 'movie' ? '' : type === 'tv' ? '' : type === 'game' ? '' : ''}</div>`}
    ${epBadge || ''}
    <div class="media-card-overlay">
      <div class="media-card-title">${_e(title)}</div>
      ${!compact ? `<div class="media-card-meta-row">
        ${meta ? `<div class="media-card-meta">${_e(meta)}</div>` : '<div></div>'}
        <button class="media-card-info-inline nf-grid-info-btn" data-id="${id}" data-type="${_e(type)}" data-kitsu-id="${_e(String(kitsuId || ''))}" aria-label="More info" type="button">ⓘ</button>
      </div>` : ''}
    </div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}"
      data-id="${id}" data-media-type="${_e(type)}"
      aria-label="${isFav ? 'In My List' : 'Add to My List'}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
    ${showRemove ? `<button class="game-card-remove" data-id="${id}" data-media-type="${_e(type)}"${removeMode ? ` data-remove-mode="${_e(removeMode)}"` : ''} aria-label="Remove" type="button">${VApp.IC.x}</button>` : ''}
  </a>`;
}
function makeMovieCard(movie, opts = {}) {
  const { showRemove = false, compact = false, removeMode } = opts;
  const year = (movie.release_date || '').slice(0, 4);
  const score = movie.vote_average ? Number(movie.vote_average).toFixed(1) : '';
  return _gridCard({
    id: movie.id, type: 'movie',
    href: `media.html?type=movie&id=${movie.id}`,
    imgSrc: posterUrl(movie.poster_path), imgAlt: movie.title || '',
    epBadge: '', title: movie.title || 'Untitled',
    meta: [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · '),
    isFav: VStorage.isMediaFavorite(movie.id, 'movie'), showRemove, compact, removeMode,
  });
}
function makeTVCard(show, opts = {}) {
  const { showRemove = false, compact = false, removeMode } = opts;
  const year = (show.first_air_date || '').slice(0, 4);
  const score = show.vote_average ? Number(show.vote_average).toFixed(1) : '';
  const prog = VStorage.getTVProgress(show.id);
  const epBadge = (prog && (prog.season > 1 || prog.episode > 1))
    ? `<div class="media-card-progress">S${prog.season} E${prog.episode}</div>` : '';
  return _gridCard({
    id: show.id, type: 'tv',
    href: `media.html?type=tv&id=${show.id}`,
    imgSrc: posterUrl(show.poster_path), imgAlt: show.name || '',
    epBadge, title: show.name || 'Untitled',
    meta: [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · '),
    isFav: VStorage.isMediaFavorite(show.id, 'tv'), showRemove, compact, removeMode,
  });
}
function makeAnimeCard(anime, opts = {}) {
  const { showRemove = false, compact = false, removeMode } = opts;
  const title = animeTitle(anime);
  const year = anime.seasonYear || '';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '';
  const poster = anime.coverImage?.large || anime.coverImage?.extraLarge || '';
  const prog = VStorage.getAnimeProgress(anime.id);
  const epBadge = (prog && prog.episode > 1)
    ? `<div class="media-card-progress">Ep ${prog.episode}</div>` : '';
  return _gridCard({
    id: anime.id, type: 'anime',
    href: `media.html?type=anime&id=${anime.id}${anime.kitsuId ? `&kid=${anime.kitsuId}` : ''}`,
    imgSrc: poster, imgAlt: title,
    epBadge, title,
    meta: [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · '),
    isFav: VStorage.isMediaFavorite(anime.id, 'anime'), showRemove, compact, removeMode,
    kitsuId: anime.kitsuId,
  });
}
function makeHistoryMediaCard(entry, opts = {}) {
  if (entry.type === 'anime') return makeAnimeCard({ id: entry.id, kitsuId: entry.kitsuId, coverImage: { large: entry.poster_path }, title: { english: entry.title }, seasonYear: '', averageScore: 0 }, opts);
  if (entry.type === 'tv') return makeTVCard({ id: entry.id, name: entry.title, poster_path: entry.poster_path, first_air_date: '', vote_average: 0 }, opts);
  return makeMovieCard({ id: entry.id, title: entry.title, poster_path: entry.poster_path, release_date: '', vote_average: 0 }, opts);
}
function makeContinueWatchingCard(entry) {
  const icons = { movie: 'Movie', tv: 'TV', anime: 'Anime' };
  let img = entry.backdrop_path;
  if (img && entry.type !== 'anime') img = `https://image.tmdb.org/t/p/w780${img}`;
  if (!img) img = entry.type === 'anime' ? entry.poster_path : (entry.poster_path ? `https://image.tmdb.org/t/p/w342${entry.poster_path}` : '');
  let epBadge = '';
  if (entry.type === 'tv') {
    const prog = VStorage.getTVProgress(entry.id);
    epBadge = `<div class="media-card-progress">S${prog.season} E${prog.episode}</div>`;
  } else if (entry.type === 'anime') {
    const prog = VStorage.getAnimeProgress(entry.id);
    epBadge = `<div class="media-card-progress">Ep ${prog.episode}</div>`;
  }
  return `<a href="media.html?type=${entry.type}&id=${entry.id}${entry.type === 'anime' && entry.kitsuId ? `&kid=${entry.kitsuId}` : ''}" class="cw-card" data-id="${entry.id}" data-media-type="${entry.type}" tabindex="0" aria-label="${_e(entry.title || '')}">
    ${img ? `<img src="${_e(img)}" alt="${_e(entry.title || '')}" loading="lazy" decoding="async">` : `<div class="media-card-noposter">${icons[entry.type] || ''}</div>`}
    <div class="cw-card-gradient"></div>
    <div class="cw-card-badge">${icons[entry.type] || ''}</div>
    <div class="cw-card-title">${_e(entry.title || 'Unknown')}</div>
    ${epBadge}
    <button class="game-card-star media-star" data-id="${entry.id}" data-media-type="${entry.type}" aria-label="${VStorage.isMediaFavorite(entry.id, entry.type) ? 'In My List' : 'Add to My List'}" type="button">
      ${VStorage.isMediaFavorite(entry.id, entry.type) ? VApp.IC.starFilled : VApp.IC.star}
    </button>
  </a>`;
}
function initMediaStars(container) {
  container.addEventListener('click', e => {
    const b = e.target.closest('.media-star');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const id = Number(b.dataset.id), type = b.dataset.mediaType;
    let added;
    if (type === 'game') {
      added = VStorage.toggleFavorite(id);
      document.dispatchEvent(new CustomEvent('vispora:game-favs-changed', { detail: { id, added } }));
    } else {
      added = VStorage.toggleMediaFavorite(id, type);
      document.dispatchEvent(new CustomEvent('vispora:media-favs-changed', { detail: { id, type, added } }));
    }
    b.classList.toggle('favorited', added);
    b.innerHTML = added ? VApp.IC.starFilled : VApp.IC.star;
    b.setAttribute('aria-label', added ? 'In My List' : 'Add to My List');
    VApp.showToast(added ? 'Added to My List' : 'Removed from My List');
  });
}
function initMediaRemove(container, onRemove) {
  container.addEventListener('click', e => {
    const b = e.target.closest('.game-card-remove');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const id = Number(b.dataset.id), type = b.dataset.mediaType;
    VStorage.removeFromMediaHistory(id, type);
    b.closest('.media-card')?.remove();
    VApp.showToast('Removed from history');
    document.dispatchEvent(new CustomEvent('vispora:media-hist-changed', { detail: { id, type } }));
    if (onRemove) onRemove(id, type);
  });
}
function initGridInfoBtns(container) {
  container.addEventListener('click', e => {
    const b = e.target.closest('.nf-grid-info-btn');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    showInfoModal(Number(b.dataset.id), b.dataset.type, b.dataset.kitsuId ? Number(b.dataset.kitsuId) : null);
  });
}
const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
];
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' },
];
const ANIME_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music', 'Psychological', 'Historical', 'Military'];
function getMovieGenres() { return Promise.resolve(MOVIE_GENRES); }
function getTVGenres() { return Promise.resolve(TV_GENRES); }
function getAnimeGenres() { return Promise.resolve(ANIME_GENRES.map(n => ({ id: n, name: n }))); }
window.VMedia = {
  tmdbFetch, kitsuFetch, getAccentHex, getProxyUrl, posterUrl, backdropUrl,
  moviePlayerUrl, tvPlayerUrl, animePlayerUrl, animeTitle,
  makeMovieCard, makeTVCard, makeAnimeCard, makeHistoryMediaCard, makeContinueWatchingCard, makeNFRowCard,
  initMediaStars, initMediaRemove, initGridInfoBtns,
  initNFCards, initNFRowCards, initNFStars, initNFPopupSystem,
  showInfoModal, closeInfoModal,
  getMovieGenres, getTVGenres, getAnimeGenres,
  getPopularAnime, getAiringAnime, getTopAnime, searchAnime, getAnimeById, getAnimeRelations,
  getAnilistIdForMal,
  getServerConfig, fetchServerConfig, describeServerDiff,
};