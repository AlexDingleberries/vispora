// ===== VISPORA APP UTILITIES =====

// ---- Toast ----
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'info' ? `toast-${type}` : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Modal ----
function showModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', dangerous = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary modal-cancel">${cancelText}</button>
          <button class="btn ${dangerous ? 'btn-danger' : 'btn-primary'} modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    overlay.querySelector('.modal-confirm').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });

    document.body.appendChild(overlay);
    overlay.querySelector('.modal-confirm').focus();
  });
}

// ---- Game Card HTML ----
function createGameCardHTML(game, opts = {}) {
  const { showRemove = false, linkToPlayer = true } = opts;
  const playtime = VStorage.getPlaytime(game.id);
  const timeStr = VStorage.formatTime(playtime);
  const isFav = VStorage.isFavorite(game.id);

  const imgSrc = game.cover || '';
  const href = linkToPlayer ? `player.html?id=${game.id}` : '#';

  return `
    <${linkToPlayer ? `a href="${href}"` : 'div'} 
      class="game-card" 
      data-id="${game.id}" 
      tabindex="0"
      aria-label="${escHtml(game.name)}"
    >
      ${imgSrc
        ? `<img class="game-card-img" src="${escHtml(imgSrc)}" alt="${escHtml(game.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''
      }
      <div class="game-card-img-placeholder" style="${imgSrc ? 'display:none' : ''}">🎮</div>

      <div class="game-card-overlay">
        <div class="game-card-title">${escHtml(game.name)}</div>
        ${timeStr ? `<div class="game-card-playtime">⏱ ${timeStr}</div>` : ''}
      </div>

      <button class="game-card-star ${isFav ? 'favorited' : ''}" 
        data-id="${game.id}" 
        aria-label="${isFav ? 'Unfavorite' : 'Favorite'} ${escHtml(game.name)}"
        title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
        ${isFav ? SVG_STAR_FILLED : SVG_STAR}
      </button>

      ${!isFav ? `
        <span class="game-card-fav-badge" style="display:none" aria-hidden="true">
          ${SVG_STAR_FILLED}
        </span>
      ` : `
        <span class="game-card-fav-badge" aria-hidden="true">
          ${SVG_STAR_FILLED}
        </span>
      `}

      ${showRemove ? `
        <button class="game-card-remove" data-id="${game.id}" aria-label="Remove from history" title="Remove from history">
          ${SVG_X}
        </button>
      ` : ''}
    </${linkToPlayer ? 'a' : 'div'}>
  `;
}

// ---- Ripple effect ----
function addRipple(el, e) {
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top  = `${e.clientY - rect.top}px`;
  let container = el.querySelector('.ripple-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'ripple-container';
    el.appendChild(container);
  }
  container.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ---- Escape HTML ----
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Update datetime ----
function startDatetime(el) {
  function update() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `${date}<br>${time}`;
  }
  update();
  return setInterval(update, 1000);
}

// ---- Load games JSON ----
async function loadGames() {
  try {
    const res = await fetch('data/games.json');
    const data = await res.json();
    // Handle both array and object with array
    return Array.isArray(data) ? data : (data.games || data);
  } catch (e) {
    console.error('Failed to load games:', e);
    return [];
  }
}

// ---- Nav active link ----
function setNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || 
      (path === '' && href === 'home.html') ||
      (path === 'index.html' && href === 'index.html'));
  });
}

// ---- Init panic button ----
function initPanicBtn() {
  document.querySelectorAll('.btn-panic').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = VStorage.getCloakMode();
      const cu   = VStorage.getCloakUrl();
      if (mode === 'google') {
        window.location.replace(VCloak.CLOAK_TARGETS.google.url);
      } else if (mode === 'custom' && cu) {
        window.location.replace(cu);
      } else {
        VCloak.cloakTab('google');
        showToast('Tab cloaked!');
      }
    });
  });
}

// ---- Star button delegation ----
function initStarDelegation(container) {
  container.addEventListener('click', (e) => {
    const starBtn = e.target.closest('.game-card-star');
    if (!starBtn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = Number(starBtn.dataset.id);
    const added = VStorage.toggleFavorite(id);
    starBtn.classList.toggle('favorited', added);
    starBtn.innerHTML = added ? SVG_STAR_FILLED : SVG_STAR;
    starBtn.setAttribute('aria-label', `${added ? 'Unfavorite' : 'Favorite'} game`);
    // Update fav badge sibling
    const card = starBtn.closest('.game-card');
    if (card) {
      const badge = card.querySelector('.game-card-fav-badge');
      if (badge) badge.style.display = added ? '' : 'none';
    }
    addRipple(starBtn, e);
    showToast(added ? '⭐ Added to favorites' : 'Removed from favorites');
  });
}

// ---- SVG Icons ----
const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const SVG_STAR_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const SVG_X = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const SVG_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const SVG_HOME = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const SVG_GRID = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
const SVG_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const SVG_FULLSCREEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
const SVG_FULLSCREEN_EXIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;
const SVG_RELOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
const SVG_SCREENSHOT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
const SVG_BACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const SVG_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const SVG_ALERT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

// Navigation HTML helper
function navHTML(activePage) {
  return `
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a href="home.html" class="nav-logo" aria-label="Vispora home">VISPORA</a>
    <ul class="nav-links" role="list">
      <li><a href="home.html" ${activePage==='home'?'class="active"':''} aria-label="Home">
        <span class="nav-icon">${SVG_HOME}</span><span>Home</span>
      </a></li>
      <li><a href="games.html" ${activePage==='games'?'class="active"':''} aria-label="Games">
        <span class="nav-icon">${SVG_GRID}</span><span>Games</span>
      </a></li>
      <li><a href="settings.html" ${activePage==='settings'?'class="active"':''} aria-label="Settings">
        <span class="nav-icon">${SVG_SETTINGS}</span><span>Settings</span>
      </a></li>
    </ul>
    <div class="nav-right">
      <div class="nav-datetime" id="nav-datetime" aria-live="polite"></div>
      <button class="btn-panic" id="nav-panic" aria-label="Panic: cloak tab">
        ${SVG_ALERT} PANIC
      </button>
    </div>
  </nav>
  `;
}

window.VApp = {
  showToast, showModal,
  createGameCardHTML,
  addRipple,
  escHtml,
  startDatetime,
  loadGames,
  setNavActive,
  initPanicBtn,
  initStarDelegation,
  navHTML,
  SVG_STAR, SVG_STAR_FILLED, SVG_X, SVG_PLAY,
  SVG_HOME, SVG_GRID, SVG_SETTINGS,
  SVG_FULLSCREEN, SVG_FULLSCREEN_EXIT,
  SVG_RELOAD, SVG_SCREENSHOT, SVG_BACK, SVG_SEARCH, SVG_ALERT,
};
