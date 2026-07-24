/* ==========================================================================
   PRELOADER SCRIPT
   Drop this <script> tag as the VERY FIRST thing inside <body>, e.g.:

     <body>
       <script src="loading.js"></script>
       <div class="app"> ... </div>

   It injects the loader markup immediately (so it paints before the rest
   of the page), fakes a smooth progress bar while assets load, then snaps
   to 100% and fades out once the window "load" event fires.

   Changes from the previous version:
   - .pl-ring-wrap around .pl-ring, for the 3D spinning-token look
   - .pl-scanline, a one-time print-head sweep that plays as the ticket lands
   - .pl-barcode, a decorative strip along the bottom
   - status messages cross-fade and use ticket/boarding-pass language
   - the whole visual card is now aria-hidden, with a separate sr-only
     live region (#pl-sr) that announces just "Loading page" / "Page
     loaded" — screen readers no longer hear every cosmetic status swap
   - the token's spin speed is now tied to real progress (2.6s per turn
     down to 1s as it nears 100%), via a --pl-spin-dur custom property
   - when loading actually finishes, the ticket gets an .is-complete class:
     the token stops front-facing and everything picks up the ok color
     for a beat, like an "approved" stamp, before the ticket retracts
   All matching styles live in loading.css.
   ========================================================================== */

(function(){
  // Lock scroll immediately so the page doesn't jump around underneath the loader
  document.documentElement.classList.add('is-loading');

  // Inject the preloader markup right where this script sits — i.e. first in <body>
  document.write(
    '<div id="preloader" aria-hidden="true">' +
      '<div class="pl-ticket">' +
        '<div class="pl-scanline" aria-hidden="true"></div>' +
        '<div class="pl-brand"><span class="pl-dot"></span>PABLITO.DEV</div>' +
        '<div class="pl-ring-wrap"><div class="pl-ring"></div></div>' +
        '<div class="pl-status" id="pl-status">Checking your ticket</div>' +
        '<div class="pl-divider"></div>' +
        '<div class="pl-progress-row">' +
          '<div class="pl-track"><div class="pl-bar" id="pl-bar"></div></div>' +
          '<div class="pl-pct" id="pl-pct">0%</div>' +
        '</div>' +
        '<div class="pl-barcode" aria-hidden="true"></div>' +
      '</div>' +
    '</div>' +
    '<div id="pl-sr" class="pl-sr-only" role="status" aria-live="polite">Loading page</div>'
  );

  var bar = null, pct = null, statusEl = null, ticketEl = null, srEl = null, current = 0, fakeTimer = null;
  var messages = ['Checking your ticket', 'Printing boarding pass', 'Clearing the gate'];
  var MIN_DISPLAY_MS = 3200;   // preloader stays visible at least this long, even if the page loads instantly
  var startTime = Date.now();

  function setProgress(value){
    current = Math.max(current, Math.min(value, 100));
    if (bar) bar.style.width = current + '%';
    if (pct) pct.textContent = Math.round(current) + '%';
    // Token spins faster as loading gets closer to done — from 2.6s per
    // turn down to 1s — so the motion actually reflects real progress
    // instead of just spinning at a fixed, meaningless rate.
    if (ticketEl) ticketEl.style.setProperty('--pl-spin-dur', (2.6 - (current / 100) * 1.6).toFixed(2) + 's');
  }

  function tickFakeProgress(){
    // Eases toward 90% while real assets are still loading, never completes on its own
    var remaining = 90 - current;
    var step = Math.max(remaining * 0.025, 0.08);
    setProgress(current + step);
    if (current < 90){
      fakeTimer = setTimeout(tickFakeProgress, 260);
    }
  }

  // Cross-fades the status line instead of swapping the text instantly
  function setStatus(text){
    if (!statusEl) return;
    statusEl.classList.add('is-swapping');
    setTimeout(function(){
      statusEl.textContent = text;
      statusEl.classList.remove('is-swapping');
    }, 180);
  }

  function hidePreloader(){
    var el = document.getElementById('preloader');
    if (!el) return;
    var elapsed = Date.now() - startTime;
    var wait = Math.max(MIN_DISPLAY_MS - elapsed, 0);

    setTimeout(function(){
      setProgress(100);
      if (ticketEl) ticketEl.classList.add('is-complete');
      if (srEl) srEl.textContent = 'Page loaded';
      clearTimeout(fakeTimer);
      setTimeout(function(){
        el.classList.add('is-hidden');
        document.documentElement.classList.remove('is-loading');
        setTimeout(function(){
          if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 500); // matches the CSS opacity transition duration
      }, 400); // pause at 100% so it doesn't feel abrupt
    }, wait);
  }

  function init(){
    bar = document.getElementById('pl-bar');
    pct = document.getElementById('pl-pct');
    statusEl = document.getElementById('pl-status');
    ticketEl = document.querySelector('.pl-ticket');
    srEl = document.getElementById('pl-sr');

    var msgIndex = 0;
    var msgTimer = setInterval(function(){
      msgIndex = (msgIndex + 1) % messages.length;
      setStatus(messages[msgIndex]);
    }, 1400);

    tickFakeProgress();

    window.addEventListener('load', function(){
      clearInterval(msgTimer);
      setStatus('Ready to board');
      hidePreloader();
    });

    // Safety net: never let the loader get stuck if "load" is delayed or missed
    setTimeout(function(){
      clearInterval(msgTimer);
      hidePreloader();
    }, 9000);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();