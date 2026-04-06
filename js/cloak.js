// ===== VISPORA CLOAK MODULE =====

const CLOAK_TARGETS = {
  google: {
    title: 'My Drive – Google Drive',
    favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
    url: 'https://docs.google.com/drive/'
  }
};

function setFavicon(url) {
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'shortcut icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

function cloakTab(mode, customUrl) {
  const m = mode || VStorage.getCloakMode();
  const cu = customUrl || VStorage.getCloakUrl();

  if (m === 'google') {
    document.title = CLOAK_TARGETS.google.title;
    setFavicon(CLOAK_TARGETS.google.favicon);
  } else if (m === 'custom' && cu) {
    const u = new URL(cu, window.location.origin);
    document.title = u.hostname.replace('www.', '');
    // Use google favicon API as fallback
    setFavicon(`https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`);
  }
}

function uncloakTab(title) {
  document.title = title || 'vispora';
  setFavicon('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%2300e5ff"/><text x="50%" y="60%" font-size="18" font-family="monospace" font-weight="900" fill="black" text-anchor="middle">V</text></svg>');
}

function initCloak() {
  const mode = VStorage.getCloakMode();
  const autoCloak = VStorage.getAutoCloak();

  if (autoCloak && mode !== 'none') {
    cloakTab(mode);
  } else {
    uncloakTab();
  }

  // Panic key listener
  document.addEventListener('keydown', (e) => {
    const panicKey = VStorage.getPanicKey();
    if (e.code === panicKey || e.key === panicKey) {
      const m = VStorage.getCloakMode();
      const cu = VStorage.getCloakUrl();
      if (m === 'google') {
        window.location.replace(CLOAK_TARGETS.google.url);
      } else if (m === 'custom' && cu) {
        window.location.replace(cu);
      } else {
        // Just cloak tab title
        cloakTab('google');
      }
    }
  });
}

window.VCloak = {
  CLOAK_TARGETS,
  cloakTab,
  uncloakTab,
  initCloak,
};
