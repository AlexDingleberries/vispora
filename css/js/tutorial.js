(function () {
  'use strict';
  const NEXT_KEY = 'vispora_tour_next';
  let state = null;

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function resolve(t) {
    if (!t) return [];
    const list = typeof t === 'function' ? t() : t;
    return [].concat(list).map(x => (typeof x === 'string' ? document.querySelector(x) : x)).filter(visible);
  }
  function available(step) {
    if (step.when && !step.when()) return false;
    if (step.keep) return true;
    return step.targets === undefined || resolve(step.targets).length > 0;
  }
  function overlayOpen() {
    return [].some.call(
      document.querySelectorAll('.modal-overlay, .nf-info-overlay, .vc-overlay.open, #welcome-screen'),
      visible
    );
  }
  function isDone(name) {
    return window.VStorage && VStorage.isTourDone ? VStorage.isTourDone(name) : false;
  }
  function markDone(name) {
    if (window.VStorage && VStorage.setTourDone) VStorage.setTourDone(name);
  }

  function openServers() {
    const menu = document.getElementById('server-dropdown-menu');
    const btn = document.getElementById('server-dropdown-btn');
    if (menu && btn && !menu.classList.contains('open')) btn.click();
  }
  function closeServers() {
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
  const nav = href => `.nav-links a[href="${href}"]`;
  const row = id => () => document.getElementById(id).closest('.settings-row');
  const sec = id => `#sec-${id} .settings-section`;

  function mediaSteps() {
    return [
      { title: 'Welcome to vispora', text: 'A quick tour of the player, what each button does, how to save things and which settings matter. It takes about a minute, and you can skip any time.' },
      { targets: '#iframe-wrap', title: 'The player', text: 'Your movie, show or anime plays here. If it stays black, keeps buffering or shows the wrong thing, switch server.' },
      { targets: '#iframe-wrap', title: 'Watch out for popups', text: 'The players come from outside sites that vispora does not control, and some of them open ad popups or new tabs. Be ready to press <b>Ctrl + W</b> (<b>Cmd + W</b> on Mac) right away to close anything that opens.' },
      { targets: ['#server-dropdown-btn', '#server-dropdown-menu'], onEnter: openServers, onLeave: closeServers, title: 'Switching servers', text: 'Open the <b>server menu</b> and pick another one (Alpha, Bravo…). The player reloads on the same episode and your choice is remembered. If every server fails, refresh the list in Settings.' },
      { targets: '#btn-theater', title: 'Theater mode', text: 'Widens the player for a bigger picture. Click it again to go back.' },
      { targets: '#episode-picker', title: 'Episodes', text: 'Pick a season and episode here. Your spot is saved so you resume where you left off.' },
      { targets: '#subdub-picker', title: 'Sub or dub', text: 'Switch anime audio between subtitled and dubbed.' },
      { targets: '.media-hero-actions', title: 'What the buttons mean', text: '<b>Play</b> jumps back up to the player. The <b>bookmark</b> saves it to My List. The <b>circle arrow</b> reloads the player. The <b>server menu</b> changes source. <b>Return</b> goes back to browsing.' },
      { targets: '#btn-fav', title: 'Saving media', text: 'Click the bookmark to add this to <b>My List</b>. On browse pages, hover any poster and click its bookmark, or the ⓘ for details.' },
      { targets: '#recs-section', title: 'Recommended', text: 'Similar titles you might like. Click any poster to open it, or use the bookmark to save it.' },
      { targets: '#related-section', title: 'Related', text: 'Prequels, sequels and spin-offs from the same series show up here so you can jump straight to them.' },
      { targets: nav('my-list.html'), title: 'Saving games', text: 'Games save the same way: the bookmark in the game bar, or the bookmark on any game card. Everything you save, plus your history, lives in <b>My List</b>.' },
      {
        targets: nav('settings.html'),
        title: 'Settings',
        text: 'Worth a visit: <b>refresh servers</b> when streams stop working, <b>pick or create a theme</b>, and set up cloaking, particles, chat and your AI key.',
      },
    ];
  }

  function browseSteps() {
    return [
      { title: 'Browsing movies, TV & anime', text: 'Movies, TV Shows and Anime all work the same way, so this one tour covers all three and you will only see it once. Skip any time.' },
      { targets: '#nf-hero', title: 'Featured', text: 'A rotating pick at the top. <b>Watch Now</b> opens the player and <b>More Details</b> shows a quick summary. Hover over it to pause the slideshow.' },
      { targets: '.nf-search-inner', title: 'Search', text: 'Search by title. Press <b>Ctrl/⌘ + K</b> to jump here from anywhere on the page.' },
      { targets: '#filter-btn', title: 'Filters', text: 'Switch the category or sort order, pick as many genres as you like and narrow by year. Press <b>Esc</b> or click Filters again to go back to browsing.' },
      { targets: '#browse-content .nf-row-section', title: 'Rows', text: 'Scroll each row sideways to see more. Rows like Trending, Popular and Top Rated fill in on their own.' },
      { targets: '#browse-content .nf-card', title: 'Posters', text: 'Click a poster to start watching. Use the <b>bookmark</b> to save it to My List and the ⓘ for details. Shows and anime remember the episode you left on.' },
      { targets: nav('my-list.html'), title: 'My List', text: 'Everything you save, plus your watch history, lives in <b>My List</b>.' },
    ];
  }

  function settingsSteps() {
    return [
      { title: 'Settings tour', text: 'These are the settings worth knowing about. Skip any time.' },
      { targets: sec('account'), title: 'Account', text: 'Change your display name or password, or sign out. Your settings sync to your account.' },
      { targets: () => document.getElementById('theme-grid-dark').closest('.settings-row'), title: 'Updating your theme', text: 'Click any theme to apply it instantly. Dark and light themes are grouped, and your pick syncs across devices.' },
      { targets: '#btn-make-theme', title: 'Creating a theme', text: '<b>Simple</b> builds a full theme from one color. <b>Advanced</b> lets you set every color. Your themes appear under <b>Custom</b>; hover one to delete it.' },
      { targets: row('navstyle-controls'), title: 'Layout & text', text: 'Switch between a top bar and a collapsible sidebar. Font size and typeface are right below.' },
      { targets: sec('particles'), title: 'Particles', text: 'Turn the animated background on or off, try presets like Snow or Network, and tune count, speed and color. Turn it off if things feel slow.' },
      { targets: sec('bgimage'), title: 'Background image', text: 'Use your own picture as the background, with opacity, blur and darken controls. It is stored on this device only.' },
      { targets: sec('chat'), title: 'Chat & friends', text: 'Profanity filter, link previews, whether friends can see your activity, and sound volumes.' },
      { targets: sec('privacy'), title: 'Privacy & cloaking', text: 'Disguise the tab as Google Drive or any site, set your <b>panic key</b>, and turn on leave-site prevention.' },
      { targets: row('btn-refresh-servers'), title: 'Refreshing servers', text: 'If streams stop working, hit <b>Refresh</b> to fetch the latest server links. You will get a notification when the links have changed.' },
      { targets: row('btn-export'), title: 'Your data', text: 'Export or import a backup, and clear history. <b>Reset Everything</b> wipes your data and signs you out.' },
      { targets: sec('ai'), title: 'AI chat key', text: 'Add your own free Groq API key here if the shared AI runs out of tokens.' },
      { targets: sec('launcher'), title: 'About:blank launcher', text: 'Open vispora, or any site, in an about:blank tab so the address bar stays blank.' },
      { title: 'All set', text: 'That covers it. You can replay this tour any time from the About section.' },
    ];
  }
 
  const aiSection = id => () => document.getElementById(id).closest('.ai-sidebar-section');
  const hasKey = () => !!(window.VStorage && VStorage.getGroqKey());

  function homeSteps() {
    return [
      { title: 'Welcome to vispora', text: 'Your hub for games, movies, TV, anime and AI chat. This quick tour covers the pages, friends, the panic button and settings. Skip any time.' },
      { targets: '.nav-links', title: 'The pages', text: '<b>Games</b>, <b>Movies</b>, <b>TV Shows</b> and <b>Anime</b> are for browsing and playing. <b>My List</b> holds what you saved plus your history. <b>AI Chat</b> answers questions, and <b>Settings</b> customizes everything.' },
      { targets: '.browse-grid', title: 'Quick shortcuts', text: 'These cards jump straight to each section.' },
      { targets: '#jump-section', title: 'Jump Back In', text: 'Anything you started playing or watching shows up here so you can resume in one click.' },
      { targets: '.featured-grid-2', title: 'Featured', text: 'A featured game and a rotating pick of a movie, show or anime. Use <b>Shuffle</b> below for more ideas.' },
      { keep: true, targets: '#vc-add-bar-friends', onEnter: () => window.VChat && VChat.openModal(), onLeave: () => window.VChat && VChat.closeModal(), title: 'Adding friends', text: 'Open <b>Chat</b>, type your friend\'s exact username in this box and press <b>Add</b>. They get a request to accept. Then click their name to message them, and click what they are playing to jump in. The <b>Groups</b> tab makes group chats.' },
      { targets: '#nav-notif-btn', title: 'Notifications', text: 'Friend requests, group invites and unread messages collect here.' },
      { targets: '#nav-panic', title: 'Panic button', text: 'Instantly cloaks or redirects the tab. <b>Alt</b> + your panic key does the same from the keyboard. Set the key and disguise in Settings → Privacy.' },
      { targets: '#nav-version-btn', title: 'Updates', text: 'Shows your version. A red dot means a newer version is available; click it to see what changed.' },
      { targets: nav('settings.html'), title: 'Settings', text: 'Refresh servers, pick or create a theme, set up cloaking and more.' },
    ];
  }

  function gamesSteps() {
    return [
      { targets: '#nf-hero', title: 'Featured games', text: 'A rotating pick of featured games. <b>Play Now</b> launches it and the bookmark saves it to My List.' },
      { targets: '.nf-search-inner', title: 'Search', text: 'Search by game name, genre or author. Press <b>Ctrl/⌘ + K</b> to jump here from anywhere on the page.' },
      { targets: '#filter-btn', title: 'Filters', text: 'Filter by type (Web, Ports, Flash, Emulator, FNF) and by genre. Web games live here and in search; the rows below feature ports, flash, emulators and FNF.' },
      { targets: '#browse-content .nf-row-section', title: 'Rows', text: 'Scroll each row sideways. Rows include Popular Now, your My List and Recently Played, and more.' },
      { targets: '#browse-content .nf-card', title: 'Game cards', text: 'Click to play. Hover for a preview, use the <b>bookmark</b> to save it to My List, and the ⓘ for details.' },
    ];
  }

  function playerSteps() {
    return [
      { targets: '#iframe-wrap', title: 'The game', text: 'Click the game once so it gets keyboard focus. Big games can take a moment to load; the loading screen goes away when it is ready.' },
      { targets: '.game-ctrl-stats', title: 'Playtime', text: 'Tracks this session and your total time in the game. It feeds your stats and Jump Back In.' },
      { targets: '.game-vol-wrap', title: 'Volume', text: 'Adjusts volume for games that support it.' },
      { targets: '#btn-popout', title: 'Pop out', text: 'Opens the game in its own about:blank tab.' },
      { targets: '#btn-fav', title: 'Saving games', text: 'Bookmark the game to save it to <b>My List</b>.' },
      { targets: '#btn-reload', title: 'Reload', text: 'Restarts the game if it freezes or glitches.' },
      { targets: '#btn-fs', title: 'Fullscreen', text: 'Fills the screen. Press <b>Esc</b> to exit.' },
      { targets: '#back-btn', title: 'Return', text: 'Saves your playtime and goes back to the games list.' },
    ];
  }

  function aiSteps() {
    return [
      { targets: '.ai-input-wrap', title: 'Chat box', text: 'Type a message and press <b>Enter</b> to send, or <b>Shift + Enter</b> for a new line.' },
      { targets: '#hint-container', title: 'Starter ideas', text: 'Click a chip to start with a ready-made question.' },
      { targets: aiSection('ai-model'), title: 'Model', text: 'Fast models answer quickly; powerful ones handle harder questions.' },
      { targets: aiSection('ai-temp'), title: 'Temperature', text: 'Lower is precise and predictable, higher is more creative.' },
      { targets: aiSection('ai-mode'), title: 'Mode & tools', text: 'Switch the assistant into Code Helper, Debugger, Tutor and other modes.' },
      { targets: aiSection('ai-system'), title: 'System prompt', text: 'Give the AI custom instructions for this session.' },
      { targets: aiSection('ai-history-list'), title: 'Chat history', text: 'Press <b>Save</b> to keep the current chat, and click a saved chat to reopen it.' },
      { targets: aiSection('ai-fav-list'), title: 'Favorite responses', text: 'Use <b>Save</b> under any answer to keep it here.' },
      { when: hasKey, targets: '#ai-attach', title: 'Image uploads', text: 'Because you added a Groq key, you can attach up to 4 images (or paste them). vispora switches to the Qwen model to read them.' },
      { when: () => !hasKey(), title: 'Image uploads & limits', text: 'Add your own free Groq API key in <b>Settings → AI</b> to attach images (Qwen) and avoid the shared token limit.' },
    ];
  }

  const TOURS = { home: homeSteps, media: mediaSteps, browse: browseSteps, settings: settingsSteps, games: gamesSteps, player: playerSteps, ai: aiSteps };

  function build() {
    const root = document.createElement('div');
    root.className = 'tour-root no-spot';
    root.innerHTML = `<div class="tour-blocker"></div><div class="tour-spot"></div>
      <div class="tour-card" role="dialog" aria-live="polite">
        <div class="tour-progress"><span></span></div>
        <div class="tour-title"></div>
        <div class="tour-text"></div>
        <button type="button" class="tour-all">Skip all tours</button>
        <div class="tour-actions">
          <button type="button" class="btn btn-ghost tour-skip">Skip tour</button>
          <span class="tour-nav">
            <button type="button" class="btn btn-secondary tour-back">Back</button>
            <button type="button" class="btn btn-secondary tour-next">Next</button>
            <button type="button" class="btn btn-primary tour-cta"></button>
          </span>
        </div>
      </div>`;
    document.body.appendChild(root);
    return root;
  }

  function place() {
    if (!state) return;
    const step = state.steps[state.i];
    if (!step) return;
    const card = state.card, spot = state.spot;
    const vw = innerWidth, vh = innerHeight;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    const els = resolve(step.targets);
    if (!els.length) {
      state.root.classList.add('no-spot');
      card.style.left = Math.max(12, (vw - cw) / 2) + 'px';
      card.style.top = Math.max(12, (vh - ch) / 2) + 'px';
      return;
    }
    state.root.classList.remove('no-spot');
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    els.forEach(el => {
      const q = el.getBoundingClientRect();
      l = Math.min(l, q.left); t = Math.min(t, q.top);
      r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    });
    const pad = 8;
    l = Math.max(4, l - pad); t = Math.max(4, t - pad);
    r = Math.min(vw - 4, r + pad); b = Math.min(vh - 4, b + pad);
    spot.style.left = l + 'px';
    spot.style.top = t + 'px';
    spot.style.width = Math.max(0, r - l) + 'px';
    spot.style.height = Math.max(0, b - t) + 'px';
    let left = Math.min(Math.max(12, l + (r - l) / 2 - cw / 2), vw - cw - 12);
    let top;
    if (b + 14 + ch <= vh - 12) top = b + 14;
    else if (t - 14 - ch >= 12) top = t - 14 - ch;
    else { top = vh - ch - 16; left = Math.max(12, (vw - cw) / 2); }
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function loop() {
    if (!state) return;
    place();
    state.raf = requestAnimationFrame(loop);
  }

  function leave(step) {
    if (step && step.onLeave) { try { step.onLeave(); } catch (e) { } }
    document.querySelectorAll('[data-tour-active]').forEach(e => e.removeAttribute('data-tour-active'));
  }

  function show(i) {
    const s = state;
    if (s.shown) leave(s.steps[s.i]);
    s.i = i;
    s.shown = true;
    const step = s.steps[i];
    if (step.onEnter) { try { step.onEnter(); } catch (e) { } }
    const els = resolve(step.targets);
    els.forEach(e => e.setAttribute('data-tour-active', ''));
    if (els.length) {
      const tall = els[0].getBoundingClientRect().height > innerHeight * 0.6;
      els[0].scrollIntoView({ behavior: 'smooth', block: tall ? 'start' : 'center' });
    }
    const hasNext = s.steps.slice(i + 1).some(available);
    const hasPrev = s.steps.slice(0, i).some(available);
    s.card.querySelector('.tour-title').textContent = step.title;
    s.card.querySelector('.tour-text').innerHTML = step.text;
    s.card.querySelector('.tour-progress span').style.width = ((i + 1) / s.steps.length) * 100 + '%';
    s.card.querySelector('.tour-back').style.display = hasPrev ? '' : 'none';
    s.card.querySelector('.tour-next').textContent = hasNext ? 'Next' : 'Finish';
    const cta = s.card.querySelector('.tour-cta');
    cta.style.display = step.cta ? '' : 'none';
    if (step.cta) cta.textContent = step.cta.label;
  }

  function step(dir) {
    let i = state.i + dir;
    while (i >= 0 && i < state.steps.length && !available(state.steps[i])) i += dir;
    if (i < 0) return;
    if (i >= state.steps.length) { finish(); return; }
    show(i);
  }

  function onKey(e) {
    if (!state) return;
    if (e.key === 'Escape') { e.preventDefault(); finish(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  }

  function finish() {
    if (!state) return;
    const s = state;
    state = null;
    cancelAnimationFrame(s.raf);
    leave(s.steps[s.i]);
    document.removeEventListener('keydown', onKey, true);
    s.root.remove();
    markDone(s.name);
  }

  function skipAll() {
    Object.keys(TOURS).forEach(markDone);
    finish();
  }

  function start(name, opts) {
    opts = opts || {};
    if (state || !TOURS[name]) return;
    if (!opts.force && isDone(name)) return;
    const root = build();
    state = { name, steps: TOURS[name](), i: -1, shown: false, root, card: root.querySelector('.tour-card'), spot: root.querySelector('.tour-spot'), raf: 0 };
    root.querySelector('.tour-skip').onclick = finish;
    root.querySelector('.tour-all').onclick = skipAll;
    root.querySelector('.tour-back').onclick = () => step(-1);
    root.querySelector('.tour-next').onclick = () => step(1);
    root.querySelector('.tour-cta').onclick = () => {
      const cur = state.steps[state.i];
      finish();
      if (cur && cur.cta) cur.cta.run();
    };
    document.addEventListener('keydown', onKey, true);
    step(1);
    loop();
  }

  function autoStart(name, opts) {
    opts = opts || {};
    let force = !!opts.force;
    if (sessionStorage.getItem(NEXT_KEY) === name) {
      sessionStorage.removeItem(NEXT_KEY);
      force = true;
    }
    function whenAuth(cb) {
      if (window.VCurrentUser) cb();
      else document.addEventListener('vispora:auth-ready', cb, { once: true });
    }
    whenAuth(() => {
      if (!force && isDone(name)) return;
      let began = Date.now();
      let stableSince = 0;
      const poll = setInterval(() => {
        if (overlayOpen()) {
          began = Date.now();
          stableSince = 0;
          return;
        }
        const ready = !opts.ready || opts.ready();
        if (!ready) {
          stableSince = 0;
          if (Date.now() - began > 15000) clearInterval(poll);
          return;
        }
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince >= 600) {
          clearInterval(poll);
          start(name, { force });
        }
      }, 400);
    });
  }

  window.VTutorial = { start, autoStart };
})();