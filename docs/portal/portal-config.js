/* Portal API Configuration
   Reads from localStorage:
   - portal_api_base: tunnel URL (e.g. "https://aarons-mac-mini.tail0dc185.ts.net")
   - portal_api_token: Bearer token for gateway auth

   Each dashboard sets window.PORTAL_SERVICE before loading this script
   (e.g. "mission-control", "isarv", "fitness").

   When a base URL is configured, API paths like "/api/dashboard" become
   "https://.../api/mission-control/dashboard" to match the gateway's
   routing pattern /api/<service>/<path>.

   Automatic localhost fallback: if the tunnel URL fails (e.g. on the same
   machine where Tailscale resolves to a private IP), retries via
   http://localhost:5080 so the portal works both locally and remotely. */

(function () {
  var base = (localStorage.getItem('portal_api_base') || '').replace(/\/+$/, '');
  var token = localStorage.getItem('portal_api_token') || '';
  var service = window.PORTAL_SERVICE || '';
  var LOCAL_GATEWAY = 'http://localhost:5080';
  var useLocal = false; // flipped on first tunnel failure

  window.portalApiUrl = function (path) {
    var target = useLocal ? LOCAL_GATEWAY : base;
    if (!target) return path;
    if (service && path.startsWith('/api/')) {
      path = '/api/' + service + '/' + path.slice(5);
    }
    return target + path;
  };

  if (!base || !token) return;

  var _origFetch = window.fetch;

  function addAuth(url, opts) {
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
    return opts;
  }

  window.fetch = function (url, opts) {
    if (typeof url !== 'string') return _origFetch.call(this, url, opts);

    // Requests to the tunnel or localhost gateway get auth injected
    if (url.startsWith(base) || url.startsWith(LOCAL_GATEWAY)) {
      opts = addAuth(url, opts);
    }

    // If already using local fallback, go straight to localhost
    if (useLocal && url.startsWith(base)) {
      url = LOCAL_GATEWAY + url.slice(base.length);
      return _origFetch.call(this, url, opts);
    }

    if (!url.startsWith(base)) return _origFetch.call(this, url, opts);

    // Try tunnel first, fallback to localhost on network error
    return _origFetch.call(this, url, opts).catch(function () {
      useLocal = true;
      var localUrl = LOCAL_GATEWAY + url.slice(base.length);
      console.log('[portal-config] Tunnel unreachable, falling back to ' + LOCAL_GATEWAY);
      return _origFetch.call(this, localUrl, addAuth(localUrl, opts));
    });
  };
})();
