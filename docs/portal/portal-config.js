/* Portal API Configuration
   Reads from localStorage:
   - portal_api_base: tunnel URL (e.g. "https://aarons-mac-mini.tail0dc185.ts.net")
   - portal_api_token: Bearer token for gateway auth

   Each dashboard sets window.PORTAL_SERVICE before loading this script
   (e.g. "finanz", "fitness").

   When a base URL is configured, API paths like "/api/overview" become
   "https://.../api/finanz/overview" to match the gateway's routing pattern. */

(function () {
  var base = (localStorage.getItem('portal_api_base') || '').replace(/\/+$/, '');
  var token = localStorage.getItem('portal_api_token') || '';
  var service = window.PORTAL_SERVICE || '';

  window.portalApiUrl = function (path) {
    if (!base) return path;
    if (service && path.startsWith('/api/')) {
      path = '/api/' + service + '/' + path.slice(5);
    }
    return base + path;
  };

  if (base && token) {
    var _origFetch = window.fetch;
    window.fetch = function (url, opts) {
      if (typeof url === 'string' && url.startsWith(base)) {
        opts = opts || {};
        opts.headers = opts.headers || {};
        if (opts.headers instanceof Headers) {
          if (!opts.headers.has('Authorization')) opts.headers.set('Authorization', 'Bearer ' + token);
        } else if (Array.isArray(opts.headers)) {
          if (!opts.headers.some(function (h) { return h[0].toLowerCase() === 'authorization'; })) {
            opts.headers.push(['Authorization', 'Bearer ' + token]);
          }
        } else {
          if (!opts.headers['Authorization'] && !opts.headers['authorization']) {
            opts.headers['Authorization'] = 'Bearer ' + token;
          }
        }
      }
      return _origFetch.call(this, url, opts);
    };
  }
})();
