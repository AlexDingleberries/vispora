
(function PPopupProtect() {
  if (window.__ppop) return; 

  const config = {
    
    allowIfSameOrigin: true,      
    allowIfSameHref: false,       
    blockAboutBlank: true,        
    logToConsole: false,          
  };

  
  const registry = {
    
    pending: new Map(),
    
    counts: new Map(),
    
    history: [],
  };

  let nextId = 1;

  
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

  
  function emit(name, detail) {
    try {
      const ev = new CustomEvent(name, { detail });
      window.dispatchEvent(ev);
    } catch (e) {
      
      if (config.logToConsole) console.log('[ppop event failed]', name, detail);
    }
  }

  
  function recordRequest(url, meta = {}) {
    const normalized = normalizeUrl(url);
    
    const current = registry.counts.get(normalized) || 0;
    registry.counts.set(normalized, current + 1);

    
    const id = makeId();
    const request = {
      id,
      url: normalized,
      createdAt: nowISO(),
      countForUrl: registry.counts.get(normalized),
      method: meta.method || 'window.open',
      openerLocation: location.href,
      resolved: false, 
      allowWhen: null, 
      denyWhen: null,  
      rawArgs: meta.rawArgs || null, 
      stubWindow: meta.stubWindow || null, 
      allowCallback: null, 
      denyCallback: null,  
    };

    registry.pending.set(id, request);
    registry.history.push({ id, event: 'requested', url: normalized, time: nowISO(), method: request.method });

    if (config.logToConsole) console.info('[ppop] request recorded', request);

    
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
    
    const pending = Array.from(registry.pending.values()).map(summarize);
    const counts = {};
    for (const [url, c] of registry.counts.entries()) counts[url] = c;
    return { pending, counts, historyCount: registry.history.length };
  }

  
  const API = {
    
    getPending: () => Array.from(registry.pending.values()).map(summarize),

    
    getCounts: () => {
      const obj = {};
      for (const [k, v] of registry.counts.entries()) obj[k] = v;
      return obj;
    },

    
    allowRequest: (id) => {
      const req = registry.pending.get(id);
      if (!req) return false;
      finalizeAllow(req);
      return true;
    },

    
    denyRequest: (id) => {
      const req = registry.pending.get(id);
      if (!req) return false;
      finalizeDeny(req);
      return true;
    },

    
    allowAll: (filterFn) => {
      const ids = Array.from(registry.pending.keys());
      for (const id of ids) {
        const req = registry.pending.get(id);
        if (!req) continue;
        if (!filterFn || filterFn(req)) finalizeAllow(req);
      }
    },

    
    denyAll: (filterFn) => {
      const ids = Array.from(registry.pending.keys());
      for (const id of ids) {
        const req = registry.pending.get(id);
        if (!req) continue;
        if (!filterFn || filterFn(req)) finalizeDeny(req);
      }
    },

    
    resetCounts: () => {
      registry.counts.clear();
      registry.history = [];
      emit('ppop:update', getSummary());
    },

    
    events: {
      
      
    },

    
    _debug: {
      config,
      registry,
      normalizeUrl,
      shouldAllowByDefault,
    }
  };

  
  function finalizeAllow(req) {
    if (req.resolved) return;
    req.resolved = true;
    req.allowWhen = nowISO();
    registry.pending.delete(req.id);
    registry.history.push({ id: req.id, event: 'allowed', url: req.url, time: req.allowWhen });

    
    if (typeof req.allowCallback === 'function') {
      try { req.allowCallback(); } catch (e) { console.error('[ppop] allowCallback failed', e); }
    }

    
    if (req.stubWindow && req.stubWindow.__ppop_attachRealWindow) {
      try { req.stubWindow.__ppop_attachRealWindow(); } catch (e) {  }
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

    
    if (typeof req.denyCallback === 'function') {
      try { req.denyCallback(); } catch (e) {  }
    }

    
    if (req.stubWindow) {
      try {
        req.stubWindow.__ppop_markDenied && req.stubWindow.__ppop_markDenied();
      } catch (e) {}
    }

    emit('ppop:denied', { request: summarize(req) });
    emit('ppop:update', getSummary());
    if (config.logToConsole) console.log('[ppop] denied', req.id, req.url);
  }

  

  const nativeOpen = window.open.bind(window);

  function createStubWindow(request) {
    
    
    let realWindow = null;
    let closed = false;
    const listeners = new Map();

    function dispatchEventToListeners(type, ...args) {
      const arr = listeners.get(type);
      if (arr) for (const fn of arr.slice()) { try { fn.apply(null, args); } catch (e) {} }
    }

    const stub = {
      
      closed,
      name: request.rawArgs && request.rawArgs.name ? request.rawArgs.name : '',
      location: {
        href: 'about:blank',
        toString() { return this.href; }
      },
      
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
      
      __ppop_attachRealWindow: function attachRealWindowMaker() {
        
        if (typeof stub.__ppop_createReal === 'function' && !realWindow) {
          try {
            realWindow = stub.__ppop_createReal();
            
            try { stub.location.href = realWindow.location.href; } catch(e){}
            stub.closed = !!(realWindow.closed);
          } catch (e) {
            
          }
        }
      },
      __ppop_markDenied: function() {
        closed = true;
        stub.closed = true;
        dispatchEventToListeners('close');
      },
      
      __ppop_internal: { setReal: (w) => { realWindow = w; } }
    };
    return stub;
  }

  function interceptedOpen(url, name, specs, replace) {
    
    const rawUrl = (typeof url === 'undefined' || url === null) ? 'about:blank' : String(url);
    const normalized = normalizeUrl(rawUrl);

    const allowedDefault = shouldAllowByDefault(normalized);
    if (allowedDefault) {
      
      return nativeOpen(url, name, specs, replace);
    }

    
    const stubWindow = createStubWindow({});
    const request = recordRequest(normalized, {
      method: 'window.open',
      rawArgs: { url: rawUrl, name: String(name || ''), specs: String(specs || ''), replace: !!replace },
      stubWindow
    });

    
    
    request.allowCallback = function() {
      
      
      
      try {
        const real = nativeOpen(request.rawArgs.url, request.rawArgs.name, request.rawArgs.specs, request.rawArgs.replace);
        if (real) {
          try { stubWindow.__ppop_internal.setReal(real); } catch (e) {}
          
          try { stubWindow.location.href = real.location.href; } catch (e) {}
        }
      } catch (e) {
        console.error('[ppop] failed to open real window', e);
      }
    };

    
    request.denyCallback = function() {
      try { stubWindow.__ppop_markDenied && stubWindow.__ppop_markDenied(); } catch (e) {}
    };

    
    return stubWindow;
  }

  
  try {
    window.open = interceptedOpen;
    
    Object.defineProperty(window, '__ppop_nativeOpen', { value: nativeOpen, writable: false, configurable: false });
  } catch (e) {
    console.error('[ppop] failed to patch window.open', e);
  }

  

  function handleAnchorTrigger(evt) {
    
    try {
      const a = evt.target && (evt.target.closest ? evt.target.closest('a[target]') : findAncestorAnchor(evt.target));
      if (!a) return;
      const target = a.getAttribute('target') || '';
      if (!/_blank/i.test(target)) return; 

      const href = a.href || a.getAttribute('href') || 'about:blank';
      const normalized = normalizeUrl(href);

      
      if (shouldAllowByDefault(normalized)) return;

      
      evt.preventDefault();
      evt.stopImmediatePropagation();

      
      const stubWindow = createStubWindow({});
      const request = recordRequest(normalized, { method: 'anchor', rawArgs: { href, target }, stubWindow });

      
      request.allowCallback = function() {
        const real = nativeOpen(href, target);
        if (real && stubWindow.__ppop_internal) {
          try { stubWindow.__ppop_internal.setReal(real); } catch (e) {}
          try { stubWindow.location.href = real.location.href; } catch (e) {}
        }
      };
      request.denyCallback = function() { stubWindow.__ppop_markDenied && stubWindow.__ppop_markDenied(); };

      
      
    } catch (e) {
      
      if (config.logToConsole) console.warn('[ppop] anchor handler error', e);
    }
  }

  
  function findAncestorAnchor(node) {
    while (node) {
      if (node.nodeName && node.nodeName.toLowerCase() === 'a' && node.hasAttribute('target')) return node;
      node = node.parentElement;
    }
    return null;
  }

  
  document.addEventListener('click', handleAnchorTrigger, true);

  

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
        
        try {
          const real = nativeOpen('about:blank', target);
          if (real) {
            
            const cloned = form.cloneNode(true);
            
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

  
  
  

  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (!m.addedNodes) continue;
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.tagName && node.tagName.toLowerCase() === 'a' && node.hasAttribute('target')) {
          
        }
      });
    }
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  
  
  
  
  

  
  window.__ppop = API;

  
  

  
  

  
  if (config.logToConsole) console.info('[ppop] popup protector installed', getSummary());

  
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

  
  API.setPolicy = function(opts) {
    Object.assign(config, opts || {});
    emit('ppop:update', getSummary());
  };

  
  setTimeout(() => emit('ppop:update', getSummary()), 0);

})();
