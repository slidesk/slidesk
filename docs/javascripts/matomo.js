const _paq = (window._paq = window._paq || []);
_paq.push(["trackPageView"]);
_paq.push(["enableLinkTracking"]);
(function () {
  const u = "//matomo.gouz.dev/";
  _paq.push(["setTrackerUrl", u + "matomo.php"]);
  _paq.push(["setSiteId", "3"]);
  const d = document,
    g = d.createElement("script"),
    s = d.getElementsByTagName("script")[0];
  g.async = true;
  g.src = u + "matomo.js";
  s.parentNode.insertBefore(g, s);
})();
