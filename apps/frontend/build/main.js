// matterbridge-test plugin frontend

// Resolve requests from the script directory:
// - normal: /plugins/matterbridge-test/main.js -> /plugins/matterbridge-test/api/info
// - Hass Ingress: /api/hassio_ingress/<token>/plugins/matterbridge-test/main.js -> /api/hassio_ingress/<token>/plugins/matterbridge-test/api/info
const BASE_URL = new URL('.', document.currentScript?.src ?? window.location.href);

function pluginUrl(path) {
  return new URL(path, BASE_URL);
}

async function fetchCard(path, dotEl, valueEl) {
  try {
    const res = await fetch(pluginUrl(`api/${path}`));
    const data = await res.json();
    dotEl.classList.toggle('online', res.ok);
    valueEl.textContent = typeof data === 'object' ? JSON.stringify(data) : String(data);
  } catch {
    dotEl.classList.remove('online');
    valueEl.textContent = 'Error';
  }
}

// GET /api/info → onFetch returns plugin info → 200 JSON
fetchCard('info', document.getElementById('dot-info'), document.getElementById('value-info'));
// GET /api/info?verbose=true&limit=5 → onFetch receives the parsed query → 200 JSON echoing it back
fetchCard('info?verbose=true&limit=5', document.getElementById('dot-query'), document.getElementById('value-query'));
// GET /api/devices → onFetch returns the registered devices list → 200 JSON
fetchCard('devices', document.getElementById('dot-devices'), document.getElementById('value-devices'));
// GET /api/invalid → onFetch returns undefined → 404 JSON error
fetchCard('invalid', document.getElementById('dot-invalid'), document.getElementById('value-invalid'));

async function methodCard(method, path, body, dotEl, valueEl) {
  try {
    const options = { method };
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(pluginUrl(`api/${path}`), options);
    dotEl.classList.toggle('online', res.ok);
    if (res.status === 204) { valueEl.textContent = '204 No Content'; return; }
    const data = await res.json();
    valueEl.textContent = typeof data === 'object' ? JSON.stringify(data) : String(data);
  } catch {
    dotEl.classList.remove('online');
    valueEl.textContent = 'Error';
  }
}

// POST /api/resource + JSON body → onFetch returns a value → 200 JSON
methodCard('POST',   'resource', { action: 'create'  }, document.getElementById('dot-post'),   document.getElementById('value-post'));
// PUT  /api/resource + JSON body → onFetch returns a value → 200 JSON
methodCard('PUT',    'resource', { action: 'replace' }, document.getElementById('dot-put'),    document.getElementById('value-put'));
// PATCH /api/resource + JSON body → onFetch returns a value → 200 JSON
methodCard('PATCH',  'resource', { action: 'update'  }, document.getElementById('dot-patch'),  document.getElementById('value-patch'));
// DELETE /api/resource → onFetch returns non-undefined → 204 No Content (no body)
methodCard('DELETE', 'resource', undefined,             document.getElementById('dot-delete'), document.getElementById('value-delete'));

// GET /unknown → no static file, no API route → SPA fallback serves index.html → 200 HTML
(async () => {
  const dotEl = document.getElementById('dot-spa');
  const valueEl = document.getElementById('value-spa');
  try {
    const res = await fetch(pluginUrl('unknown'));
    const text = await res.text();
    const ok = res.ok && text.includes('<title>matterbridge-test</title>');
    dotEl.classList.toggle('online', ok);
    valueEl.textContent = ok ? 'index.html' : 'Error';
  } catch {
    dotEl.classList.remove('online');
    valueEl.textContent = 'Error';
  }
})();
