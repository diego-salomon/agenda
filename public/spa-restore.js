// Restores the real URL after the 404.html redirect on GitHub Pages, turning
// /agenda/?/plantilla back into /agenda/plantilla before React Router mounts.
// Kept as an external file so it passes the strict `script-src 'self'` CSP in
// index.html (an inline script would be blocked). No-op anywhere else.
(function () {
  var l = window.location;
  if (l.search[1] === '/') {
    var decoded = l.search
      .slice(1)
      .split('&')
      .map(function (part) {
        return part.replace(/~and~/g, '&');
      })
      .join('?');
    window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
  }
})();
