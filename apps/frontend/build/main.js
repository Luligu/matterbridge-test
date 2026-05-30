// matterbridge-test plugin frontend

const BASE = '/plugins/matterbridge-test';

async function fetchCard(path, dotEl, valueEl) {
  try {
    const res = await fetch(`${BASE}/api/${path}`);
    const data = await res.json();
    dotEl.classList.toggle('online', res.ok);
    valueEl.textContent = typeof data === 'object' ? JSON.stringify(data) : String(data);
  } catch {
    dotEl.classList.remove('online');
    valueEl.textContent = 'Error';
  }
}

// GET /api/valid → onFetch returns a value → 200 JSON
fetchCard('valid', document.getElementById('dot-valid'), document.getElementById('value-valid'));
// GET /api/invalid → onFetch returns undefined → 404 JSON error
fetchCard('invalid', document.getElementById('dot-invalid'), document.getElementById('value-invalid'));

async function methodCard(method, path, body, dotEl, valueEl) {
  try {
    const options = { method };
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE}/api/${path}`, options);
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
    const res = await fetch(`${BASE}/unknown`);
    const text = await res.text();
    const ok = res.ok && text.includes('<title>matterbridge-test</title>');
    dotEl.classList.toggle('online', ok);
    valueEl.textContent = ok ? 'index.html' : 'Error';
  } catch {
    dotEl.classList.remove('online');
    valueEl.textContent = 'Error';
  }
})();
