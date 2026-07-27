/* ==========================================================================
   view-counter.js
   Adds a public "site views" counter + "since" time + "% vs yesterday"
   delta, using the free CounterAPI.dev service (v1 endpoint — no signup,
   no API key required). No backend required — works on GitHub Pages,
   Vercel, etc.

   NOTE ON THE DELTA: CounterAPI.dev's basic /up endpoint only tracks ONE
   running total, with no built-in daily breakdown. To get a real
   "vs yesterday" percentage (not a fake number), this script keeps two
   extra date-stamped keys — one for "today" and one for "yesterday" —
   and compares them. This does mean 3 small requests instead of 1.
   If CounterAPI.dev ever changes its read-only GET behavior, the catch
   block below falls back to hiding the delta rather than showing wrong data.

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

  function formatTime(d) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
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

  // ---- 2. "Since HH:MM Today" ----
  const now = new Date();
  const todayStr = dateKey(now);
  const SINCE_STORAGE_KEY = `portfolio-first-view-${todayStr}`;

  let firstViewTime;
  try {
    const stored = localStorage.getItem(SINCE_STORAGE_KEY);
    if (stored) {
      firstViewTime = new Date(stored);
    } else {
      firstViewTime = now;
      localStorage.setItem(SINCE_STORAGE_KEY, now.toISOString());
    }
  } catch (e) {
    // localStorage unavailable (private browsing etc.) — just use "now"
    firstViewTime = now;
  }

  if (sinceEl) {
    sinceEl.textContent = `Since ${formatTime(firstViewTime)} Today`;
  }

  // ---- 3. "% vs Yesterday" using date-stamped counter keys ----
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
