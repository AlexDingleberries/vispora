/* Popup Protector (backend-only)
   - Intercepts window.open, anchor clicks with target="_blank", and form submits with target="_blank".
   - Blocks all new-window requests that are NOT allowed (configurable rule).
   - Records requests, aggregates counts per URL, exposes API to query/allow/deny each request.
   - Emits CustomEvents on window for integration with any UI: "ppop:request", "ppop:allowed", "ppop:denied", "ppop:update"
   - No visuals included. All interaction via API or events.
   - Drop into any page as a plain <script>.
*/
(function PPopupProtect() {
  if (window.__ppop) return; // avoid double-init

  const config = {
    // What "same page" means: change to 'href' to require exact href match
    allowIfSameOrigin: true,      // allow popups to same origin by default
    allowIfSameHref: false,       // if true, only allow if identical URL
    blockAboutBlank: true,        // true => intercept about:blank opens and treat as request
    logToConsole: false,          // whether to console.log events
  };

  // Internal registry
  const registry = {
    // pendingRequests: map requestId -> requestObject
    pending: new Map(),
    // aggregated counts per URL (string) => count
    counts: new Map(),
    // history (optional): array of {id, time, url, action}
    history: [],
  };

  let nextId = 1;

  // Util helpers
  function nowISO() { return (new Date()).toISOString(); }
  function makeId() { return 'ppop-' + (nextId++); }
  function normalizeUrl(u) {
    try {
      return (new URL(u, location.href)).href;
    } catch (e) {
      return String(u);
    }
  }
  function sameOrigin(u) {
    try {
      const url = new URL(u, location.href);
      return url.origin === location.origin;
    } catch (e) {
      return false;
    }
  }
  function shouldAllowByDefault(url) {
    if (config.allowIfSameHref) {
      return normalizeUrl(url) === location.href;
    }
    if (config.allowIfSameOrigin) {
      return sameOrigin(url);
    }
    return false;
  }

  // Event emitter helper
  function emit(name, detail) {
    try {
      const ev = new CustomEvent(name, { detail });
      window.dispatchEvent(ev);
    } catch (e) {
      // fall back to console logging
      if (config.logToConsole) console.log('[ppop event failed]', name, detail);
    }
  }

  // Record request
  function recordRequest(url, meta = {}) {
    const normalized = normalizeUrl(url);
    // update counts
    const current = registry.counts.get(normalized) || 0;
    registry.counts.set(normalized, current + 1);

    // create request
    const id = makeId();
    const request = {
      id,
      url: normalized,
      createdAt: nowISO(),
      countForUrl: registry.counts.get(normalized),
      method: meta.method || 'window.open',
      openerLocation: location.href,
      resolved: false, // allowed or denied later
      allowWhen: null, // timestamp if allowed
      denyWhen: null,  // timestamp if denied
      rawArgs: meta.rawArgs || null, // raw args (if from window.open)
      stubWindow: meta.stubWindow || null, // stub window returned to caller
      allowCallback: null, // internal function to finalize allow
      denyCallback: null,  // internal function to finalize deny
    };

    registry.pending.set(id, request);
    registry.history.push({ id, event: 'requested', url: normalized, time: nowISO(), method: request.method });

    if (config.logToConsole) console.info('[ppop] request recorded', request);

    // emit event so UI can show notification/list
    emit('ppop:request', { request: summarize(request) });
    emit('ppop:update', getSummary());

    return request;
  }

  function summarize(req) {
    return {
      id: req.id,
      url: req.url,
      createdAt: req.createdAt,
      countForUrl: req.countForUrl,
      method: req.method,
      resolved: req.resolved,
      allowWhen: req.allowWhen,
      denyWhen: req.denyWhen,
      openerLocation: req.openerLocation,
    };
  }

  function getSummary() {
    // top 50 pending
    const pending = Array.from(registry.pending.values()).map(summarize);
    const counts = {};
    for (const [url, c] of registry.counts.entries()) counts[url] = c;
    return { pending, counts, historyCount: registry.history.length };
  }

  // API surface we'll expose at window.__ppop
  const API = {
    // Get pending requests
    getPending: () => Array.from(registry.pending.values()).map(summarize),

    // Get aggregated counts
    getCounts: () => {
      const obj = {};
      for (const [k, v] of registry.counts.entries()) obj[k] = v;
      return obj;
    },

    // Allow a specific request by id. Returns true if action performed.
    allowRequest: (id) => {
      const req = registry.pending.get(id);
      if (!req) return false;
      finalizeAllow(req);
      return true;
    },

    // Deny request by id
    denyRequest: (id) => {
      const req = registry.pending.get(id);
      if (!req) return false;
      finalizeDeny(req);
      return true;
    },

    // Allow all pending requests (optionally filter by url)
    allowAll: (filterFn) => {
      const ids = Array.from(registry.pending.keys());
      for (const id of ids) {
        const req = registry.pending.get(id);
        if (!req) continue;
        if (!filterFn || filterFn(req)) finalizeAllow(req);
      }
    },

    // Deny all pending requests (optionally filter by url)
    denyAll: (filterFn) => {
      const ids = Array.from(registry.pending.keys());
      for (const id of ids) {
        const req = registry.pending.get(id);
        if (!req) continue;
        if (!filterFn || filterFn(req)) finalizeDeny(req);
      }
    },

    // Clear internal counters/history
    resetCounts: () => {
      registry.counts.clear();
      registry.history = [];
      emit('ppop:update', getSummary());
    },

    // For integrators: subscribe via events rather than polling.
    events: {
      // event names: ppop:request, ppop:allowed, ppop:denied, ppop:update
      // Use: window.addEventListener('ppop:request', e => console.log(e.detail));
    },

    // For debugging
    _debug: {
      config,
      registry,
      normalizeUrl,
      shouldAllowByDefault,
    }
  };

  // FINALIZE: allow/deny logic that opens actual window if needed and resolves stub windows
  function finalizeAllow(req) {
    if (req.resolved) return;
    req.resolved = true;
    req.allowWhen = nowISO();
    registry.pending.delete(req.id);
    registry.history.push({ id: req.id, event: 'allowed', url: req.url, time: req.allowWhen });

    // If there is a stored callback to actually create the window, call it
    if (typeof req.allowCallback === 'function') {
      try { req.allowCallback(); } catch (e) { console.error('[ppop] allowCallback failed', e); }
    }

    // If there is a stubWindow (proxy), mark as allowed and attach a real window if created
    if (req.stubWindow && req.stubWindow.__ppop_attachRealWindow) {
      try { req.stubWindow.__ppop_attachRealWindow(); } catch (e) { /* no-op */ }
    }

    emit('ppop:allowed', { request: summarize(req) });
    emit('ppop:update', getSummary());
    if (config.logToConsole) console.log('[ppop] allowed', req.id, req.url);
  }

  function finalizeDeny(req) {
    if (req.resolved) return;
    req.resolved = true;
    req.denyWhen = nowISO();
    registry.pending.delete(req.id);
    registry.history.push({ id: req.id, event: 'denied', url: req.url, time: req.denyWhen });

    // Call deny callback if present
    if (typeof req.denyCallback === 'function') {
      try { req.denyCallback(); } catch (e) { /* no-op */ }
    }

    // If there's a stubWindow, mark as closed
    if (req.stubWindow) {
      try {
        req.stubWindow.__ppop_markDenied && req.stubWindow.__ppop_markDenied();
      } catch (e) {}
    }

    emit('ppop:denied', { request: summarize(req) });
    emit('ppop:update', getSummary());
    if (config.logToConsole) console.log('[ppop] denied', req.id, req.url);
  }

  /* ------------ Intercept window.open -------------- */

  const nativeOpen = window.open.bind(window);

  function createStubWindow(request) {
    // Minimal stub that mimics window handle interface scripts might expect.
    // It can be upgraded/attached to a real window later via __ppop_attachRealWindow.
    let realWindow = null;
    let closed = false;
    const listeners = new Map();

    function dispatchEventToListeners(type, ...args) {
      const arr = listeners.get(type);
      if (arr) for (const fn of arr.slice()) { try { fn.apply(null, args); } catch (e) {} }
    }

    const stub = {
      // some properties scripts might check
      closed,
      name: request.rawArgs && request.rawArgs.name ? request.rawArgs.name : '',
      location: {
        href: 'about:blank',
        toString() { return this.href; }
      },
      // simple methods proxies
      close() {
        if (realWindow) try { realWindow.close(); } catch (e) {}
        closed = true;
        stub.closed = true;
        dispatchEventToListeners('close');
      },
      focus() {
        if (realWindow) try { realWindow.focus(); } catch (e) {}
        dispatchEventToListeners('focus');
      },
      blur() { dispatchEventToListeners('blur'); },
      postMessage(message, targetOrigin, transfer) {
        if (realWindow) try { realWindow.postMessage(message, targetOrigin, transfer); } catch (e) {}
      },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      removeEventListener(type, fn) {
        const arr = listeners.get(type);
        if (!arr) return;
        const idx = arr.indexOf(fn);
        if (idx >= 0) arr.splice(idx, 1);
      },
      // internal helpers used by ppop to attach real window
      __ppop_attachRealWindow: function attachRealWindowMaker() {
        // create real window now (will be implemented by creator)
        if (typeof stub.__ppop_createReal === 'function' && !realWindow) {
          try {
            realWindow = stub.__ppop_createReal();
            // sync location and closed
            try { stub.location.href = realWindow.location.href; } catch(e){}
            stub.closed = !!(realWindow.closed);
          } catch (e) {
            /* ignore */
          }
        }
      },
      __ppop_markDenied: function() {
        closed = true;
        stub.closed = true;
        dispatchEventToListeners('close');
      },
      // debugging
      __ppop_internal: { setReal: (w) => { realWindow = w; } }
    };
    return stub;
  }

  function interceptedOpen(url, name, specs, replace) {
    // If no URL passed, many sites use window.open() to create about:blank window
    const rawUrl = (typeof url === 'undefined' || url === null) ? 'about:blank' : String(url);
    const normalized = normalizeUrl(rawUrl);

    const allowedDefault = shouldAllowByDefault(normalized);
    if (allowedDefault) {
      // allow silently without registering (or we could register with auto-allowed flag)
      return nativeOpen(url, name, specs, replace);
    }

    // Create stub window and request record
    const stubWindow = createStubWindow({});
    const request = recordRequest(normalized, {
      method: 'window.open',
      rawArgs: { url: rawUrl, name: String(name || ''), specs: String(specs || ''), replace: !!replace },
      stubWindow
    });

    // Provide attach/detach callbacks so UI can later allow opening.
    // allowCallback will actually call nativeOpen with saved args and attach the real window handle to stub.
    request.allowCallback = function() {
      // open the real window now (use nativeOpen)
      // Note: some browsers will still block programmatic opens if not in user gesture; but since original open
      // was called by page code, many times it will succeed here.
      try {
        const real = nativeOpen(request.rawArgs.url, request.rawArgs.name, request.rawArgs.specs, request.rawArgs.replace);
        if (real) {
          try { stubWindow.__ppop_internal.setReal(real); } catch (e) {}
          // sync location
          try { stubWindow.location.href = real.location.href; } catch (e) {}
        }
      } catch (e) {
        console.error('[ppop] failed to open real window', e);
      }
    };

    // denyCallback: mark stub as closed/no-op
    request.denyCallback = function() {
      try { stubWindow.__ppop_markDenied && stubWindow.__ppop_markDenied(); } catch (e) {}
    };

    // return stub window immediately to caller (so scripts that rely on return get an object)
    return stubWindow;
  }

  // Actually override window.open
  try {
    window.open = interceptedOpen;
    // keep a non-enumerable ref to native open in case needed
    Object.defineProperty(window, '__ppop_nativeOpen', { value: nativeOpen, writable: false, configurable: false });
  } catch (e) {
    console.error('[ppop] failed to patch window.open', e);
  }

  /* ------------- Intercept clicks on <a target="_blank"> ------------- */

  function handleAnchorTrigger(evt) {
    // capture phase will intercept before default opens if we preventDefault
    try {
      const a = evt.target && (evt.target.closest ? evt.target.closest('a[target]') : findAncestorAnchor(evt.target));
      if (!a) return;
      const target = a.getAttribute('target') || '';
      if (!/_blank/i.test(target)) return; // only intercept new window anchors

      const href = a.href || a.getAttribute('href') || 'about:blank';
      const normalized = normalizeUrl(href);

      // If default allow rule permits, do nothing
      if (shouldAllowByDefault(normalized)) return;

      // Prevent default open
      evt.preventDefault();
      evt.stopImmediatePropagation();

      // Record request
      const stubWindow = createStubWindow({});
      const request = recordRequest(normalized, { method: 'anchor', rawArgs: { href, target }, stubWindow });

      // allowCallback: open
      request.allowCallback = function() {
        const real = nativeOpen(href, target);
        if (real && stubWindow.__ppop_internal) {
          try { stubWindow.__ppop_internal.setReal(real); } catch (e) {}
          try { stubWindow.location.href = real.location.href; } catch (e) {}
        }
      };
      request.denyCallback = function() { stubWindow.__ppop_markDenied && stubWindow.__ppop_markDenied(); };

      // Dispatch event so integrator can show a preview (they can fetch request.url). No UI here.
      // We intentionally don't open the link until allowRequest called.
    } catch (e) {
      // swallow errors
      if (config.logToConsole) console.warn('[ppop] anchor handler error', e);
    }
  }

  // helper for older browsers without closest
  function findAncestorAnchor(node) {
    while (node) {
      if (node.nodeName && node.nodeName.toLowerCase() === 'a' && node.hasAttribute('target')) return node;
      node = node.parentElement;
    }
    return null;
  }

  // Attach capture-phase listener so we can prevent default before new window is created
  document.addEventListener('click', handleAnchorTrigger, true);

  /* ------------- Intercept forms with target="_blank" ------------- */

  function handleFormSubmit(evt) {
    try {
      const form = evt.target && (evt.target.tagName && evt.target.tagName.toLowerCase() === 'form' ? evt.target : null);
      if (!form) return;
      const target = form.getAttribute('target') || '';
      if (!/_blank/i.test(target)) return;
      const action = form.action || location.href;
      const normalized = normalizeUrl(action);

      if (shouldAllowByDefault(normalized)) return;

      evt.preventDefault();
      evt.stopImmediatePropagation();

      const stubWindow = createStubWindow({});
      const request = recordRequest(normalized, { method: 'form', rawArgs: { action, target }, stubWindow });

      request.allowCallback = function() {
        // Create a form inside a real window by opening first then submitting into it.
        try {
          const real = nativeOpen('about:blank', target);
          if (real) {
            // clone form and submit into real window via target
            const cloned = form.cloneNode(true);
            // append to doc for submission
            document.body.appendChild(cloned);
            cloned.submit();
            try { stubWindow.__ppop_internal.setReal(real); } catch (e) {}
          }
        } catch (e) {
          console.error('[ppop] allow form submit failed', e);
        }
      };
      request.denyCallback = function() { stubWindow.__ppop_markDenied && stubWindow.__ppop_markDenied(); };
    } catch (e) {
      if (config.logToConsole) console.warn('[ppop] form submit handler error', e);
    }
  }
  document.addEventListener('submit', handleFormSubmit, true);

  /* ---------- MutationObserver: intercept dynamically created <a target="_blank"> with onclick that triggers open() ---------- */
  // Optional: observe added nodes to catch inline onclick calls that call window.open immediately during insertion.
  // We primarily handle programmatic window.open via patched function, so this is extra.

  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (!m.addedNodes) continue;
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.tagName && node.tagName.toLowerCase() === 'a' && node.hasAttribute('target')) {
          // nothing to do — the click handler will catch user actions. We don't create any visuals.
        }
      });
    }
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  /* ------------- about:blank navigation tracking (best-effort) ------------- */
  // Some sites open about:blank then set location by writing or setting location.href.
  // We cannot reliably intercept writes to an opened about:blank window if we blocked its creation; instead, we
  // provide the stubWindow for scripts to manipulate; when allowed, stub will open the real window.
  // For about:blank opens, we already register them because interceptedOpen maps undefined -> 'about:blank'.

  /* ------------- Expose API and auto-allow small things ------------- */
  window.__ppop = API;

  // Convenience: auto-deny after a long time? We won't auto-decide; integrator controls.
  // But provide small default behavior: if a request uses the same URL multiple times, we still require explicit permission.

  // Provide an automatic "attempt to silently allow" path for certain programmatic opens that have a user gesture:
  // NOTE: detecting user gesture reliably is impossible; we do not try to auto-allow beyond same-origin/same-href rules.

  // Log initial install
  if (config.logToConsole) console.info('[ppop] popup protector installed', getSummary());

  // provide small helper to allow/deny by URL (for integrators that prefer that)
  API.allowByUrl = function(url) {
    const norm = normalizeUrl(url);
    for (const req of Array.from(registry.pending.values())) {
      if (req.url === norm) finalizeAllow(req);
    }
  };
  API.denyByUrl = function(url) {
    const norm = normalizeUrl(url);
    for (const req of Array.from(registry.pending.values())) {
      if (req.url === norm) finalizeDeny(req);
    }
  };

  // Small safety: expose an immediate policy toggle if page really wants to permit all (dangerous)
  API.setPolicy = function(opts) {
    Object.assign(config, opts || {});
    emit('ppop:update', getSummary());
  };

  // Initial event so external UIs can pick up current state
  setTimeout(() => emit('ppop:update', getSummary()), 0);

})();
