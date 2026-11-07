/* ELWIS – rzut z powiększaniem i przesuwaniem (dotyk, mysz), znaczniki urządzeń. */
function PlanView(box, imgUrl, markers, onTap) {
  const layer = document.createElement('div'); layer.className = 'layer';
  const img = new Image(); img.src = imgUrl; img.alt = 'Rzut';
  layer.appendChild(img); box.appendChild(layer);
  let s = 1, tx = 0, ty = 0, W = 1, H = 1, minS = 0.1;
  const pts = new Map(); let last = null, moved = false;

  function apply() {
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
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; last = null; });
  box.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      tx += dx; ty += dy; apply();
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
    // dotknięcie bez przesunięcia = wybór znacznika (przechwycenie wskaźnika kieruje zdarzenie do ramki, więc szukamy znacznika pod palcem)
    if (single && !moved && e.type === 'pointerup') {
      const el = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains('mk') && layer.contains(x));
      if (el) onTap(el.dataset.id);
    }
  };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('wheel', e => { e.preventDefault(); const r = box.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  return {
    box,
    recolor(fn) { layer.querySelectorAll('.mk').forEach(b => { const r = fn(b.dataset.id); b.className = 'mk ' + r.cls; b.title = r.label; b.setAttribute('aria-label', r.label); }); },
    zoomIn() { const r = box.getBoundingClientRect(); zoomAt(1.3, r.width / 2, r.height / 2); },
    zoomOut() { const r = box.getBoundingClientRect(); zoomAt(1 / 1.3, r.width / 2, r.height / 2); },
    fit,
    focus(id) {
      const m = markers.find(x => x.id === id); if (!m) return;
      const r = box.getBoundingClientRect(); s = Math.max(s, Math.min(r.width / W, r.height / H) * 3);
      tx = r.width / 2 - m.x * W * s; ty = r.height / 2 - m.y * H * s; apply();
    }
  };
}
