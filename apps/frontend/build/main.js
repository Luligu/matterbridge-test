// matterbridge-test plugin frontend

const BASE = '/plugins/matterbridge-test';

async function fetchCard(path, dotEl, valueEl) {
  try {
    const res = await fetch(`${BASE}/get/${path}`);
    const data = await res.json();
    dotEl.classList.toggle('online', res.ok);
    valueEl.textContent = typeof data === 'object' ? JSON.stringify(data) : String(data);
  } catch {
    dotEl.classList.remove('online');
    valueEl.textContent = 'Error';
  }
}

fetchCard('valid', document.getElementById('dot-valid'), document.getElementById('value-valid'));
fetchCard('invalid', document.getElementById('dot-invalid'), document.getElementById('value-invalid'));
