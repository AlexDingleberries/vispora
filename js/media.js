'use strict';
const TMDB_KEY = 'af0f4f810b172fe42fa1063137979e31';
const TMDB_BASE = 'https://api.themoviedb.org/3';

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

function tvPlayerUrl(tmdbId, season, episode) {https://player.vidplus.to/embed/tv/${tmdbId}/${season}/${episode}?
  return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}/english?color=${getAccentHex()}`;
}

/* ---- Poster-only card (hover reveals info + blur) ---- */
function makeMovieCard(movie) {
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
  </a>`;
}

function makeTVCard(show) {
  const isFav = VStorage.isMediaFavorite(show.id, 'tv');
  const year  = (show.first_air_date || '').slice(0, 4);
  const score = show.vote_average ? Number(show.vote_average).toFixed(1) : '';
  const meta  = [year, score ? `★ ${score}` : ''].filter(Boolean).join(' · ');
  return `<a href="media.html?type=tv&id=${show.id}"
    class="media-card tv-card" data-id="${show.id}" data-media-type="tv"
    tabindex="0" aria-label="${VApp.esc(show.name || '')}">
    ${show.poster_path
      ? `<img src="${VApp.esc(posterUrl(show.poster_path))}" alt="${VApp.esc(show.name || '')}" loading="lazy" decoding="async">`
      : `<div class="media-card-noposter">📺</div>`}
    <div class="media-card-overlay">
      <div class="media-card-title">${VApp.esc(show.name || 'Untitled')}</div>
      ${meta ? `<div class="media-card-meta">${VApp.esc(meta)}</div>` : ''}
    </div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}"
      data-id="${show.id}" data-media-type="tv"
      aria-label="${isFav ? 'Unfavorite' : 'Favorite'}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
  </a>`;
}

/* Make a card from a history entry (has .type, .title, .poster_path) */
function makeHistoryMediaCard(entry) {
  if (entry.type === 'tv') {
    return makeTVCard({ id: entry.id, name: entry.title, poster_path: entry.poster_path, first_air_date: '', vote_average: 0 });
  }
  return makeMovieCard({ id: entry.id, title: entry.title, poster_path: entry.poster_path, release_date: '', vote_average: 0 });
}

/* Attach star click handlers to any container */
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
  });
}

/* Genre helpers — hardcoded TMDB IDs (these never change) */
const MOVIE_GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 36,    name: 'History' },
  { id: 27,    name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648,  name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53,    name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37,    name: 'Western' },
];

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648,  name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37,    name: 'Western' },
];

function getMovieGenres() { return Promise.resolve(MOVIE_GENRES); }
function getTVGenres()    { return Promise.resolve(TV_GENRES); }

window.VMedia = {
  tmdbFetch, getAccentHex, posterUrl, backdropUrl, moviePlayerUrl, tvPlayerUrl,
  makeMovieCard, makeTVCard, makeHistoryMediaCard, initMediaStars,
  getMovieGenres, getTVGenres,
};