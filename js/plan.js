/* ELWIS – rzut z powiększaniem i przesuwaniem (dotyk, mysz), znaczniki urządzeń. */
/* od 1.61.0: rząd kwadracików pod kropką – jeden na krok; zrobiony = zielony */
function sqHtml(k) {
  return k && k.length ? `<span class="sqs" aria-hidden="true">${k.map(v => `<i class="${v ? 'on' : ''}"></i>`).join('')}</span>` : '';
}

function PlanView(box, imgUrl, markers, onTap, opt) {
  opt = opt || {};
  const layer = document.createElement('div'); layer.className = 'layer';
  const img = new Image(); img.src = imgUrl; img.alt = 'Rzut';
  layer.appendChild(img); box.appendChild(layer);
  let s = 1, tx = 0, ty = 0, W = 1, H = 1, minS = 0.1, loaded = false, czekaFocus = null;
  const pts = new Map(); let last = null, moved = false, start = null, tap = false, tapTimer = 0;
  const TAP_TOL = 12;   // px – drżenie palca nie jest przesunięciem
  const HIT = 28;       // px – promień trafienia znacznika na ekranie
  const HOLD = 2000;    // ms – przytrzymanie znacznika 2 s = przesuwanie (od 1.30.0, opt.onMove)
  let hold = 0, drag = null, trzym = null, wielo = false;
  const puscTrzym = () => { if (trzym) { trzym.classList.remove('trzym'); trzym = null; } };

  const M = 40; // px marginesu przy krawędzi
  function clamp() {
    const r = box.getBoundingClientRect();
    const cw = W * s, ch = H * s;
    // mniejszy niż okno → zostaje w oknie; większy → krawędź rzutu nie odjedzie dalej niż margines
    const lim = (t, c, v) => c <= v ? Math.min(Math.max(t, Math.min(0, v - c) - M), Math.max(0, v - c) + M) : Math.min(Math.max(t, v - c - M), M);
    tx = lim(tx, cw, r.width); ty = lim(ty, ch, r.height);
  }
  /* od 1.61.0: kwadraciki kroków (.sqs) nad kropką – przy oddalaniu kropki zbliżają się i kwadraciki nachodziłyby na siebie:
     każdy znacznik dostaje tyle podniesienia (--lift, px ekranu), żeby jego rząd nie kolidował z już ułożonymi wyżej/niżej. */
  const SQ_W = 42, SQ_H = 12;   // px ekranu – szerokość rzędu kwadracików i skok podniesienia
  function sqLift() {
    if (!markers || !loaded) return;
    const pos = markers.map(m => ({ m, x: tx + (m.px != null ? m.px : m.x) * W * s + (m.dx || 0), y: ty + (m.py != null ? m.py : m.y) * H * s, lift: 0 }))
      .sort((a, b) => a.x - b.x);
    const ulozone = [];
    for (const p of pos) {
      let ok = false;
      while (!ok) {
        ok = true;
        for (const q of ulozone) {
          if (Math.abs(p.x - q.x) < SQ_W && Math.abs(p.lift - q.lift) < SQ_H) { p.lift = q.lift + SQ_H; ok = false; break; }
        }
      }
      ulozone.push(p);
      const b = layer.querySelector(`.mk[data-id="${CSS.escape(p.m.id)}"]`);
      if (b) b.style.setProperty('--lift', String(p.lift));
    }
  }
  function apply() {
    clamp();
    layer.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    layer.style.setProperty('--inv', String(1 / s));
    sqLift();
  }
  function fit() {
    const r = box.getBoundingClientRect();
    s = Math.min(r.width / W, r.height / H); minS = s * 0.8;
    tx = (r.width - W * s) / 2; ty = (r.height - H * s) / 2; apply();
  }
  function zoomAt(f, cx, cy) {
    const ns = Math.max(minS, Math.min(s * f, 6));
    tx = cx - (cx - tx) * (ns / s); ty = cy - (cy - ty) * (ns / s); s = ns; apply();
  }
  // od 1.30.3: urządzenia w (prawie) tym samym miejscu rzutu – kropki obok siebie, stykające się bokiem (stały odstęp na ekranie, przy każdym powiększeniu)
  const BLISKO = 0.006, KROP = 30;
  function rozsun() {
    const grp = markers.map((m, i) => i);
    const f = i => grp[i] === i ? i : (grp[i] = f(grp[i]));
    markers.forEach((a, i) => markers.forEach((b, j) => { if (j > i && Math.abs(a.x - b.x) < BLISKO && Math.abs(a.y - b.y) < BLISKO) grp[f(j)] = f(i); }));
    const g = {}; markers.forEach((m, i) => { (g[f(i)] = g[f(i)] || []).push(m); });
    Object.values(g).forEach(arr => {
      const cx = arr.reduce((a, m) => a + m.x, 0) / arr.length, cy = arr.reduce((a, m) => a + m.y, 0) / arr.length;
      arr.sort((a, b) => a.x - b.x || String(a.id).localeCompare(String(b.id), 'pl', { numeric: true }));
      arr.forEach((m, k) => { m.px = arr.length > 1 ? cx : m.x; m.py = arr.length > 1 ? cy : m.y; m.dx = arr.length > 1 ? (k - (arr.length - 1) / 2) * KROP : 0; });
    });
  }
  function ustaw(b, m) {
    b.style.left = (m.px * 100) + '%'; b.style.top = (m.py * 100) + '%';
    b.style.marginLeft = m.dx ? `calc(${-15 + m.dx}px*var(--inv,1))` : '';
  }
  img.onload = () => {
    W = img.naturalWidth; H = img.naturalHeight;
    img.style.width = W + 'px'; img.style.height = H + 'px';
    layer.style.width = W + 'px'; layer.style.height = H + 'px';
    rozsun();
    for (const m of markers) {
      const b = document.createElement('button');
      b.className = 'mk ' + m.cls; b.dataset.id = m.id; ustaw(b, m); b.innerHTML = sqHtml(m.kroki);
      b.setAttribute('aria-label', m.label); b.title = m.label;
      layer.appendChild(b);
    }
    fit(); loaded = true; sqLift();
    if (czekaFocus) { const id = czekaFocus; czekaFocus = null; api.focus(id); }
  };
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.planctl')) return; // przyciski powiększenia działają zwykłym kliknięciem
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { moved = false; start = { x: e.clientX, y: e.clientY }; }
    clearTimeout(hold); puscTrzym();
    if (pts.size >= 2) wielo = true;   // od 1.30.3: 2+ palce (np. powiększanie) – bez odliczania do przesuwania aż do zdjęcia wszystkich palców
    if (pts.size === 1 && opt.onMove && !wskaz && !wielo) {
      const m = najblizszy(e.clientX, e.clientY);
      const el0 = m && layer.querySelector(`.mk[data-id="${CSS.escape(m.id)}"]`);
      if (el0) { trzym = el0; el0.classList.add('trzym'); }   // otoczka rośnie przez 2 s przytrzymania
      if (m) hold = setTimeout(() => {
        if (trzym) { trzym.classList.remove('trzym'); trzym = null; }
        if (moved || pts.size !== 1 || wielo) return;
        const el = layer.querySelector(`.mk[data-id="${CSS.escape(m.id)}"]`); if (!el) return;
        drag = { m, el, fx: m.x, fy: m.y, ruch: false }; el.classList.add('drag'); box.classList.add('przesuw');
        if (navigator.vibrate) navigator.vibrate(30);
      }, HOLD);
    }
    last = null; });
  box.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag) {   // przesuwanie znacznika palcem
      const r = box.getBoundingClientRect();
      drag.fx = Math.min(1, Math.max(0, (e.clientX - r.left - tx) / (W * s))); drag.fy = Math.min(1, Math.max(0, (e.clientY - r.top - ty) / (H * s)));
      drag.el.style.left = (drag.fx * 100) + '%'; drag.el.style.top = (drag.fy * 100) + '%'; drag.el.style.marginLeft = '';
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_TOL) drag.ruch = true;
      return;
    }
    if (pts.size === 1) {
      if (!moved && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_TOL) { moved = true; puscTrzym(); }
      if (moved) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; apply(); }
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = box.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
      if (last) zoomAt(dist / last, cx, cy);
      last = dist; moved = true;
    }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    const single = pts.size === 1;
    pts.delete(e.pointerId); if (pts.size < 2) last = null;
    clearTimeout(hold); puscTrzym();
    if (!pts.size) wielo = false;
    if (drag) {
      const d = drag; drag = null; box.classList.remove('przesuw'); tap = false;
      const wroc = () => { d.el.classList.remove('drag'); ustaw(d.el, d.m); };
      if (!d.ruch || e.type !== 'pointerup') { wroc(); return; }
      const fx = Math.round(d.fx * 1e4) / 1e4, fy = Math.round(d.fy * 1e4) / 1e4;
      opt.onMove(d.m.id, fx, fy, wroc, () => { d.el.classList.remove('drag'); d.m.x = fx; d.m.y = fy; rozsun(); layer.querySelectorAll('.mk[data-id]').forEach(b => { const m = markers.find(x => x.id === b.dataset.id); if (m) ustaw(b, m); }); });
      return;
    }
    tap = single && !moved && e.type === 'pointerup';
    // długie przytrzymanie: Android nie wysyła wtedy „click” – otwieramy sami po chwili
    clearTimeout(tapTimer);
    if (tap) { const x = e.clientX, y = e.clientY; tapTimer = setTimeout(() => { if (tap) { tap = false; pick(x, y); } }, 450); }
  };
  // tryb wskazywania miejsca (od 1.15.0 – „Dodaj urządzenie”): dotknięcie zwraca pozycję w ułamkach arkusza
  let wskaz = null, pin = null;
  function pick(x, y) {
    const r = box.getBoundingClientRect();
    if (wskaz) {
      const fx = (x - r.left - tx) / (W * s), fy = (y - r.top - ty) / (H * s);
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
      if (!pin) { pin = document.createElement('div'); pin.className = 'mk nowy'; layer.appendChild(pin); }
      pin.style.left = (fx * 100) + '%'; pin.style.top = (fy * 100) + '%';
      wskaz(Math.round(fx * 1e4) / 1e4, Math.round(fy * 1e4) / 1e4); return;
    }
    const best = najblizszy(x, y);
    if (best) onTap(best.id);
  }
  function najblizszy(x, y) {
    const r = box.getBoundingClientRect(); let best = null, bd = HIT;
    for (const m of markers) {
      const d = Math.hypot(r.left + tx + (m.px != null ? m.px : m.x) * W * s + (m.dx || 0) - x, r.top + ty + (m.py != null ? m.py : m.y) * H * s - y);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  // Wybór znacznika dopiero na zdarzeniu „click” (po pointerup). Otwarcie okna wcześniej powodowało,
  // że kliknięcie generowane przez Androida trafiało w tło nowego okna i od razu je zamykało.
  box.addEventListener('click', e => {
    if (e.target.closest('.planctl')) return;
    if (e.detail === 0 && e.target.classList.contains('mk') && !wskaz) { onTap(e.target.dataset.id); return; } // klawiatura
    const ok = tap; tap = false; clearTimeout(tapTimer);
    if (ok) pick(e.clientX, e.clientY);
  });
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('wheel', e => { e.preventDefault(); const r = box.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const api = {
    box,
    recolor(fn) { layer.querySelectorAll('.mk').forEach(b => { const r = fn(b.dataset.id); b.className = 'mk ' + r.cls; b.title = r.label; b.setAttribute('aria-label', r.label); b.innerHTML = sqHtml(r.kroki); }); },
    zoomIn() { const r = box.getBoundingClientRect(); zoomAt(1.3, r.width / 2, r.height / 2); },
    zoomOut() { const r = box.getBoundingClientRect(); zoomAt(1 / 1.3, r.width / 2, r.height / 2); },
    fit,
    wskaz(fn) { wskaz = fn; box.classList.toggle('wskaz', !!fn); if (!fn && pin) { pin.remove(); pin = null; } },
    focus(id) {
      // od 1.31.1: rzut jeszcze się wczytuje (duży plik) – wskazanie po wczytaniu, inaczej fit() cofało widok do całego rzutu
      if (!loaded) { czekaFocus = id; return; }
      const m = markers.find(x => x.id === id); if (!m) return;
      const r = box.getBoundingClientRect(); s = Math.max(s, Math.min(r.width / W, r.height / H) * 3);
      tx = r.width / 2 - (m.px != null ? m.px : m.x) * W * s - (m.dx || 0); ty = r.height / 2 - (m.py != null ? m.py : m.y) * H * s; apply();
      // od 1.31.0: kropka pulsuje przez ok. 1 s, żeby była dobrze widoczna
      const el = layer.querySelector(`.mk[data-id="${CSS.escape(id)}"]`);
      if (el) { el.classList.remove('puls'); void el.offsetWidth; el.classList.add('puls'); setTimeout(() => el.classList.remove('puls'), 1100); }
    }
  };
  return api;
}
