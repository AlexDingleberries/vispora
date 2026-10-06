(function () {
  'use strict';
  var root = document.documentElement;
  root.style.visibility = 'hidden';
  root.style.pointerEvents = 'none';
  var leaving = false;
  var armed = false;

  function _reveal() {
    root.style.visibility = '';
    root.style.pointerEvents = '';
  }

  function _redirect() {
    window.top.location.replace('../index.html');
  }

  function _leave() {
    if (leaving) return;
    leaving = true;
    try { if (window.VFirebase && VFirebase.auth) VFirebase.auth.signOut(); } catch (e) { }
    try { if (window.VStorage) VStorage.resetCloudSync(); } catch (e) { }
    _redirect();
  }

  function _guard() {
    if (!armed || leaving) return;
    if (!VFirebase.auth.currentUser) _leave();
  }

  if (!window.VFirebase || !window.VFirebase.auth) {
    _redirect();
    return;
  }

  var safetyTimer = setTimeout(_redirect, 8000);
  var settled = false;

  ['click', 'keydown', 'pointerdown', 'focus'].forEach(function (ev) {
    window.addEventListener(ev, _guard, true);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) _guard();
  });
  setInterval(_guard, 5000);

  VFirebase.auth.onAuthStateChanged(function (user) {
    if (settled) {
      if (!user) _leave();
      else if (window.VCurrentUser && window.VCurrentUser.uid !== user.uid) location.reload();
      return;
    }
    settled = true;
    clearTimeout(safetyTimer);

    if (!user) {
      _leave();
      return;
    }

    function _done(res) {
      window.VCurrentUser = user;
      armed = true;
      if (res && res.applied && window.VTheme) VTheme._safeInitTheme();
      _reveal();
      setTimeout(function () {
        document.dispatchEvent(
          new CustomEvent('vispora:auth-ready', { detail: { user: user } })
        );
      }, 0);
    }

    if (window.VStorage && window.VFirebase.db) {
      var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 6000); });
      Promise.race([VStorage.syncFromCloud(VFirebase.db, user.uid), timeout])
        .then(_done)
        .catch(function (err) {
          console.warn('[auth] cloud sync failed:', err);
          _done(null);
        });
    } else {
      _done(null);
    }
  });

})();