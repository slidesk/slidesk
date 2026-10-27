var _paq = (window._paq = window._paq || []);
/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
_paq.push(["trackPageView"], ["enableLinkTracking"]);
(function () {
  var u = "//matomo.gouz.dev/";
  _paq.push(["setTrackerUrl", u + "matomo.php"], ["setSiteId", "3"]);
  var d = document,
    g = d.createElement("script"),
    s = d.getElementsByTagName("script")[0];
  g.async = true;
  g.src = u + "matomo.js";
  s.parentNode.insertBefore(g, s);
})();
