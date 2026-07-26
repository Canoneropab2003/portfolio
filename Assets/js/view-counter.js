/* ==========================================================================
   view-counter.js
   Adds a public "site views" counter using the free CounterAPI.dev service
   (v1 endpoint — no signup, no API key required).
   No backend / PHP required — works fine on GitHub Pages, Vercel, etc.

   NOTE: The older "CountAPI.xyz" service has been discontinued (its domain
   no longer resolves), which is why this uses CounterAPI.dev instead.

   Requires in your HTML:
   <span class="stamp open" id="view-counter">
     <span class="dot"></span>Loading views…
   </span>

   Then include this file near the bottom of the page:
   <script src="Assets/js/view-counter.js"></script>
   ========================================================================== */

(function () {
  // Change this to something unique to you (e.g. your GitHub username + repo name)
  // so your counter doesn't collide with anyone else's namespace.
  const NAMESPACE = "canoneropab2003-portfolio";
  const KEY = "site-views";

  const el = document.getElementById("view-counter");
  if (!el) return; // element not found on this page, do nothing

  fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${KEY}/up`)
    .then((res) => {
      if (!res.ok) throw new Error("Bad response from CounterAPI.dev");
      return res.json();
    })
    .then((data) => {
      // CounterAPI.dev returns the current count in `data.value` (or `data.count` on some versions)
      const value = data.value ?? data.count ?? 0;
      const formatted = Number(value).toLocaleString();
      el.innerHTML = `<span class="dot"></span>${formatted} views`;
    })
    .catch(() => {
      el.innerHTML = `<span class="dot"></span>Views unavailable`;
    });
})();
