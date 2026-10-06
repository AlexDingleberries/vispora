let _games = [];
let _filtered = [];
let _currentCategory = 'all';
let _currentGenre = 'all';
let _currentQuery = '';

function setGames(games) {
  _games = games;
  _filtered = games;
}

function getFiltered() { return _filtered; }

function search(query) {
  _currentQuery = (query || '').toLowerCase().trim();
  _applyFilters();
}

function setCategory(cat) {
  _currentCategory = cat || 'all';
  _applyFilters();
}

function setGenre(genre) {
  _currentGenre = genre || 'all';
  _applyFilters();
}

function _applyFilters() {
  let results = _games;

  if (_currentCategory !== 'all') {
    results = results.filter(g => {
      const specials = g.special || [];
      if (_currentCategory === 'web')   return specials.includes('web') || specials.length === 0;
      if (_currentCategory === 'ports') return specials.includes('port');
      if (_currentCategory === 'flash') return specials.includes('flash');
      if (_currentCategory === 'emulator') return specials.includes('emulator');
      if (_currentCategory === 'fnf') return specials.includes('fnf');
      return true;
    });
  }

  if (_currentGenre !== 'all') {
    results = results.filter(g => {
      const genres = g.genres || [];
      return genres.includes(_currentGenre);
    });
  }

  if (_currentQuery) {
    results = results.filter(g => {
      const name = (g.name || '').toLowerCase();
      const author = (g.author || '').toLowerCase();
      const genres = (g.genres || []).join(' ').toLowerCase();

      return name.includes(_currentQuery) ||
             author.includes(_currentQuery) ||
             genres.includes(_currentQuery) ||
             _fuzzyMatch(_currentQuery, name);
    });
  }

  _filtered = results;
  return results;
}

function _fuzzyMatch(query, target) {
  let qi = 0;
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function getAllGenres(games) {
  const set = new Set();
  (games || _games).forEach(g => {
    (g.genres || []).forEach(genre => set.add(genre));
  });
  return [...set].sort();
}

window.VSearch = {
  setGames,
  getFiltered,
  search,
  setCategory,
  setGenre,
  getAllGenres,
};