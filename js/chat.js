'use strict';
(function () {
  const MSG_PAGE = 20;
  const STATUS_OFF_MS = 300_000;
  const STATUS_AWAY_MS = 90_000;
  const FRIEND_TTL = 60_000;
  const DELETE_WIN = 5 * 60_000;
  const MAX_IMG_PX = 800;
  const MAX_IMG_BYTES = 150 * 1024;
  const DOMAIN = '@vispora.app';
  const CHAT_COOLDOWN_MS = 1500;
  const BAD_WORDS = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
    'asshole', 'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut'];
  let _db, _uid, _myName;
  let _selfUnsub = null, _chatUnsub = null;
  let _friendCache = {};
  let _cacheFetched = 0;
  let _friends = [];
  let _requests = { incoming: [], outgoing: [] };
  let _chats = {};
  let _notifOff = {};
  let _prevReqCount = -1;
  let _activeChatId = null;
  let _activePartner = null;
  let _messages = [];
  let _lastMsgCursor = null;
  let _replyTo = null;
  let _chatOpen = false;
  let _notifOpen = false;
  let _inChatView = false;
  let _inGroupView = false;
  let _activeMainTab = 'friends';
  let _groups = [];
  let _groupCache = {};
  let _groupChats = {};
  let _groupInvites = [];
  let _prevGroupInviteCount = -1;
  let _activeGroupId = null;
  let _groupMessages = [];
  let _lastGroupMsgCursor = null;
  let _groupReplyTo = null;
  let _searchQ = '';
  let _audioCtx = null;
  let _audioLevels = { message: 0.3, receive: 0.4, request: 0.5 };
  let _statusTimer = null;
  let _lastSendAt = {};
  function _ctx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }
  function _beep(freq, type, dur, vol) {
    try {
      if (vol <= 0) return;
      const c = _ctx(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(); o.stop(c.currentTime + dur);
    } catch { }
  }
  function _sfxSend() { const v = _audioLevels.message * 0.5; _beep(880, 'sine', .08, v); setTimeout(() => _beep(1100, 'sine', .12, v), 80); }
  function _sfxReceive() { const v = _audioLevels.receive * 0.5; _beep(600, 'sine', .12, v); setTimeout(() => _beep(800, 'sine', .18, v), 100); }
  function _sfxRequest() { const v = _audioLevels.request * 0.5;[440, 550, 660].forEach((f, i) => setTimeout(() => _beep(f, 'sine', .12, v), i * 120)); }
  function _sfxAccepted() { const v = _audioLevels.request * 0.5;[440, 550, 660, 880].forEach((f, i) => setTimeout(() => _beep(f, 'sine', .12, v), i * 80)); }
  function _ensureToastContainer() {
    let c = document.getElementById('vc-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'vc-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }
  function _showToast({ type, name, sub, onMain, onAccept, onDecline, duration = 5000 }) {
    const c = _ensureToastContainer();
    const icons = {
      msg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      req: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
      accepted: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    };
    const toast = document.createElement('div');
    toast.className = `vc-toast vc-toast-${type}`;
    toast.innerHTML = `
    <div class="vc-toast-icon">${icons[type] || icons.msg}</div>
    <div class="vc-toast-body">
      <div class="vc-toast-name">${_e(name)}</div>
      <div class="vc-toast-sub">${_e(sub)}</div>
      ${type === 'req' ? `<div class="vc-toast-req-actions">
        <button class="vc-toast-req-accept" type="button">✓ Accept</button>
        <button class="vc-toast-req-decline" type="button">✕ Decline</button>
      </div>` : ''}
    </div>
    <button class="vc-toast-dismiss" type="button" aria-label="Dismiss">✕</button>
    <div class="vc-toast-progress" id="tp-${Date.now()}"></div>`;
    c.appendChild(toast);
    const bar = toast.querySelector('.vc-toast-progress');
    bar.style.transition = `transform ${duration}ms linear`;
    bar.style.transform = 'scaleX(1)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transform = 'scaleX(0)';
    }));
    function dismiss() {
      toast.classList.add('vc-toast-out');
      setTimeout(() => toast.remove(), 240);
    }
    const timer = setTimeout(dismiss, duration);
    toast.onclick = e => {
      if (e.target.closest('.vc-toast-dismiss,.vc-toast-req-accept,.vc-toast-req-decline')) return;
      clearTimeout(timer); dismiss();
      if (onMain) onMain();
    };
    toast.querySelector('.vc-toast-dismiss').onclick = e => {
      e.stopPropagation(); clearTimeout(timer); dismiss();
    };
    if (type === 'req') {
      toast.querySelector('.vc-toast-req-accept').onclick = e => {
        e.stopPropagation(); clearTimeout(timer); dismiss();
        if (onAccept) onAccept();
      };
      toast.querySelector('.vc-toast-req-decline').onclick = e => {
        e.stopPropagation(); clearTimeout(timer); dismiss();
        if (onDecline) onDecline();
      };
    }
  }
  const LEET_MAP = {
    a: 'a4@^', b: 'b8', c: 'c(<{', d: 'd', e: 'e3', f: 'f', g: 'g69',
    h: 'h#', i: 'i1!|', j: 'j', k: 'k', l: 'l1|', m: 'm', n: 'n',
    o: 'o0', p: 'p', q: 'q', r: 'r', s: 's5$', t: 't7+', u: 'u',
    v: 'v', w: 'w', x: 'x', y: 'y', z: 'z2',
  };
  function _escapeCls(s) {
    return s.replace(/[\\\]\^\-]/g, '\\$&');
  }
  function _charClass(ch) {
    return `[${_escapeCls(LEET_MAP[ch] || ch)}]`;
  }
  function _buildBypassRegex(word) {
    const sep = '[^a-zA-Z0-9]{0,2}';
    const pattern = word.toLowerCase().split('').map(ch => `${_charClass(ch)}+`).join(sep);
    return new RegExp(pattern, 'gi');
  }
  function _filter(text) {
    if (!VStorage.get('vispora_profanity_filter', false)) return text;
    let t = text;
    BAD_WORDS.forEach(w => {
      const re = _buildBypassRegex(w);
      t = t.replace(re, m => '*'.repeat(m.length));
    });
    return t;
  }
  const _uref = uid => _db.collection('users').doc(uid);
  const _mref = cid => _db.collection('chats').doc(cid).collection('messages');
  const _cid = (a, b) => [a, b].sort().join('_');
  const _gref = gid => _db.collection('groups').doc(gid);
  const _gmref = gid => _db.collection('groups').doc(gid).collection('messages');
  let _actKey = null, _actSince = 0;
  function _num(v) {
    const n = Number(v);
    return v !== null && v !== '' && v !== undefined && Number.isFinite(n) ? n : null;
  }
  function _detectActivity() {
    if (!VStorage.get('vispora_show_activity', true)) return null;
    const pg = location.pathname.split('/').pop();
    const p = new URLSearchParams(location.search);
    let act = null;
    if (pg === 'player.html') {
      const g = VStorage.getHistory().find(h => String(h.id) === p.get('id'));
      act = { type: 'game', name: g?.name || 'a game', id: _num(p.get('id')), kid: null };
    } else if (pg === 'media.html') {
      const t = p.get('type') || 'movie';
      const id = p.get('id');
      const generic = { movie: 'a movie', tv: 'a show', anime: 'anime' }[t] || 'media';
      const h = VStorage.getMediaHistory().find(x => String(x.id) === String(id) && x.type === t);
      act = { type: t, name: h?.title || generic, id: _num(id), kid: _num(p.get('kid')) };
    } else if (pg === 'live.html') {
      const lv = window.VLiveActivity;
      if (lv && lv.id) act = { type: 'live', name: lv.title || 'a live event', id: String(lv.id), kid: null };
    }
    if (!act) { _actKey = null; return null; }
    const key = act.type + ':' + act.id;
    if (key !== _actKey) { _actKey = key; _actSince = Date.now(); }
    act.since = _actSince;
    return act;
  }
  function _actHref(act) {
    if (!act || act.id === null || act.id === undefined) return '';
    if (act.type === 'live') return `live.html?watch=${encodeURIComponent(act.id)}`;
    const id = _num(act.id);
    if (id === null) return '';
    if (act.type === 'game') return `player.html?id=${id}`;
    if (['movie', 'tv', 'anime'].includes(act.type)) {
      const kid = _num(act.kid);
      return `media.html?type=${act.type}&id=${id}${kid ? `&kid=${kid}` : ''}`;
    }
    return '';
  }
  function _actSubHTML(act, hasAct, clr, text) {
    const href = hasAct ? _actHref(act) : '';
    if (href) return `<button class="vc-friend-sub vc-friend-act" data-href="${_e(href)}" style="color:${clr}" title="Go to ${_e(act.name || 'activity')}" type="button">${_e(text)}</button>`;
    return `<div class="vc-friend-sub" style="color:${hasAct ? clr : 'var(--text-secondary)'}">${_e(text)}</div>`;
  }
  function _goActivity(href) {
    if (/^(player|media|live)\.html\?/.test(href || '')) window.location.href = href;
  }
  async function _writeStatus(st) {
    if (!_db || !_uid) return;
    try {
      await _uref(_uid).set({ status: st, lastSeen: Date.now(), currentActivity: st === 'offline' ? null : _detectActivity() }, { merge: true });
    } catch { }
  }
  function _startStatus() {
    _writeStatus('online');
    _statusTimer = setInterval(() => _writeStatus('online'), 45_000);
    document.addEventListener('visibilitychange', () => _writeStatus(document.hidden ? 'away' : 'online'));
    window.addEventListener('beforeunload', () => _writeStatus('offline'));
  }
  function _statusOf(info) {
    if (!info) return 'offline';
    const age = Date.now() - (info.lastSeen || 0);
    if (info.status === 'online' && age < STATUS_OFF_MS) return age > STATUS_AWAY_MS ? 'away' : 'online';
    if (info.status === 'away') return 'away';
    return 'offline';
  }
  const _dotColor = st => ({ online: '#4ade80', away: '#facc15', offline: '#4b5563' })[st] || '#4b5563';
  const _actColor = t => ({ game: '#a78bfa', movie: '#60a5fa', tv: '#34d399', anime: '#f472b6', live: '#ef4444', music: '#fb923c' })[t] || '#6b7280';
  function _actLabel(act) {
    if (!act?.type) return '';
    const dur = _durStr(Date.now() - (act.since || Date.now()));
    const labels = {
      game: `Playing ${act.name || 'a game'}`, movie: `Watching ${act.name || 'a movie'}`,
      tv: `Watching ${act.name || 'a show'}`, anime: `Watching ${act.name || 'anime'}`, live: `Watching Live: ${act.name || 'a live event'}`, music: `Listening to ${act.name || 'music'}`
    };
    return (labels[act.type] || '') + (dur ? ` · ${dur}` : '');
  }
  function _durStr(ms) {
    if (!ms || ms < 60_000) return '';
    const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
    return h ? `${h}h ${m % 60}m` : `${m}m`;
  }
  function _fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts), n = new Date();
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === n.toDateString() ? t
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + t;
  }
  async function _fetchFriends(force) {
    if (!force && Date.now() - _cacheFetched < FRIEND_TTL) return;
    if (!_friends.length) { _cacheFetched = Date.now(); return; }
    const chunks = [];
    for (let i = 0; i < _friends.length; i += 10) chunks.push(_friends.slice(i, i + 10));
    const results = await Promise.all(chunks.map(ch =>
      _db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', ch).get()
    ));
    results.forEach(snap => snap.docs.forEach(d => { _friendCache[d.id] = d.data(); }));
    _cacheFetched = Date.now();
  }
  async function _resolveName(uid) {
    if (!uid) return 'Unknown';
    if (_friendCache[uid]?.displayName && _friendCache[uid].displayName !== uid) return _friendCache[uid].displayName;
    const req = (_requests.incoming || []).find(r => r.uid === uid);
    if (req?.displayName && req.displayName !== uid) return req.displayName;
    try {
      const snap = await _uref(uid).get();
      if (snap.exists) {
        _friendCache[uid] = snap.data();
        const dn = snap.data().displayName;
        return (dn && dn !== uid) ? dn : 'Unknown';
      }
    } catch { }
    return 'Unknown';
  }
  function _nameOf(uid) {
    if (!uid) return 'Unknown';
    if (_friendCache[uid]?.displayName && _friendCache[uid].displayName !== uid) return _friendCache[uid].displayName;
    const req = (_requests.incoming || []).find(r => r.uid === uid);
    if (req?.displayName && req.displayName !== uid) return req.displayName;
    return '…';
  }
  function _ensureNameCached(uid) {
    if (!uid || (_friendCache[uid]?.displayName && _friendCache[uid].displayName !== uid)) return;
    _resolveName(uid).then(name => {
      if (name && name !== 'Unknown' && name !== uid) {
        _friendCache[uid] = { ..._friendCache[uid], displayName: name };
        if (_activeMainTab === 'friends') _renderFriendsList();
        _renderNotifPanel();
      }
    });
  }
  function _reqName(req) {
    if (_friendCache[req.uid]?.displayName && _friendCache[req.uid].displayName !== req.uid) return _friendCache[req.uid].displayName;
    if (req.displayName && req.displayName !== req.uid) return req.displayName;
    _ensureNameCached(req.uid);
    return _nameOf(req.uid);
  }
  function _sortedFriends() {
    const order = { online: 0, away: 1, offline: 2 };
    return [..._friends].sort((a, b) => {
      const sa = order[_statusOf(_friendCache[a])], sb = order[_statusOf(_friendCache[b])];
      if (sa !== sb) return sa - sb;
      const ta = _chats[_cid(_uid, a)]?.lastMsgTime || 0;
      const tb = _chats[_cid(_uid, b)]?.lastMsgTime || 0;
      return tb - ta;
    });
  }
  function _filteredFriends() {
    const q = _searchQ.toLowerCase().trim();
    return _sortedFriends().filter(uid => !q || (_friendCache[uid]?.displayName || '').toLowerCase().includes(q));
  }
  function _onlineCount() { return _friends.filter(u => _statusOf(_friendCache[u]) === 'online').length; }
  function _totalDMUnread() { return Object.values(_chats).reduce((s, c) => s + (c.unread || 0), 0); }
  function _totalGroupUnread() { return Object.values(_groupChats).reduce((s, c) => s + (c.unread || 0), 0); }
  function _totalUnread() { return _totalDMUnread() + _totalGroupUnread(); }
  function _reqCount() { return (_requests.incoming || []).length + _groupInvites.length; }
  const _e = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const IC_BELL = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  const IC_BELL_OFF = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  const IC_MSG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  const IC_X = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  const IC_REPLY = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`;
  const IC_TRASH = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
  const IC_IMG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  const IC_SEND = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const IC_CHECK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const IC_ADD_USER = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;
  const IC_LEAVE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  const IC_USERS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  const IC_SETTINGS = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`;
  function _friendCardHTML(uid, chatMeta) {
    const info = _friendCache[uid] || {};
    const name = (info.displayName && info.displayName !== uid) ? info.displayName : _nameOf(uid);
    const st = _statusOf(info);
    const act = info.currentActivity;
    const hasAct = act && act.type && st !== 'offline';
    const dotClr = hasAct ? _actColor(act.type) : _dotColor(st);
    const subText = hasAct ? _actLabel(act) : (st === 'online' ? 'Online' : st === 'away' ? 'Away' : 'Offline');
    const unread = chatMeta?.unread || 0;
    const off = _notifOff[uid] || false;
    return `<div class="vc-friend-card vc-friend-card-open" data-uid="${_e(uid)}">
    <div class="vc-avatar">${_e(name[0]?.toUpperCase() || '?')}
      <span class="vc-dot" style="background:${dotClr}" title="${_e(subText)}"></span>
    </div>
    <div class="vc-friend-info">
      <div class="vc-friend-name">${_e(name)}${unread > 0 ? `<span class="vc-unread">${unread}</span>` : ''}</div>
      ${_actSubHTML(act, hasAct, dotClr, subText)}
    </div>
    <div class="vc-friend-btns">
      <button class="vc-icon-btn vc-notif-btn${off ? ' vc-notif-off' : ''}" data-uid="${_e(uid)}" title="${off ? 'Enable' : 'Disable'} notifications" type="button">${off ? IC_BELL_OFF : IC_BELL}</button>
      <button class="vc-icon-btn vc-remove-btn" data-uid="${_e(uid)}" title="Remove friend" type="button">${IC_X}</button>
    </div>
  </div>`;
  }
  function _renderFriendsList() {
    const el = document.getElementById('vc-friends-list');
    if (!el) return;
    const friends = _filteredFriends();
    const reqs = (_requests.incoming || []);
    let html = '';
    if (reqs.length > 0 && !_searchQ) {
      html += `<div class="vc-section-label">Friend Requests (${reqs.length})</div>`;
      reqs.forEach(req => {
        const n = _reqName(req);
        html += `<div class="vc-friend-card vc-req-card" data-uid="${_e(req.uid)}">
        <div class="vc-avatar">${_e(n[0]?.toUpperCase() || '?')}</div>
        <div class="vc-friend-info">
          <div class="vc-friend-name">${_e(n)}</div>
          <div class="vc-friend-sub">sent you a friend request</div>
        </div>
        <div class="vc-friend-btns">
          <button class="vc-btn-accept" data-uid="${_e(req.uid)}" data-name="${_e(n)}" type="button">${IC_CHECK} Accept</button>
          <button class="vc-icon-btn vc-decline-btn" data-uid="${_e(req.uid)}" title="Decline" type="button">${IC_X}</button>
        </div>
      </div>`;
      });
    }
    const online = _onlineCount();
    html += `<div class="vc-section-label">${online > 0 ? `${online} online · ` : ''}<span style="opacity:.7">${friends.length} friend${friends.length !== 1 ? 's' : ''}</span></div>`;
    if (!friends.length) {
      html += `<div class="vc-empty">No friends yet! Add someone below!</div>`;
    } else {
      friends.forEach(uid => html += _friendCardHTML(uid, _chats[_cid(_uid, uid)]));
    }
    el.innerHTML = html;
    el.querySelectorAll('.vc-btn-accept').forEach(b => b.onclick = () => _acceptReq(b.dataset.uid, b.dataset.name));
    el.querySelectorAll('.vc-decline-btn').forEach(b => b.onclick = () => _declineReq(b.dataset.uid));
    el.querySelectorAll('.vc-friend-card:not(.vc-req-card) .vc-remove-btn').forEach(b => b.onclick = e => { e.stopPropagation(); _confirmRemove(b.dataset.uid); });
    el.querySelectorAll('.vc-notif-btn').forEach(b => b.onclick = e => { e.stopPropagation(); _toggleNotif(b.dataset.uid); });
    el.querySelectorAll('.vc-friend-act').forEach(b => b.onclick = e => { e.stopPropagation(); _goActivity(b.dataset.href); });
    el.querySelectorAll('.vc-friend-card-open').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        _openChat(card.dataset.uid);
      });
    });
  }
  async function _sendRequest(username) {
    if (!username) return;
    try {
      const snap = await _db.collection('users').where('displayName', '==', username).limit(1).get();
      if (snap.empty) { VApp.showToast('User not found', 'error'); return; }
      await _requestUid(snap.docs[0].id, snap.docs[0].data().displayName || username);
    } catch (e) {
      console.error('[VChat] sendRequest failed:', e);
      VApp.showToast('Failed to send request', 'error');
    }
  }
  async function _requestUid(tid, username) {
    try {
      if (tid === _uid) { VApp.showToast("That's you!", 'error'); return false; }
      if (_friends.includes(tid)) { VApp.showToast('Already friends', 'error'); return false; }
      if ((_requests.outgoing || []).includes(tid)) { VApp.showToast('Request already sent', 'error'); return false; }
      const existingIncoming = (_requests.incoming || []).find(r => r.uid === tid);
      if (existingIncoming) { await _acceptReq(tid, username); return true; }
      const reqObj = { uid: _uid, displayName: _myName, sentAt: Date.now() };
      const batch = _db.batch();
      batch.set(_uref(tid), {
        friendRequests: { incoming: firebase.firestore.FieldValue.arrayUnion(reqObj) }
      }, { merge: true });
      batch.set(_uref(_uid), {
        friendRequests: { outgoing: firebase.firestore.FieldValue.arrayUnion(tid) }
      }, { merge: true });
      await batch.commit();
      _requests.outgoing = [...(_requests.outgoing || []), tid];
      VApp.showToast(`Request sent to ${username}`);
      return true;
    } catch (e) {
      console.error('[VChat] requestUid failed:', e);
      VApp.showToast('Failed to send request', 'error');
      return false;
    }
  }
  async function _acceptReq(tid, tname) {
    try {
      const mySnap = await _uref(_uid).get();
      const myData = mySnap.data() || {};
      const incoming = myData.friendRequests?.incoming || [];
      const exactReq = incoming.find(r => r.uid === tid);
      if (!exactReq) {
        VApp.showToast('Request no longer exists', 'error');
        return;
      }
      const batch = _db.batch();
      batch.update(_uref(_uid), {
        friends: firebase.firestore.FieldValue.arrayUnion(tid),
        'friendRequests.incoming': firebase.firestore.FieldValue.arrayRemove(exactReq),
      });
      batch.update(_uref(tid), {
        friends: firebase.firestore.FieldValue.arrayUnion(_uid),
        'friendRequests.outgoing': firebase.firestore.FieldValue.arrayRemove(_uid),
      });
      await batch.commit();
      _friends = _friends.includes(tid) ? _friends : [..._friends, tid];
      _requests.incoming = (_requests.incoming || []).filter(r => r.uid !== tid);
      const theirSnap = await _uref(tid).get();
      if (theirSnap.exists) _friendCache[tid] = theirSnap.data();
      _sfxAccepted();
      const freshName = _friendCache[tid]?.displayName;
      const resolvedName = (freshName && freshName !== tid) ? freshName : ((tname && tname !== tid) ? tname : 'your new friend');
      VApp.showToast(`You and ${resolvedName} are now friends!`);
      _showToast({
        type: 'accepted',
        name: resolvedName,
        sub: 'You are now friends!',
        onMain: () => _openChatModal(tid),
        duration: 5000,
      });
      if (!_inChatView && !_inGroupView && _activeMainTab === 'friends') _renderFriendsList();
      _updateMainTabDots();
      _updateNavDots();
      _renderNotifPanel();
    } catch (e) {
      console.error('[VChat] acceptReq failed:', e);
      VApp.showToast('Could not accept. Please try again', 'error');
    }
  }
  async function _declineReq(tid) {
    try {
      const mySnap = await _uref(_uid).get();
      const incoming = mySnap.data()?.friendRequests?.incoming || [];
      const exactReq = incoming.find(r => r.uid === tid);
      const batch = _db.batch();
      if (exactReq) {
        batch.update(_uref(_uid), {
          'friendRequests.incoming': firebase.firestore.FieldValue.arrayRemove(exactReq),
        });
      }
      batch.update(_uref(tid), {
        'friendRequests.outgoing': firebase.firestore.FieldValue.arrayRemove(_uid),
      });
      await batch.commit();
      _requests.incoming = (_requests.incoming || []).filter(r => r.uid !== tid);
      if (!_inChatView && !_inGroupView && _activeMainTab === 'friends') _renderFriendsList();
      _updateMainTabDots();
      _updateNavDots();
      _renderNotifPanel();
    } catch (e) {
      console.error('[VChat] declineReq failed:', e);
      VApp.showToast('Could not decline. Please try again', 'error');
    }
  }
  async function _confirmRemove(tid) {
    const cached = _friendCache[tid]?.displayName;
    const name = (cached && cached !== tid) ? cached : _nameOf(tid);
    const ok = await VApp.showModal({ title: 'Remove Friend', message: `Remove ${name} as a friend?`, confirmText: 'Remove', dangerous: true });
    if (!ok) return;
    try {
      const batch = _db.batch();
      batch.update(_uref(_uid), { friends: firebase.firestore.FieldValue.arrayRemove(tid) });
      batch.update(_uref(tid), { friends: firebase.firestore.FieldValue.arrayRemove(_uid) });
      await batch.commit();
      _friends = _friends.filter(u => u !== tid);
      if (!_inChatView && !_inGroupView && _activeMainTab === 'friends') _renderFriendsList();
      VApp.showToast(`Removed ${name}`);
    } catch { VApp.showToast('Failed to remove', 'error'); }
  }
  function _toggleNotif(uid) {
    _notifOff[uid] = !_notifOff[uid];
    VStorage.set('vispora_notif_disabled', _notifOff);
    if (_inChatView && _activePartner === uid) _renderChatView();
    else if (_activeMainTab === 'friends') _renderFriendsList();
  }
  function _compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = e => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > MAX_IMG_PX || h > MAX_IMG_PX) {
            if (w > h) { h = Math.round(h * MAX_IMG_PX / w); w = MAX_IMG_PX; }
            else { w = Math.round(w * MAX_IMG_PX / h); h = MAX_IMG_PX; }
          }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          let q = 0.82, data = canvas.toDataURL('image/jpeg', q);
          while (data.length > MAX_IMG_BYTES * 1.37 && q > 0.25) { q -= 0.08; data = canvas.toDataURL('image/jpeg', q); }
          resolve(data);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function _extractYT(text) {
    const m = (text || '').match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function _extractURL(text) {
    const m = (text || '').match(/(https?:\/\/[^\s<>"]+)/);
    return m ? m[1] : null;
  }
  function _linkify(text) {
    return _e(text).replace(/(https?:\/\/[^\s<>"&]+)/g, url => `<a class="vc-msg-link" href="${url}" target="_blank" rel="noopener">${url}</a>`);
  }
  function _ytEmbed(id) {
    return `<div class="vc-yt-wrap"><iframe src="https://www.youtube.com/embed/${_e(id)}" frameborder="0" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"></iframe></div>`;
  }
  function _linkCard(url) {
    if (!VStorage.get('vispora_link_previews', true)) return '';
    return `<a class="vc-link-card" href="${_e(url)}" target="_blank" rel="noopener">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    ${_e(url.length > 55 ? url.slice(0, 55) + '…' : url)}
  </a>`;
  }
  async function _sendMsg(text, imgData, gifUrl) {
    if (!_activeChatId) return;
    const filtered = text ? _filter(text.trim()) : '';
    if (!filtered && !imgData && !gifUrl) return;
    const now = Date.now();
    const remaining = CHAT_COOLDOWN_MS - (now - (_lastSendAt[_activeChatId] || 0));
    if (remaining > 0) {
      VApp.showToast(`Slow down. Wait ${Math.ceil(remaining / 1000)}s`, 'error');
      return;
    }
    _lastSendAt[_activeChatId] = now;
    _disableSendBriefly();
    const ytId = _extractYT(filtered);
    const data = {
      senderId: _uid, senderName: _myName,
      timestamp: now,
      serverTime: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (filtered) data.text = filtered;
    if (imgData) data.imageData = imgData;
    if (gifUrl) data.gifUrl = gifUrl;
    if (ytId) data.youtubeId = ytId;
    if (_replyTo) data.replyTo = { ..._replyTo };
    try {
      await _mref(_activeChatId).add(data);
      const lastMsg = imgData ? 'Image' : gifUrl ? 'GIF'
        : (filtered.length > 60 ? filtered.slice(0, 60) + '…' : filtered);
      const now = Date.now();
      const batch = _db.batch();
      batch.update(_uref(_uid), { [`chats.${_activeChatId}`]: { partnerId: _activePartner, lastMsg, lastMsgTime: now, unread: 0 } });
      batch.update(_uref(_activePartner), {
        [`chats.${_activeChatId}`]: {
          partnerId: _uid, lastMsg, lastMsgTime: now,
          unread: firebase.firestore.FieldValue.increment(1),
        }
      });
      await batch.commit();
      _replyTo = null;
      _updateReplyBar();
      _sfxSend();
    } catch (e) { console.error('[VChat] sendMsg failed:', e); VApp.showToast('Failed to send', 'error'); }
  }
  function _disableSendBriefly() {
    const btn = document.getElementById('vc-send');
    if (!btn) return;
    btn.disabled = true;
    setTimeout(() => { if (btn) btn.disabled = false; }, CHAT_COOLDOWN_MS);
  }
  async function _deleteMsg(id, ts) {
    if (Date.now() - ts > DELETE_WIN) { VApp.showToast('Too late to delete', 'error'); return; }
    try {
      await _mref(_activeChatId).doc(id).update({
        deleted: true,
        text: firebase.firestore.FieldValue.delete(),
        imageData: firebase.firestore.FieldValue.delete(),
        gifUrl: firebase.firestore.FieldValue.delete(),
        youtubeId: firebase.firestore.FieldValue.delete(),
      });
    } catch (e) { console.error('[VChat] deleteMsg failed:', e); }
  }
  function _subscribeMsgs() {
    if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }
    const q = _mref(_activeChatId).orderBy('serverTime', 'desc').limit(MSG_PAGE);
    let firstSnap = true;
    _chatUnsub = q.onSnapshot(snap => {
      const isFirst = firstSnap; firstSnap = false;
      snap.docChanges().forEach(ch => {
        if (ch.type === 'added' && !isFirst) {
          const msg = ch.doc.data();
          if (msg.senderId !== _uid && !_notifOff[_activePartner]) {
            _sfxReceive();
            if (!_chatOpen || document.hidden) {
              const cachedName = _friendCache[msg.senderId]?.displayName;
              const senderName = (cachedName && cachedName !== msg.senderId) ? cachedName
                : (msg.senderName && msg.senderName !== msg.senderId) ? msg.senderName
                  : _nameOf(msg.senderId);
              const preview = msg.text
                ? msg.text.slice(0, 55) + (msg.text.length > 55 ? '…' : '')
                : msg.imageData ? 'Image' : msg.gifUrl ? 'GIF' : '…';
              const partnerId = msg.senderId;
              _showToast({
                type: 'msg',
                name: senderName,
                sub: preview,
                onMain: () => _openChatModal(partnerId),
                duration: 6000,
              });
            }
          }
        }
      });
      _messages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      _lastMsgCursor = snap.docs[snap.docs.length - 1] || null;
      _renderMessages();
    }, e => console.error('[VChat] messages snapshot error:', e));
  }
  async function _loadOlder() {
    if (!_lastMsgCursor || !_activeChatId) return;
    const snap = await _mref(_activeChatId).orderBy('serverTime', 'desc').startAfter(_lastMsgCursor).limit(MSG_PAGE).get().catch(() => null);
    if (!snap || snap.empty) { const b = document.getElementById('vc-load-older'); if (b) b.style.display = 'none'; return; }
    const older = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    _messages = [...older, ..._messages];
    _lastMsgCursor = snap.docs[snap.docs.length - 1];
    _renderMessages(true);
  }
  function _renderMessages(keepScroll) {
    const el = document.getElementById('vc-messages');
    if (!el) return;
    const wasBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    const prevH = el.scrollHeight, prevTop = el.scrollTop;
    el.innerHTML = _messages.map((msg, i) => {
      if (msg.deleted) return `<div class="vc-msg-row vc-msg-${msg.senderId === _uid ? 'self' : 'other'}"><div class="vc-bubble vc-deleted">Message deleted</div></div>`;
      const self = msg.senderId === _uid;
      const canDel = self && (Date.now() - (msg.timestamp || 0) < DELETE_WIN);
      const ytId = msg.youtubeId;
      const url = !ytId ? _extractURL(msg.text || '') : null;
      return `<div class="vc-msg-row vc-msg-${self ? 'self' : 'other'}" data-msg-id="${_e(msg.id)}">
      ${msg.replyTo ? `<div class="vc-reply-ref" data-target="${_e(msg.replyTo.id)}">
        ${IC_REPLY} <b>${_e(msg.replyTo.senderName)}</b>: ${_e((msg.replyTo.text || '[media]').slice(0, 50))}
      </div>` : ''}
      <div class="vc-bubble${self ? ' vc-self' : ' vc-other'}">
        ${msg.imageData ? `<img class="vc-msg-img" src="${msg.imageData}" alt="image" loading="lazy">` : ''}
        ${msg.gifUrl ? `<img class="vc-msg-img vc-msg-gif" src="${_e(msg.gifUrl)}" alt="gif" loading="lazy">` : ''}
        ${msg.text ? `<div class="vc-msg-text">${_linkify(msg.text)}</div>` : ''}
        ${ytId ? _ytEmbed(ytId) : (url && msg.text ? _linkCard(url) : '')}
        <div class="vc-msg-time">${_fmtTime(msg.timestamp)}</div>
      </div>
      <div class="vc-msg-actions">
        <button class="vc-action-btn vc-reply-btn" data-idx="${i}" title="Reply">${IC_REPLY}</button>
        ${canDel ? `<button class="vc-action-btn vc-del-btn" data-id="${_e(msg.id)}" data-ts="${msg.timestamp}" title="Delete">${IC_TRASH}</button>` : ''}
      </div>
    </div>`;
    }).join('');
    el.querySelectorAll('.vc-msg-img').forEach(img => {
      img.onclick = () => _openLightbox(img.src);
    });
    el.querySelectorAll('.vc-reply-btn').forEach(b => {
      b.onclick = () => {
        const msg = _messages[parseInt(b.dataset.idx)];
        if (!msg) return;
        const cachedName = _friendCache[msg.senderId]?.displayName;
        const replySenderName = (cachedName && cachedName !== msg.senderId) ? cachedName
          : (msg.senderName && msg.senderName !== msg.senderId) ? msg.senderName : '';
        _replyTo = { id: msg.id, text: msg.text || '[media]', senderName: replySenderName };
        _updateReplyBar();
        document.getElementById('vc-input')?.focus();
      };
    });
    el.querySelectorAll('.vc-del-btn').forEach(b => b.onclick = () => _deleteMsg(b.dataset.id, Number(b.dataset.ts)));
    el.querySelectorAll('.vc-reply-ref').forEach(ref => {
      ref.onclick = () => {
        const t = el.querySelector(`[data-msg-id="${ref.dataset.target}"]`);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
    if (keepScroll) el.scrollTop = prevTop + (el.scrollHeight - prevH);
    else if (wasBottom) el.scrollTop = el.scrollHeight;
  }
  let _lightboxEl = null;
  function _ensureLightbox() {
    if (_lightboxEl) return _lightboxEl;
    _lightboxEl = document.createElement('div');
    _lightboxEl.className = 'vc-lightbox';
    _lightboxEl.innerHTML = `<button class="vc-lightbox-close" type="button" aria-label="Close">${IC_X}</button><img alt="Full size image">`;
    _lightboxEl.addEventListener('click', e => {
      if (e.target === _lightboxEl) _closeLightbox();
    });
    _lightboxEl.querySelector('.vc-lightbox-close').onclick = _closeLightbox;
    document.body.appendChild(_lightboxEl);
    return _lightboxEl;
  }
  function _openLightbox(src) {
    const el = _ensureLightbox();
    el.querySelector('img').src = src;
    el.classList.add('open');
    document.addEventListener('keydown', _lightboxEscHandler);
  }
  function _closeLightbox() {
    if (!_lightboxEl) return;
    _lightboxEl.classList.remove('open');
    document.removeEventListener('keydown', _lightboxEscHandler);
  }
  function _lightboxEscHandler(e) {
    if (e.key === 'Escape') _closeLightbox();
  }

  function _updateReplyBar() {
    const el = document.getElementById('vc-reply-bar');
    if (!el) return;
    if (_replyTo) {
      el.style.display = 'flex';
      el.innerHTML = `<span>${IC_REPLY} Replying to <b>${_e(_replyTo.senderName)}</b>: ${_e((_replyTo.text || '').slice(0, 60))}</span>
      <button id="vc-cancel-reply" type="button">✕</button>`;
      document.getElementById('vc-cancel-reply').onclick = () => { _replyTo = null; _updateReplyBar(); };
    } else {
      el.style.display = 'none'; el.innerHTML = '';
    }
  }
  function _openChat(uid) {
    _inChatView = true;
    _activePartner = uid;
    _activeChatId = _cid(_uid, uid);
    _messages = []; _lastMsgCursor = null; _replyTo = null;
    if (!_friendCache[uid]?.displayName) {
      _uref(uid).get().then(s => { if (s.exists) { _friendCache[uid] = s.data(); _renderChatView(); _subscribeMsgs(); } }).catch(() => { });
      return;
    }
    const chatMeta = _chats[_activeChatId];
    if (chatMeta?.unread > 0) {
      _uref(_uid).update({ [`chats.${_activeChatId}.unread`]: 0 }).catch(() => { });
      if (_chats[_activeChatId]) _chats[_activeChatId].unread = 0;
      _updateNavDots();
      _renderNotifPanel();
    }
    _renderChatView();
    _subscribeMsgs();
  }
  function _renderChatView() {
    const body = document.getElementById('vc-modal-body');
    if (!body) return;
    _updateOnlineBadge();
    const info = _friendCache[_activePartner] || {};
    const name = (info.displayName && info.displayName !== _activePartner) ? info.displayName : _nameOf(_activePartner);
    const st = _statusOf(info);
    const act = info.currentActivity;
    const hasAct = act && act.type && st !== 'offline';
    const dotClr = hasAct ? _actColor(act.type) : _dotColor(st);
    const sub = hasAct ? _actLabel(act) : (st === 'online' ? 'Online' : st === 'away' ? 'Away' : 'Offline');
    const off = _notifOff[_activePartner] || false;
    body.innerHTML = `
    <div class="vc-chat-topbar">
      <div class="vc-chat-who">
        <div class="vc-avatar">${_e(name[0]?.toUpperCase() || '?')}
          <span class="vc-dot" style="background:${dotClr}"></span>
        </div>
        <div>
          <div class="vc-friend-name">${_e(name)}</div>
          ${_actSubHTML(act, hasAct, dotClr, sub)}
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="vc-icon-btn vc-notif-btn${off ? ' vc-notif-off' : ''}" id="vc-chat-notif" title="${off ? 'Enable' : 'Disable'} notifications">${off ? IC_BELL_OFF : IC_BELL}</button>
        <button class="vc-back-btn" id="vc-leave-chat">← Back</button>
      </div>
    </div>
    <div class="vc-msgs-wrap">
      <button class="vc-load-older" id="vc-load-older">Load older messages</button>
      <div class="vc-messages" id="vc-messages"></div>
    </div>
    <div class="vc-input-area">
      <div class="vc-reply-bar" id="vc-reply-bar" style="display:none"></div>
      <div class="vc-input-row">
        <label class="vc-icon-btn vc-img-label" title="Attach image" tabindex="0">
          ${IC_IMG}
          <input type="file" id="vc-file-in" accept="image/*,image/gif" style="display:none">
        </label>
        <textarea class="vc-input" id="vc-input" placeholder="Message ${_e(name)}…" rows="1"></textarea>
        <button class="vc-send-btn" id="vc-send">${IC_SEND}</button>
      </div>
    </div>`;
    _bindChatEvents();
    _renderMessages();
    _updateReplyBar();
  }
  function _bindChatEvents() {
    document.getElementById('vc-leave-chat').onclick = _leaveChat;
    document.querySelectorAll('#vc-modal-body .vc-friend-act').forEach(b => b.onclick = () => _goActivity(b.dataset.href));
    document.getElementById('vc-chat-notif').onclick = () => _toggleNotif(_activePartner);
    document.getElementById('vc-load-older').onclick = _loadOlder;
    const input = document.getElementById('vc-input');
    const send = document.getElementById('vc-send');
    const fileIn = document.getElementById('vc-file-in');
    function doSend() {
      const t = input.value.trim();
      if (!t) return;
      _sendMsg(t); input.value = ''; input.style.height = '';
    }
    send.onclick = doSend;
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
    input.oninput = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
    input.addEventListener('paste', async e => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            _sendMsg('', await _compressImage(item.getAsFile()), null);
            return;
          }
        }
      }
      const txt = e.clipboardData?.getData('text') || '';
      if (/\.gif(\?.*)?$/i.test(txt.trim())) { e.preventDefault(); _sendMsg('', null, txt.trim()); }
    });
    fileIn.onchange = async () => {
      const f = fileIn.files[0]; if (!f) return;
      if (f.type === 'image/gif') _sendMsg('', null, URL.createObjectURL(f));
      else _sendMsg('', await _compressImage(f), null);
      fileIn.value = '';
    };
  }
  function _leaveChat() {
    _inChatView = false;
    if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }
    _activeChatId = null; _activePartner = null;
    _messages = []; _replyTo = null;
    _renderMainView();
  }
  function _updateGroupReplyBar() {
    const el = document.getElementById('vc-reply-bar');
    if (!el) return;
    if (_groupReplyTo) {
      el.style.display = 'flex';
      el.innerHTML = `<span>${IC_REPLY} Replying to <b>${_e(_groupReplyTo.senderName)}</b>: ${_e((_groupReplyTo.text || '').slice(0, 60))}</span>
      <button id="vc-cancel-reply" type="button">✕</button>`;
      document.getElementById('vc-cancel-reply').onclick = () => { _groupReplyTo = null; _updateGroupReplyBar(); };
    } else {
      el.style.display = 'none'; el.innerHTML = '';
    }
  }
  async function _fetchGroupMeta(groupId, force) {
    if (!force && _groupCache[groupId]) return _groupCache[groupId];
    try {
      const snap = await _gref(groupId).get();
      _groupCache[groupId] = snap.exists ? snap.data() : { name: 'Unknown Group', members: [] };
    } catch (e) {
      console.error('[VChat] fetchGroupMeta failed:', e);
      if (!_groupCache[groupId]) _groupCache[groupId] = { name: 'Unknown Group', members: [] };
    }
    return _groupCache[groupId];
  }
  async function _fetchGroupsMeta(force) {
    const ids = force ? _groups : _groups.filter(id => !_groupCache[id]);
    if (!ids.length) return;
    await Promise.all(ids.map(id => _fetchGroupMeta(id, force)));
  }
  function _groupPolicy(group) {
    return (group && group.settings && group.settings.invitePolicy) || 'everyone';
  }
  function _isGroupOwner(group) {
    return !!group && group.ownerId === _uid;
  }
  function _canInvite(group) {
    const policy = _groupPolicy(group);
    if (policy === 'none') return false;
    return policy === 'everyone' || _isGroupOwner(group);
  }
  function _lastPreview(meta) {
    if (!meta || !meta.lastMsg) return '';
    if (!meta.lastSenderId) return meta.lastMsg;
    if (meta.lastSystem) return `${meta.lastSenderId === _uid ? 'You' : (meta.lastSender || 'Someone')} ${meta.lastMsg}`;
    return `${meta.lastSenderId === _uid ? 'You' : (meta.lastSender || 'Someone')}: ${meta.lastMsg}`;
  }
  function _applyGroupHeader() {
    const nameEl = document.getElementById('vc-group-name');
    if (!nameEl) return;
    const group = _groupCache[_activeGroupId] || {};
    const count = (group.members || []).length;
    nameEl.textContent = group.name || 'Group';
    document.getElementById('vc-group-sub').textContent = `${count} member${count === 1 ? '' : 's'}`;
    document.getElementById('vc-group-invite').style.display = _canInvite(group) ? '' : 'none';
    document.getElementById('vc-group-settings').style.display = _isGroupOwner(group) ? '' : 'none';
    const input = document.getElementById('vc-input');
    if (input) input.placeholder = `Message ${group.name || 'Group'}…`;
  }
  function _openGroupChat(groupId) {
    _inGroupView = true;
    _activeGroupId = groupId;
    _groupMessages = []; _lastGroupMsgCursor = null; _groupReplyTo = null;
    const chatMeta = _groupChats[groupId];
    if (chatMeta?.unread > 0) {
      _uref(_uid).update({ [`groupChats.${groupId}.unread`]: 0 }).catch(() => { });
      if (_groupChats[groupId]) _groupChats[groupId].unread = 0;
      _updateNavDots();
      _renderNotifPanel();
    }
    if (!_groupCache[groupId]) {
      _fetchGroupMeta(groupId).then(() => { _renderGroupChatView(); _subscribeGroupMsgs(); });
      return;
    }
    _renderGroupChatView();
    _subscribeGroupMsgs();
    _fetchGroupMeta(groupId, true).then(() => {
      if (_inGroupView && _activeGroupId === groupId) _applyGroupHeader();
    });
  }
  function _renderGroupChatView() {
    const body = document.getElementById('vc-modal-body');
    if (!body) return;
    _updateOnlineBadge();
    const group = _groupCache[_activeGroupId] || {};
    const name = group.name || 'Group';
    body.innerHTML = `
    <div class="vc-chat-topbar">
      <div class="vc-chat-who vc-group-who" id="vc-group-info" title="View members">
        <div class="vc-avatar vc-group-avatar">${IC_USERS}</div>
        <div class="vc-group-titles">
          <div class="vc-friend-name" id="vc-group-name"></div>
          <div class="vc-friend-sub" id="vc-group-sub"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="vc-icon-btn" id="vc-group-invite" title="Invite Friends">${IC_ADD_USER}</button>
        <button class="vc-icon-btn" id="vc-group-settings" title="Group Settings">${IC_SETTINGS}</button>
        <button class="vc-icon-btn" id="vc-group-leave" title="Leave Group">${IC_LEAVE}</button>
        <button class="vc-back-btn" id="vc-leave-group">← Back</button>
      </div>
    </div>
    <div class="vc-msgs-wrap">
      <button class="vc-load-older" id="vc-load-older">Load older messages</button>
      <div class="vc-messages" id="vc-messages"></div>
    </div>
    <div class="vc-input-area">
      <div class="vc-reply-bar" id="vc-reply-bar" style="display:none"></div>
      <div class="vc-input-row">
        <label class="vc-icon-btn vc-img-label" title="Attach image" tabindex="0">
          ${IC_IMG}
          <input type="file" id="vc-file-in" accept="image/*,image/gif" style="display:none">
        </label>
        <textarea class="vc-input" id="vc-input" placeholder="Message ${_e(name)}…" rows="1"></textarea>
        <button class="vc-send-btn" id="vc-send">${IC_SEND}</button>
      </div>
    </div>`;
    _bindGroupChatEvents();
    _applyGroupHeader();
    _renderGroupMessages();
    _updateGroupReplyBar();
  }
  function _bindGroupChatEvents() {
    document.getElementById('vc-leave-group').onclick = _leaveGroupChat;
    document.getElementById('vc-group-info').onclick = () => _renderMembersView();
    document.getElementById('vc-group-settings').onclick = () => _renderGroupSettings();
    document.getElementById('vc-group-invite').onclick = () => _renderInvitePicker();
    document.getElementById('vc-group-leave').onclick = () => _confirmLeaveGroup(_activeGroupId);
    document.getElementById('vc-load-older').onclick = _loadOlderGroup;
    const input = document.getElementById('vc-input');
    const send = document.getElementById('vc-send');
    const fileIn = document.getElementById('vc-file-in');
    function doSend() {
      const t = input.value.trim();
      if (!t) return;
      _sendGroupMsg(t); input.value = ''; input.style.height = '';
    }
    send.onclick = doSend;
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
    input.oninput = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
    input.addEventListener('paste', async e => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            _sendGroupMsg('', await _compressImage(item.getAsFile()), null);
            return;
          }
        }
      }
      const txt = e.clipboardData?.getData('text') || '';
      if (/\.gif(\?.*)?$/i.test(txt.trim())) { e.preventDefault(); _sendGroupMsg('', null, txt.trim()); }
    });
    fileIn.onchange = async () => {
      const f = fileIn.files[0]; if (!f) return;
      if (f.type === 'image/gif') _sendGroupMsg('', null, URL.createObjectURL(f));
      else _sendGroupMsg('', await _compressImage(f), null);
      fileIn.value = '';
    };
  }
  function _leaveGroupChat() {
    _inGroupView = false;
    if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }
    _activeGroupId = null;
    _groupMessages = []; _groupReplyTo = null;
    _renderMainView();
  }
  function _renderInvitePicker() {
    const body = document.getElementById('vc-modal-body');
    if (!body) return;
    const group = _groupCache[_activeGroupId] || {};
    if (!_canInvite(group)) {
      VApp.showToast('Invites are turned off for this group', 'error');
      return;
    }
    const members = new Set(group.members || []);
    const pending = new Set(group.pendingInvites || []);
    const candidates = _friends.filter(uid => !members.has(uid) && !pending.has(uid));
    body.innerHTML = `
    <div class="vc-chat-topbar">
      <div class="vc-chat-who"><div class="vc-friend-name">Invite Friends</div></div>
      <button class="vc-back-btn" id="vc-invite-back">← Back</button>
    </div>
    <div class="vc-friends-list" id="vc-invite-list" style="flex:1"></div>`;
    const list = document.getElementById('vc-invite-list');
    if (!candidates.length) {
      list.innerHTML = `<div class="vc-empty">${_friends.length ? 'Everyone is already in this group' : 'Add some friends first!'}</div>`;
    } else {
      list.innerHTML = candidates.map(uid => {
        const name = _nameOf(uid);
        return `<div class="vc-friend-card" data-uid="${_e(uid)}">
        <div class="vc-avatar">${_e(name[0]?.toUpperCase() || '?')}</div>
        <div class="vc-friend-info"><div class="vc-friend-name">${_e(name)}</div></div>
        <div class="vc-friend-btns">
          <button class="vc-btn-accept vc-invite-send-btn" data-uid="${_e(uid)}" type="button">Invite</button>
        </div>
      </div>`;
      }).join('');
      list.querySelectorAll('.vc-invite-send-btn').forEach(b => {
        b.onclick = () => _sendGroupInvite(_activeGroupId, b.dataset.uid);
      });
    }
    document.getElementById('vc-invite-back').onclick = () => _renderGroupChatView();
  }
  async function _sendGroupInvite(groupId, targetUid) {
    const group = await _fetchGroupMeta(groupId, true);
    if (!_canInvite(group)) {
      VApp.showToast('Invites are turned off for this group', 'error');
      _renderGroupChatView();
      return;
    }
    const inviteObj = { groupId, groupName: group.name, invitedBy: _uid, invitedByName: _myName, sentAt: Date.now() };
    try {
      const batch = _db.batch();
      batch.update(_gref(groupId), { pendingInvites: firebase.firestore.FieldValue.arrayUnion(targetUid) });
      batch.update(_uref(targetUid), { groupInvites: firebase.firestore.FieldValue.arrayUnion(inviteObj) });
      await batch.commit();
      group.pendingInvites = [...(group.pendingInvites || []), targetUid];
      VApp.showToast(`Invite sent to ${_nameOf(targetUid)}`);
      _renderInvitePicker();
    } catch (e) {
      console.error('[VChat] sendGroupInvite failed:', e);
      VApp.showToast('Failed to send invite', 'error');
    }
  }
  let _membersTimer = null;
  let _leavingGroup = null;
  function _presence(info) {
    const st = _statusOf(info);
    const act = info && info.currentActivity;
    const hasAct = !!(act && act.type && st !== 'offline');
    return {
      act, hasAct,
      dotClr: hasAct ? _actColor(act.type) : _dotColor(st),
      subText: hasAct ? _actLabel(act) : (st === 'online' ? 'Online' : st === 'away' ? 'Away' : 'Offline'),
    };
  }
  async function _loadMemberInfo(uids) {
    await Promise.all(uids.map(async uid => {
      try {
        const s = await _uref(uid).get();
        if (s.exists) _friendCache[uid] = s.data();
      } catch { }
    }));
  }
  function _memberAction(uid, name) {
    if (uid === _uid) return '';
    if (_friends.includes(uid)) return '<span class="vc-member-tag vc-member-tag-muted">Friend</span>';
    if ((_requests.outgoing || []).includes(uid)) return '<span class="vc-member-tag vc-member-tag-muted">Requested</span>';
    if ((_requests.incoming || []).some(r => r.uid === uid)) {
      return `<button class="vc-btn-accept vc-member-add" data-uid="${_e(uid)}" data-name="${_e(name)}" type="button">${IC_CHECK} Accept</button>`;
    }
    return `<button class="vc-btn-accept vc-member-add" data-uid="${_e(uid)}" data-name="${_e(name)}" type="button">${IC_ADD_USER} Add</button>`;
  }
  function _paintMembers() {
    const list = document.getElementById('vc-members-list');
    if (!list || !_inGroupView) return;
    const group = _groupCache[_activeGroupId] || {};
    const members = group.members || [];
    const title = document.getElementById('vc-members-title');
    if (title) title.textContent = `Members (${members.length})`;
    const rows = members.map(uid => {
      const dn = _friendCache[uid]?.displayName;
      const name = uid === _uid ? _myName : (dn && dn !== uid ? dn : _nameOf(uid));
      return { uid, name: name || 'Unknown' };
    }).sort((a, b) => (b.uid === group.ownerId) - (a.uid === group.ownerId)
      || (b.uid === _uid) - (a.uid === _uid)
      || a.name.localeCompare(b.name));
    list.innerHTML = rows.map(m => {
      const p = _presence(_friendCache[m.uid]);
      return `<div class="vc-friend-card" style="cursor:default">
      <div class="vc-avatar">${_e(m.name[0]?.toUpperCase() || '?')}
        <span class="vc-dot" style="background:${p.dotClr}" title="${_e(p.subText)}"></span>
      </div>
      <div class="vc-friend-info">
        <div class="vc-friend-name">${_e(m.name)}</div>
        ${_actSubHTML(p.act, p.hasAct, p.dotClr, p.subText)}
      </div>
      <div class="vc-friend-btns">
        ${m.uid === group.ownerId ? '<span class="vc-member-tag">Owner</span>' : ''}
        ${m.uid === _uid ? '<span class="vc-member-tag">You</span>' : ''}
        ${_memberAction(m.uid, m.name)}
        ${_isGroupOwner(group) && m.uid !== _uid ? `<button class="vc-icon-btn vc-member-kick" data-uid="${_e(m.uid)}" data-name="${_e(m.name)}" title="Remove from group" type="button">${IC_X}</button>` : ''}
      </div>
    </div>`;
    }).join('');
    list.querySelectorAll('.vc-friend-act').forEach(b => b.onclick = e => { e.stopPropagation(); _goActivity(b.dataset.href); });
    list.querySelectorAll('.vc-member-kick').forEach(b => {
      b.onclick = async e => {
        e.stopPropagation();
        await _kickMember(b.dataset.uid, b.dataset.name);
        _paintMembers();
      };
    });
    list.querySelectorAll('.vc-member-add').forEach(b => {
      b.onclick = async e => {
        e.stopPropagation();
        b.disabled = true;
        await _requestUid(b.dataset.uid, b.dataset.name);
        _paintMembers();
      };
    });
  }
  async function _kickMember(uid, name) {
    const groupId = _activeGroupId;
    const group = _groupCache[groupId] || {};
    if (!_isGroupOwner(group) || uid === _uid) return;
    const ok = await VApp.showModal({ title: 'Remove Member', message: `Remove ${name} from "${group.name || 'this group'}"? They'll need a new invite to rejoin.`, confirmText: 'Remove', dangerous: true });
    if (!ok) return;
    try {
      const batch = _db.batch();
      batch.update(_gref(groupId), {
        members: firebase.firestore.FieldValue.arrayRemove(uid),
        pendingInvites: firebase.firestore.FieldValue.arrayRemove(uid),
      });
      batch.update(_uref(uid), {
        groups: firebase.firestore.FieldValue.arrayRemove(groupId),
        [`groupChats.${groupId}`]: firebase.firestore.FieldValue.delete(),
      });
      await batch.commit();
      group.members = (group.members || []).filter(m => m !== uid);
      VApp.showToast(`Removed ${name}`);
      await _announceGroup(groupId, `removed ${name} from the group`);
    } catch (e) {
      console.error('[VChat] kickMember failed:', e);
      VApp.showToast('Failed to remove member', 'error');
    }
  }
  async function _renderMembersView() {
    const body = document.getElementById('vc-modal-body');
    if (!body) return;
    const groupId = _activeGroupId;
    const count = ((_groupCache[groupId] || {}).members || []).length;
    body.innerHTML = `
    <div class="vc-chat-topbar">
      <div class="vc-chat-who"><div class="vc-friend-name" id="vc-members-title">Members (${count})</div></div>
      <button class="vc-back-btn" id="vc-members-back">← Back</button>
    </div>
    <div class="vc-friends-list" id="vc-members-list" style="flex:1"></div>`;
    document.getElementById('vc-members-back').onclick = () => _renderGroupChatView();
    const refresh = async () => {
      await _loadMemberInfo((_groupCache[groupId] || {}).members || []);
      if (_activeGroupId === groupId) _paintMembers();
    };
    if (_membersTimer) clearInterval(_membersTimer);
    _paintMembers();
    _membersTimer = setInterval(() => {
      if (!document.getElementById('vc-members-list') || !_inGroupView || _activeGroupId !== groupId) {
        clearInterval(_membersTimer); _membersTimer = null; return;
      }
      refresh();
    }, 30_000);
    await refresh();
  }
  function _notifyGroupEvents(prev) {
    Object.entries(_groupChats).forEach(([id, meta]) => {
      if (!meta.lastSystem || meta.lastSenderId === _uid) return;
      if (meta.lastMsgTime <= ((prev[id] && prev[id].lastMsgTime) || 0)) return;
      _fetchGroupMeta(id, true).then(() => {
        if (_notifOpen) _renderNotifPanel();
        if (_inGroupView && _activeGroupId === id) {
          _applyGroupHeader();
          return;
        }
        if (_chatOpen && !_inChatView && !_inGroupView) _renderActiveMainList();
        _showToast({
          type: 'msg',
          name: _groupCache[id]?.name || 'Group',
          sub: _lastPreview(meta),
          onMain: () => { _openChatModal(); _openGroupChat(id); },
          duration: 6000,
        });
      });
    });
  }
  async function _announceGroup(groupId, text, opts) {
    const skipSelf = !!(opts && opts.skipSelf);
    const group = _groupCache[groupId] || {};
    const now = Date.now();
    const last = { lastMsg: text, lastSender: _myName, lastSenderId: _uid, lastSystem: true, lastMsgTime: now };
    try {
      await _gmref(groupId).add({
        senderId: _uid, senderName: _myName,
        system: true, text,
        timestamp: now,
        serverTime: firebase.firestore.FieldValue.serverTimestamp(),
      });
      const batch = _db.batch();
      if (!skipSelf) batch.update(_uref(_uid), { [`groupChats.${groupId}`]: { ...last, unread: 0 } });
      (group.members || []).filter(m => m !== _uid).forEach(m => {
        batch.update(_uref(m), {
          [`groupChats.${groupId}`]: { ...last, unread: firebase.firestore.FieldValue.increment(1) },
        });
      });
      await batch.commit();
    } catch (e) {
      console.error('[VChat] announceGroup failed:', e);
    }
  }
  const _announceRename = (groupId, newName) => _announceGroup(groupId, `renamed the group to "${newName}"`);
  async function _updateGroup(fields, local) {
    const groupId = _activeGroupId;
    try {
      await _gref(groupId).update(fields);
      Object.assign(_groupCache[groupId], local);
      VApp.showToast('Group updated');
      return true;
    } catch (e) {
      console.error('[VChat] updateGroup failed:', e);
      VApp.showToast('Failed to update group', 'error');
      return false;
    }
  }
  function _renderGroupSettings() {
    const body = document.getElementById('vc-modal-body');
    if (!body) return;
    const current = () => _groupCache[_activeGroupId] || {};
    if (!_isGroupOwner(current())) return;
    const INVITE_DESC = {
      everyone: 'Any member can invite friends.',
      owner: 'Only you can invite friends.',
      none: 'Nobody can send invites until this is changed.',
    };
    body.innerHTML = `
    <div class="vc-chat-topbar">
      <div class="vc-chat-who"><div class="vc-friend-name">Group Settings</div></div>
      <button class="vc-back-btn" id="vc-settings-back">← Back</button>
    </div>
    <div class="vc-settings-body">
      <div class="vc-section-label">Group name</div>
      <div class="vc-setting-row">
        <input class="vc-add-input" id="vc-gs-name" type="text" maxlength="40" value="${_e(current().name || '')}">
        <button class="vc-add-btn" id="vc-gs-name-save" type="button">Save</button>
      </div>
      <div class="vc-section-label">Who can invite</div>
      <select class="settings-select" id="vc-gs-invite">
        <option value="everyone">Everyone</option>
        <option value="owner">Only me</option>
        <option value="none">No one</option>
      </select>
      <div class="vc-friend-sub" id="vc-gs-invite-desc"></div>
    </div>`;
    const nameIn = document.getElementById('vc-gs-name');
    const select = document.getElementById('vc-gs-invite');
    const desc = document.getElementById('vc-gs-invite-desc');
    select.value = _groupPolicy(current());
    desc.textContent = INVITE_DESC[select.value];
    document.getElementById('vc-settings-back').onclick = () => _renderGroupChatView();
    document.getElementById('vc-gs-name-save').onclick = () => {
      const name = nameIn.value.trim();
      if (!name) { VApp.showToast('Enter a group name', 'error'); return; }
      if (name === current().name) return;
      _updateGroup({ name }, { name }).then(ok => { if (ok) _announceRename(_activeGroupId, name); });
    };
    nameIn.onkeydown = e => { if (e.key === 'Enter') document.getElementById('vc-gs-name-save').click(); };
    select.onchange = async () => {
      const value = select.value;
      desc.textContent = INVITE_DESC[value];
      const ok = await _updateGroup(
        { 'settings.invitePolicy': value },
        { settings: { ...(current().settings || {}), invitePolicy: value } }
      );
      if (!ok) {
        select.value = _groupPolicy(current());
        desc.textContent = INVITE_DESC[select.value];
      }
    };
  }
  async function _confirmLeaveGroup(groupId) {
    let group = _groupCache[groupId] || {};
    const ok = await VApp.showModal({ title: 'Leave Group', message: `Leave "${group.name || 'this group'}"? You'll need a new invite to rejoin.`, confirmText: 'Leave', dangerous: true });
    if (!ok) return;
    try {
      _leavingGroup = groupId;
      group = await _fetchGroupMeta(groupId, true);
      const remaining = (group.members || []).filter(m => m !== _uid);
      if (remaining.length) await _announceGroup(groupId, 'left the group', { skipSelf: true });
      const batch = _db.batch();
      const groupUpdate = { members: firebase.firestore.FieldValue.arrayRemove(_uid) };
      if (group.ownerId === _uid && remaining.length) groupUpdate.ownerId = remaining[0];
      batch.update(_gref(groupId), groupUpdate);
      batch.update(_uref(_uid), {
        groups: firebase.firestore.FieldValue.arrayRemove(groupId),
        [`groupChats.${groupId}`]: firebase.firestore.FieldValue.delete(),
      });
      await batch.commit();
      if (!remaining.length) await _gref(groupId).delete().catch(() => { });
      _groups = _groups.filter(id => id !== groupId);
      delete _groupCache[groupId];
      delete _groupChats[groupId];
      VApp.showToast('Left group');
      _leavingGroup = null;
      _leaveGroupChat();
    } catch (e) {
      _leavingGroup = null;
      console.error('[VChat] leaveGroup failed:', e);
      VApp.showToast('Failed to leave group', 'error');
    }
  }
  async function _acceptGroupInvite(invite) {
    try {
      const batch = _db.batch();
      batch.update(_gref(invite.groupId), {
        members: firebase.firestore.FieldValue.arrayUnion(_uid),
        pendingInvites: firebase.firestore.FieldValue.arrayRemove(_uid),
      });
      batch.update(_uref(_uid), {
        groups: firebase.firestore.FieldValue.arrayUnion(invite.groupId),
        groupInvites: firebase.firestore.FieldValue.arrayRemove(invite),
        [`groupChats.${invite.groupId}`]: { lastMsg: '', lastMsgTime: Date.now(), unread: 0 },
      });
      await batch.commit();
      if (!_groups.includes(invite.groupId)) _groups = [..._groups, invite.groupId];
      await _fetchGroupMeta(invite.groupId, true);
      await _announceGroup(invite.groupId, 'joined the group');
      VApp.showToast(`Joined ${invite.groupName || 'the group'}`);
      if (_chatOpen && !_inChatView && !_inGroupView && _activeMainTab === 'groups') _renderGroupsSection();
      _updateMainTabDots();
      _updateNavDots();
      _renderNotifPanel();
    } catch (e) {
      console.error('[VChat] acceptGroupInvite failed:', e);
      VApp.showToast('Could not join. Please try again', 'error');
    }
  }
  async function _declineGroupInvite(invite) {
    try {
      const batch = _db.batch();
      batch.update(_uref(_uid), { groupInvites: firebase.firestore.FieldValue.arrayRemove(invite) });
      batch.update(_gref(invite.groupId), { pendingInvites: firebase.firestore.FieldValue.arrayRemove(_uid) });
      await batch.commit();
      _renderNotifPanel();
      _updateNavDots();
    } catch (e) {
      console.error('[VChat] declineGroupInvite failed:', e);
      VApp.showToast('Could not decline. Please try again', 'error');
    }
  }
  async function _createGroup(name) {
    try {
      const ref = _db.collection('groups').doc();
      await ref.set({
        name,
        ownerId: _uid,
        members: [_uid],
        pendingInvites: [],
        settings: { invitePolicy: 'everyone' },
        createdAt: Date.now(),
      });
      await _uref(_uid).update({
        groups: firebase.firestore.FieldValue.arrayUnion(ref.id),
        [`groupChats.${ref.id}`]: { lastMsg: '', lastMsgTime: Date.now(), unread: 0 },
      });
      _groups = [..._groups, ref.id];
      _groupCache[ref.id] = { name, ownerId: _uid, members: [_uid], pendingInvites: [], settings: { invitePolicy: 'everyone' } };
      VApp.showToast('Group created!');
      _openGroupChat(ref.id);
    } catch (e) {
      console.error('[VChat] createGroup failed:', e);
      VApp.showToast('Failed to create group', 'error');
    }
  }
  async function _sendGroupMsg(text, imgData, gifUrl) {
    if (!_activeGroupId) return;
    const filtered = text ? _filter(text.trim()) : '';
    if (!filtered && !imgData && !gifUrl) return;
    const now = Date.now();
    const remaining = CHAT_COOLDOWN_MS - (now - (_lastSendAt[_activeGroupId] || 0));
    if (remaining > 0) {
      VApp.showToast(`Slow down. Wait ${Math.ceil(remaining / 1000)}s`, 'error');
      return;
    }
    _lastSendAt[_activeGroupId] = now;
    _disableSendBriefly();
    const ytId = _extractYT(filtered);
    const data = {
      senderId: _uid, senderName: _myName,
      timestamp: now,
      serverTime: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (filtered) data.text = filtered;
    if (imgData) data.imageData = imgData;
    if (gifUrl) data.gifUrl = gifUrl;
    if (ytId) data.youtubeId = ytId;
    if (_groupReplyTo) data.replyTo = { ..._groupReplyTo };
    try {
      await _gmref(_activeGroupId).add(data);
      const lastMsg = imgData ? 'Image' : gifUrl ? 'GIF'
        : (filtered.length > 60 ? filtered.slice(0, 60) + '…' : filtered);
      const group = await _fetchGroupMeta(_activeGroupId);
      const members = (group?.members || []).filter(m => m !== _uid);
      const last = { lastMsg, lastSender: _myName, lastSenderId: _uid, lastMsgTime: now };
      const batch = _db.batch();
      batch.update(_uref(_uid), { [`groupChats.${_activeGroupId}`]: { ...last, unread: 0 } });
      members.forEach(m => {
        batch.update(_uref(m), {
          [`groupChats.${_activeGroupId}`]: { ...last, unread: firebase.firestore.FieldValue.increment(1) },
        });
      });
      await batch.commit();
      _groupReplyTo = null;
      _updateGroupReplyBar();
      _sfxSend();
    } catch (e) { console.error('[VChat] sendGroupMsg failed:', e); VApp.showToast('Failed to send', 'error'); }
  }
  async function _deleteGroupMsg(id, ts) {
    if (Date.now() - ts > DELETE_WIN) { VApp.showToast('Too late to delete', 'error'); return; }
    try {
      await _gmref(_activeGroupId).doc(id).update({
        deleted: true,
        text: firebase.firestore.FieldValue.delete(),
        imageData: firebase.firestore.FieldValue.delete(),
        gifUrl: firebase.firestore.FieldValue.delete(),
        youtubeId: firebase.firestore.FieldValue.delete(),
      });
    } catch (e) { console.error('[VChat] deleteGroupMsg failed:', e); }
  }
  function _subscribeGroupMsgs() {
    if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }
    const q = _gmref(_activeGroupId).orderBy('serverTime', 'desc').limit(MSG_PAGE);
    let firstSnap = true;
    const groupId = _activeGroupId;
    _chatUnsub = q.onSnapshot(snap => {
      const isFirst = firstSnap; firstSnap = false;
      snap.docChanges().forEach(ch => {
        if (ch.type === 'added' && !isFirst) {
          const msg = ch.doc.data();
          if (msg.senderId !== _uid) {
            _sfxReceive();
            if (!_chatOpen || document.hidden) {
              const preview = msg.system ? `${msg.senderName || 'Someone'} ${msg.text || ''}`
                : msg.text ? msg.text.slice(0, 55) + (msg.text.length > 55 ? '…' : '')
                  : msg.imageData ? 'Image' : msg.gifUrl ? 'GIF' : '…';
              const groupName = _groupCache[groupId]?.name || 'Group';
              _showToast({
                type: 'msg',
                name: msg.system ? groupName : `${msg.senderName || 'Someone'} · ${groupName}`,
                sub: preview,
                onMain: () => { _openChatModal(); _openGroupChat(groupId); },
                duration: 6000,
              });
            }
          }
        }
      });
      _groupMessages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      _lastGroupMsgCursor = snap.docs[snap.docs.length - 1] || null;
      _renderGroupMessages();
    }, e => console.error('[VChat] group messages snapshot error:', e));
  }
  async function _loadOlderGroup() {
    if (!_lastGroupMsgCursor || !_activeGroupId) return;
    const snap = await _gmref(_activeGroupId).orderBy('serverTime', 'desc').startAfter(_lastGroupMsgCursor).limit(MSG_PAGE).get().catch(() => null);
    if (!snap || snap.empty) { const b = document.getElementById('vc-load-older'); if (b) b.style.display = 'none'; return; }
    const older = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    _groupMessages = [...older, ..._groupMessages];
    _lastGroupMsgCursor = snap.docs[snap.docs.length - 1];
    _renderGroupMessages(true);
  }
  function _renderGroupMessages(keepScroll) {
    const el = document.getElementById('vc-messages');
    if (!el) return;
    const wasBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    const prevH = el.scrollHeight, prevTop = el.scrollTop;
    el.innerHTML = _groupMessages.map((msg, i) => {
      if (msg.system) return `<div class="vc-msg-system">${_e(msg.senderName || 'Someone')} ${_e(msg.text || '')}</div>`;
      if (msg.deleted) return `<div class="vc-msg-row vc-msg-${msg.senderId === _uid ? 'self' : 'other'}"><div class="vc-bubble vc-deleted">Message deleted</div></div>`;
      const self = msg.senderId === _uid;
      const canDel = self && (Date.now() - (msg.timestamp || 0) < DELETE_WIN);
      const ytId = msg.youtubeId;
      const url = !ytId ? _extractURL(msg.text || '') : null;
      const senderLabel = !self ? `<div class="vc-msg-sender">${_e(msg.senderName || 'Unknown')}</div>` : '';
      return `<div class="vc-msg-row vc-msg-${self ? 'self' : 'other'}" data-msg-id="${_e(msg.id)}">
      ${msg.replyTo ? `<div class="vc-reply-ref" data-target="${_e(msg.replyTo.id)}">
        ${IC_REPLY} <b>${_e(msg.replyTo.senderName)}</b>: ${_e((msg.replyTo.text || '[media]').slice(0, 50))}
      </div>` : ''}
      ${senderLabel}
      <div class="vc-bubble${self ? ' vc-self' : ' vc-other'}">
        ${msg.imageData ? `<img class="vc-msg-img" src="${msg.imageData}" alt="image" loading="lazy">` : ''}
        ${msg.gifUrl ? `<img class="vc-msg-img vc-msg-gif" src="${_e(msg.gifUrl)}" alt="gif" loading="lazy">` : ''}
        ${msg.text ? `<div class="vc-msg-text">${_linkify(msg.text)}</div>` : ''}
        ${ytId ? _ytEmbed(ytId) : (url && msg.text ? _linkCard(url) : '')}
        <div class="vc-msg-time">${_fmtTime(msg.timestamp)}</div>
      </div>
      <div class="vc-msg-actions">
        <button class="vc-action-btn vc-reply-btn" data-idx="${i}" title="Reply">${IC_REPLY}</button>
        ${canDel ? `<button class="vc-action-btn vc-del-btn" data-id="${_e(msg.id)}" data-ts="${msg.timestamp}" title="Delete">${IC_TRASH}</button>` : ''}
      </div>
    </div>`;
    }).join('');
    el.querySelectorAll('.vc-msg-img').forEach(img => {
      img.onclick = () => _openLightbox(img.src);
    });
    el.querySelectorAll('.vc-reply-btn').forEach(b => {
      b.onclick = () => {
        const msg = _groupMessages[parseInt(b.dataset.idx)];
        if (!msg) return;
        _groupReplyTo = { id: msg.id, text: msg.text || '[media]', senderName: msg.senderName || '' };
        _updateGroupReplyBar();
        document.getElementById('vc-input')?.focus();
      };
    });
    el.querySelectorAll('.vc-del-btn').forEach(b => b.onclick = () => _deleteGroupMsg(b.dataset.id, Number(b.dataset.ts)));
    el.querySelectorAll('.vc-reply-ref').forEach(ref => {
      ref.onclick = () => {
        const t = el.querySelector(`[data-msg-id="${ref.dataset.target}"]`);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
    if (keepScroll) el.scrollTop = prevTop + (el.scrollHeight - prevH);
    else if (wasBottom) el.scrollTop = el.scrollHeight;
  }
  function _renderMainView() {
    const body = document.getElementById('vc-modal-body');
    if (!body) return;
    body.innerHTML = `
    <div class="vc-list-header">
      <div class="vc-main-tabs" id="vc-main-tabs">
        <button class="vc-main-tab" data-tab="friends" type="button">Friends<span class="vc-tab-dot" id="vc-tab-dot-friends"></span></button>
        <button class="vc-main-tab" data-tab="groups" type="button">Groups<span class="vc-tab-dot" id="vc-tab-dot-groups"></span></button>
      </div>
      <div class="vc-search-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="vc-search" id="vc-search" type="text" placeholder="Search friends…" value="${_e(_searchQ)}" autocapitalize="none" spellcheck="false">
      </div>
    </div>
    <div class="vc-friends-list" id="vc-friends-list"></div>
    <div class="vc-add-bar" id="vc-add-bar-friends">
      <input class="vc-add-input" id="vc-add-input" type="text" placeholder="Add friend by username…" autocapitalize="none" spellcheck="false" maxlength="20">
      <button class="vc-add-btn" id="vc-add-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Add
      </button>
    </div>
    <div class="vc-add-bar" id="vc-add-bar-groups" style="display:none">
      <input class="vc-add-input" id="vc-new-group-input" type="text" placeholder="New group name…" maxlength="40">
      <button class="vc-add-btn" id="vc-new-group-btn">${IC_USERS} Create</button>
    </div>`;
    _renderMainTabs();
    _renderActiveMainList();
    _updateOnlineBadge();
    const search = document.getElementById('vc-search');
    search.oninput = () => { _searchQ = search.value; _renderActiveMainList(); _updateOnlineBadge(); };
    search.onkeydown = e => { if (e.key === 'Escape') { _searchQ = ''; search.value = ''; _renderActiveMainList(); } };
    const addIn = document.getElementById('vc-add-input');
    const addBtn = document.getElementById('vc-add-btn');
    addBtn.onclick = () => { const u = addIn.value.trim(); if (u) { _sendRequest(u); addIn.value = ''; } };
    addIn.onkeydown = e => { if (e.key === 'Enter') addBtn.click(); };
    const groupIn = document.getElementById('vc-new-group-input');
    const groupBtn = document.getElementById('vc-new-group-btn');
    groupBtn.onclick = () => {
      const name = groupIn.value.trim();
      if (!name) { VApp.showToast('Enter a group name', 'error'); return; }
      groupIn.value = '';
      _createGroup(name);
    };
    groupIn.onkeydown = e => { if (e.key === 'Enter') groupBtn.click(); };
    document.querySelectorAll('.vc-main-tab').forEach(btn => {
      btn.onclick = () => _switchMainTab(btn.dataset.tab);
    });
  }
  function _switchMainTab(tab) {
    _activeMainTab = tab;
    _searchQ = '';
    const search = document.getElementById('vc-search');
    if (search) search.value = '';
    _renderMainTabs();
    _renderActiveMainList();
    _updateOnlineBadge();
  }
  function _renderMainTabs() {
    document.querySelectorAll('.vc-main-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeMainTab));
    const barF = document.getElementById('vc-add-bar-friends');
    const barG = document.getElementById('vc-add-bar-groups');
    if (barF) barF.style.display = _activeMainTab === 'friends' ? '' : 'none';
    if (barG) barG.style.display = _activeMainTab === 'groups' ? '' : 'none';
    const search = document.getElementById('vc-search');
    if (search) search.placeholder = _activeMainTab === 'friends' ? 'Search friends…' : 'Search groups…';
    _updateMainTabDots();
  }
  function _updateMainTabDots() {
    const fDot = document.getElementById('vc-tab-dot-friends');
    const gDot = document.getElementById('vc-tab-dot-groups');
    const friendsPending = _totalDMUnread() + (_requests.incoming || []).length;
    const groupsPending = _totalGroupUnread() + _groupInvites.length;
    if (fDot) fDot.style.display = friendsPending > 0 ? '' : 'none';
    if (gDot) gDot.style.display = groupsPending > 0 ? '' : 'none';
  }
  function _renderActiveMainList() {
    if (_activeMainTab === 'groups') _renderGroupsSection();
    else _renderFriendsList();
  }
  function _renderGroupsSection() {
    const el = document.getElementById('vc-friends-list');
    if (!el) return;
    const q = _searchQ.toLowerCase().trim();
    const filtered = _groups.filter(id => !q || (_groupCache[id]?.name || '').toLowerCase().includes(q));
    const sorted = [...filtered].sort((a, b) => (_groupChats[b]?.lastMsgTime || 0) - (_groupChats[a]?.lastMsgTime || 0));
    let html = `<div class="vc-section-label">${_groups.length} group${_groups.length !== 1 ? 's' : ''}</div>`;
    if (!sorted.length) {
      html += `<div class="vc-empty">${_groups.length ? 'No groups match your search' : 'No groups yet. Create one below!'}</div>`;
    } else {
      html += sorted.map(id => _groupCardHTML(id)).join('');
    }
    el.innerHTML = html;
    el.querySelectorAll('.vc-group-card').forEach(card => {
      card.addEventListener('click', () => _openGroupChat(card.dataset.id));
    });
  }
  function _groupCardHTML(id) {
    const meta = _groupCache[id] || {};
    const name = meta.name || 'Loading…';
    const unread = _groupChats[id]?.unread || 0;
    const memberCount = (meta.members || []).length;
    const sub = _lastPreview(_groupChats[id]) || `${memberCount || 1} member${memberCount === 1 ? '' : 's'}`;
    return `<div class="vc-friend-card vc-group-card" data-id="${_e(id)}">
      <div class="vc-avatar vc-group-avatar">${IC_USERS}</div>
      <div class="vc-friend-info">
        <div class="vc-friend-name">${_e(name)}${unread > 0 ? `<span class="vc-unread">${unread}</span>` : ''}</div>
        <div class="vc-friend-sub">${_e(sub)}</div>
      </div>
    </div>`;
  }
  function _updateOnlineBadge() {
    const el = document.getElementById('vc-online-badge');
    if (!el) return;
    if (_inChatView || _inGroupView || _activeMainTab !== 'friends') { el.textContent = ''; el.style.display = 'none'; return; }
    const n = _onlineCount();
    el.textContent = n > 0 ? `${n} online` : '';
    el.style.display = n > 0 ? '' : 'none';
  }
  function _renderNotifPanel() {
    const panel = document.getElementById('vc-notif-panel');
    if (!panel) return;
    const reqs = _requests.incoming || [];
    const invites = _groupInvites || [];
    const unreadChats = Object.entries(_chats)
      .filter(([, c]) => (c.unread || 0) > 0)
      .sort(([, a], [, b]) => (b.lastMsgTime || 0) - (a.lastMsgTime || 0));
    const unreadGroups = Object.entries(_groupChats)
      .filter(([, c]) => (c.unread || 0) > 0)
      .sort(([, a], [, b]) => (b.lastMsgTime || 0) - (a.lastMsgTime || 0));
    const totalItems = reqs.length + invites.length + unreadChats.length + unreadGroups.length;
    let html = `<div class="vc-notif-header">
    <span class="vc-notif-title">Notifications</span>
    ${totalItems > 0 ? `<button class="vc-notif-clear" id="vc-notif-clear-all">Mark all read</button>` : ''}
  </div>
  <div class="vc-notif-list">`;
    if (totalItems === 0) {
      html += `<div class="vc-notif-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.3"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <div>You're all caught up!</div>
    </div>`;
    } else {
      reqs.forEach(req => {
        const n = _reqName(req);
        html += `<div class="vc-notif-item vc-notif-req" data-uid="${_e(req.uid)}" data-name="${_e(n)}">
        <div class="vc-notif-icon vc-notif-icon-req">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </div>
        <div class="vc-notif-body">
          <div class="vc-notif-text"><b>${_e(n)}</b> sent you a friend request</div>
          <div class="vc-notif-actions">
            <button class="vc-notif-accept" data-uid="${_e(req.uid)}" data-name="${_e(n)}">${IC_CHECK} Accept</button>
            <button class="vc-notif-decline" data-uid="${_e(req.uid)}">${IC_X} Decline</button>
          </div>
        </div>
      </div>`;
      });
      invites.forEach((invite, i) => {
        html += `<div class="vc-notif-item vc-notif-ginvite" data-idx="${i}">
        <div class="vc-notif-icon vc-notif-icon-req">${IC_USERS}</div>
        <div class="vc-notif-body">
          <div class="vc-notif-text"><b>${_e(invite.invitedByName || 'Someone')}</b> invited you to <b>${_e(invite.groupName || 'a group')}</b></div>
          <div class="vc-notif-actions">
            <button class="vc-notif-accept" data-idx="${i}">${IC_CHECK} Accept</button>
            <button class="vc-notif-decline" data-idx="${i}">${IC_X} Decline</button>
          </div>
        </div>
      </div>`;
      });
      unreadChats.forEach(([chatId, meta]) => {
        const partnerId = meta.partnerId;
        const cachedPartnerName = _friendCache[partnerId]?.displayName;
        const partnerName = (cachedPartnerName && cachedPartnerName !== partnerId) ? cachedPartnerName : _nameOf(partnerId);
        const preview = meta.lastMsg || 'New message';
        html += `<div class="vc-notif-item vc-notif-msg" data-chat-id="${_e(chatId)}" data-partner-id="${_e(partnerId)}">
        <div class="vc-notif-icon vc-notif-icon-msg">
          ${IC_MSG}
        </div>
        <div class="vc-notif-body">
          <div class="vc-notif-text"><b>${_e(partnerName)}</b>: ${_e(preview.length > 50 ? preview.slice(0, 50) + '…' : preview)}</div>
          <div class="vc-notif-meta">
            <span class="vc-unread-pill">${meta.unread} unread</span>
            <span style="font-size:.7rem;color:var(--text-secondary)">${_fmtTime(meta.lastMsgTime)}</span>
          </div>
        </div>
      </div>`;
      });
      unreadGroups.forEach(([groupId, meta]) => {
        const groupName = _groupCache[groupId]?.name || 'Group';
        const preview = _lastPreview(meta) || 'New message';
        html += `<div class="vc-notif-item vc-notif-gmsg" data-group-id="${_e(groupId)}">
        <div class="vc-notif-icon vc-notif-icon-msg">
          ${IC_MSG}
        </div>
        <div class="vc-notif-body">
          <div class="vc-notif-text"><b>${_e(groupName)}</b>: ${_e(preview.length > 50 ? preview.slice(0, 50) + '…' : preview)}</div>
          <div class="vc-notif-meta">
            <span class="vc-unread-pill">${meta.unread} unread</span>
            <span style="font-size:.7rem;color:var(--text-secondary)">${_fmtTime(meta.lastMsgTime)}</span>
          </div>
        </div>
      </div>`;
      });
    }
    html += `</div>`;
    panel.innerHTML = html;
    panel.querySelectorAll('.vc-notif-accept').forEach(b =>
      b.onclick = e => {
        e.stopPropagation();
        if (b.dataset.uid) _acceptReq(b.dataset.uid, b.dataset.name);
        else _acceptGroupInvite(invites[parseInt(b.dataset.idx)]);
      }
    );
    panel.querySelectorAll('.vc-notif-decline').forEach(b =>
      b.onclick = e => {
        e.stopPropagation();
        if (b.dataset.uid) _declineReq(b.dataset.uid);
        else _declineGroupInvite(invites[parseInt(b.dataset.idx)]);
      }
    );
    panel.querySelectorAll('.vc-notif-msg').forEach(item => {
      item.onclick = () => {
        _closeNotifPanel();
        _openChatModal(item.dataset.partnerId);
      };
    });
    panel.querySelectorAll('.vc-notif-gmsg').forEach(item => {
      item.onclick = () => {
        _closeNotifPanel();
        _openChatModal();
        _openGroupChat(item.dataset.groupId);
      };
    });
    const clearAll = document.getElementById('vc-notif-clear-all');
    if (clearAll) clearAll.onclick = _markAllRead;
  }
  async function _markAllRead() {
    try {
      const update = {};
      Object.keys(_chats).forEach(chatId => {
        if ((_chats[chatId]?.unread || 0) > 0) update[`chats.${chatId}.unread`] = 0;
      });
      Object.keys(_groupChats).forEach(groupId => {
        if ((_groupChats[groupId]?.unread || 0) > 0) update[`groupChats.${groupId}.unread`] = 0;
      });
      if (Object.keys(update).length) await _uref(_uid).update(update);
    } catch (e) { console.error('[VChat] markAllRead failed:', e); }
  }
  function _updateNavDots() {
    const unread = _totalUnread();
    const reqs = _reqCount();
    const unreadDot = document.getElementById('nav-chat-unread-dot');
    const reqDot = document.getElementById('nav-chat-request-dot');
    const notifBadge = document.getElementById('nav-notif-badge');
    if (unreadDot) unreadDot.style.display = unread > 0 ? '' : 'none';
    if (reqDot) reqDot.style.display = reqs > 0 ? '' : 'none';
    const total = unread + reqs;
    if (notifBadge) {
      notifBadge.textContent = total > 99 ? '99+' : String(total);
      notifBadge.style.display = total > 0 ? '' : 'none';
    }
  }
  function _isMobileLayout() {
    return window.matchMedia('(max-width: 520px)').matches;
  }
  function _sidebarWidthPx() {
    if (!document.body.classList.contains('nav-sidebar-mode')) return 0;
    const collapsed = document.body.classList.contains('nav-sidebar-collapsed');
    const v = parseFloat(getComputedStyle(document.body).getPropertyValue(collapsed ? '--sidebar-w-collapsed' : '--sidebar-w'));
    return Number.isFinite(v) && v > 0 ? v : (collapsed ? 68 : 216);
  }
  function _defaultPanelPos(width, height) {
    const margin = 12;
    const sidebarW = _sidebarWidthPx();
    if (sidebarW > 0) {
      return {
        left: Math.min(sidebarW + margin, Math.max(margin, window.innerWidth - width - margin)),
        top: Math.max(margin, window.innerHeight - height - margin),
      };
    }
    return {
      left: Math.max(margin, window.innerWidth - width - margin),
      top: 54,
    };
  }
  function _positionPanel(panelEl, fallbackW, fallbackH) {
    if (_isMobileLayout()) return;
    const pos = _defaultPanelPos(panelEl.offsetWidth || fallbackW, panelEl.offsetHeight || fallbackH);
    panelEl.style.left = `${pos.left}px`;
    panelEl.style.top = `${pos.top}px`;
  }
  function _makeDraggable(panelEl, handleSelector) {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    function move(e) {
      if (!dragging) return;
      const margin = 4;
      const w = panelEl.offsetWidth, h = panelEl.offsetHeight;
      let left = ox + (e.clientX - sx);
      let top = oy + (e.clientY - sy);
      left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
      top = Math.max(margin, Math.min(top, window.innerHeight - h - margin));
      panelEl.style.left = `${left}px`;
      panelEl.style.top = `${top}px`;
    }
    function up() {
      dragging = false;
      panelEl.classList.remove('vc-dragging');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    }
    panelEl.addEventListener('pointerdown', e => {
      if (_isMobileLayout()) return;
      if (!e.target.closest(handleSelector) || e.target.closest('button')) return;
      dragging = true;
      const rect = panelEl.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = rect.left; oy = rect.top;
      panelEl.classList.add('vc-dragging');
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }
  function _openChatModal(jumpToUid) {
    _chatOpen = true;
    _closeNotifPanel();
    let overlay = document.getElementById('vc-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'vc-overlay';
      overlay.className = 'vc-overlay';
      overlay.innerHTML = `<div class="vc-modal" id="vc-modal" role="dialog" aria-modal="true" aria-label="Friends &amp; Chat">
      <div class="vc-modal-header">
        <div class="vc-modal-title-wrap">
          <span class="vc-modal-title">Friends &amp; Chat</span>
          <span class="vc-online-badge" id="vc-online-badge" style="display:none"></span>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <button class="vc-close-btn" id="vc-close" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="vc-modal-body" id="vc-modal-body"></div>
    </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) _closeChatModal(); });
      document.getElementById('vc-close').onclick = _closeChatModal;
      _makeDraggable(document.getElementById('vc-modal'), '.vc-modal-header');
    }
    _positionPanel(document.getElementById('vc-modal'), 360, 560);
    overlay.classList.add('open');
    if (jumpToUid) {
      _renderMainView();
      _openChat(jumpToUid);
    } else if (!_inChatView && !_inGroupView) {
      _renderMainView();
    }
    _fetchFriends(true).then(() => {
      if (!_inChatView && !_inGroupView) { _renderActiveMainList(); _updateOnlineBadge(); }
    });
    _fetchGroupsMeta().then(() => {
      if (!_inChatView && !_inGroupView) _renderActiveMainList();
    });
  }
  function _closeChatModal() {
    _chatOpen = false;
    if (_inChatView) _leaveChat();
    else if (_inGroupView) _leaveGroupChat();
    const overlay = document.getElementById('vc-overlay');
    if (overlay) overlay.classList.remove('open');
    _searchQ = '';
  }
  function _openNotifPanel() {
    _notifOpen = true;
    _closeChatModal();
    let panel = document.getElementById('vc-notif-overlay');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'vc-notif-overlay';
      panel.className = 'vc-notif-overlay';
      panel.innerHTML = `<div class="vc-notif-panel" id="vc-notif-panel"></div>`;
      document.body.appendChild(panel);
      panel.addEventListener('click', e => { if (e.target === panel) _closeNotifPanel(); });
      _makeDraggable(document.getElementById('vc-notif-panel'), '.vc-notif-header');
    }
    panel.classList.add('open');
    _renderNotifPanel();
    _positionPanel(document.getElementById('vc-notif-panel'), 310, 420);
  }
  function _closeNotifPanel() {
    _notifOpen = false;
    const panel = document.getElementById('vc-notif-overlay');
    if (panel) panel.classList.remove('open');
  }
  function _subscribeSelf() {
    if (_selfUnsub) _selfUnsub();
    _selfUnsub = _uref(_uid).onSnapshot(snap => {
      if (!snap.exists) return;
      const data = snap.data();
      _friends = data.friends || [];
      _requests = data.friendRequests || { incoming: [], outgoing: [] };
      _chats = data.chats || {};
      _groups = data.groups || [];
      const prevGroupChats = _groupChats;
      _groupChats = data.groupChats || {};
      _groupInvites = data.groupInvites || [];
      if (_inGroupView && _activeGroupId && !_groups.includes(_activeGroupId) && _leavingGroup !== _activeGroupId) {
        const gid = _activeGroupId, gname = _groupCache[gid]?.name || 'the group';
        delete _groupCache[gid];
        VApp.showToast(`You were removed from ${gname}`, 'error');
        _leaveGroupChat();
      }
      if (_prevReqCount >= 0) _notifyGroupEvents(prevGroupChats);
      const reqCount = (_requests.incoming || []).length;
      if (_prevReqCount >= 0 && reqCount > _prevReqCount) {
        _sfxRequest();
        const newReqs = (_requests.incoming || []).slice(_prevReqCount);
        newReqs.forEach(req => {
          const reqUid = req.uid, reqName = _reqName(req);
          _showToast({
            type: 'req',
            name: reqName,
            sub: 'Sent you a friend request',
            onMain: () => _openNotifPanel(),
            onAccept: () => _acceptReq(reqUid, reqName),
            onDecline: () => _declineReq(reqUid),
            duration: 9000,
          });
        });
      }
      _prevReqCount = reqCount;
      const inviteCount = _groupInvites.length;
      if (_prevGroupInviteCount >= 0 && inviteCount > _prevGroupInviteCount) {
        _sfxRequest();
        const newInvites = _groupInvites.slice(_prevGroupInviteCount);
        newInvites.forEach(invite => {
          _showToast({
            type: 'req',
            name: invite.invitedByName || 'Someone',
            sub: `Invited you to ${invite.groupName || 'a group'}`,
            onMain: () => _openNotifPanel(),
            onAccept: () => _acceptGroupInvite(invite),
            onDecline: () => _declineGroupInvite(invite),
            duration: 9000,
          });
        });
      }
      _prevGroupInviteCount = inviteCount;
      _fetchGroupsMeta().then(() => {
        if (_chatOpen && !_inChatView && !_inGroupView) _renderActiveMainList();
      });
      _updateNavDots();
      if (document.getElementById('vc-members-list')) _paintMembers();
      if (_chatOpen && !_inChatView && !_inGroupView) { _renderMainTabs(); _renderActiveMainList(); _updateOnlineBadge(); }
      if (_notifOpen) _renderNotifPanel();
    }, e => console.error('[VChat] self snapshot error:', e));
  }
  async function checkUsernameAvailable(username) {
    if (!_db || !username || username.length < 3) return null;
    try {
      const snap = await _db.collection('users').where('displayName', '==', username).limit(1).get();
      return snap.empty;
    } catch { return null; }
  }
  function _init(db, uid, displayName) {
    _db = db; _uid = uid; _myName = displayName;
    _audioLevels = VStorage.get('vispora_audio_levels', { message: 0.3, receive: 0.4, request: 0.5 });
    _notifOff = VStorage.get('vispora_notif_disabled', {});
    _startStatus();
    _subscribeSelf();
  }
  function _autoInit() {
    if (window.VFirebase) {
      VFirebase.auth.onAuthStateChanged(async user => {
        if (user) {
          let name = user.displayName || VStorage.getUserProfile().displayName;
          if (!name) {
            try {
              const snap = await VFirebase.db.collection('users').doc(user.uid).get();
              const dn = snap.exists ? snap.data().displayName : null;
              if (dn) name = dn;
            } catch { }
          }
          name = name || user.email?.replace(DOMAIN, '') || 'Player';
          _init(VFirebase.db, user.uid, name);
        }
      });
    } else {
      setTimeout(_autoInit, 100);
    }
  }
  function _repositionOpenPanels() {
    if (_chatOpen) _positionPanel(document.getElementById('vc-modal'), 360, 560);
    if (_notifOpen) _positionPanel(document.getElementById('vc-notif-panel'), 310, 420);
  }
  document.addEventListener('vispora:sidebar-toggled', _repositionOpenPanels);
  window.addEventListener('resize', _repositionOpenPanels);
  function initNavBtn() {
    const chatBtn = document.getElementById('nav-chat-btn');
    const notifBtn = document.getElementById('nav-notif-btn');
    if (chatBtn) chatBtn.onclick = () => _chatOpen ? _closeChatModal() : _openChatModal();
    if (notifBtn) notifBtn.onclick = () => _notifOpen ? _closeNotifPanel() : _openNotifPanel();
    _updateNavDots();
  }
  window.VChat = {
    init: _init,
    autoInit: _autoInit,
    initNavBtn,
    openModal: _openChatModal,
    closeModal: _closeChatModal,
    openNotif: _openNotifPanel,
    closeNotif: _closeNotifPanel,
    checkUsernameAvailable,
    refreshActivity: () => _writeStatus(document.hidden ? 'away' : 'online'),
    setAudioLevels: v => { _audioLevels = { ..._audioLevels, ...v }; VStorage.set('vispora_audio_levels', _audioLevels); },
    getAudioLevels: () => _audioLevels,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _autoInit);
  else _autoInit();
})();