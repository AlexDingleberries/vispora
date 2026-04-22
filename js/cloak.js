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

function navigateCloakTarget(url) {
  if (window.location.protocol === 'file:') {
    window.location.replace(url);
    return;
  }
  window.top.location.replace(url);
}

function cloakTab(mode, customUrl) {
  const m = mode || VStorage.getCloakMode();
  const cu = customUrl || VStorage.getCloakUrl();

  if (m === 'google') {
    document.title = CLOAK_TARGETS.google.title;
    setFavicon('https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  } else if (m === 'custom' && cu) {
    const u = new URL(cu, window.location.origin);
    document.title = u.hostname.replace('www.', '');
    // Use google favicon API as fallback
    setFavicon(`https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`);
  }
}

function uncloakTab(title) {
  document.title = title || 'vispora';
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
        navigateCloakTarget(CLOAK_TARGETS.google.url);
      } else if (m === 'custom' && cu) {
        navigateCloakTarget(cu);
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
