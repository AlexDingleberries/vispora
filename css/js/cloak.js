'use strict';
const CLOAK_TARGETS = {
  google: {
    title: 'My Drive – Google Drive',
    favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
    url: 'https://docs.google.com/drive/'
  }
};
function setFavicon(url) {
  let link = document.querySelector("link[rel*='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'shortcut icon'; document.head.appendChild(link); }
  link.href = url;
}
function cloakTab(mode, customUrl) {
  const m = mode || VStorage.getCloakMode();
  const cu = customUrl || VStorage.getCloakUrl();
  if (m === 'google') {
    document.title = CLOAK_TARGETS.google.title;
    setFavicon('https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  } else if (m === 'about-blank') {
    document.title = '';
    setFavicon('data:,');
  } else if (m === 'custom' && cu) {
    try {
      const u = new URL(cu, window.location.origin);
      document.title = u.hostname.replace('www.', '');
      setFavicon(`https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`);
    } catch { }
  }
}
function uncloakTab(title) {
  document.title = title || 'vispora';
}
let _leavePreventionActive = false;
function _leaveHandler(e) {
  e.preventDefault();
  e.returnValue = '';
}
function initLeavePrevention() {
  if (VStorage.getLeavePrevention()) {
    _enableLeavePrevention();
  }
}
function _enableLeavePrevention() {
  if (!_leavePreventionActive) {
    window.addEventListener('beforeunload', _leaveHandler);
    _leavePreventionActive = true;
  }
}
function _disableLeavePrevention() {
  if (_leavePreventionActive) {
    window.removeEventListener('beforeunload', _leaveHandler);
    _leavePreventionActive = false;
  }
}
function toggleLeavePrevention(enabled) {
  VStorage.setLeavePrevention(enabled);
  if (enabled) _enableLeavePrevention();
  else _disableLeavePrevention();
}
function initCloak() {
  const mode = VStorage.getCloakMode();
  const autoCloak = VStorage.getAutoCloak();
  if (autoCloak && mode !== 'none') {
    cloakTab(mode);
  } else {
    uncloakTab();
  }
  initLeavePrevention();
  document.addEventListener('keydown', (e) => {
    const panicKey = VStorage.getPanicKey();
    if (e.altKey && e.code === panicKey) {
      e.preventDefault();
      const m = VStorage.getCloakMode();
      const cu = VStorage.getCloakUrl();
      if (m === 'google') window.top.location.replace(CLOAK_TARGETS.google.url);
      else if (m === 'about-blank') window.top.location.replace('about:blank');
      else if (m === 'custom' && cu) window.top.location.replace(cu);
      else cloakTab('google');
    }
  });
}
window.VCloak = { CLOAK_TARGETS, cloakTab, uncloakTab, initCloak, toggleLeavePrevention, releaseLeavePrevention: _disableLeavePrevention };