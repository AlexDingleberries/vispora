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

function moviePlayerUrl(tmdbId) {
  return `https://api.cinetaro.buzz/movie/${tmdbId}/english?color=${getAccentHex()}`;
}

function tvPlayerUrl(tmdbId, season, episode) {
  return `https://api.cinetaro.buzz/tv/${tmdbId}/${season}/${episode}/english?color=${getAccentHex()}`;
}

function makeMovieCard(movie, opts = {}) {
  const { linkToPlayer = true } = opts;
  const isFav = VStorage.isMovieFavorite(movie.id);
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : '';
  const tag = linkToPlayer ? 'a' : 'div';
  const href = `media.html?type=movie&id=${movie.id}`;
  return `<${tag} ${linkToPlayer ? `href="${VApp.esc(href)}"` : ''} class="media-card movie-card" data-id="${movie.id}" tabindex="0" aria-label="${VApp.esc(movie.title || '')}">
    <div class="media-card-poster">
      ${movie.poster_path
        ? `<img src="${VApp.esc(posterUrl(movie.poster_path))}" alt="${VApp.esc(movie.title || '')}" loading="lazy" decoding="async">`
        : `<div class="media-card-noposter">🎬</div>`}
    </div>
    <div class="media-card-info">
      <div class="media-card-title">${VApp.esc(movie.title || 'Untitled')}</div>
      <div class="media-card-meta">${[year, rating ? `⭐ ${rating}` : ''].filter(Boolean).join(' · ')}</div>
    </div>
    <button class="visp-card-star media-star${isFav ? ' favorited' : ''}" data-id="${movie.id}" data-media-type="movie"
      aria-label="${isFav ? 'Unfavorite' : 'Favorite'} ${VApp.esc(movie.title || '')}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
  </${tag}>`;
}

function makeTVCard(show, opts = {}) {
  const { linkToPlayer = true } = opts;
  const isFav = VStorage.isTVFavorite(show.id);
  const year = show.first_air_date ? show.first_air_date.slice(0, 4) : '';
  const rating = show.vote_average ? Number(show.vote_average).toFixed(1) : '';
  const tag = linkToPlayer ? 'a' : 'div';
  const href = `media.html?type=tv&id=${show.id}`;
  return `<${tag} ${linkToPlayer ? `href="${VApp.esc(href)}"` : ''} class="media-card tv-card" data-id="${show.id}" tabindex="0" aria-label="${VApp.esc(show.name || '')}">
    <div class="media-card-poster">
      ${show.poster_path
        ? `<img src="${VApp.esc(posterUrl(show.poster_path))}" alt="${VApp.esc(show.name || '')}" loading="lazy" decoding="async">`
        : `<div class="media-card-noposter">📺</div>`}
    </div>
    <div class="media-card-info">
      <div class="media-card-title">${VApp.esc(show.name || 'Untitled')}</div>
      <div class="media-card-meta">${[year, rating ? `⭐ ${rating}` : ''].filter(Boolean).join(' · ')}</div>
    </div>
    <button class="visp-card-star media-star${isFav ? ' favorited' : ''}" data-id="${show.id}" data-media-type="tv"
      aria-label="${isFav ? 'Unfavorite' : 'Favorite'} ${VApp.esc(show.name || '')}" type="button">
      ${isFav ? VApp.IC.starFilled : VApp.IC.star}
    </button>
  </${tag}>`;
}

function initMediaStars(container) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('.media-star');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const id = Number(btn.dataset.id);
    const type = btn.dataset.mediaType;
    const added = type === 'movie' ? VStorage.toggleMovieFavorite(id) : VStorage.toggleTVFavorite(id);
    btn.classList.toggle('favorited', added);
    btn.innerHTML = added ? VApp.IC.starFilled : VApp.IC.star;
    VApp.showToast(added ? 'Added to favorites' : 'Removed from favorites');
  });
}

let _movieGenres = null;
let _tvGenres = null;

async function getMovieGenres() {
  if (_movieGenres) return _movieGenres;
  try {
    const d = await tmdbFetch('/genre/movie/list');
    _movieGenres = d.genres || [];
  } catch { _movieGenres = []; }
  return _movieGenres;
}

async function getTVGenres() {
  if (_tvGenres) return _tvGenres;
  try {
    const d = await tmdbFetch('/genre/tv/list');
    _tvGenres = d.genres || [];
  } catch { _tvGenres = []; }
  return _tvGenres;
}

window.VMedia = {
  tmdbFetch, getAccentHex, posterUrl, moviePlayerUrl, tvPlayerUrl,
  makeMovieCard, makeTVCard, initMediaStars,
  getMovieGenres, getTVGenres
};