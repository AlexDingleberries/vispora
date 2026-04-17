'use strict';
const TMDB_KEY = 'af0f4f810b172fe42fa1063137979e31';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const ANILIST_BASE = 'https://graphql.anilist.co';

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`TMDB ${r.status}: ${endpoint}`);
  return r.json();
}

async function anilistFetch(query, variables = {}) {
  const r = await fetch(ANILIST_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(`Anilist ${r.status}`);
  const json = await r.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

const ANIME_FIELDS = `
  id title { english romaji }
  coverImage { large extraLarge }
  bannerImage description genres
  averageScore episodes status
  season seasonYear
  studios(isMain: true) { nodes { name } }
`;

async function getPopularAnime(page = 1) {
  const data = await anilistFetch(`
    query($page:Int){Page(page:$page,perPage:20){
      pageInfo{total currentPage lastPage}
      media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){${ANIME_FIELDS}}
    }}`, { page });
  return data.Page;
}

async function getAiringAnime(page = 1) {
  const data = await anilistFetch(`
    query($page:Int){Page(page:$page,perPage:20){
      pageInfo{total currentPage lastPage}
      media(type:ANIME,status:RELEASING,sort:POPULARITY_DESC,isAdult:false){${ANIME_FIELDS}}
    }}`, { page });
  return data.Page;
}

async function getTopAnime(page = 1) {
  const data = await anilistFetch(`
    query($page:Int){Page(page:$page,perPage:20){
      pageInfo{total currentPage lastPage}
      media(type:ANIME,sort:SCORE_DESC,isAdult:false){${ANIME_FIELDS}}
    }}`, { page });
  return data.Page;
}

async function searchAnime(query, page = 1) {
  const data = await anilistFetch(`
    query($search:String,$page:Int){Page(page:$page,perPage:20){
      pageInfo{total currentPage lastPage}
      media(type:ANIME,search:$search,isAdult:false){${ANIME_FIELDS}}
    }}`, { search: query, page });
  return data.Page;
}

async function getAnimeById(id) {
  const data = await anilistFetch(`
    query($id:Int){Media(id:$id,type:ANIME){
      ${ANIME_FIELDS}
      characters(sort:ROLE,perPage:10){nodes{name{full}image{medium}}}
      recommendations(perPage:8){nodes{mediaRecommendation{${ANIME_FIELDS}}}}
    }}`, { id: Number(id) });
  return data.Media;
}

function getAccentHex() {
  return (VStorage.getAccent() || '#ffffff').replace('#', '');
}

function posterUrl(path, size = 'w500') {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function backdropUrl(path, size = 'w1280') {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function moviePlayerUrl(tmdbId) {
  return `https://player.videasy.net/movie/${tmdbId}?color=${getAccentHex()}`;
}

function tvPlayerUrl(tmdbId, season, episode) {
  return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}/english?color=${getAccentHex()}`;
}

function animePlayerUrl(anilistId, episode) {
  const ep = episode || 1;
  return `https://player.videasy.net/anime/${anilistId}/${ep}?color=${getAccentHex()}`;
}

function animeTitle(anime) {
  return anime.title?.english || anime.title?.romaji || 'Unknown';
}

/* ---- Movie card ---- */
function makeMovieCard(movie, opts = {}) {
  const { showRemove = false } = opts;
  const isFav = VStorage.isMediaFavorite(movie.id, 'movie');
  const year  = (movie.release_date || '').slice(0, 4);
  const score = movie.vote_average ? Number(movie.vote_average).toFixed(1) : '';
  const meta  = [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · ');
  return `<a href="media.html?type=movie&id=${movie.id}"
    class="media-card movie-card" data-id="${movie.id}" data-media-type="movie"
    tabindex="0" aria-label="${VApp.esc(movie.title || '')}">
    ${movie.poster_path
      ? `<img src="${VApp.esc(posterUrl(movie.poster_path))}" alt="${VApp.esc(movie.title || '')}" loading="lazy" decoding="async">`
      : `<div class="media-card-noposter">🎬</div>`}
    <div class="media-card-overlay">
      <div class="media-card-title">${VApp.esc(movie.title || 'Untitled')}</div>
      ${meta ? `<div class="media-card-meta">${VApp.esc(meta)}</div>` : ''}
    </div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}"
      data-id="${movie.id}" data-media-type="movie"
      aria-label="${isFav ? 'Unfavorite' : 'Favorite'}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
    ${showRemove ? `<button class="game-card-remove" data-id="${movie.id}" data-media-type="movie" aria-label="Remove" type="button">${VApp.IC.x}</button>` : ''}
  </a>`;
}

/* ---- TV card ---- */
function makeTVCard(show, opts = {}) {
  const { showRemove = false } = opts;
  const isFav = VStorage.isMediaFavorite(show.id, 'tv');
  const year  = (show.first_air_date || '').slice(0, 4);
  const score = show.vote_average ? Number(show.vote_average).toFixed(1) : '';
  const meta  = [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · ');
  const prog  = VStorage.getTVProgress(show.id);
  const epBadge = (prog && (prog.season > 1 || prog.episode > 1))
    ? `<div class="media-card-progress">S${prog.season} E${prog.episode}</div>` : '';
  return `<a href="media.html?type=tv&id=${show.id}"
    class="media-card tv-card" data-id="${show.id}" data-media-type="tv"
    tabindex="0" aria-label="${VApp.esc(show.name || '')}">
    ${show.poster_path
      ? `<img src="${VApp.esc(posterUrl(show.poster_path))}" alt="${VApp.esc(show.name || '')}" loading="lazy" decoding="async">`
      : `<div class="media-card-noposter">📺</div>`}
    ${epBadge}
    <div class="media-card-overlay">
      <div class="media-card-title">${VApp.esc(show.name || 'Untitled')}</div>
      ${meta ? `<div class="media-card-meta">${VApp.esc(meta)}</div>` : ''}
    </div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}"
      data-id="${show.id}" data-media-type="tv"
      aria-label="${isFav ? 'Unfavorite' : 'Favorite'}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
    ${showRemove ? `<button class="game-card-remove" data-id="${show.id}" data-media-type="tv" aria-label="Remove" type="button">${VApp.IC.x}</button>` : ''}
  </a>`;
}

/* ---- Anime card ---- */
function makeAnimeCard(anime, opts = {}) {
  const { showRemove = false } = opts;
  const isFav = VStorage.isMediaFavorite(anime.id, 'anime');
  const title = animeTitle(anime);
  const year  = anime.seasonYear || '';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '';
  const meta  = [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · ');
  const poster = anime.coverImage?.large || anime.coverImage?.extraLarge || '';
  const prog  = VStorage.getAnimeProgress(anime.id);
  const epBadge = (prog && prog.episode > 1)
    ? `<div class="media-card-progress">Ep ${prog.episode}</div>` : '';
  return `<a href="media.html?type=anime&id=${anime.id}"
    class="media-card anime-card" data-id="${anime.id}" data-media-type="anime"
    tabindex="0" aria-label="${VApp.esc(title)}">
    ${poster
      ? `<img src="${VApp.esc(poster)}" alt="${VApp.esc(title)}" loading="lazy" decoding="async">`
      : `<div class="media-card-noposter">🎌</div>`}
    ${epBadge}
    <div class="media-card-overlay">
      <div class="media-card-title">${VApp.esc(title)}</div>
      ${meta ? `<div class="media-card-meta">${VApp.esc(meta)}</div>` : ''}
    </div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}"
      data-id="${anime.id}" data-media-type="anime"
      aria-label="${isFav ? 'Unfavorite' : 'Favorite'}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
    ${showRemove ? `<button class="game-card-remove" data-id="${anime.id}" data-media-type="anime" aria-label="Remove" type="button">${VApp.IC.x}</button>` : ''}
  </a>`;
}

/* Make a card from a history entry */
function makeHistoryMediaCard(entry, opts = {}) {
  if (entry.type === 'anime') {
    return makeAnimeCard({
      id: entry.id, coverImage: { large: entry.poster_path },
      title: { english: entry.title }, seasonYear: '', averageScore: 0
    }, opts);
  }
  if (entry.type === 'tv') {
    return makeTVCard({ id: entry.id, name: entry.title, poster_path: entry.poster_path, first_air_date: '', vote_average: 0 }, opts);
  }
  return makeMovieCard({ id: entry.id, title: entry.title, poster_path: entry.poster_path, release_date: '', vote_average: 0 }, opts);
}

/* Star click handler — dispatches events for reactivity */
function initMediaStars(container) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('.media-star');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const id   = Number(btn.dataset.id);
    const type = btn.dataset.mediaType;
    const added = VStorage.toggleMediaFavorite(id, type);
    btn.classList.toggle('favorited', added);
    btn.innerHTML = added ? VApp.IC.starFilled : VApp.IC.star;
    btn.setAttribute('aria-label', added ? 'Unfavorite' : 'Favorite');
    VApp.showToast(added ? 'Added to favorites' : 'Removed from favorites');
    document.dispatchEvent(new CustomEvent('vispora:media-favs-changed', { detail: { id, type, added } }));
  });
}

/* Remove click handler for media history cards */
function initMediaRemove(container, onRemove) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('.game-card-remove');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const id   = Number(btn.dataset.id);
    const type = btn.dataset.mediaType;
    VStorage.removeFromMediaHistory(id, type);
    btn.closest('.media-card')?.remove();
    VApp.showToast('Removed from history');
    document.dispatchEvent(new CustomEvent('vispora:media-hist-changed', { detail: { id, type } }));
    if (onRemove) onRemove(id, type);
  });
}

/* Genre helpers — hardcoded TMDB IDs */
const MOVIE_GENRES = [
  { id: 28,    name: 'Action' }, { id: 12, name: 'Adventure' },
  { id: 16,    name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80,    name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18,    name: 'Drama' }, { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' }, { id: 36, name: 'History' },
  { id: 27,    name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648,  name: 'Mystery' }, { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Science Fiction' }, { id: 10770, name: 'TV Movie' },
  { id: 53,    name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
];
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' },
  { id: 35,    name: 'Comedy' }, { id: 80, name: 'Crime' },
  { id: 99,    name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' },
  { id: 9648,  name: 'Mystery' }, { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' },
];
const ANIME_GENRES = [
  'Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery',
  'Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller',
  'Mecha','Music','Psychological','Ecchi','Historical','Military',
];

function getMovieGenres() { return Promise.resolve(MOVIE_GENRES); }
function getTVGenres()    { return Promise.resolve(TV_GENRES); }
function getAnimeGenres() { return Promise.resolve(ANIME_GENRES.map(n => ({ id: n, name: n }))); }

window.VMedia = {
  tmdbFetch, anilistFetch, getAccentHex, posterUrl, backdropUrl,
  moviePlayerUrl, tvPlayerUrl, animePlayerUrl, animeTitle,
  makeMovieCard, makeTVCard, makeAnimeCard, makeHistoryMediaCard,
  initMediaStars, initMediaRemove,
  getMovieGenres, getTVGenres, getAnimeGenres,
  getPopularAnime, getAiringAnime, getTopAnime, searchAnime, getAnimeById,
};