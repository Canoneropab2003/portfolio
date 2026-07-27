/* ==========================================================================
   view-counter.js
   Adds a public "site views" counter + a LIVE current-time clock + "% vs
   yesterday" delta, using the free CounterAPI.dev service (v1 endpoint —
   no signup, no API key required). No backend required — works on GitHub
   Pages, Vercel, etc.

   NOTE ON THE DELTA: CounterAPI.dev's basic /up endpoint only tracks ONE
   running total, with no built-in daily breakdown. To get a real
   "vs yesterday" percentage (not a fake number), this script keeps two
   extra date-stamped keys — one for "today" and one for "yesterday" —
   and compares them.

   KNOWN LIMITATION: CounterAPI.dev's read-only GET endpoint (used to
   check yesterday's final count) does not send CORS headers, so browsers
   block it outright (console shows a CORS/net::ERR_FAILED error — this
   is the service itself, not a bug in this script). It's wrapped in
   .catch(() => 0), so it safely falls back to showing "New today"
   instead of breaking the rest of the widget.

   NOTE ON "SINCE HH:MM" (CHANGED): this previously cached the FIRST time
   a visitor loaded the page each day and kept showing that same frozen
   time all day (e.g. stuck at "14:05" even at 7:22 PM). That's been
   removed. It now shows the ACTUAL, LIVE current time on the visitor's
   own device clock, ticking forward every second — so it always
   matches whatever time it really is for them right now (e.g. Philippines
   time GMT+8).

   Requires in your HTML:
   <div class="stub-head-badges">
     <div class="view-chip-wrap">
       <span class="view-chip" id="view-counter" title="Total page views">
         <svg class="view-chip-icon" ...>...</svg>
         <span class="view-chip-count">···</span>
         <span class="view-chip-label">views</span>
       </span>
       <div class="view-chip-sub">
         <span class="view-chip-since" id="view-since">Since —</span>
         <span class="view-chip-delta" id="view-delta">···</span>
       </div>
     </div>
     <span class="stamp open"><span class="dot"></span>OPEN TO WORK</span>
   </div>

   Then include this file near the bottom of the page:
   <script src="Assets/js/view-counter.js"></script>
   ========================================================================== */
(function () {
  // Change this to something unique to you (e.g. your GitHub username + repo name)
  // so your counters don't collide with anyone else's namespace.
  const NAMESPACE = "canoneropab2003-portfolio";
  const TOTAL_KEY = "site-views";

  const chipEl = document.getElementById("view-counter");
  const sinceEl = document.getElementById("view-since");
  const deltaEl = document.getElementById("view-delta");
  if (!chipEl) return; // markup not present on this page, do nothing

  const countEl = chipEl.querySelector(".view-chip-count");
  const labelEl = chipEl.querySelector(".view-chip-label");

  // ---- helpers ----
  function dateKey(d) {
    // YYYY-MM-DD, safe to use as part of a counter key
    return d.toISOString().slice(0, 10);
  }

  // Builds a real HH:MM string from the visitor's own device clock/timezone.
  // Tries the locale-aware Intl API first; falls back to a manual
  // 24-hour build if Intl is unavailable/restricted, so the clock never
  // ends up blank.
  function formatTime(d) {
    try {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch (e) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }

  // increment (or create) a counter key, returns the new value
  function bumpCounter(key) {
    return fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${key}/up`)
      .then((res) => {
        if (!res.ok) throw new Error("Bad response from CounterAPI.dev (up)");
        return res.json();
      })
      .then((data) => Number(data.value ?? data.count ?? 0));
  }

  // read a counter key WITHOUT incrementing it (for reading yesterday's final total)
  function readCounter(key) {
    return fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${key}`)
      .then((res) => {
        if (!res.ok) throw new Error("Bad response from CounterAPI.dev (read)");
        return res.json();
      })
      .then((data) => Number(data.value ?? data.count ?? 0));
  }

  function renderDelta(todayCount, yesterdayCount) {
    if (!deltaEl) return;

    if (!yesterdayCount || yesterdayCount === 0) {
      deltaEl.textContent = "New today";
      deltaEl.classList.add("neutral");
      return;
    }

    const pct = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
    const rounded = Math.round(pct * 10) / 10; // one decimal place
    const sign = rounded > 0 ? "+" : "";
    deltaEl.textContent = `${sign}${rounded}% vs Yesterday`;
    deltaEl.classList.toggle("negative", rounded < 0);
  }

  // ---- 1. Total lifetime count (the big number in the pill) ----
  bumpCounter(TOTAL_KEY)
    .then((value) => {
      const formatted = value.toLocaleString();
      if (countEl) {
        countEl.textContent = formatted;
      } else {
        chipEl.innerHTML = `${formatted} views`;
      }
    })
    .catch(() => {
      if (countEl) {
        countEl.textContent = "—";
        if (labelEl) labelEl.textContent = "views unavailable";
      } else {
        chipEl.innerHTML = "Views unavailable";
      }
    });

  // ---- 2. LIVE current time (replaces the old "first view today" cache) ----
  // No localStorage involved anymore — always reflects the visitor's real,
  // current device clock (e.g. Philippines GMT+8), ticking forward live.
  function renderLiveClock() {
    if (!sinceEl) return;
    const nowLive = new Date();
    sinceEl.textContent = `Since ${formatTime(nowLive)} Today`;
  }

  renderLiveClock();               // show immediately on load
  setInterval(renderLiveClock, 1000); // tick forward every second, live

  // ---- 3. "% vs Yesterday" using date-stamped counter keys ----
  const now = new Date();
  const todayStr = dateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = `daily-${todayStr}`;
  const yesterdayKey = `daily-${dateKey(yesterday)}`;

  Promise.all([
    bumpCounter(todayKey),      // increments today's bucket for this pageview
    readCounter(yesterdayKey).catch(() => 0) // yesterday's bucket is read-only; if missing, treat as 0
  ])
    .then(([todayCount, yesterdayCount]) => {
      renderDelta(todayCount, yesterdayCount);
    })
    .catch(() => {
      if (deltaEl) {
        deltaEl.textContent = "—";
        deltaEl.classList.add("neutral");
      }
    });
})();
