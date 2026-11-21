/* ELWIS – panel biura na komputerze (od 1.57.0).
   Ta sama aplikacja: na szerokim ekranie (≥ 1200 px) i dla roli biuro – menu boczne i ekrany w tabelach.
   Dane administracyjne – tylko podgląd (zmiany jak dotąd w Bazie projektów). */
const PC = {
  wyl: false,   // „Widok tabletu” wybrany na komputerze (zapamiętany na urządzeniu)
  szeroki() { return window.matchMedia('(min-width: 1200px)').matches; },
  on() { return !!(S.user && Session.isBiuro() && !podw() && this.szeroki() && !this.wyl); },
  async init() {
    this.wyl = !!(await DB.get('pcWyl'));
    // od 1.57.0: Esc zamyka okno jak jego przycisk „Anuluj” / „Zamknij” (okna z niezapisanymi zmianami pytają same)
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !this.on() || !modal.innerHTML.trim()) return;
      const bt = [...modal.querySelectorAll('button')].reverse().find(b => /^(Anuluj|Zamknij|Wróć|×|✕)$/.test(b.textContent.trim()) || b.classList.contains('x') || b.dataset.close != null);
      e.preventDefault(); if (bt) bt.click(); else UI.close();
    }); window.addEventListener('resize', () => { clearTimeout(this._rz); this._rz = setTimeout(() => UI.refresh(), 250); }); },
  IKO: {
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M4 10h16M9 3v4M15 3v4"></path>',
    day: '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M4 10h16M9 3v4M15 3v4M9 14h3v3H9z"></path>',
    bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>',
    home: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5"></path>',
    warn: '<path d="M12 3 2 20h20L12 3zM12 10v5M12 17.5v.5"></path>',
    doc: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"></path>',
    cart: '<path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3"></path><circle cx="10" cy="19.5" r="1.5"></circle><circle cx="17" cy="19.5" r="1.5"></circle>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"></path>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"></path>',
    users: '<circle cx="9" cy="8" r="3.5"></circle><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"></path>',
    tab: '<rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M11 18h2"></path>',
    dict: '<path d="M4 5h16M4 10h16M4 15h10M4 20h7"></path>',
    gear: '<circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>',
    swap: '<path d="M4 7h14l-3-3M20 17H6l3 3"></path>'
  },
  ico(k) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${this.IKO[k] || ''}</svg>`; },
  MENU: [
    ['Plan', [['pcTydz', 'Harmonogram tygodnia', 'cal'], ['plan', 'Plan dnia', 'day'], ['pcObc', 'Obciążenie ekip', 'bars']]],
    ['Budowy', [['pcBud', 'Budowy', 'home'], ['pcBraki', 'Braki', 'warn'], ['pcProt', 'Protokoły', 'doc'], ['dokumenty', 'Dokumenty techniczne', 'book', { typ: 'tech' }]]],
    ['Biuro', [['zakupy', 'Zapotrzebowania', 'cart'], ['powiad', 'Powiadomienia', 'bell'], ['zmiany', 'Ostatnie zmiany', 'list'], ['wydajnosc', 'Wydajność ekip', 'bars']]],
    ['Administracja · podgląd', [['pcAdmin', 'Pracownicy', 'users', { tab: 'pracownicy' }], ['pcAdmin', 'Tablety', 'tab', { tab: 'tablety' }], ['pcAdmin', 'Słowniki', 'dict', { tab: 'slowniki' }], ['pcAdmin', 'Protokoły (definicje)', 'doc', { tab: 'protokoly' }], ['pcAdmin', 'Konfiguracja', 'gear', { tab: 'konfiguracja' }]]]
  ],
  /* menu boczne – po każdym przerysowaniu ekranu */
  nav() {
    const on = this.on();
    document.body.classList.toggle('pc', on);
    let wl = $('#pcWlacz');
    const pokazWl = !on && this.wyl && S.user && Session.isBiuro() && !podw() && this.szeroki();
    if (pokazWl && !wl) { wl = document.createElement('button'); wl.id = 'pcWlacz'; wl.className = 'btn sm'; wl.innerHTML = this.ico('swap') + ' Widok komputera'; wl.onclick = async () => { this.wyl = false; await DB.set('pcWyl', false); UI.refresh(); }; document.body.appendChild(wl); }
    if (wl) wl.hidden = !pokazWl;
    const n = $('#pcNav'); if (!n) return;
    n.hidden = !on; if (!on) return;
    const akt = (v, p) => UI.cur === v && (!p || Object.keys(p).every(k => (UI.par || {})[k] === p[k]));
    // od 1.57.0: będąc w budowie – jej ekrany w menu (jak kafelki na tablecie)
    const wBud = S.kod && ['budowa', 'rzut', 'braki', 'protokoly', 'protokol', 'notatki', 'zdjecia', 'postep'].includes(UI.cur) || (S.kod && UI.cur === 'dokumenty' && (UI.par || {}).typ === 'proj');
    const pb = wBud && ((S.boot && S.boot.projekty) || []).find(x => x.kod === S.kod);
    const BUD = [['budowa', 'Przegląd budowy', 'home'], ['rzut', 'Urządzenia i rzuty', 'tab'], ['braki', 'Braki i tematy', 'warn'], ['protokoly', 'Protokoły', 'doc', null, 'protokol'], ['zdjecia', 'Zdjęcia', 'day'], ['notatki', 'Notatki', 'list'], ['postep', 'Postęp', 'bars'], ['dokumenty', 'Dokumenty projektowe', 'book', { typ: 'proj' }]];
    const budHtml = pb ? `<div class="pcbud"><div class="pcbk">${U.esc(pb.kod)}</div><div class="pcbn2">${U.esc(String(pb.nazwa || '').replace(pb.kod, '').trim())}</div>` +
      BUD.map(([v, t, i, p, v2]) => `<button class="pcmi${UI.cur === v || UI.cur === v2 ? ' on' : ''}" data-v="${v}" data-p='${U.esc(JSON.stringify(p || {}))}'>${this.ico(i)}<span>${U.esc(t)}</span></button>`).join('') +
      `<button class="pcmi" id="pcBInfo">${this.ico('gear')}<span>Informacje o budowie</span></button></div>` : '';
    const html = `<div class="pcbrand"><span class="logo">ELW<span class="elwis-i">I</span>S</span><small>panel biura · v${APP_VERSION}</small></div>` + budHtml +
      this.MENU.map(([g, items]) => `<div class="pcgr">${U.esc(g)}</div>` + items.map(([v, t, i, p], ix) =>
        `<button class="pcmi${!wBud && (akt(v, p) || (v === 'zmiany' && UI.cur === 'priorytety')) || (wBud && v === 'pcBud') ? ' on' : ''}" data-v="${v}" data-p='${U.esc(JSON.stringify(p || {}))}'>${this.ico(i)}<span>${U.esc(t)}</span>${v === 'pcBraki' ? '<span class="pcbn" id="pcBrN" hidden></span>' : v === 'powiad' ? '<span class="pcbn" id="pcPowN" hidden></span>' : v === 'zakupy' ? '<span class="pcbn" id="pcZakN" hidden></span>' : ''}</button>`).join('')).join('') +
      `<div class="grow"></div><button class="pcmi pcwyl" id="pcWyl">${this.ico('swap')}<span>Widok tabletu</span></button>`;
    if (n._h !== html) {
      n._h = html; n.innerHTML = html;
      n.querySelectorAll('[data-v]').forEach(b => b.onclick = () => UI.go(b.dataset.v, JSON.parse(b.dataset.p || '{}')));
      $('#pcWyl').onclick = async () => { this.wyl = true; await DB.set('pcWyl', true); UI.refresh(); };
      if ($('#pcBInfo')) $('#pcBInfo').onclick = () => Dialogs.infoBudowy(S.kod);
    }
    this.plakietki();
  },
  plakietki() {
    const kop = (z, na) => { const a = $(z), b = $(na); if (!b) return; b.hidden = !a || a.hidden; b.textContent = a ? a.textContent : ''; };
    kop('#nPowN', '#pcPowN'); kop('#nZakN', '#pcZakN');
    const b = $('#pcBrN'); if (b && this._brN != null) { b.hidden = !this._brN; b.textContent = this._brN; }
  },
  /* ekran panelu: tytuł, przyciski akcji, treść */
  widok(tytul, akcje, html, opis) {
    UI.header(tytul);
    $('#view').innerHTML = `<div class="pcw"><div class="pchead"><div class="grow"><h1>${U.esc(tytul)}</h1>${opis ? `<p class="mute">${opis}</p>` : ''}</div><div class="pcakc">${akcje || ''}</div></div>${html}</div>`;
  },
  /* dane budów zapisanych na komputerze: projekt, zdarzenia, złożony stan */
  async dane() {
    if (this._dane && Date.now() - this._dane.at < 20000) return this._dane.l;
    const out = [];
    for (const p of (S.boot && S.boot.projekty) || []) {
      const proj = await DB.get('proj:' + p.kod); if (!proj) continue;
      const ev = await DB.eventsFor(p.kod);
      out.push({ p, proj, F: fold(ev) });
    }
    this._dane = { at: Date.now(), l: out };
    this._brN = out.reduce((n, x) => n + Object.values(x.F.braki).filter(b => !b.zamk).length, 0);
    return out;
  },
  /* pobranie danych budów bez plików (rzuty i dokumenty – przy otwarciu budowy); świeże budowy pomijane */
  async pobierz(kody, wymus, onProg) {
    let i = 0;
    for (const kod of kody) {
      i++;
      const pp = ((S.boot && S.boot.projekty) || []).find(x => x.kod === kod) || {};
      const ma = await DB.get('proj:' + kod), seq = (await DB.get('seq:' + kod)) || 0, ts = (await DB.get('projTs:' + kod)) || 0;
      if (!wymus && ma && pp.zd != null && seq >= pp.zd && Date.now() - ts < 6 * 3600e3) continue;
      if (onProg) onProg(i, kody.length);
      try { await Sync.pullProject(kod, false, null, { bezPlikow: true }); } catch (e) { console.warn('pc pobierz', kod, e); }
    }
    this._dane = null;
  },
  /* wszystkie aktywne budowy w pamięci komputera (synchronizacja i porządki) */
  kodyAktywne() { return ((S.boot && S.boot.projekty) || []).filter(p => dostepDoBudowy(p)).map(p => p.kod); },
  async otworzBud(kod) {
    await wczytajBudowe(kod);
    const r = ((await DB.get('recent')) || []).filter(k => k !== kod); r.unshift(kod); await DB.set('recent', r.slice(0, PAMIEC_BUDOW));
  },
  /* tabela z wierszy arkusza (pierwszy wiersz = nagłówek) */
  tabela(w, opc = {}) {
    if (!w || !w.length) return '<p class="mute">Brak danych.</p>';
    const [h, ...r] = w;
    return `<div class="pctw"><table class="pct"><thead><tr>${h.map(x => `<th>${U.esc(x)}</th>`).join('')}</tr></thead><tbody>${r.filter(x => x.some(v => String(v).trim())).map(x => `<tr>${h.map((_, i) => `<td${opc.kl ? ` class="${opc.kl(x[i], i, x) || ''}"` : ''}>${U.esc(x[i] == null ? '' : x[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  },
  poniedzialek(k) { const d = new Date(k + 'T12:00:00'); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return U.day(d); },
  plus(k, n) { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return U.day(d); },
  dm(k) { const d = new Date(k + 'T12:00:00'); return d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0'); },
  dzienTyg(k) { return new Date(k + 'T12:00:00').toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', ''); },
  data(ts) { if (!ts) return ''; const d = new Date(ts); return isNaN(d) ? '' : d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); },
  dni(ts) { return ts ? Math.floor((Date.now() - new Date(ts).getTime()) / 864e5) : 0; }
};

/* ---------- ekrany panelu ---------- */
Object.assign(Views, {
  /* Harmonogram tygodnia: osoby × dni, zadania z ClickUp (plan ±7 dni) */
  async pcTydz(par) {
    if (!PC.on()) return UI.go('plan', {}, { zastap: true });
    const dzis = U.day(new Date()), pon = par.t || PC.poniedzialek(dzis);
    const dni = [0, 1, 2, 3, 4, 5, 6].map(i => PC.plus(pon, i));
    const pl = (await DB.get('plan')) || null;
    const kol = (await DB.get('zadKolejka')) || [];
    if (UI.cur !== 'pcTydz') return;
    const zad = ((pl && pl.zadania) || []).map(t => { const q = kol.filter(z => z.task === t.id).pop(); return q ? { ...t, status: q.status, czeka: true, zamk: q.status === 'complete' } : t; });
    const prac = ((S.boot && S.boot.pracownicy) || []).filter(x => x.cu).slice().sort((a, b) => (String(a.ekipa || 'z') + a.name).localeCompare(String(b.ekipa || 'z') + b.name, 'pl'));
    const proj = (S.boot && S.boot.projekty) || [];
    const budowaZ = t => proj.find(p => p.listaCU && p.listaCU === t.lista);
    const kodZ = t => { const b = budowaZ(t); return b ? b.kod : String(t.listaNazwa || '').split(' ')[0]; };
    const godz = d => { const x = new Date(d); return x.getHours() + (x.getMinutes() ? ':' + String(x.getMinutes()).padStart(2, '0') : ''); };
    const hDnia = (t, k) => {
      const s = t.start ? U.day(new Date(t.start)) : U.day(new Date(t.koniec)), e = U.day(new Date(t.koniec));
      if (t.godzStart && t.godzKoniec && s === e) return (t.koniec - t.start) / 36e5;
      if (t.godzStart && t.godzKoniec) return U.wolny(k) ? 0 : 8;   // wielodniowe z godzinami – cały dzień pracy
      if (t.est) { let n = 0; for (let d = s; d <= e; d = PC.plus(d, 1)) if (!U.wolny(d)) n++; return U.wolny(k) ? 0 : t.est / 36e5 / Math.max(1, n); }
      return null;
    };
    const kl = t => { const k = STATUS_ZAD[String(t.status || '').toLowerCase()]; return t.zamk ? 'st-ok' : k ? 'st-' + k.kl : ''; };
    const zakres = pl && pl.zadania ? null : 'Plan pobierze się przy synchronizacji.';
    const poza = dni.some(d => Math.abs((new Date(d) - new Date(dzis)) / 864e5) > 7);
    const naglowek = `<tr><th class="pcos">Osoba</th>${dni.map(k => { const sw = U.swieto(k);
      return `<th class="${U.wolny(k) ? 'wolne' : ''}${k === dzis ? ' dzis' : ''}" title="${sw ? U.esc(sw) : ''}"><button class="pcdz" data-d="${k}">${PC.dzienTyg(k)} <b>${PC.dm(k)}</b>${sw ? `<small>${U.esc(sw)}</small>` : ''}</button></th>`; }).join('')}<th>Suma</th></tr>`;
    let ekPop = null;
    const wiersze = prac.map(o => {
      const gr = String(o.ekipa || '') !== ekPop ? `<tr class="pcgrw"><td colspan="9">${o.ekipa ? 'Ekipa ' + U.esc(o.ekipa) : o.rola === 'biuro' ? 'Biuro' : 'Pozostali'}</td></tr>` : '';
      ekPop = String(o.ekipa || '');
      let suma = 0, nieokr = false;
      const kom = dni.map(k => {
        const lista = zad.filter(t => naDzien(t, k) && t.osoby.includes(String(o.cu)));
        let h = 0, q = false;
        const chipy = lista.map(t => { const x = hDnia(t, k); if (x == null) q = true; else h += x;
          const czas = t.godzStart ? godz(t.start) + (t.godzKoniec ? '–' + godz(t.koniec) : '') : x ? String(Math.round(x * 2) / 2).replace('.', ',') + ' h' : 'cały dzień';
          return `<button class="pczd ${kl(t)}" data-t="${U.esc(t.id)}" title="${U.esc(t.nazwa)}"><span class="pczk">${U.esc(kodZ(t))} · ${U.esc(czas)}</span><span class="pczn">${U.esc(t.nazwa)}</span></button>`; }).join('');
        suma += h; nieokr = nieokr || q;
        const pr = Math.min(100, Math.round(h / 8 * 100));
        return `<td class="${U.wolny(k) ? 'wolne' : ''}${k === dzis ? ' dzis' : ''}">${chipy}${lista.length ? `<div class="pcobc" title="${String(Math.round(h * 2) / 2).replace('.', ',')} h z 8 h${q ? ' + zadania bez czasu' : ''}"><i class="${h > 8 ? 'nad' : h >= 6 ? 'pel' : 'mal'}" style="width:${pr}%"></i></div>` : ''}</td>`;
      }).join('');
      return gr + `<tr><td class="pcos"><b>${U.esc(o.name)}</b>${S.user && o.name === S.user.name ? ' <small>(ja)</small>' : ''}</td>${kom}<td class="pcsum">${String(Math.round(suma * 2) / 2).replace('.', ',')} h${nieokr ? '<small> + ?</small>' : ''}</td></tr>`;
    }).join('');
    PC.widok('Harmonogram tygodnia',
      `<button class="btn sm" id="tP">‹ Poprzedni</button><button class="btn sm" id="tD">Ten tydzień</button><button class="btn sm" id="tN">Następny ›</button><button class="btn sm pri" id="tNZ">${ic('plus')} Nowe zadanie</button>`,
      `${zakres || poza ? `<p class="pcinfo">${zakres || 'Plan z ClickUp obejmuje 7 dni wstecz i 7 dni naprzód od dziś – dalsze dni mogą być niepełne.'}</p>` : ''}
       <div class="pctw"><table class="pct pctyd"><thead>${naglowek}</thead><tbody>${wiersze}</tbody></table></div>
       <p class="mute pcleg"><span class="pczd st-ok">wykonane</span> <span class="pczd st-update">do kontynuacji</span> <span class="pczd st-hold">niepodjęte</span> · pasek – zajęte godziny z 8 h · dzień tygodnia otwiera plan dnia</p>`,
      `${PC.dm(dni[0])} – ${PC.dm(dni[6])}.${dni[6].slice(0, 4)}`);
    $('#tP').onclick = () => UI.go('pcTydz', { t: PC.plus(pon, -7) }, { zastap: true });
    $('#tN').onclick = () => UI.go('pcTydz', { t: PC.plus(pon, 7) }, { zastap: true });
    $('#tD').onclick = () => UI.go('pcTydz', {}, { zastap: true });
    $('#tNZ').onclick = () => Dialogs.noweZadanie(null, dni.includes(dzis) ? dzis : pon);
    $('#view').querySelectorAll('[data-d]').forEach(b => b.onclick = () => UI.go('plan', { d: b.dataset.d, all: true }));
    $('#view').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = zad.find(x => x.id === b.dataset.t); if (t) Dialogs.zadanie(t, budowaZ(t), osobyTxt(t, (S.boot && S.boot.pracownicy) || [])); });
  },

  /* Obciążenie ekip – zakładka „Obciążenie” z Bazy (liczy serwer) */
  async pcObc(par) {
    if (!PC.on()) return UI.go('plan', {}, { zastap: true });
    const pokaz = (d, laduje) => {
      if (UI.cur !== 'pcObc') return;
      const w = (d && d.wiersze) || [];
      const stan = w[0] ? w[0][1] : '', leg = w[0] ? w[0][2] : '';
      const h = w[2] || [];
      let i = 3; const os = []; while (i < w.length && w[i].some(v => String(v).trim())) os.push(w[i++]);
      const zad = w.slice(i + 1).filter(r => r.some(v => String(v).trim()));
      const klDz = (v, ix) => {
        if (ix < 3) return '';
        const s = String(v).trim(); if (!s) return 'o-wol';
        if (s === 'Ś') return 'o-sw'; if (/^(U|L4)/.test(s)) return 'o-nb';
        const m = s.match(/^([\d,.]+)\/(\d+)/);
        if (m) { const r = Number(m[1].replace(',', '.')) / Number(m[2]); return r >= 0.95 ? 'o-pel' : r >= 0.6 ? 'o-sr' : r > 0 ? 'o-mal' : 'o-wol'; }
        const n = Number(s.replace('?', '').replace(',', '.')); if (isNaN(n)) return '';
        return n >= 8 ? 'o-pel' : n >= 5 ? 'o-sr' : n > 0 ? 'o-mal' : 'o-wol';
      };
      PC.widok('Obciążenie ekip', `<button class="btn sm" id="oP">Przelicz teraz</button>${d && d.baza ? '' : ''}`,
        laduje && !w.length ? '<p class="mute">Wczytuję obciążenie z Bazy…</p>' : !w.length ? '<p class="mute">Brak danych – zakładka „Obciążenie” powstanie po pierwszym przeliczeniu (przycisk „Przelicz teraz”).</p>' :
        `${leg ? `<p class="mute pcleg">${U.esc(leg)}</p>` : ''}
         <div class="pctw"><table class="pct pcobct"><thead><tr>${h.map(x => `<th>${U.esc(x)}</th>`).join('')}</tr></thead>
         <tbody>${os.map(r => `<tr>${h.map((_, ix) => `<td class="${klDz(r[ix], ix)}">${U.esc(r[ix] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
         <h2 class="pch2">Otwarte zadania w okresie (${zad.length - 1 > 0 ? zad.length - 1 : 0})</h2>
         ${zad.length ? `<div class="pctw"><table class="pct"><thead><tr>${zad[0].map(x => `<th>${U.esc(x)}</th>`).join('')}</tr></thead><tbody>${zad.slice(1).map(r => `<tr class="${/ZALEGŁE/.test(r[6]) ? 'o-zal' : ''}">${r.map((v, ix) => `<td>${ix === 7 && v ? `<a href="${U.esc(v)}" target="_blank" rel="noopener">ClickUp ↗</a>` : U.esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}`,
        (stan ? 'Stan na ' + U.esc(stan) : '') + (laduje ? ' · odświeżam…' : ''));
      $('#oP').onclick = async () => {
        $('#oP').disabled = true;
        try { const r = await API.fg('Przeliczam obciążenie ekip', () => API.pc({ co: 'obciazenie', swieze: true })); await DB.set('pcObc', r); pokaz(r); }
        catch (e) { UI.toast('Nie udało się: ' + e.message); if ($('#oP')) $('#oP').disabled = false; }
      };
    };
    const c = await DB.get('pcObc'); pokaz(c, true);
    if (!navigator.onLine) return pokaz(c);
    try { const r = await API.pc({ co: 'obciazenie' }); await DB.set('pcObc', r); pokaz(r); } catch (e) { pokaz(c); UI.toast('Obciążenie: ' + e.message); }
  },

  /* Budowy – tabela z licznikami */
  async pcBud(par) {
    if (!PC.on()) return UI.go('home', {}, { zastap: true });
    const all = (S.boot && S.boot.projekty) || [];
    const off = new Set(await Pamiec.lista());
    const LM = await liczLokalne(all);
    if (UI.cur !== 'pcBud') return;
    const so = Object.assign({ k: 'kod', d: 1 }, (await DB.get('pcSortBud')) || {});
    const q = par.q || '';
    const naz = p => String(p.nazwa || '').replace(p.kod, '').trim() || p.nazwa;
    const KOL = [['kod', 'Kod'], ['naz', 'Nazwa'], ['kier', 'Kierownik'], ['w', 'Urządz.'], ['d', 'Rozp.'], ['p', 'Podł.'], ['u', 'Uruch.'], ['r', 'Do rozp.'], ['f', 'Front'], ['b', 'Braki'], ['nt', 'Notatki'], ['t', 'Ostatni wpis'], ['off', 'Na PC']];
    const wart = (p, k) => { const L = LM[p.kod] || {}; return k === 'kod' ? p.kod : k === 'naz' ? naz(p) : k === 'kier' ? (p.kierownik || '') : k === 'off' ? (off.has(p.kod) ? 1 : 0) : k === 't' ? (L.t || '') : (L[k] != null ? L[k] : -1); };
    const nq = U.norm(q);
    const lista = all.filter(p => !nq || U.norm([p.kod, p.nazwa, p.adres, p.kierownik].join(' ')).includes(nq))
      .sort((a, b) => { const x = wart(a, so.k), y = wart(b, so.k); return (typeof x === 'number' && typeof y === 'number' ? x - y : so.k === 'kod' ? natCmp(String(x), String(y)) : String(x).localeCompare(String(y), 'pl')) * so.d; });
    const brakPC = all.filter(p => !off.has(p.kod) && dostepDoBudowy(p)).length;
    const pct = (L, k) => L && L.w ? `<small>${Math.round(L[k] / L.w * 100)}%</small>` : '';
    PC.widok('Budowy', `<input class="pcq" id="bQ" placeholder="Szukaj: kod, nazwa, adres, kierownik" value="${U.esc(q)}"><button class="btn sm" id="bPob">Pobierz dane wszystkich budów${brakPC ? ` (${brakPC})` : ''}</button>`,
      `<div class="pctw"><table class="pct pcbud"><thead><tr>${KOL.map(([k, t]) => `<th><button class="pcsrt${so.k === k ? ' on' : ''}" data-s="${k}">${t}${so.k === k ? (so.d > 0 ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr></thead>
       <tbody>${lista.map(p => { const L = LM[p.kod];
         return `<tr class="pcrow" data-k="${U.esc(p.kod)}"><td><b>${U.esc(p.kod)}</b></td><td>${U.esc(naz(p))}${p.wojskowy === 'tak' ? ' <span class="chip warn">W</span>' : ''}</td><td>${U.esc(p.kierownik || '')}</td>
           ${L ? `<td>${L.w}</td><td>${L.d} ${pct(L, 'd')}</td><td>${L.p} ${pct(L, 'p')}</td><td>${L.u} ${pct(L, 'u')}</td><td>${L.r != null ? L.r : ''}</td><td>${L.f || ''}</td><td class="${L.b ? 'o-bad' : ''}">${L.b || ''}</td><td>${L.nt || ''}</td><td>${L.t ? U.esc(PC.data(L.t)) + (L.k ? ` <small>${U.esc(L.k)}</small>` : '') : ''}</td>` : '<td colspan="9" class="mute">liczniki po pobraniu danych budowy</td>'}
           <td>${off.has(p.kod) ? '✓' : ''}</td></tr>`; }).join('')}</tbody></table></div>
       <p class="mute pcleg">Wiersz otwiera budowę. „Na PC” – dane budowy w pamięci komputera (bez rzutów i dokumentów, te pobierają się przy otwarciu).</p>`,
      `${all.length} aktywnych budów`);
    { let tm; $('#bQ').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { UI.par.q = e.target.value; Views.pcBud(UI.par).then(() => { const i = $('#bQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); }; }
    $('#view').querySelectorAll('[data-s]').forEach(b => b.onclick = async () => { const k = b.dataset.s; await DB.set('pcSortBud', { k, d: so.k === k ? -so.d : 1 }); Views.pcBud(UI.par); });
    $('#view').querySelectorAll('[data-k]').forEach(r => r.onclick = () => openProject(r.dataset.k));
    $('#bPob').onclick = async () => {
      if (!navigator.onLine) return UI.toast('Brak internetu.');
      $('#bPob').disabled = true;
      await PC.pobierz(PC.kodyAktywne(), false, (i, n) => { const b = $('#bPob'); if (b) b.textContent = `Pobieram dane budów ${i}/${n}…`; });
      UI.toast('Dane budów pobrane'); if (UI.cur === 'pcBud') Views.pcBud(UI.par);
    };
  },

  /* Braki ze wszystkich budów zapisanych na komputerze */
  async pcBraki(par) {
    if (!PC.on()) return UI.go('home', {}, { zastap: true });
    PC.widok('Braki', '', '<p class="mute">Zbieram braki z budów…</p>');
    const D = await PC.dane(); if (UI.cur !== 'pcBraki') return;
    const all = (S.boot && S.boot.projekty) || [];
    const wiersze = [];
    D.forEach(({ p, proj, F }) => Object.values(F.braki).forEach(b => {
      const u = (proj.urzadzenia || []).find(x => x.id === b.urz);
      wiersze.push({ kod: p.kod, b, urz: b.urz ? b.urz + (u && u.oz ? ' · ' + u.oz : '') : '(bez urządzenia)' });
    }));
    const f = Object.assign({ st: 'otw', odp: '', kod: '', kat: '', q: '' }, par.f || {});
    const opc = (arr, wyb, pusty) => `<option value="">${pusty}</option>` + [...new Set(arr.filter(Boolean))].sort((a, b) => natCmp(a, b)).map(v => `<option${v === wyb ? ' selected' : ''}>${U.esc(v)}</option>`).join('');
    const filtruj = () => wiersze.filter(({ kod, b, urz }) => (f.st === 'wsz' || (f.st === 'otw' ? !b.zamk : !!b.zamk)) && (!f.odp || b.odp === f.odp) && (!f.kod || kod === f.kod) && (!f.kat || b.kat === f.kat)
      && (!f.q || U.norm([kod, urz, b.opis, b.kat, b.odp, b.kto].join(' ')).includes(U.norm(f.q))))
      .sort((x, y) => (!x.b.zamk === !y.b.zamk ? (x.b.ts < y.b.ts ? -1 : 1) : x.b.zamk ? 1 : -1));
    const otw = wiersze.filter(x => !x.b.zamk);
    const podsum = `<div class="pcsum4"><div><b>${otw.length}</b><span>otwartych</span></div><div><b>${otw.filter(x => x.b.blokuje).length}</b><span>blokujących pracę</span></div><div><b>${otw.filter(x => PC.dni(x.b.ts) > 14).length}</b><span>starszych niż 14 dni</span></div>${[...new Set(otw.map(x => x.b.odp || 'bez odpowiedzialnego'))].map(o => `<div><b>${otw.filter(x => (x.b.odp || 'bez odpowiedzialnego') === o).length}</b><span>${U.esc(o)}</span></div>`).join('')}</div>`;
    const brakPC = all.filter(p => dostepDoBudowy(p)).length - D.length;
    PC.widok('Braki',
      `<select id="fSt"><option value="otw"${f.st === 'otw' ? ' selected' : ''}>Otwarte</option><option value="zam"${f.st === 'zam' ? ' selected' : ''}>Zamknięte</option><option value="wsz"${f.st === 'wsz' ? ' selected' : ''}>Wszystkie</option></select>
       <select id="fKod">${opc(wiersze.map(x => x.kod), f.kod, 'Wszystkie budowy')}</select>
       <select id="fOdp">${opc(wiersze.map(x => x.b.odp), f.odp, 'Każdy odpowiedzialny')}</select>
       <select id="fKat">${opc(wiersze.map(x => x.b.kat), f.kat, 'Każda kategoria')}</select>
       <input class="pcq" id="fQ" placeholder="Szukaj" value="${U.esc(f.q)}">`,
      `${brakPC > 0 ? `<p class="pcinfo">${brakPC} ${odm(brakPC, 'budowa nie jest', 'budowy nie są', 'budów nie jest')} jeszcze w pamięci komputera – <button class="btn sm" id="bPob">Pobierz dane wszystkich budów</button></p>` : ''}
       ${podsum}<div id="pcBrT"></div>`,
      `${D.length} ${odm(D.length, 'budowa', 'budowy', 'budów')} w pamięci komputera`);
    const rys = () => {
      const l = filtruj();
      $('#pcBrT').innerHTML = !l.length ? '<p class="mute">Brak braków dla wybranych filtrów.</p>' :
        `<div class="pctw"><table class="pct"><thead><tr><th>Budowa</th><th>Urządzenie</th><th>Kategoria</th><th>Odpowiedzialny</th><th>Opis</th><th>Zgłosił</th><th>Wiek</th><th>Zdj.</th><th>Kom.</th><th>Stan</th></tr></thead>
         <tbody>${l.map(({ kod, b, urz }) => `<tr class="pcrow${b.blokuje && !b.zamk ? ' o-blok' : ''}" data-k="${U.esc(kod)}" data-b="${U.esc(b.id)}"><td><b>${U.esc(kod)}</b></td><td>${U.esc(urz)}</td><td>${U.esc(b.kat || '')}</td><td>${U.esc(b.odp || '–')}</td><td class="pcopis">${U.esc(b.opis || '')}${b.blokuje ? ' <span class="chip warn">blokuje</span>' : ''}</td><td>${U.esc(b.kto || '')}<br><small>${U.esc(PC.data(b.ts))}</small></td><td>${b.zamk ? '' : PC.dni(b.ts) + ' d'}</td><td>${(b.foto || []).length || ''}</td><td>${b.kom.length || ''}</td><td>${b.zamk ? `zamknięty<br><small>${U.esc(b.zamk.kto || '')} ${U.esc(PC.data(b.zamk.ts))}</small>` : '<b class="o-badt">otwarty</b>'}</td></tr>`).join('')}</tbody></table></div>`;
      $('#pcBrT').querySelectorAll('[data-b]').forEach(r => r.onclick = async () => { await PC.otworzBud(r.dataset.k); UI.go('braki', {}); Dialogs.brakOkno(r.dataset.b); });
    };
    const zm = (k, v) => { f[k] = v; UI.par.f = Object.assign({}, f); UI.zapamietaj(); rys(); };
    $('#fSt').onchange = e => zm('st', e.target.value); $('#fKod').onchange = e => zm('kod', e.target.value); $('#fOdp').onchange = e => zm('odp', e.target.value); $('#fKat').onchange = e => zm('kat', e.target.value);
    let tm; $('#fQ').oninput = e => { clearTimeout(tm); tm = setTimeout(() => zm('q', e.target.value), 250); };
    if ($('#bPob')) $('#bPob').onclick = async () => { $('#bPob').disabled = true; await PC.pobierz(PC.kodyAktywne(), false, (i, n) => { const b = $('#bPob'); if (b) b.textContent = `Pobieram ${i}/${n}…`; }); if (UI.cur === 'pcBraki') Views.pcBraki(UI.par); };
    rys(); PC.plakietki();
  },

  /* Protokoły ze wszystkich budów zapisanych na komputerze */
  async pcProt(par) {
    if (!PC.on()) return UI.go('home', {}, { zastap: true });
    PC.widok('Protokoły', '', '<p class="mute">Zbieram protokoły z budów…</p>');
    const D = await PC.dane(); if (UI.cur !== 'pcProt') return;
    const defs = (S.boot && S.boot.protokoly) || [];
    const ST_P = { roboczy: 'szkic', gotowy: 'przesłany', zablokowany: 'zamknięty' };
    const f = Object.assign({ st: '', kod: '' }, par.f || {});
    const w = [];
    D.forEach(({ p, proj, F }) => Object.values(F.prot).forEach(x => { const d = defs.find(z => z.id === x.def) || {}; const u = (proj.urzadzenia || []).find(z => z.id === x.urz);
      w.push({ kod: p.kod, x, naz: d.nazwa || x.def || '', urz: x.urz ? x.urz + (u && u.oz ? ' · ' + u.oz : '') : '' }); }));
    w.sort((a, b) => (a.x.ts < b.x.ts ? 1 : -1));
    const opc = (arr, wyb, pusty, map) => `<option value="">${pusty}</option>` + [...new Set(arr.filter(Boolean))].sort().map(v => `<option value="${U.esc(v)}"${v === wyb ? ' selected' : ''}>${U.esc(map ? map(v) : v)}</option>`).join('');
    PC.widok('Protokoły', `<select id="pSt">${opc(Object.keys(ST_P), f.st, 'Każdy stan', v => ST_P[v])}</select><select id="pKod">${opc(w.map(r => r.kod), f.kod, 'Wszystkie budowy')}</select>`,
      '<div id="pcPrT"></div>', `${w.length} protokołów z ${D.length} ${odm(D.length, 'budowy', 'budów', 'budów')} w pamięci komputera`);
    const rys = () => {
      const l = w.filter(r => (!f.st || r.x.stan === f.st) && (!f.kod || r.kod === f.kod));
      $('#pcPrT').innerHTML = !l.length ? '<p class="mute">Brak protokołów dla wybranych filtrów.</p>' :
        `<div class="pctw"><table class="pct"><thead><tr><th>Budowa</th><th>Numer</th><th>Protokół</th><th>Urządzenie</th><th>Stan</th><th>Ostatni zapis</th></tr></thead><tbody>${l.map(r => `<tr class="pcrow" data-k="${U.esc(r.kod)}" data-p="${U.esc(r.x.pid)}"><td><b>${U.esc(r.kod)}</b></td><td>${U.esc(r.x.nr || '–')}</td><td>${U.esc(r.naz)}${r.x.wersja ? ` <small>v${U.esc(r.x.wersja)}</small>` : ''}</td><td>${U.esc(r.urz)}</td><td>${U.esc(ST_P[r.x.stan] || r.x.stan)}</td><td>${U.esc(r.x.kto || '')} <small>${U.esc(PC.data(r.x.ts))}</small></td></tr>`).join('')}</tbody></table></div>`;
      $('#pcPrT').querySelectorAll('[data-p]').forEach(r => r.onclick = async () => { await PC.otworzBud(r.dataset.k); UI.go('protokol', { pid: r.dataset.p }); });
    };
    const zm = (k, v) => { f[k] = v; UI.par.f = Object.assign({}, f); UI.zapamietaj(); rys(); };
    $('#pSt').onchange = e => zm('st', e.target.value); $('#pKod').onchange = e => zm('kod', e.target.value);
    rys();
  },

  /* Administracja – podgląd zakładek Bazy (bez PIN-ów i kluczy tabletów) */
  async pcAdmin(par) {
    if (!PC.on()) return UI.go('plan', {}, { zastap: true });
    const TABS = [['pracownicy', 'Pracownicy'], ['tablety', 'Tablety'], ['slowniki', 'Słowniki'], ['protokoly', 'Protokoły'], ['konfiguracja', 'Konfiguracja']];
    const tab = par.tab || 'pracownicy', nazwa = (TABS.find(t => t[0] === tab) || TABS[0])[1];
    const pokaz = (d, laduje) => {
      if (UI.cur !== 'pcAdmin' || (UI.par.tab || 'pracownicy') !== tab) return;
      const w = d && d[tab];
      const kl = tab === 'pracownicy' || tab === 'tablety' ? (v, i, r) => (i === (tab === 'pracownicy' ? 3 : 2) && /^nie$/i.test(String(v).trim()) ? 'o-nb' : '') : null;
      PC.widok(nazwa, `${TABS.map(([k, t]) => `<button class="btn sm${k === tab ? ' pri' : ''}" data-tab="${k}">${t}</button>`).join('')}${d && d.baza ? `<a class="btn sm" href="${U.esc(d.baza)}" target="_blank" rel="noopener">Otwórz Bazę projektów ↗</a>` : ''}`,
        `<p class="pcinfo">Tylko podgląd. Zmiany – jak dotąd w Bazie projektów (lub przez Claude po akceptacji). ${tab === 'pracownicy' ? 'Kolumna PIN nie jest pokazywana.' : tab === 'tablety' ? 'Klucze synchronizacji nie są pokazywane.' : ''}</p>
         ${!w ? `<p class="mute">${laduje ? 'Wczytuję z Bazy…' : 'Brak danych – wymagana aktualizacja serwera ELWIS (1.57.0).'}</p>` : PC.tabela(w, kl ? { kl } : {})}`,
        d && d.czas ? 'Stan z ' + PC.data(d.czas) + (laduje ? ' · odświeżam…' : '') : '');
      $('#view').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => UI.go('pcAdmin', { tab: b.dataset.tab }, { zastap: true }));
    };
    const c = await DB.get('pcAdmin'); pokaz(c, navigator.onLine);
    if (!navigator.onLine) return;
    try { const r = await API.pc({ co: 'admin' }); await DB.set('pcAdmin', r); pokaz(r); } catch (e) { pokaz(c); UI.toast('Administracja: ' + e.message); }
  }
});
