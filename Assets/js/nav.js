/* ==========================================================
   NAV.JS — optional enhancement for the mobile nav dropdown.

   The core open/close behavior now works with ZERO JavaScript:
   it's a plain checkbox (#nav-toggle-checkbox) + <label> in the
   HTML, driven entirely by CSS (:checked ~ .nav-panel). This
   script only adds convenience behavior on top of that:
     - closes the dropdown after picking a tab (mobile only)
     - closes when tapping/clicking outside the nav
     - closes on Escape
     - closes automatically if resized past the breakpoint
   If this file fails to load for any reason, the hamburger
   still opens and closes the menu just fine on its own.
   ========================================================== */

(function () {
  var BREAKPOINT = 1024; // must match nav.css

  function initNav(nav) {
    if (nav.dataset.navInit === 'true') return;
    nav.dataset.navInit = 'true';

    var checkbox = nav.querySelector('.nav-toggle-checkbox');
    if (!checkbox) return; // nothing to enhance

    function close() {
      checkbox.checked = false;
    }

    nav.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.innerWidth <= BREAKPOINT) close();
      });
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > BREAKPOINT) close();
    });
  }

  function init() {
    document.querySelectorAll('.nav').forEach(initNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();