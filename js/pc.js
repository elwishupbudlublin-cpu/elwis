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
    ['Czas pracy', [['pcCzas', 'Do zatwierdzenia', 'list', { st: 'dec' }], ['pcCzas', 'Zatwierdzone godziny', 'doc', { st: 'zatw' }]]],
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
    const akt = (v, p) => UI.cur === v && (!p || Object.keys(p).every(k => ((UI.par || {}).f || UI.par || {})[k] === p[k] || (UI.par || {})[k] === p[k]));
    // od 1.57.0: będąc w budowie – jej ekrany w menu (jak kafelki na tablecie)
    const wBud = S.kod && ['budowa', 'rzut', 'braki', 'protokoly', 'protokol', 'notatki', 'zdjecia', 'postep'].includes(UI.cur) || (S.kod && UI.cur === 'dokumenty' && (UI.par || {}).typ === 'proj');
    const pb = wBud && ((S.boot && S.boot.projekty) || []).find(x => x.kod === S.kod);
    const BUD = [['budowa', 'Przegląd budowy', 'home'], ['rzut', 'Urządzenia i rzuty', 'tab'], ['braki', 'Braki i tematy', 'warn'], ['protokoly', 'Protokoły', 'doc', null, 'protokol'], ['zdjecia', 'Zdjęcia', 'day'], ['notatki', 'Notatki', 'list'], ['postep', 'Postęp', 'bars'], ['dokumenty', 'Dokumenty projektowe', 'book', { typ: 'proj' }]];
    const budHtml = pb ? `<div class="pcbud"><div class="pcbk">${U.esc(pb.kod)}</div><div class="pcbn2">${U.esc(String(pb.nazwa || '').replace(pb.kod, '').trim())}</div>` +
      BUD.map(([v, t, i, p, v2]) => `<button class="pcmi${UI.cur === v || UI.cur === v2 ? ' on' : ''}" data-v="${v}" data-p='${U.esc(JSON.stringify(p || {}))}'>${this.ico(i)}<span>${U.esc(t)}</span></button>`).join('') +
      `<button class="pcmi" id="pcBInfo">${this.ico('gear')}<span>Informacje o budowie</span></button></div>` : '';
    const html = `<div class="pcbrand"><span class="logo">ELW<span class="elwis-i">I</span>S</span><small>panel biura · v${APP_VERSION}</small></div>` + budHtml +
      this.MENU.map(([g, items]) => `<div class="pcgr">${U.esc(g)}</div>` + items.map(([v, t, i, p], ix) =>
        `<button class="pcmi${!wBud && (akt(v, p) || (v === 'zmiany' && UI.cur === 'priorytety')) || (wBud && v === 'pcBud') ? ' on' : ''}" data-v="${v}" data-p='${U.esc(JSON.stringify(p || {}))}'>${this.ico(i)}<span>${U.esc(t)}</span>${v === 'pcCzas' && p && p.st === 'dec' ? '<span class="pcbn" id="pcCzN" hidden></span>' : v === 'pcBraki' ? '<span class="pcbn" id="pcBrN" hidden></span>' : v === 'powiad' ? '<span class="pcbn" id="pcPowN" hidden></span>' : v === 'zakupy' ? '<span class="pcbn" id="pcZakN" hidden></span>' : ''}</button>`).join('')).join('') +
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
    const c = $('#pcCzN'); if (c && this._czN != null) { c.hidden = !this._czN; c.textContent = this._czN; }
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
          return `<button class="pczd ${kl(t)}" data-t="${U.esc(t.id)}" data-dz="${k}" title="${U.esc(t.nazwa)}"><span class="pczk">${U.esc(kodZ(t))} · ${U.esc(czas)}</span><span class="pczn">${U.esc(t.nazwa)}</span></button>`; }).join('');
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
    $('#view').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = zad.find(x => x.id === b.dataset.t); if (t) Dialogs.zadanie(t, budowaZ(t), osobyTxt(t, (S.boot && S.boot.pracownicy) || []), b.dataset.dz); });
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

/* ---------- Czas pracy – zatwierdzanie (od 1.58.0) ---------- */
Object.assign(Views, {
  async pcCzas(par) {
    if (!PC.on()) return UI.go('plan', {}, { zastap: true });
    const f = Object.assign({ st: par.st || 'dec', ek: '', tyg: 'wsz' }, par.f || {});
    PC.widok(f.st === 'zatw' ? 'Zatwierdzone godziny' : 'Do zatwierdzenia', '', '<p class="mute">Wczytuję czas pracy…</p>');
    const odsw = async () => { if (navigator.onLine && API.ready()) try { await Czas.sync(); } catch (e) { UI.toast('Czas pracy: ' + e.message); } };
    if (!par._bez) await odsw();
    if (UI.cur !== 'pcCzas') return;
    const W = await Czas.lista(), auto = await Czas.auto(), autoB = await Czas.autoBiuro(), pl = await DB.get('plan'), bazaP = (await DB.get('projektyBaza')) || [];
    const prac = (S.boot && S.boot.pracownicy) || [], ek = n => String((prac.find(p => p.name === n) || {}).ekipa || '');
    const proj = (S.boot && S.boot.projekty) || [], budZ = t => proj.find(p => p.listaCU && p.listaCU === t.lista);
    const dzis = U.day(new Date()), pon = PC.poniedzialek(dzis), zakres = f.tyg === 'ten' ? [pon, PC.plus(pon, 6)] : f.tyg === 'pop' ? [PC.plus(pon, -7), PC.plus(pon, -1)] : ['0000', '9999'];
    const wZak = d => d >= zakres[0] && d <= zakres[1];
    const akt = W.filter(w => Czas.akt(w));
    const nak = w => !w.nieob && akt.some(x => x !== w && !x.nieob && x.osoba === w.osoba && x.data === w.data && x.stan !== 'prop' && CZ.min(x.od) < CZ.min(w.do) && CZ.min(x.do) > CZ.min(w.od));
    const wNieob = (n, d) => akt.some(x => x.nieob && x.osoba === n && x.data <= d && (x.dataDo || x.data) >= d);
    const godz = w => w.nieob ? 0 : CZ.h(w.od, w.do);
    const nbTxt = w => `${U.esc(w.nazwa || CZ_ST_TXT[w.st] || '')} · ${CZ.dniTxt(w.dni)}: ${U.esc(PC_dzien(w.data))}${w.dataDo && w.dataDo !== w.data ? ' – ' + U.esc(PC_dzien(w.dataDo)) : ''}`;
    const zgodny = w => w.zad && w.plan && w.od === w.plan.od && w.do === w.plan.do && (w.st === 'complete' || w.st === 'dzien');
    // zadania z planu bez wpisu osoby (dni robocze do wczoraj, 14 dni)
    const braki = [];
    ((pl && pl.zadania) || []).forEach(t => prac.filter(p => p.cu && t.osoby.includes(String(p.cu))).forEach(p => {
      for (let i = 14; i >= 1; i--) { const d = PC.plus(dzis, -i); if (U.wolny(d) || wNieob(p.name, d) || !naDzien(t, d) || t.zamk || ['on hold', 'complete', 'cancelled'].includes(String(t.status || '').toLowerCase())) continue;
        if (W.some(w => w.osoba === p.name && w.zad === t.id && w.data === d && (Czas.akt(w) || ['odrzucone', 'odrzB'].includes(w.stan)))) continue;
        const [a, b] = CZ.planOkno(t, d, p.name);
        braki.push({ brak: true, wid: 'brak-' + t.id + '-' + p.name + '-' + d, osoba: p.name, data: d, zad: t.id, nazwa: t.nazwa, kod: (budZ(t) || {}).kod || '', od: CZ.hm(a), do: CZ.hm(b), st: 'complete',
          plan: { od: CZ.hm(a), do: CZ.hm(b), osoby: CZ.nazwyOsob(t), wielodniowy: CZ.wielo(t) } }); } }));
    const dec = akt.filter(w => w.stan !== 'zatw').concat(braki);
    PC._czN = dec.length; PC.plakietki();
    let lista = (f.st === 'zatw' ? akt.filter(w => w.stan === 'zatw') : dec).filter(w => wZak(w.data) && (!f.ek || ek(w.osoba) === f.ek))
      .sort((a, b) => (a.data + a.osoba + a.od < b.data + b.osoba + b.od ? -1 : 1));
    const sel = new Set(), auto7 = akt.filter(w => w.stan === 'zatw' && w.zatw && w.zatw.auto && w.data >= PC.plus(dzis, -7)).length;
    const zrodlo = w => w.brak ? '<span class="czchip c-gr">nic nie wpisano</span>' : w.stan === 'prop' ? `<span class="czchip c-pro">propozycja ${U.esc(w.kto)}</span>` : w.kto === w.osoba ? '<span class="czchip c-ok">własne</span>' : '<span class="czchip c-ok">potwierdzona</span>';
    const stat = w => w.brak ? '<span class="czchip c-bad">decyzja biura</span>' : nak(w) ? '<span class="czchip c-bad">nakładanie godzin</span>' : w.stan === 'zatw' ? `<span class="czchip c-lock">🔒 ${w.zatw && w.zatw.auto ? 'auto' : U.esc((w.zatw || {}).kto || '')}</span>` : w.stan === 'prop' ? '<span class="czchip c-bad">brak potwierdzenia</span>' : '';
    const plTxt = w => w.plan ? `${U.esc(w.plan.od)}–${U.esc(w.plan.do)} · ${CZ.hTxt(CZ.h(w.plan.od, w.plan.do))}` : '–';
    const wyb = { w: null, od: 0, do: 0, powod: '', termin: null };
    const rys = () => {
      PC.widok(f.st === 'zatw' ? 'Zatwierdzone godziny' : 'Do zatwierdzenia',
        `<label class="cb"><input type="checkbox" id="czAuto" ${auto ? 'checked' : ''}> Auto-zatwierdzaj zgodne z planem</label>
         <label class="cb" title="Wpisy roli biuro – własne i dodane za innych (także nieobecności) – zatwierdzane od razu"><input type="checkbox" id="czAutoB" ${autoB ? 'checked' : ''}> Wpisy biura bez zatwierdzania</label>
         <select id="czT"><option value="wsz"${f.tyg === 'wsz' ? ' selected' : ''}>Wszystkie dni</option><option value="ten"${f.tyg === 'ten' ? ' selected' : ''}>Ten tydzień</option><option value="pop"${f.tyg === 'pop' ? ' selected' : ''}>Poprzedni tydzień</option></select>
         <select id="czE"><option value="">Wszystkie ekipy</option>${['1', '2', '3'].map(x => `<option value="${x}"${f.ek === x ? ' selected' : ''}>Ekipa ${x}</option>`).join('')}</select>
         <button class="btn sm" id="czOdsw">Odśwież</button>`,
        `${f.st === 'zatw' ? '' : `<div class="pcsum4"><div><b>${dec.length}</b><span>do decyzji</span></div><div><b>${dec.filter(w => w.stan === 'prop').length}</b><span>bez potwierdzenia osoby</span></div><div><b>${braki.length}</b><span>nic nie wpisano</span></div><div><b>${dec.filter(w => !w.brak && nak(w)).length}</b><span>nakładanie godzin</span></div><div><b>${auto7}</b><span>zatw. auto (7 dni)</span></div></div>`}
         <div class="pcczas"><div class="grow">${!lista.length ? '<p class="mute">Brak wpisów dla wybranych filtrów.</p>' : `<div class="pctw"><table class="pct"><thead><tr>${f.st === 'zatw' ? '' : '<th></th>'}<th>Dzień</th><th>Osoba</th><th>Budowa · zadanie</th><th>Plan</th><th>Zgłoszone</th><th>Źródło</th><th>Status</th>${f.st === 'zatw' ? '' : '<th></th>'}</tr></thead><tbody>
          ${lista.map((w, i) => `<tr class="pcrow${wyb.w === w ? ' sel1' : ''}" data-i="${i}">${f.st === 'zatw' ? '' : `<td><input type="checkbox" data-s="${i}" ${sel.has(i) ? 'checked' : ''} ${w.brak ? 'disabled' : ''}></td>`}<td>${U.esc(PC_dzien(w.data))}</td><td><b>${U.esc(w.osoba)}</b></td>
            <td>${w.nieob ? `<b>${nbTxt(w)}</b>${w.uwagi ? '<br><small>' + U.esc(w.uwagi) + '</small>' : ''}` : `${U.esc(w.kod || '')} · ${w.zad ? '' : '<i>spoza planu:</i> '}${U.esc(w.nazwa || w.opis || '')}`}${w.notatka ? `<br><small>${U.esc(String(w.notatka).slice(0, 90))}</small>` : ''}</td><td>${plTxt(w)}</td>
            <td class="${w.plan && !w.brak && !zgodny(w) ? 'o-badt' : ''}">${w.nieob ? 'cały dzień' : w.brak ? '–' : `${U.esc(w.od)}–${U.esc(w.do)} · ${CZ.hTxt(CZ.h(w.od, w.do))}`}<br><small>${w.brak ? '' : U.esc(CZ_ST_TXT[w.st] || '')}${w.termin ? ' · dokończenie ' + U.esc(PC_dzien(w.termin.data) + ' ' + w.termin.od + '–' + w.termin.do) : ''}</small></td>
            <td>${zrodlo(w)}</td><td>${stat(w)}</td>${f.st === 'zatw' ? '' : `<td>${w.brak ? `<button class="btn sm" data-wp="${i}">Wg planu</button>` : `<button class="btn sm ok" data-ok="${i}">Zatwierdź</button>`}</td>`}</tr>`).join('')}</tbody></table></div>`}
          ${f.st === 'zatw' || !lista.length ? '' : `<div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" id="czZg">Zaznacz zgodne z planem</button><button class="btn sm ok" id="czZz">Zatwierdź zaznaczone (${sel.size})</button><span class="grow"></span><span class="mute">Zatwierdzone trafiają do arkusza „ELWIS – Harmonogram” i do ClickUp</span></div>`}</div>
          ${wyb.w ? detal() : ''}</div>`,
        f.st === 'zatw' ? `${lista.length} wpisów · ${CZ.hTxt(lista.reduce((a, w) => a + godz(w), 0))}` : '');
      $('#czAuto').onchange = async e => { try { await API.fg('Zapisuję ustawienie', () => API.czas({ op: 'ust', auto: e.target.checked })); await Czas.sync(); UI.toast(e.target.checked ? 'Auto-zatwierdzanie włączone' : 'Auto-zatwierdzanie wyłączone'); } catch (er) { UI.toast(er.message); e.target.checked = !e.target.checked; } };
      $('#czAutoB').onchange = async e => { try { await API.fg('Zapisuję ustawienie', () => API.czas({ op: 'ust', autoBiuro: e.target.checked })); await Czas.sync(); UI.toast(e.target.checked ? 'Wpisy biura zatwierdzane od razu' : 'Wpisy biura – do zatwierdzenia'); } catch (er) { UI.toast(er.message); e.target.checked = !e.target.checked; } };
      $('#czT').onchange = e => { f.tyg = e.target.value; UI.par.f = Object.assign({}, f); Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); };
      $('#czE').onchange = e => { f.ek = e.target.value; UI.par.f = Object.assign({}, f); Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); };
      $('#czOdsw').onclick = () => Views.pcCzas(Object.assign({}, UI.par, { _bez: 0 }));
      $('#view').querySelectorAll('[data-s]').forEach(c => c.onclick = e => { e.stopPropagation(); const i = +c.dataset.s; c.checked ? sel.add(i) : sel.delete(i); rys(); });
      $('#view').querySelectorAll('[data-i]').forEach(r => r.onclick = e => { if (e.target.closest('button,input')) return; const w = lista[+r.dataset.i]; wyb.w = w; wyb.od = CZ.min(w.od); wyb.do = CZ.min(w.do); wyb.powod = ''; wyb.termin = w.termin || null;
        wyb.e = { data: w.data, osoba: w.osoba, kod: w.kod || '', faza: w.faza || '', nazwa: w.nazwa || w.opis || '', st: w.st || 'complete', notatka: w.notatka || '', rodzaj: w.rodzaj || 'urlop', dni: w.dni || 1, uwagi: w.uwagi || '', terminData: (w.termin || {}).data || '' }; rys(); });
      $('#view').querySelectorAll('[data-ok]').forEach(b => b.onclick = () => wyslij([{ w: lista[+b.dataset.ok] }]));
      $('#view').querySelectorAll('[data-wp]').forEach(b => b.onclick = () => wyslij([{ w: lista[+b.dataset.wp] }]));
      if ($('#czZg')) $('#czZg').onclick = () => { lista.forEach((w, i) => { if (!w.brak && zgodny(w) && !nak(w)) sel.add(i); }); rys(); };
      if ($('#czZz')) $('#czZz').onclick = () => { if (!sel.size) return UI.toast('Nic nie zaznaczono'); wyslij([...sel].map(i => ({ w: lista[i] }))); };
      if (wyb.w) {
        CZ.tpBind($('#view'), (k, d) => { if (k === 'od') wyb.od = Math.max(0, Math.min(wyb.do - 30, wyb.od + d)); else wyb.do = Math.min(1440, Math.max(wyb.od + 30, wyb.do + d)); rys(); });
        $('#czPw').oninput = e => { wyb.powod = e.target.value; };
        const v = $('#view'), E = wyb.e;
        CZ.combo($('#czEO'), () => CZ.osoby([E.osoba]), x => { E.osoba = x.v; rys(); });
        CZ.combo($('#czEB'), () => CZ.budowy(bazaP).filter(x => x.v !== E.kod), x => { E.kod = x.v; rys(); });
        v.querySelectorAll('[data-e]').forEach(el => el.onchange = ev => { E[el.dataset.e] = ev.target.value; if (['st', 'data'].includes(el.dataset.e)) rys(); });
        v.querySelectorAll('input[data-e],textarea[data-e]').forEach(el => el.oninput = ev => { E[el.dataset.e] = ev.target.value; });
        v.querySelectorAll('[data-er]').forEach(b => b.onclick = () => { E.rodzaj = b.dataset.er; rys(); });
        v.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { E.dni = CZ.dniFix(E.dni + +b.dataset.dn); rys(); });
        if ($('#czDni')) $('#czDni').onchange = ev => { E.dni = CZ.dniFix(ev.target.value); rys(); };
        $('#czDOk').onclick = () => { const w = wyb.w, zmG = !w.nieob && (CZ.hm(wyb.od) !== w.od || CZ.hm(wyb.do) !== w.do), zmP = zmiany(w);
          if ((zmG || zmP || w.stan === 'zatw') && !wyb.powod.trim() && !w.brak) return UI.toast('Podaj powód zmiany');
          if (w.stan === 'zatw' && !zmG && !zmP) return UI.toast('Nic nie zmieniono');
          if (zmP || w.stan === 'zatw') return wyslijEd(w);
          wyslij([{ w, od: zmG ? CZ.hm(wyb.od) : '', do: zmG ? CZ.hm(wyb.do) : '', powod: wyb.powod.trim() }]); };
        if ($('#czDNo')) $('#czDNo').onclick = () => { const pw = prompt(wyb.w.brak ? 'Osoba nie pracowała przy tym zadaniu – powód (opcjonalnie):' : 'Odrzucić wpis? Powód:'); if (pw === null) return; odrzuc(wyb.w, pw); };
        $('#czDX').onclick = () => { wyb.w = null; rys(); };
      }
    };
    const detal = () => { const w = wyb.w, hist = W.filter(x => x.osoba === w.osoba && x.data === w.data && (w.zad ? x.zad === w.zad : x.wid === w.wid)).sort((a, b) => (a.ts < b.ts ? -1 : 1));
      return `<aside class="pcdet"><div class="row"><span class="lbl grow">Szczegóły</span><button class="btn sm" id="czDX">✕</button></div><h3>${U.esc(w.osoba)} · ${U.esc(PC_dzien(w.data))}</h3>
        <p class="mute">${w.nieob ? nbTxt(w) + (w.uwagi ? ' · ' + U.esc(w.uwagi) : '') : `${U.esc(w.kod || '')} · ${U.esc(w.nazwa || w.opis || '')}${w.plan ? ' · plan ' + plTxt(w) : ''}`}</p>
        <div class="czhist">${hist.map(x => `<div class="${x.stan}"><b>${U.esc(PC.data(x.ts))} ${U.esc(x.kto)}</b>: ${U.esc(x.od)}–${U.esc(x.do)} · ${U.esc(CZ_ST_TXT[x.st] || '')} <span class="czchip c-gr">${U.esc({ wlasne: 'własne', prop: 'propozycja', zatw: 'zatwierdzone', zastapiony: 'zastąpiony', odrzucone: 'odrzucony przez osobę', odrzB: 'odrzucony przez biuro', zignorowany: 'pominięty' }[x.stan] || x.stan)}</span>${x.notatka ? `<br><small>${U.esc(x.notatka)}</small>` : ''}</div>`).join('') || '<p class="mute">Nic nie wpisano – zdecyduj za osobę.</p>'}</div>
        ${edycja(w)}</aside>`; };
    // edycja wszystkich pól przez administratora (także po zatwierdzeniu – wtedy jako korekta)
    const zmiany = w => { const e = wyb.e; if (!e) return false; return e.data !== w.data || e.osoba !== w.osoba || (w.nieob ? e.rodzaj !== w.rodzaj || e.dni !== (w.dni || 1) || e.uwagi !== (w.uwagi || '')
      : e.kod !== (w.kod || '') || e.faza !== (w.faza || '') || e.nazwa !== (w.nazwa || w.opis || '') || e.st !== (w.st || 'complete') || e.notatka !== (w.notatka || '') || e.terminData !== ((w.termin || {}).data || '')); };
    const doDnia = (od, dni) => { let d = U.wolny(od) ? CZ.nastRob(od) : od; for (let n = 1; n < Math.ceil(dni); n++) d = CZ.nastRob(d); return d; };
    const edycja = w => { const e = wyb.e, zz = w.stan === 'zatw';
      const opt = (arr, v) => arr.map(([k, t]) => `<option value="${U.esc(k)}"${k === v ? ' selected' : ''}>${U.esc(t)}</option>`).join('');
      const pola = w.nieob ? `<div class="czst" style="grid-template-columns:repeat(4,1fr)">${Object.keys(CZ.NB).map(k => `<button class="${e.rodzaj === k ? CZ.NBKL[k] : ''}" data-er="${k}">${U.esc(CZ.NB[k])}</button>`).join('')}</div>
          <label><span class="lbl">Od dnia</span><input type="date" data-e="data" value="${e.data}"></label>
          <div><span class="lbl" style="display:block">Liczba dni roboczych</span>${CZ.dniPole('czDni', e.dni)} <span class="mute">do ${U.esc(PC_dzien(doDnia(e.data, e.dni)))}</span></div>
          <label><span class="lbl">Uwagi</span><input type="text" data-e="uwagi" value="${U.esc(e.uwagi)}"></label>`
        : `<label><span class="lbl">Dzień</span><input type="date" data-e="data" value="${e.data}"></label>
          <label><span class="lbl">Budowa</span><span class="cbsel"><b>${U.esc(e.kod ? (String((proj.find(p => p.kod === e.kod) || {}).nazwa || e.kod)) : '–')}</b><input type="text" id="czEB" class="cbin" placeholder="zmień – wpisz lub wybierz"></span></label>
          <label><span class="lbl">Faza</span><select data-e="faza"><option value="">–</option>${opt(CZ.FAZY.map(x => [x, x]), e.faza)}</select></label>
          <label><span class="lbl">Nazwa / opis</span><input type="text" data-e="nazwa" value="${U.esc(e.nazwa)}"></label>
          <label><span class="lbl">Status</span><select data-e="st">${opt(['complete', 'update required', 'on hold', 'dzien', 'spoza'].map(k => [k, CZ_ST_TXT[k]]), e.st)}</select></label>
          <div><span class="lbl">Godziny</span><div class="row" style="gap:8px">${CZ.tp('od', wyb.od)}–${CZ.tp('do', wyb.do)}</div></div>
          ${e.st === 'update required' ? `<label><span class="lbl">Dokończenie – dzień</span><input type="date" data-e="terminData" value="${e.terminData}"></label>` : ''}
          <label><span class="lbl">Notatka</span><textarea data-e="notatka" rows="3">${U.esc(e.notatka)}</textarea></label>`;
      return `<div class="card pced"><div class="lbl">${zz ? '🔒 Zatwierdzone – korekta administratora' : w.brak ? 'Decyzja biura' : 'Edycja i zatwierdzenie'}</div>
          <label><span class="lbl">Osoba</span><span class="cbsel"><b>${U.esc(e.osoba)}</b><input type="text" id="czEO" class="cbin" placeholder="zmień – wpisz lub wybierz"></span></label>${pola}
          <input type="text" id="czPw" placeholder="powód zmiany (wymagany przy zmianie)" value="${U.esc(wyb.powod)}"></div>
        <div class="row" style="gap:8px"><button class="btn ok grow" id="czDOk">${zz ? 'Zapisz korektę' : 'Zatwierdź' + (w.nieob ? '' : ' ' + CZ.hTxt((wyb.do - wyb.od) / 60))}</button>${zz ? '' : `<button class="btn" id="czDNo">${w.brak ? 'Nie pracował' : 'Odrzuć'}</button>`}</div>
        <p class="mute">${zz ? 'Korekta zastępuje zatwierdzony wpis; w ClickUp komentarz z powodem i nowe godziny.' : 'Po zatwierdzeniu: wpis zablokowany na tablecie, wiersz w arkuszu „ELWIS – Harmonogram”. Godziny różne od planu → w ClickUp pierwotne zadanie „cancelled” i nowe zadania wg faktycznych godzin.'}</p>`; };
    const nowyWpis = (w, x) => Czas.zdarzenie('wpis', { wid: U.uid('w'), data: w.data, osoba: w.osoba, zad: w.zad, nazwa: w.nazwa, kod: w.kod, faza: '', od: x.od || w.od, do: x.do || w.do, st: x.st || w.st, plan: w.plan, notatka: '' });
    const wpisEd = w => { const e = wyb.e, nb = !!w.nieob;
      const d = nb ? { wid: U.uid('w'), data: U.wolny(e.data) ? CZ.nastRob(e.data) : e.data, dataDo: doDnia(e.data, e.dni), dni: e.dni, osoba: e.osoba, zad: '', nieob: true, rodzaj: e.rodzaj, st: e.rodzaj, nazwa: e.rodzaj === 'inne' ? 'Inne: ' + e.uwagi.trim() : CZ.NB[e.rodzaj], od: w.od, do: w.do, uwagi: e.uwagi.trim() }
        : { wid: U.uid('w'), data: e.data, osoba: e.osoba, zad: w.zad || '', lista: w.lista || '', nazwa: e.nazwa.trim(), opis: w.zad ? (w.opis || '') : e.nazwa.trim(), kod: e.kod, faza: e.faza, od: CZ.hm(wyb.od), do: CZ.hm(wyb.do), st: e.st, plan: w.plan, notatka: e.notatka, spoza: w.spoza, osoby: w.osoby,
            termin: e.st === 'update required' && e.terminData ? Object.assign({}, w.termin || { od: CZ.hm(wyb.od), do: CZ.hm(wyb.do) }, { data: e.terminData }) : (e.st === 'update required' ? w.termin : undefined) };
      if (!w.brak) d.kor = w.wid; return Czas.zdarzenie('wpis', d); };
    const wyslijEd = async w => {
      if (!navigator.onLine) return UI.toast('Zapis wymaga internetu');
      const e = wpisEd(w);
      try { await API.fg(w.stan === 'zatw' ? 'Zapisuję korektę i aktualizuję ClickUp' : 'Zatwierdzam i zapisuję w ClickUp', () => API.czas({ op: 'zatw', wpisy: [e], lista: [{ wid: e.d.wid, powod: (w.brak ? 'decyzja biura' : 'edycja biura') + (wyb.powod.trim() ? ': ' + wyb.powod.trim() : '') }] }));
        await Czas.sync(); UI.toast(w.stan === 'zatw' ? 'Korekta zapisana' : 'Zatwierdzono'); wyb.w = null; Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); }
      catch (er) { UI.toast('Nie udało się: ' + er.message); } };
    const wyslij = async pozycje => {
      if (!navigator.onLine) return UI.toast('Zatwierdzanie wymaga internetu');
      const wpisy = [], l = [];
      pozycje.forEach(({ w, od, do: dd, powod }) => { if (w.brak) { const e = nowyWpis(w, { od, do: dd }); wpisy.push(e); l.push({ wid: e.d.wid, powod: 'decyzja biura' + (powod ? ': ' + powod : '') }); }
        else l.push(Object.assign({ wid: w.wid }, od ? { od, do: dd, powod } : {}, w.termin ? { termin: w.termin } : {})); });
      try { await API.fg('Zatwierdzam godziny i zapisuję w ClickUp', () => API.czas({ op: 'zatw', wpisy, lista: l })); await Czas.sync(); UI.toast('Zatwierdzono: ' + l.length); wyb.w = null; Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); }
      catch (e) { UI.toast('Nie udało się: ' + e.message); }
    };
    const odrzuc = async (w, pw) => {
      try { const wpisy = [], l = [];
        if (w.brak) { const e = nowyWpis(w, {}); wpisy.push(e); l.push({ wid: e.d.wid, powod: pw || 'nie pracował' }); } else l.push({ wid: w.wid, powod: pw || '' });
        await API.fg('Zapisuję decyzję', () => API.czas({ op: 'odrzB', wpisy, lista: l })); await Czas.sync(); wyb.w = null; Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); }
      catch (e) { UI.toast('Nie udało się: ' + e.message); }
    };
    rys();
  }
});
