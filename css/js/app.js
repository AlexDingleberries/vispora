const IC = {
  home: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  grid: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  film: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,
  tv: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  live: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  anime: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7c4-1.5 14-1.5 18 0"/> <path d="M5 10h14"/><path d="M7 10v11"/><path d="M17 10v11"/> <path d="M3 5.5l1 .5M20 6l1-.5"/></svg>`,
  settings: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  star: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/><path d="M4 1.5h8A1.5 1.5 0 0 1 13.5 3v12"/></svg>`,
  starFilled: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/></svg>`,
  x: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  maximize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
  minimize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`,
  reload: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  camera: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  chevronLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  search: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  alert: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  bookmark: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  menu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  coffee: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  key: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  zap: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  brain: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
  logout: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  chat: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
};

const DOMAIN = '';

function showToast(msg, type = 'info', duration = 3000) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast${type !== 'info' ? ` toast-${type}` : ''}`;
  t.textContent = msg; c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 220); }, duration);
}

function showModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', dangerous = false }) {
  return new Promise(resolve => {
    const o = document.createElement('div'); o.className = 'modal-overlay'; o.style.zIndex = '30000';
    o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <h3>${esc(title)}</h3><p>${esc(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary modal-cancel">${esc(cancelText)}</button>
        <button class="btn ${dangerous ? 'btn-danger' : 'btn-primary'} modal-confirm">${esc(confirmText)}</button>
      </div></div>`;
    o.querySelector('.modal-cancel').onclick = () => { o.remove(); resolve(false); };
    o.querySelector('.modal-confirm').onclick = () => { o.remove(); resolve(true); };
    o.onclick = e => { if (e.target === o) { o.remove(); resolve(false); } };
    document.body.appendChild(o); o.querySelector('.modal-confirm').focus();
  });
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function makeCard(game, opts = {}) {
  const { showRemove = false, linkToPlayer = true, compact = false, removeMode } = opts;
  const pt = VStorage.getPlaytime(game.id);
  const timeStr = VStorage.formatTime(pt);
  const isFav = VStorage.isFavorite(game.id);
  const tag = linkToPlayer ? 'a' : 'div';
  const href = linkToPlayer ? `player.html?id=${game.id}` : '#';
  const metaStr = timeStr ? `${IC.clock} ${timeStr}` : (game.genre || '');
  return `<${tag} ${linkToPlayer ? `href="${href}"` : ''}
    class="media-card game-card${compact ? ' media-card-compact' : ''}" data-id="${game.id}" data-media-type="game" tabindex="0"
    aria-label="${esc(game.name)}" role="${linkToPlayer ? 'link' : 'article'}">
    <img src="${esc(game.cover || '')}" alt="${esc(game.name)}"
      loading="lazy" decoding="async"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="media-card-noposter" style="display:none"></div>
    <div class="media-card-overlay">
      <div class="media-card-title">${esc(game.name)}</div>
      ${!compact ? `<div class="media-card-meta-row">
        <div class="media-card-meta">${metaStr ? esc(metaStr) : ''}</div>
      </div>`: ''}
    </div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}" data-id="${game.id}" data-media-type="game"
      aria-label="${isFav ? 'In My List' : 'Add to My List'} ${esc(game.name)}" type="button">
      ${isFav ? IC.starFilled : IC.star}
    </button>
    ${showRemove ? `<button class="game-card-remove" data-id="${game.id}" data-media-type="game"${removeMode ? ` data-remove-mode="${esc(removeMode)}"` : ''} aria-label="Remove from history" type="button">${IC.x}</button>` : ''}
  </${tag}>`;
}

function makeContinuePlayingCard(game) {
  const pt = VStorage.getPlaytime(game.id);
  const timeStr = VStorage.formatTime(pt);
  const isFav = VStorage.isFavorite(game.id);
  return `<a href="player.html?id=${game.id}" class="cw-card" data-id="${game.id}" data-media-type="game" tabindex="0" aria-label="${esc(game.name || '')}">
    ${game.cover ? `<img src="${esc(game.cover)}" alt="${esc(game.name || '')}" loading="lazy" decoding="async">` : `<div class="media-card-noposter"></div>`}
    <div class="cw-card-gradient"></div>
    <div class="cw-card-badge">Game</div>
    <div class="cw-card-title">${esc(game.name || 'Game')}</div>
    <button class="game-card-star media-star${isFav ? ' favorited' : ''}" data-id="${game.id}" data-media-type="game"
      aria-label="${isFav ? 'In My List' : 'Add to My List'} ${esc(game.name || '')}" type="button">
      ${isFav ? IC.starFilled : IC.star}
    </button>
  </a>`;
}

function initStars(container) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('.game-card-star');
    if (!btn) return; e.preventDefault(); e.stopPropagation();
    const id = Number(btn.dataset.id);
    const added = VStorage.toggleFavorite(id);
    btn.classList.toggle('favorited', added);
    btn.innerHTML = added ? IC.starFilled : IC.star;
    btn.setAttribute('aria-label', `${added ? 'Unfavorite' : 'Favorite'} game`);
    showToast(added ? 'Added to My List' : 'Removed from My List');
    document.dispatchEvent(new CustomEvent('vispora:game-favs-changed', { detail: { id, added } }));
  });
}

function _renderDatetime(el) {
  const expanded = document.body.classList.contains('nav-sidebar-mode') && !document.body.classList.contains('nav-sidebar-collapsed');
  const n = new Date();
  let dateEl = el.querySelector('.nav-datetime-date');
  let timeEl = el.querySelector('.nav-datetime-time');
  if (!dateEl || !timeEl) {
    el.innerHTML = `<span class="nav-datetime-date"></span><span class="nav-datetime-time"></span>`;
    dateEl = el.querySelector('.nav-datetime-date');
    timeEl = el.querySelector('.nav-datetime-time');
  }
  timeEl.textContent = n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  dateEl.textContent = n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  el.classList.toggle('nav-datetime-expanded', expanded);
}
function startDatetime(el) {
  _renderDatetime(el);
  if (!el._sidebarMorphWired) {
    el._sidebarMorphWired = true;
    document.addEventListener('vispora:sidebar-toggled', () => _renderDatetime(el));
  }
  return setInterval(() => _renderDatetime(el), 1000);
}

async function loadGames() {
  if (window.VGames && typeof window.VGames.getGames === 'function') {
    const games = await window.VGames.getGames();
    if (!games) throw new Error('Failed to load games data.');
    return games;
  }
  const res = await fetch('https://vispora-links.alexdingleberries.workers.dev/?type=games');
  if (!res.ok) throw new Error('Failed to load games data.');
  const data = await res.json();
  const games = Array.isArray(data) ? data : data.games;
  if (!Array.isArray(games)) throw new Error('Failed to load games data.');
  return games;
}

function _navChatHTML() {
  return `<div class="nav-chat-group">
    <button class="nav-chat-btn" id="nav-chat-btn" type="button" aria-label="Friends &amp; Chat" title="Friends &amp; Chat">
      ${IC.chat}
      <span class="nav-chat-dot nav-chat-dot-unread" id="nav-chat-unread-dot"></span>
    </button>
    <button class="nav-notif-btn" id="nav-notif-btn" type="button" aria-label="Notifications" title="Notifications">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="nav-notif-badge" id="nav-notif-badge" style="display:none"></span>
      <span class="nav-chat-dot nav-chat-dot-req" id="nav-chat-request-dot"></span>
    </button>
  </div>`;
}

function userAvatarHTML(extraClass) {
  const profile = VStorage.getUserProfile();
  const fbUser = window.VCurrentUser || null;
  const name = profile.displayName
    || (fbUser && fbUser.displayName)
    || (fbUser && fbUser.email ? fbUser.email.replace("@vispora.app", '') : '')
    || '?';
  const initial = name.trim()[0]?.toUpperCase() || '?';
  const photo = fbUser && fbUser.photoURL ? fbUser.photoURL : null;
  const cls = 'nav-avatar' + (extraClass ? ' ' + extraClass : '');
  return photo
    ? `<div class="${cls}"><div class="nav-avatar-img" style="background-image:url('${esc(photo)}')"></div></div>`
    : `<div class="${cls}"><span class="nav-avatar-initials">${esc(initial)}</span></div>`;
}
function _navAvatarHTML() {
  const profile = VStorage.getUserProfile();
  const fbUser = window.VCurrentUser || null;
  const name = profile.displayName
    || (fbUser && fbUser.displayName)
    || (fbUser && fbUser.email ? fbUser.email.replace("@vispora.app", '') : '')
    || '?';
  return `<div class="nav-profile" id="nav-profile">
    <button class="nav-avatar-btn" id="nav-avatar-btn" type="button" aria-label="Profile menu">
      ${userAvatarHTML()}
    </button>
    <div class="nav-profile-dropdown" id="nav-profile-dropdown">
      <div class="nav-profile-info">
        ${userAvatarHTML('nav-avatar-lg')}
        <div>
          <div class="nav-profile-name">${esc(name)}</div>
        </div>
      </div>
      <div class="nav-profile-divider"></div>
      <button class="nav-profile-item nav-profile-signout" id="nav-signout-btn" type="button">
        ${IC.logout} Sign Out
      </button>
    </div>
  </div>`;
}

const VISP_VERSION = 'v1.3.0';

function navHTML(active) {
  const style = VStorage.getNavStyle ? VStorage.getNavStyle() : 'topbar';
  const collapsed = VStorage.getNavSidebarCollapsed ? VStorage.getNavSidebarCollapsed() : false;
  document.body.classList.toggle('nav-sidebar-mode', style === 'sidebar');
  document.body.classList.toggle('nav-sidebar-collapsed', style === 'sidebar' && collapsed);
  setTimeout(() => {
    const toggle = document.getElementById('nav-sidebar-toggle');
    if (toggle && !toggle._wired) {
      toggle._wired = true;
      toggle.onclick = () => {
        const nowCollapsed = !document.body.classList.contains('nav-sidebar-collapsed');
        document.body.classList.toggle('nav-sidebar-collapsed', nowCollapsed);
        if (VStorage.setNavSidebarCollapsed) VStorage.setNavSidebarCollapsed(nowCollapsed);
        document.dispatchEvent(new CustomEvent('vispora:sidebar-toggled'));
      };
    }
  }, 0);
  return `<nav class="nav" role="navigation" aria-label="Main">
    <button class="nav-sidebar-toggle" id="nav-sidebar-toggle" type="button" aria-label="Toggle sidebar" title="Toggle sidebar">${IC.menu}<span class="nav-toggle-dot"></span></button>
    <a href="home.html" class="nav-logo">vispora</a>
    <button class="nav-version" id="nav-version-btn" type="button" title="What's new">${VISP_VERSION}<span class="nav-version-dot" id="nav-version-dot" style="display:none"></span></button>
    <ul class="nav-links">
      <li><a href="home.html" ${active === 'home' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.home}</span><span>Home</span></a></li>
      <li><a href="games.html" ${active === 'games' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.grid}</span><span>Games</span></a></li>
      <li><a href="movies.html" ${active === 'movies' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.film}</span><span>Movies</span></a></li>
      <li><a href="tv.html" ${active === 'tv' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.tv}</span><span>TV Shows</span></a></li>
      <li><a href="anime.html" ${active === 'anime' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.anime}</span><span>Anime</span></a></li>
        <li><a href="live.html" ${active === 'live' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.live}</span><span>Live TV</span></a></li>
      <li><a href="my-list.html" ${active === 'mylist' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.bookmark}</span><span>My List</span></a></li>
      <li><a href="ai.html" ${active === 'ai' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.brain}</span><span>AI Chat</span></a></li>
      <li><a href="settings.html" ${active === 'settings' ? 'class="active"' : ''}>
        <span class="nav-icon">${IC.settings}</span><span>Settings</span></a></li>
    </ul>
    <div class="nav-right">
      <div class="nav-datetime" id="nav-datetime"></div>
      <div class="nav-social-group">
        ${_navChatHTML()}
        ${_navAvatarHTML()}
      </div>
      <button class="btn-panic" id="nav-panic" type="button">${IC.alert} <span class="btn-panic-label">PANIC</span></button>
      <a class="nav-coffee-btn" href="https://ko-fi.com/alexdingleberries" target="_blank" rel="noopener noreferrer" title="Buy me a coffee">${IC.coffee}<span class="nav-coffee-label">Buy me a coffee</span></a>
    </div>
  </nav>`;
}

let _versionData = null;
let _versionFetchPromise = null;
function _whenAuthReady() {
  return new Promise(resolve => {
    if (window.VCurrentUser) resolve();
    else document.addEventListener('vispora:auth-ready', () => resolve(), { once: true });
  });
}
function _fetchVersionData() {
  if (_versionData) return Promise.resolve(_versionData);
  if (_versionFetchPromise) return _versionFetchPromise;
  if (!window.VFirebase || !VFirebase.db) return Promise.resolve(null);
  _versionFetchPromise = _whenAuthReady()
    .then(() => VFirebase.db.collection('meta').doc('version').get())
    .then(snap => { _versionData = snap.exists ? snap.data() : null; return _versionData; })
    .catch(e => { console.warn('[VApp] version check failed:', e); return null; })
    .finally(() => { _versionFetchPromise = null; });
  return _versionFetchPromise;
}
function _plainVer(v) { return String(v || '').replace(/^v/i, '').trim(); }
function _verParts(v) { return _plainVer(v).split('.').map(n => parseInt(n, 10) || 0); }
function _isOutdated(data) {
  if (!data || !data.version) return false;
  const latest = _verParts(data.version), current = _verParts(VISP_VERSION);
  for (let i = 0; i < Math.max(latest.length, current.length); i++) {
    const diff = (latest[i] || 0) - (current[i] || 0);
    if (diff) return diff > 0;
  }
  return false;
}
function showChangelogModal(data) {
  const outdated = _isOutdated(data);
  const plain = _plainVer(outdated ? data.version : VISP_VERSION);
  const date = data && data.date;
  const items = ((data && data.changelog) || []).map(line => `<li>${esc(line)}</li>`).join('')
    || '<li>No changelog available yet.</li>';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '31000';
  overlay.innerHTML = `<div class="modal changelog-modal" role="dialog" aria-modal="true">
    <h3>What's new — v${esc(plain)}${date ? ` from ${esc(date)}` : ''}</h3>
    ${outdated ? `<p style="margin-bottom:10px">You are on ${esc(VISP_VERSION)}. An update is available.</p>` : ''}
    <ul class="changelog-list">${items}</ul>
    <div class="modal-actions" style="justify-content:space-between;align-items:center">
      <button class="btn btn-secondary changelog-close" type="button">Close</button>
      ${outdated ? `<a class="btn btn-primary" href="https://pub-906ac390d44e4d89a7872c30881da83f.r2.dev/clientv${esc(plain)}.zip" target="_blank" rel="noopener noreferrer">Download Update</a>` : ''}
    </div>
  </div>`;
  overlay.querySelector('.changelog-close').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc_); } });
  document.body.appendChild(overlay);
}
async function initVersionCheck() {
  const btn = document.getElementById('nav-version-btn');
  const dot = document.getElementById('nav-version-dot');
  if (!btn) return;
  btn.onclick = async () => showChangelogModal(await _fetchVersionData());
  const outdated = _isOutdated(await _fetchVersionData());
  if (dot) dot.style.display = outdated ? '' : 'none';
  document.body.classList.toggle('vispora-update', outdated);
}

function _positionFixedPopup(anchorEl, popupEl, opts = {}) {
  const margin = opts.margin ?? 10;
  const width = popupEl.offsetWidth || opts.width || 220;
  const rect = anchorEl.getBoundingClientRect();
  let left = opts.align === 'left' ? rect.left : rect.right - width;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const height = popupEl.offsetHeight || opts.height || 160;
  if (opts.side === 'right') {
    const navEl = anchorEl.closest('.nav');
    const edge = navEl ? navEl.getBoundingClientRect().right : rect.right;
    popupEl.style.left = `${Math.min(edge + margin, window.innerWidth - width - margin)}px`;
    popupEl.style.top = `${Math.max(margin, Math.min(rect.bottom - height, window.innerHeight - height - margin))}px`;
    return;
  }
  let top = rect.bottom + margin;
  if (top + height > window.innerHeight - margin) {
    top = rect.top - height - margin;
  }
  top = Math.max(margin, top);
  popupEl.style.left = `${left}px`;
  popupEl.style.top = `${top}px`;
}

function initNavProfile() {
  const btn = document.getElementById('nav-avatar-btn');
  const dropdown = document.getElementById('nav-profile-dropdown');
  const signout = document.getElementById('nav-signout-btn');
  if (!btn || !dropdown) return;
  if (dropdown.parentElement !== document.body) document.body.appendChild(dropdown);

  const reposition = () => {
    const side = document.body.classList.contains('nav-sidebar-mode') && window.innerWidth > 860;
    dropdown.style.transformOrigin = side ? 'bottom left' : '';
    _positionFixedPopup(btn, dropdown, { width: 220, side: side ? 'right' : undefined });
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const opening = !dropdown.classList.contains('open');
    if (opening) {
      dropdown.style.visibility = 'hidden';
      dropdown.classList.add('open');
      reposition();
      dropdown.style.visibility = '';
    } else {
      dropdown.classList.remove('open');
    }
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
  window.addEventListener('resize', () => { if (dropdown.classList.contains('open')) reposition(); });

  if (signout && window.VFirebase) {
    signout.addEventListener('click', async () => {
      if (await showModal({ title: 'Sign Out', message: 'Sign out of vispora?', confirmText: 'Sign Out', dangerous: true })) {
        try { await VStorage.syncToCloud(); } catch (e) { }
        await VFirebase.auth.signOut();
        VStorage.resetCloudSync();
        window.top.location.replace('../index.html');
      }
    });
  }
}

function initNavChat() {
  if (window.VChat) VChat.initNavBtn();
}

function initPanic() {
  document.querySelectorAll('#nav-panic,.btn-panic').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = VStorage.getCloakMode(), cu = VStorage.getCloakUrl();
      if (m === 'google') window.top.location.replace(VCloak.CLOAK_TARGETS.google.url);
      else if (m === 'custom' && cu) window.top.location.replace(cu);
      else { VCloak.cloakTab('google'); showToast('Tab cloaked'); }
    });
  });
}

function initParticles() {
  try {
    const cfg = VStorage.getParticlesConfig();
    if (!cfg.enabled) { const el = document.getElementById('particles-js'); if (el) el.style.display = 'none'; return; }
    const accent = VStorage.getAccent();
    const color = cfg.color === 'accent' ? (accent || '#ffffff') : (cfg.color || '#ffffff');
    const shape = cfg.shape || 'circle';
    const direction = cfg.direction || 'none';
    if (window.particlesJS) {
      particlesJS('particles-js', {
        particles: {
          number: { value: cfg.count || 40, density: { enable: true, value_area: 800 } },
          color: { value: color },
          shape: { type: shape },
          opacity: { value: cfg.opacity ?? 0.25, random: true }, size: { value: cfg.size || 1.5, random: true },
          line_linked: { enable: !!cfg.linked, distance: 150, color: color, opacity: (cfg.opacity ?? 0.25) * 0.5, width: 1 },
          move: { enable: true, speed: cfg.speed || 0.6, direction: direction, random: direction === 'none', straight: direction !== 'none', out_mode: 'out' },
        },
        interactivity: { detect_on: 'canvas', events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
        retina_detect: true
      });
    }
  } catch (e) { console.warn('[VApp] particles init failed (page continues normally):', e); }
}

function reloadParticles() {
  if (window.pJSDom && window.pJSDom.length > 0) {
    window.pJSDom.forEach(p => { try { p.pJS.fn.vendors.destroypJS(); } catch (e) { } });
    window.pJSDom = [];
  }
  initParticles();
}

let _bgObjectUrl = null;
function applyBackgroundImage(objectUrl, cfg) {
  let layer = document.getElementById('vispora-bg-layer');
  let overlay = document.getElementById('vispora-bg-overlay');
  if (!objectUrl || !cfg.enabled) {
    if (layer) layer.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    return;
  }
  if (!layer) { layer = document.createElement('div'); layer.id = 'vispora-bg-layer'; document.body.insertBefore(layer, document.body.firstChild); }
  if (!overlay) { overlay = document.createElement('div'); overlay.id = 'vispora-bg-overlay'; document.body.insertBefore(overlay, layer.nextSibling); }
  layer.style.cssText = `position:fixed;inset:0;z-index:-2;background-image:url("${objectUrl}");background-size:${cfg.size || 'cover'};background-position:${cfg.position || 'center'};background-repeat:no-repeat;opacity:${cfg.opacity ?? 0.35};filter:blur(${cfg.blur || 0}px);display:block;pointer-events:none;`;
  overlay.style.cssText = `position:fixed;inset:0;z-index:-1;background:rgba(0,0,0,${cfg.darken ?? 0.35});display:block;pointer-events:none;`;
}
async function initBackgroundImage() {
  try {
    const cfg = VStorage.getBgImageConfig();
    if (!cfg.enabled) { applyBackgroundImage(null, cfg); return; }
    const blob = await VStorage.getBackgroundImage();
    if (!blob) { applyBackgroundImage(null, cfg); return; }
    if (_bgObjectUrl) URL.revokeObjectURL(_bgObjectUrl);
    _bgObjectUrl = URL.createObjectURL(blob);
    applyBackgroundImage(_bgObjectUrl, cfg);
  } catch (e) {
    console.warn('[VApp] background image init failed (page continues normally):', e);
    try { applyBackgroundImage(null, { enabled: false }); } catch { }
  }
}

function _infoModal({ title, message, okText = 'Got it' }) {
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.style.zIndex = '40000';
  o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <h3>${esc(title)}</h3><p>${esc(message)}</p>
    <div class="modal-actions" style="justify-content:flex-end">
      <button class="btn btn-primary modal-ok" type="button">${esc(okText)}</button>
    </div></div>`;
  const close = () => o.remove();
  o.querySelector('.modal-ok').onclick = close;
  o.addEventListener('click', e => { if (e.target === o) close(); });
  document.body.appendChild(o);
  return o;
}

function _showClosedTab() {
  try { if (window.VCloak) VCloak.releaseLeavePrevention(); } catch (e) { }
  const url = location.pathname.indexOf('/pages/') !== -1 ? 'closed.html' : 'pages/closed.html';
  if (window.self !== window.top) {
    window.location.replace(url);
    return;
  }
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;z-index:2147483647';
  document.body.replaceChildren(frame);
}

function initDuplicateTabCheck() {
  try {
    if (!('BroadcastChannel' in window) || !window.VFirebase) return;
    if (location.pathname.indexOf('/pages/') === -1) return;
    const instanceId = 'tab_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const bc = new BroadcastChannel('vispora_tabs');
    const peers = new Map();
    const PEER_TTL = 15000;
    let myUid = VFirebase.auth.currentUser ? VFirebase.auth.currentUser.uid : null;
    let overlay = null;
    let evalTimer = null;

    function send(type) {
      if (!myUid) return;
      try { bc.postMessage({ type, instanceId, uid: myUid }); } catch (e) { }
    }

    function samePeers() {
      const now = Date.now();
      peers.forEach((p, id) => { if (now - p.seen > PEER_TTL) peers.delete(id); });
      return myUid ? [...peers.values()].filter(p => p.uid === myUid) : [];
    }

    function hidePrompt() {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
    }

    function showPrompt() {
      if (overlay || document.hidden) return;
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '40000';
      overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
        <h3>Already Open Elsewhere</h3>
        <p>This account is open in another tab or window right now. Using both at once can cause playtime, chat, and settings to fall out of sync.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="dup-close-this" type="button">Close This Tab</button>
          <button class="btn btn-primary" id="dup-close-other" type="button">Close Other Tab(s)</button>
        </div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#dup-close-this').onclick = () => {
        hidePrompt();
        _showClosedTab();
      };
      overlay.querySelector('#dup-close-other').onclick = () => {
        send('close-others');
        peers.forEach((p, id) => { if (p.uid === myUid) peers.delete(id); });
        showToast('Asked other tabs to close');
        hidePrompt();
      };
    }

    function evaluate() {
      if (evalTimer) return;
      evalTimer = setTimeout(() => {
        evalTimer = null;
        if (samePeers().length) showPrompt();
        else hidePrompt();
      }, 800);
    }

    bc.onmessage = e => {
      const msg = e.data;
      if (!msg || msg.instanceId === instanceId) return;
      if (msg.type === 'close-others') {
        if (myUid && msg.uid === myUid) _showClosedTab();
        return;
      }
      if (msg.type === 'bye') {
        peers.delete(msg.instanceId);
      } else {
        peers.set(msg.instanceId, { uid: msg.uid, seen: Date.now() });
        if (msg.type === 'announce') send('here');
      }
      evaluate();
    };

    VFirebase.auth.onAuthStateChanged(user => {
      myUid = user ? user.uid : null;
      send('announce');
      evaluate();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) evaluate(); });
    const pingTimer = setInterval(() => { send('ping'); evaluate(); }, 5000);
    window.addEventListener('pagehide', () => {
      clearInterval(pingTimer);
      send('bye');
      try { bc.close(); } catch (e) { }
    });
  } catch (e) { console.warn('[VApp] duplicate tab check failed:', e); }
}

let _offlineBannerEl = null;
let _offlineWarned = false;
function _ensureOfflineBanner() {
  if (_offlineBannerEl) return _offlineBannerEl;
  _offlineBannerEl = document.createElement('div');
  _offlineBannerEl.id = 'vispora-offline-banner';
  _offlineBannerEl.innerHTML = `${IC.alert}<span>No internet connection. Some features may not work</span>`;
  document.body.appendChild(_offlineBannerEl);
  return _offlineBannerEl;
}
function initConnectivityWatch() {
  try {
    function goOffline() {
      _ensureOfflineBanner().classList.add('open');
      if (!_offlineWarned) {
        _offlineWarned = true;
        _infoModal({
          title: 'No Internet Connection',
          message: 'vispora needs an internet connection for streaming, chat, and browsing. Some pages may not work until the connection comes back.',
        });
      } else {
        showToast('Connection lost', 'error');
      }
    }
    function goOnline() {
      _ensureOfflineBanner().classList.remove('open');
      showToast('Back online', 'success');
    }
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    if (!navigator.onLine) goOffline();
  } catch (e) { console.warn('[VApp] connectivity watch failed (page continues normally):', e); }
}

const MARQUEE_SPEED_PX_S = 10;
const MARQUEE_CARD_SELECTOR = '.media-card, .cw-card, .nf-card';
const MARQUEE_TITLE_SELECTOR = '.media-card-title, .nf-card-title-text, .cw-card-title';
function _marqueeTitleOf(card) { try { return card.querySelector(MARQUEE_TITLE_SELECTOR); } catch { return null; } }
function _armMarquee(card) {
  try {
    const title = _marqueeTitleOf(card);
    if (!title || title._marqueeArmed) return;
    const overflow = title.scrollWidth - title.clientWidth;
    if (overflow <= 2) return;
    title._marqueeArmed = true;
    title.style.setProperty('--marquee-distance', `-${overflow}px`);
    title.style.setProperty('--marquee-duration', `${(overflow / MARQUEE_SPEED_PX_S).toFixed(2)}s`);
    title.classList.add('marquee-live');
  } catch { }
}
function _disarmMarquee(card) {
  try {
    const title = _marqueeTitleOf(card);
    if (!title) return;
    title._marqueeArmed = false;
    title.classList.remove('marquee-live');
  } catch { }
}
document.addEventListener('mouseenter', e => { const c = e.target.closest?.(MARQUEE_CARD_SELECTOR); if (c) _armMarquee(c); }, true);
document.addEventListener('mouseleave', e => { const c = e.target.closest?.(MARQUEE_CARD_SELECTOR); if (c) _disarmMarquee(c); }, true);
document.addEventListener('focusin', e => { const c = e.target.closest?.(MARQUEE_CARD_SELECTOR); if (c) _armMarquee(c); });
document.addEventListener('focusout', e => { const c = e.target.closest?.(MARQUEE_CARD_SELECTOR); if (c) _disarmMarquee(c); });

window.VApp = { VERSION: VISP_VERSION, IC, esc, showToast, showModal, makeCard, makeContinuePlayingCard, initStars, startDatetime, loadGames, navHTML, userAvatarHTML, initNavProfile, initNavChat, initPanic, initParticles, reloadParticles, initBackgroundImage, applyBackgroundImage, initVersionCheck, showChangelogModal, positionFixedPopup: _positionFixedPopup, initDuplicateTabCheck, initConnectivityWatch };

function _autoInitSystemChecks() {
  initBackgroundImage();
  initDuplicateTabCheck();
  initConnectivityWatch();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _autoInitSystemChecks);
} else {
  _autoInitSystemChecks();
}