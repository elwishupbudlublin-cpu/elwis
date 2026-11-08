/* ELWIS – komunikacja ze skryptem Apps Script (zamknięta lista operacji, patrz docs/API.md). */
const APP_VERSION = '1.11.6';

const API = (() => {
  let cfg = null; // {url, key, tablet}
  async function load() { cfg = await DB.get('cfg'); return cfg; }
  function ready() { return !!(cfg && cfg.url && cfg.key); }

  async function get(action, params = {}) {
    const q = new URLSearchParams({ action, key: cfg.key, v: APP_VERSION, ...params });
    const r = await fetch(cfg.url + (cfg.url.includes('?') ? '&' : '?') + q.toString(), { method: 'GET', redirect: 'follow' });
    return parse(r);
  }
  async function post(body) {
    const r = await fetch(cfg.url, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key: cfg.key, v: APP_VERSION, ...body })
    });
    return parse(r);
  }
  async function parse(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Błąd serwera');
    return j;
  }

  /* Test konfiguracji przy pierwszym uruchomieniu */
  async function test(url, key) {
    const saved = cfg; cfg = { url, key };
    try { const b = await get('bootstrap'); return b; } finally { cfg = saved; }
  }

  return {
    load, ready, test,
    setCfg: async (c) => { cfg = c; await DB.set('cfg', c); },
    cfg: () => cfg,
    bootstrap: (pamiec) => get('bootstrap', pamiec ? { pamiec } : {}),
    project: (kod) => get('project', { kod }),
    techniczne: () => get('techniczne'),
    plan: (od, d) => get('plan', { od, do: d, kto: S.user ? S.user.name : '' }),
    file: (id, part) => get('file', part === undefined ? { id } : { id, part }),
    /* Plik w częściach (serwer 1.2+); stary serwer zwraca od razu cały plik. */
    async fileFull(id, onProgress) {
      const first = await get('file', { id, part: 0 });
      const parts = first.parts || 1, chunks = [U.b64ToBlob(first.b64, first.mime)];
      for (let i = 1; i < parts; i++) {
        if (onProgress) onProgress(i, parts);
        const r = await get('file', { id, part: i });
        chunks.push(U.b64ToBlob(r.b64, first.mime));
      }
      return { name: first.name, mime: first.mime, blob: new Blob(chunks, { type: first.mime }) };
    },
    events: (kod, since) => get('events', { kod, since: String(since || 0) }),
    foto: (kod, fid) => get('foto', { kod, fid }),
    push: (kod, events, photos) => post({ action: 'push', kod, events, photos }),
    docx: (kod, pid) => post({ action: 'docx', kod, pid, kto: S.user ? S.user.name : '' })
  };
})();

/* Pomocnicze */
const U = {
  esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  uid: p => p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
  now: () => new Date().toISOString(),
  day: d => (d ? new Date(d) : new Date()).toLocaleDateString('sv-SE'),
  fmt: d => { const x = new Date(d); return x.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) + ' ' + x.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); },
  norm: s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'),
  prefix: id => (String(id).match(/^[A-Za-z]+/) || [''])[0].toUpperCase(),
  async sha256(str) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  },
  b64ToBlob(b64, mime) { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); },
  blobToB64: blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); }),
  async compress(file, max = 1600, q = 0.75) {
    const img = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return new Promise(res => c.toBlob(res, 'image/jpeg', q));
  }
};
