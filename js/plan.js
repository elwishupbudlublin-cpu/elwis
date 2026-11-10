/* ELWIS – rzut z powiększaniem i przesuwaniem (dotyk, mysz), znaczniki urządzeń. */
function PlanView(box, imgUrl, markers, onTap) {
  const layer = document.createElement('div'); layer.className = 'layer';
  const img = new Image(); img.src = imgUrl; img.alt = 'Rzut';
  layer.appendChild(img); box.appendChild(layer);
  let s = 1, tx = 0, ty = 0, W = 1, H = 1, minS = 0.1;
  const pts = new Map(); let last = null, moved = false, start = null, tap = false, tapTimer = 0;
  const TAP_TOL = 12;   // px – drżenie palca nie jest przesunięciem
  const HIT = 28;       // px – promień trafienia znacznika na ekranie

  const M = 40; // px marginesu przy krawędzi
  function clamp() {
    const r = box.getBoundingClientRect();
    const cw = W * s, ch = H * s;
    // mniejszy niż okno → zostaje w oknie; większy → krawędź rzutu nie odjedzie dalej niż margines
    const lim = (t, c, v) => c <= v ? Math.min(Math.max(t, Math.min(0, v - c) - M), Math.max(0, v - c) + M) : Math.min(Math.max(t, v - c - M), M);
    tx = lim(tx, cw, r.width); ty = lim(ty, ch, r.height);
  }
  function apply() {
    clamp();
    layer.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    layer.style.setProperty('--inv', String(1 / s));
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
  img.onload = () => {
    W = img.naturalWidth; H = img.naturalHeight;
    img.style.width = W + 'px'; img.style.height = H + 'px';
    layer.style.width = W + 'px'; layer.style.height = H + 'px';
    for (const m of markers) {
      const b = document.createElement('button');
      b.className = 'mk ' + m.cls; b.dataset.id = m.id; b.style.left = (m.x * 100) + '%'; b.style.top = (m.y * 100) + '%';
      b.setAttribute('aria-label', m.label); b.title = m.label;
      layer.appendChild(b);
    }
    fit();
  };
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.planctl')) return; // przyciski powiększenia działają zwykłym kliknięciem
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { moved = false; start = { x: e.clientX, y: e.clientY }; }
    last = null; });
  box.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      if (!moved && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_TOL) moved = true;
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
    let best = null, bd = HIT;
    for (const m of markers) {
      const d = Math.hypot(r.left + tx + m.x * W * s - x, r.top + ty + m.y * H * s - y);
      if (d < bd) { bd = d; best = m; }
    }
    if (best) onTap(best.id);
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
  return {
    box,
    recolor(fn) { layer.querySelectorAll('.mk').forEach(b => { const r = fn(b.dataset.id); b.className = 'mk ' + r.cls; b.title = r.label; b.setAttribute('aria-label', r.label); }); },
    zoomIn() { const r = box.getBoundingClientRect(); zoomAt(1.3, r.width / 2, r.height / 2); },
    zoomOut() { const r = box.getBoundingClientRect(); zoomAt(1 / 1.3, r.width / 2, r.height / 2); },
    fit,
    wskaz(fn) { wskaz = fn; box.classList.toggle('wskaz', !!fn); if (!fn && pin) { pin.remove(); pin = null; } },
    focus(id) {
      const m = markers.find(x => x.id === id); if (!m) return;
      const r = box.getBoundingClientRect(); s = Math.max(s, Math.min(r.width / W, r.height / H) * 3);
      tx = r.width / 2 - m.x * W * s; ty = r.height / 2 - m.y * H * s; apply();
    }
  };
}
