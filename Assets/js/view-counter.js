/* ==========================================================================
   view-counter.js
   Adds a public "site views" counter using the free CountAPI service.
   No backend / PHP required — works fine on GitHub Pages, Vercel, etc.

   Requires in your HTML:
   <span class="stamp open" id="view-counter">
     <span class="dot"></span>Loading views…
   </span>

   Then include this file near the bottom of the page:
   <script src="Assets/js/view-counter.js"></script>
   ========================================================================== */

(function () {
  // Change this to something unique to you (e.g. your GitHub username + repo name)
  // so your counter doesn't collide with anyone else's.
  const NAMESPACE = "canoneropab2003-portfolio";
  const KEY = "site-views";

  const el = document.getElementById("view-counter");
  if (!el) return; // element not found on this page, do nothing

  fetch(`https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`)
    .then((res) => {
      if (!res.ok) throw new Error("Bad response from CountAPI");
      return res.json();
    })
    .then((data) => {
      const formatted = data.value.toLocaleString();
      el.innerHTML = `<span class="dot"></span>${formatted} views`;
    })
    .catch(() => {
      el.innerHTML = `<span class="dot"></span>Views unavailable`;
    });
})();
