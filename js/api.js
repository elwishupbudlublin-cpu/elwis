/* ELWIS – komunikacja ze skryptem Apps Script (zamknięta lista operacji, patrz docs/API.md). */
const APP_VERSION = '1.59.0';

const API = (() => {
  let cfg = null; // {url, key, tablet}
  async function load() { cfg = await DB.get('cfg'); return cfg; }
  function ready() { return !!(cfg && cfg.url && cfg.key); }

  /* Oczekiwanie na serwer (od 1.56.1): każde zapytanie ma limit czasu, a oczekujące są widoczne z odliczaniem.
     et = etykieta działania wywołanego przyciskiem (pasek „Czekam na serwer” z przyciskiem Przerwij);
     bez etykiety = praca w tle (odliczanie przy wskaźniku synchronizacji). */
  const LIMIT = { bootstrap: 45, project: 90, events: 60, plan: 60, powiad: 30, techniczne: 60, priorytety: 90, file: 90, foto: 60,
    push: 120, zadNowe: 120, pc: 120, czas: 120, zadania: 90, zakupy: 90, docx: 120 };
  const W = new Map(); let wid = 0, fgEt = null;
  async function req(action, url, opts) {
    const lim = LIMIT[action] || 60, ctrl = new AbortController(), id = ++wid;
    const w = { id, action, et: fgEt, start: Date.now(), lim: lim * 1000, ctrl, timeout: false };
    W.set(id, w); API.onWait();
    const tm = setTimeout(() => { w.timeout = true; ctrl.abort(); }, lim * 1000);
    try { const r = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal })); return await parse(r); }
    catch (e) {
      if (e && e.name === 'AbortError') { const er = new Error(w.timeout ? `Serwer nie odpowiedział w ${lim} s – spróbuj ponownie` : 'Przerwano'); er.timeout = w.timeout; er.przerwane = !w.timeout; throw er; }
      if (e instanceof TypeError) { const er = new Error('Brak połączenia z serwerem'); er.siec = true; throw er; }
      throw e;
    } finally { clearTimeout(tm); W.delete(id); API.onWait(); }
  }
  async function get(action, params = {}) {
    const q = new URLSearchParams({ action, key: cfg.key, v: APP_VERSION, ...params });
    return req(action, cfg.url + (cfg.url.includes('?') ? '&' : '?') + q.toString(), { method: 'GET', redirect: 'follow' });
  }
  async function post(body) {
    return req(body.action, cfg.url, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key: cfg.key, v: APP_VERSION, ...body })
    });
  }
  /* Działanie z przycisku: fg('Szukam terminu', () => API.zadNowe(...)) */
  function fg(et, fn) { const st = fgEt; fgEt = et; try { return fn(); } finally { fgEt = st; } }
  async function parse(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Błąd serwera');
    return j;
  }

  /* Test konfiguracji przy pierwszym uruchomieniu */
  async function test(url, key) {
    const saved = cfg; cfg = { url, key };
    try { const b = await fg('Sprawdzam połączenie', () => get('bootstrap')); return b; } finally { cfg = saved; }
  }

  return {
    load, ready, test, fg,
    onWait: () => { },
    oczekujace: () => [...W.values()],
    przerwij: (id) => { const w = W.get(id); if (w) w.ctrl.abort(); },
    setCfg: async (c) => { cfg = c; await DB.set('cfg', c); },
    cfg: () => cfg,
    bootstrap: (pamiec) => get('bootstrap', pamiec ? { pamiec } : {}),
    project: (kod) => get('project', { kod }),
    techniczne: () => get('techniczne'),
    plan: (od, d) => get('plan', { od, do: d, kto: S.user ? S.user.name : '' }),
    powiad: (since) => get('powiad', { since: String(since || 0), kto: S.user ? S.user.name : '' }),
    zadNowe: (d) => post(Object.assign({ action: 'zadNowe', kto: S.user ? S.user.name : '' }, d)),   // od 1.56.0: warianty terminu / zaplanowanie zadania
    pc: (d) => post(Object.assign({ action: 'pc', kto: S.user ? S.user.name : '' }, d)),   // od 1.57.0: panel biura na PC
    czas: (d) => post(Object.assign({ action: 'czas', kto: S.user ? S.user.name : '' }, d)),   // od 1.58.0: czas pracy
    priorytety: (odswiez) => get('priorytety', Object.assign({ kto: S.user ? S.user.name : '' }, odswiez ? { odswiez: '1' } : {})),
    zadania: (zmiany) => post({ action: 'zadania', zmiany }),
    zakupy: (o) => post(Object.assign({ action: 'zakupy' }, o || {})),   // od 1.48.0: zapotrzebowania
    file: (id, part) => get('file', part === undefined ? { id } : { id, part }),
    /* Plik w częściach (serwer 1.2+); stary serwer zwraca od razu cały plik. */
    async fileFull(id, onProgress) {
      const et = fgEt, g = (o) => fg(et, () => get('file', o));
      const first = await g({ id, part: 0 });
      const parts = first.parts || 1, chunks = [U.b64ToBlob(first.b64, first.mime)];
      for (let i = 1; i < parts; i++) {
        if (onProgress) onProgress(i, parts);
        const r = await g({ id, part: i });
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
  /* Święto ustawowe w Polsce (od 1.56.2): nazwa albo '' – stałe daty, Wielkanoc (algorytm Gaussa / Meeusa) i święta ruchome; Wigilia od 2025 */
  swieto: function(k) {
    const y = +k.slice(0, 4), md = k.slice(5);
    const st = { '01-01': 'Nowy Rok', '01-06': 'Trzech Króli', '05-01': 'Święto Pracy', '05-03': 'Święto Konstytucji 3 Maja', '08-15': 'Wniebowzięcie NMP', '11-01': 'Wszystkich Świętych', '11-11': 'Święto Niepodległości', '12-24': 'Wigilia', '12-25': 'Boże Narodzenie', '12-26': 'Boże Narodzenie (2. dzień)' };
    if (md === '12-24' && y < 2025) return '';
    if (st[md]) return st[md];
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), kk = c % 4, l = (32 + 2 * e + 2 * i - h - kk) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mies = Math.floor((h + l - 7 * m + 114) / 31), dz = ((h + l - 7 * m + 114) % 31) + 1, wlk = Date.UTC(y, mies - 1, dz);
    const r = Math.round((Date.UTC(y, +md.slice(0, 2) - 1, +md.slice(3)) - wlk) / 864e5);
    return { 0: 'Wielkanoc', 1: 'Poniedziałek Wielkanocny', 49: 'Zielone Świątki', 60: 'Boże Ciało' }[r] || '';
  },
  wolny: k => { const w = new Date(k + 'T12:00:00Z').getUTCDay(); return w === 0 || w === 6 || !!U.swieto(k); },
  // krok ze Słowników: „Podłączony [puszka HupBud | puszka b. el.]” → {n:'Podłączony', op:['puszka HupBud','puszka b. el.']} (od 1.22.0)
  krok(k) { const m = String(k || '').match(/^(.*?)\s*\[([^\]]*)\]\s*$/); if (!m) return { n: String(k || ''), op: [] }; const op = m[2].split('|').map(x => x.trim()).filter(Boolean); return op.length ? { n: m[1].trim(), op } : { n: String(k), op: [] }; },
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
  /* Archiwum ZIP bez kompresji (od 1.35.0) – JPG i tak są skompresowane; files: [{ name, data: Uint8Array }] */
  zip(files) {
    const T = U._crcT || (U._crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }));
    const crc = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = T[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
    const hdr = (n) => { const b = new DataView(new ArrayBuffer(n)); return b; };
    files.forEach(f => {
      const nm = enc.encode(f.name), c = crc(f.data), sz = f.data.length;
      const l = hdr(30); l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(8, 0, true);
      l.setUint32(14, c, true); l.setUint32(18, sz, true); l.setUint32(22, sz, true); l.setUint16(26, nm.length, true);
      parts.push(l.buffer, nm, f.data);
      const h = hdr(46); h.setUint32(0, 0x02014b50, true); h.setUint16(4, 20, true); h.setUint16(6, 20, true); h.setUint16(8, 0x0800, true);
      h.setUint32(16, c, true); h.setUint32(20, sz, true); h.setUint32(24, sz, true); h.setUint16(28, nm.length, true); h.setUint32(42, off, true);
      cen.push(h.buffer, nm); off += 30 + nm.length + sz;
    });
    const cl = cen.reduce((a, x) => a + (x.byteLength || x.length), 0);
    const e = hdr(22); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...cen, e.buffer], { type: 'application/zip' });
  },
  async compress(file, max = 1600, q = 0.75, opis = null, rot = 0) {
    const img = await createImageBitmap(file);
    // od 1.54.2: obrót o dowolny kąt (stopnie) – całe zdjęcie mieści się w obróconym kadrze (narożniki tła ciemne), bez przycinania
    const a = ((rot % 360) + 360) % 360 * Math.PI / 180, cs = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a));
    const bw = img.width * cs + img.height * sn, bh = img.width * sn + img.height * cs;
    const s = Math.min(1, max / Math.max(bw, bh));
    const c = document.createElement('canvas'); c.width = Math.round(bw * s); c.height = Math.round(bh * s);
    const g = c.getContext('2d');
    if (a) { g.fillStyle = '#111827'; g.fillRect(0, 0, c.width, c.height); g.translate(c.width / 2, c.height / 2); g.rotate(a); g.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s); g.setTransform(1, 0, 0, 1, 0, 0); }
    else g.drawImage(img, 0, 0, c.width, c.height);
    if (opis && opis.length) {   // opis wtopiony w lewy górny róg (od 1.12.0): budowa, urządzenie, data, autor
      const fs = Math.max(14, Math.round(Math.min(c.width, c.height) / 32)), pad = Math.round(fs * 0.6), lh = Math.round(fs * 1.3);
      g.font = `600 ${fs}px Inter, system-ui, sans-serif`; g.textBaseline = 'top';
      const linie = opis.map(x => String(x)).map(x => { let t = x; while (t.length > 4 && g.measureText(t).width > c.width - 4 * pad) t = t.slice(0, -2); return t === x ? t : t + '…'; });
      const w = Math.max(...linie.map(t => g.measureText(t).width)) + 2 * pad, h = linie.length * lh + 2 * pad - (lh - fs);
      g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(pad, pad, w, h);
      g.fillStyle = '#fff'; linie.forEach((t, i) => g.fillText(t, 2 * pad, 2 * pad + i * lh));
    }
    return new Promise(res => c.toBlob(res, 'image/jpeg', q));
  }
};
