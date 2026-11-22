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
  /* od 1.59.0: przewinięcie okna, tabeli i panelu szczegółów zostaje po przerysowaniu */
  scrZapisz() { const v = $('#view'); if (!v) return null; const g = sel => { const e = v.querySelector(sel); return e ? e.scrollTop : 0; };
    return { y: window.scrollY, t: g('.pctw'), d: g('.pcdet'), c: g('.pcczas') }; },
  scrPrzywroc(z) { if (!z) return; const v = $('#view'), u = (sel, x) => { const e = v.querySelector(sel); if (e && x) e.scrollTop = x; };
    u('.pctw', z.t); u('.pcdet', z.d); u('.pcczas', z.c); if (z.y) window.scrollTo(0, z.y); },
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
  /* Harmonogram tygodnia / miesiąca (od 1.59.1): osoby × dni, zadania z harmonogramu bazy, statusy czasu pracy, zwijanie, dni wolne */
  async pcTydz(par) {
    if (!PC.on()) return UI.go('plan', {}, { zastap: true });
    const opc = Object.assign({ mies: false, bezWolnych: false }, (await DB.get('pcTydOpc')) || {});
    const dzis = U.day(new Date());
    const m0 = (par.m || dzis.slice(0, 7)) + '-01', ileM = new Date(+m0.slice(0, 4), +m0.slice(5, 7), 0).getDate();
    const pon = par.t || PC.poniedzialek(dzis);
    const wszDni = opc.mies ? Array.from({ length: ileM }, (_, i) => PC.plus(m0, i)) : [0, 1, 2, 3, 4, 5, 6].map(i => PC.plus(pon, i));
    const dni = opc.bezWolnych ? wszDni.filter(k => !U.wolny(k)) : wszDni;
    // plan: z komputera, a gdy zakres wykracza poza pobrany – z serwera (do 31 dni, pamięć do odświeżenia)
    let pl = (await DB.get('plan')) || null, zakresInfo = '';
    const od = wszDni[0], doD = wszDni[wszDni.length - 1];
    if (!pl || !pl.od || od < pl.od || doD > pl.do) {
      const kl = 'planPC:' + od + ':' + doD, zap = PC._planPC && PC._planPC[kl];
      if (zap) pl = zap;
      else if (navigator.onLine && API.ready()) { try { const r = await API.plan(od, doD); pl = { od, do: doD, zadania: r.zadania || [] }; (PC._planPC = PC._planPC || {})[kl] = pl; } catch (e) { zakresInfo = 'Nie udało się pobrać planu dla tego zakresu: ' + e.message; } }
      else zakresInfo = 'Plan na komputerze obejmuje 14 dni wstecz i 7 naprzód – dla dalszych dni potrzebny internet.';
    }
    const kol = (await DB.get('zadKolejka')) || [];
    const W = await Czas.lista();
    const ZP = (await Czas.zadPlany()).filter(x => !x.usun).map(x => Czas.zpZad(x));
    if (UI.cur !== 'pcTydz') return;
    const zad = ((pl && pl.zadania) || []).filter(t => !ZP.some(z => z.prop && (z.id === t.id || z.zid === t.id))).concat(ZP.filter(z => z.prop || !((pl && pl.zadania) || []).some(t => t.id === z.id)))
      .map(t => { const q = kol.filter(z => z.task === t.id).pop(); return q ? { ...t, status: q.status, czeka: true, zamk: q.status === 'complete' } : t; });
    const prac = ((S.boot && S.boot.pracownicy) || []).filter(x => x.cu).slice().sort((a, b) => (String(a.ekipa || 'z') + a.name).localeCompare(String(b.ekipa || 'z') + b.name, 'pl'));
    const proj = (S.boot && S.boot.projekty) || [];
    const budowaZ = t => proj.find(p => (p.listaCU && p.listaCU === t.lista) || (t.kod && p.kod === t.kod));
    const kodZ = t => { const b = budowaZ(t); return b ? b.kod : t.kod || String(t.listaNazwa || '').split(' ')[0]; };
    const godz = d => { const x = new Date(d); return x.getHours() + (x.getMinutes() ? ':' + String(x.getMinutes()).padStart(2, '0') : ''); };
    const hDnia = (t, k) => {
      const s = t.start ? U.day(new Date(t.start)) : U.day(new Date(t.koniec)), e = U.day(new Date(t.koniec));
      if (t.godzStart && t.godzKoniec && s === e) return (t.koniec - t.start) / 36e5;
      if (U.wolny(k) && !t.wolne) return 0;
      if (t.godzStart && t.godzKoniec) return 8;   // wielodniowe z godzinami – cały dzień pracy
      if (t.est) { let n = 0; for (let d = s; d <= e; d = PC.plus(d, 1)) if (t.wolne || !U.wolny(d)) n++; return t.est / 36e5 / Math.max(1, n); }
      return null;
    };
    // stan czasu pracy osoby dla zadania i dnia
    const czasW = (t, o, k) => W.filter(w => w.osoba === o && w.zad === t.id && w.data === k && !w.nieob);
    const stanCz = (t, o, k) => { const L = czasW(t, o, k), z = L.find(w => w.stan === 'zatw'), wl = L.find(w => w.stan === 'wlasne'), pr = L.find(w => w.stan === 'prop'), od = L.filter(w => w.stan === 'odrzB').pop();
      if (t.prop) return ['zatwierdzenie zadania', 'c-pro', 'zadanie czeka na zatwierdzenie przez biuro'];
      if (z) return ['🔒 zatwierdzone', 'c-lock', 'zatwierdził ' + (z.zatw && z.zatw.auto ? 'automatycznie' : (z.zatw || {}).kto || '') + ' ' + PC.data((z.zatw || {}).ts) + ' · ' + z.od + '–' + z.do];
      if (wl) return ['czeka na zatwierdzenie', 'c-gr', 'wpisane ' + wl.od + '–' + wl.do + ' (' + (CZ_ST_TXT[wl.st] || '') + ')' + (wl.lok ? ' · niewysłane' : '')];
      if (pr) return ['czeka na potwierdzenie', 'c-pro', 'propozycja ' + pr.kto + ': ' + pr.od + '–' + pr.do];
      if (od) return ['do poprawy', 'c-bad', 'odrzucone przez ' + ((od.odrzB || {}).kto || 'biuro') + ((od.odrzB || {}).powod ? ': ' + od.odrzB.powod : '')];
      if (k < dzis && !t.zamk && !U.wolny(k)) return ['brak godzin', 'c-bad', 'nic nie wpisano'];
      return null; };
    const kl = t => { const k = STATUS_ZAD[String(t.status || '').toLowerCase()]; return t.prop ? 'st-prop' : t.zamk ? 'st-ok' : k ? 'st-' + k.kl : ''; };
    const zw = new Set((await DB.get('pcTydZw')) || []);
    const hTxt = h => String(Math.round(h * 2) / 2).replace('.', ',') + ' h', hKl = h => { const r = Math.round(h * 2) / 2; return r > 8 ? 'h-hi' : r === 8 ? 'h-ok' : 'h-lo'; };
    const info = (t, o, k, cz) => { const b = budowaZ(t), a = t.start ? new Date(t.start) : null, e = t.koniec ? new Date(t.koniec) : null;
      return [`${kodZ(t) || '—'}${b ? ' ' + String(b.nazwa || '').replace(b.kod, '').trim() : t.listaNazwa ? ' ' + t.listaNazwa : ''}`, t.faza ? 'Faza: ' + t.faza : '', 'Zadanie: ' + t.nazwa,
        'Kto: ' + osobyTxt(t, (S.boot && S.boot.pracownicy) || []), 'Kiedy: ' + (a ? PC.dm(U.day(a)) + (t.godzStart ? ' ' + godz(a) : '') : '') + (e ? ' – ' + PC.dm(U.day(e)) + (t.godzKoniec ? ' ' + godz(e) : '') : '') + (t.est ? ' · szac. ' + hTxt(t.est / 36e5) : '') + (t.wolne ? ' · także w dni wolne' : ''),
        'Status: ' + (t.prop ? 'do zatwierdzenia (dodał ' + (t.autor || '') + ')' : stNazwa(t.status || '') || '—') + (t.czeka ? ' · czeka na wysłanie' : ''),
        cz ? 'Czas pracy (' + o + '): ' + cz[0] + ' – ' + cz[2] : '', t.opis ? 'Notatka: ' + String(t.opis).slice(0, 400) : ''].filter(String).join('\n'); };
    const M = opc.mies, wkl = k => (U.wolny(k) ? 'wolne' : '') + (k === dzis ? ' dzis' : '');
    const naglowek = `<tr><th class="pcos"><button class="btn sm" id="tZW" title="Zwiń / rozwiń wszystkie osoby">${prac.every(o => zw.has(o.name)) ? '▸ Rozwiń wszystkie' : '▾ Zwiń wszystkie'}</button></th>${dni.map(k => { const sw = U.swieto(k);
      return `<th class="${wkl(k)}" title="${sw ? U.esc(sw) : ''}"><button class="pcdz" data-d="${k}">${M ? `<span>${PC.dzienTyg(k).slice(0, 2)}</span> <b>${+k.slice(8)}</b>` : `${PC.dzienTyg(k)} <b>${PC.dm(k)}</b>${sw ? `<small>${U.esc(sw)}</small>` : ''}`}</button></th>`; }).join('')}<th class="pcsumh">Suma</th></tr>`;
    let ekPop = null;
    const wiersze = prac.map(o => {
      const gr = String(o.ekipa || '') !== ekPop ? `<tr class="pcgrw"><td colspan="${dni.length + 2}">${o.ekipa ? 'Ekipa ' + U.esc(o.ekipa) : o.rola === 'biuro' ? 'Biuro' : 'Pozostali'}</td></tr>` : '';
      ekPop = String(o.ekipa || '');
      let suma = 0, nieokr = false; const zwin = zw.has(o.name);
      const kom = dni.map(k => {
        const lista = zad.filter(t => naDzien(t, k) && t.osoby.includes(String(o.cu)));
        let h = 0, q = false;
        const chipy = lista.map(t => { const x = hDnia(t, k); if (x == null) q = true; else h += x;
          const cz = stanCz(t, o.name, k), czas = t.godzStart ? godz(t.start) + (t.godzKoniec ? '–' + godz(t.koniec) : '') : x ? hTxt(x) : 'cały dzień';
          return M ? `<button class="pczd pczm ${kl(t)}" data-t="${U.esc(t.id)}" data-dz="${k}" data-os="${U.esc(o.name)}" title="${U.esc(info(t, o.name, k, cz))}"><span class="pczk">${U.esc(String(kodZ(t) || '').slice(3) || '•')}</span>${cz ? `<i class="pcczd ${cz[1]}"></i>` : ''}</button>`
            : `<button class="pczd ${kl(t)}" data-t="${U.esc(t.id)}" data-dz="${k}" data-os="${U.esc(o.name)}" title="${U.esc(info(t, o.name, k, cz))}"><span class="pczk">${U.esc(kodZ(t))} · ${U.esc(czas)}</span><span class="pczn">${U.esc(t.nazwa)}</span>${cz ? `<span class="czchip ${cz[1]} pczst">${U.esc(cz[0])}</span>` : ''}</button>`; }).join('');
        suma += h; nieokr = nieokr || q;
        const hd = lista.length ? `<div class="pchd ${hKl(h)}" title="${hTxt(h)} z 8 h${q ? ' + zadania bez czasu' : ''}">${M ? String(Math.round(h * 2) / 2).replace('.', ',') : hTxt(h)}${q ? '+?' : ''}</div>` : '';
        return `<td class="${wkl(k)}${zwin ? ' zw' : ''}">${hd}${zwin ? (lista.length && !M ? `<span class="mute pczn2">${lista.length} ${odm(lista.length, 'zadanie', 'zadania', 'zadań')}</span>` : '') : chipy}</td>`;
      }).join('');
      return gr + `<tr class="${zwin ? 'pczw' : ''}"><td class="pcos"><button class="pczwb" data-zw="${U.esc(o.name)}" title="${zwin ? 'Rozwiń zadania' : 'Zwiń zadania'}">${zwin ? '▸' : '▾'}</button><b>${U.esc(o.name)}</b>${S.user && o.name === S.user.name ? ' <small>(ja)</small>' : ''}</td>${kom}<td class="pcsum">${hTxt(suma)}${nieokr ? '<small> + ?</small>' : ''}</td></tr>`;
    }).join('');
    const nazwaM = new Date(m0 + 'T12:00:00').toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    const tytul = M ? 'Harmonogram miesiąca' : 'Harmonogram tygodnia';
    PC.widok(tytul,
      `<div class="seg"><button id="tTyg" class="${M ? '' : 'on'}">Tydzień</button><button id="tMies" class="${M ? 'on' : ''}">Miesiąc</button></div>
       <button class="btn sm" id="tP">‹ ${M ? 'Poprzedni' : 'Poprzedni'}</button><button class="btn sm" id="tD">${M ? 'Ten miesiąc' : 'Ten tydzień'}</button><button class="btn sm" id="tN">${M ? 'Następny' : 'Następny'} ›</button>
       <button class="btn sm" id="tWol">${opc.bezWolnych ? 'Pokaż dni wolne' : 'Ukryj dni wolne'}</button>
       <button class="btn sm" id="tSH" title="Pobierz zmiany z ClickUp do harmonogramu">⟳ Sync</button><button class="btn sm pri" id="tNZ">${ic('plus')} Nowe zadanie</button>`,
      `${zakresInfo ? `<p class="pcinfo">${U.esc(zakresInfo)}</p>` : ''}
       <div class="pctw"><table class="pct pctyd${M ? ' pcmies' : ''}"><colgroup><col style="width:${M ? 11 : 13}%">${dni.map(k => `<col style="width:${((U.wolny(k) ? 0.5 : 1) / dni.reduce((a, d) => a + (U.wolny(d) ? 0.5 : 1), 0) * (M ? 84 : 81)).toFixed(3)}%">`).join('')}<col style="width:${M ? 5 : 6}%"></colgroup><thead>${naglowek}</thead><tbody>${wiersze}</tbody></table></div>
       <p class="mute pcleg"><span class="pczd st-ok">wykonane</span> <span class="pczd st-update">do kontynuacji</span> <span class="pczd st-hold">niepodjęte</span> <span class="pczd st-prop">do zatwierdzenia</span> · czas pracy: <span class="czchip c-lock">🔒 zatwierdzone</span> <span class="czchip c-gr">czeka na zatwierdzenie</span> <span class="czchip c-pro">czeka na potwierdzenie</span> <span class="czchip c-bad">do poprawy / brak godzin</span> · godziny dnia: <span class="pchd h-lo">&lt; 8 h</span> <span class="pchd h-ok">8 h</span> <span class="pchd h-hi">&gt; 8 h</span> · najedź na zadanie – szczegóły</p>`,
      M ? nazwaM : `${PC.dm(wszDni[0])} – ${PC.dm(wszDni[6])}.${wszDni[6].slice(0, 4)}`);
    const zapOpc = async o => { await DB.set('pcTydOpc', Object.assign(opc, o)); };
    const idzM = n => { const d = new Date(m0 + 'T12:00:00'); d.setMonth(d.getMonth() + n); return U.day(d).slice(0, 7); };
    $('#tP').onclick = () => UI.go('pcTydz', M ? { m: idzM(-1) } : { t: PC.plus(pon, -7) }, { zastap: true });
    $('#tN').onclick = () => UI.go('pcTydz', M ? { m: idzM(1) } : { t: PC.plus(pon, 7) }, { zastap: true });
    $('#tD').onclick = () => UI.go('pcTydz', {}, { zastap: true });
    $('#tTyg').onclick = async () => { await zapOpc({ mies: false }); UI.go('pcTydz', { t: PC.poniedzialek(M ? (m0.slice(0, 7) === dzis.slice(0, 7) ? dzis : m0) : pon) }, { zastap: true }); };
    $('#tMies').onclick = async () => { await zapOpc({ mies: true }); UI.go('pcTydz', { m: (M ? m0 : pon).slice(0, 7) }, { zastap: true }); };
    $('#tWol').onclick = async () => { await zapOpc({ bezWolnych: !opc.bezWolnych }); Views.pcTydz(par); };
    $('#tNZ').onclick = () => Dialogs.noweZadanie(null, dni.includes(dzis) ? dzis : dni[0]);
    $('#tZW').onclick = async () => { const wsz = prac.every(o => zw.has(o.name)); await DB.set('pcTydZw', wsz ? [] : prac.map(o => o.name)); const scr = PC.scrZapisz(); await Views.pcTydz(par); PC.scrPrzywroc(scr); };
    if ($('#tSH')) $('#tSH').onclick = () => harmSyncTeraz();
    $('#view').querySelectorAll('[data-d]').forEach(b => b.onclick = () => UI.go('plan', { d: b.dataset.d, all: true }));
    $('#view').querySelectorAll('[data-zw]').forEach(b => b.onclick = async () => { const n = b.dataset.zw; zw.has(n) ? zw.delete(n) : zw.add(n); await DB.set('pcTydZw', [...zw]);
      const scr = PC.scrZapisz(); await Views.pcTydz(par); PC.scrPrzywroc(scr); });
    $('#view').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = zad.find(x => x.id === b.dataset.t); if (t) Dialogs.zadanie(t, budowaZ(t), osobyTxt(t, (S.boot && S.boot.pracownicy) || []), b.dataset.dz, null, b.dataset.os); });
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
    const scr0 = UI.cur === 'pcCzas' && par._bez ? PC.scrZapisz() : null;   // od 1.59.0: przerysowanie w tle nie przewija listy na górę
    if (!par._bez) PC.widok(f.st === 'zatw' ? 'Zatwierdzone godziny' : 'Do zatwierdzenia', '', '<p class="mute">Wczytuję czas pracy…</p>');
    const odsw = async () => { if (navigator.onLine && API.ready()) try { await Czas.sync(); } catch (e) { UI.toast('Czas pracy: ' + e.message); } };
    // od 1.58.5: ekran od razu z danych na komputerze; serwer w tle (najwyżej co 30 s, „Odśwież” – zawsze), potem ponowne narysowanie z zachowaniem zaznaczeń
    if (!par._bez && Date.now() - (PC._czT || 0) > 30000) { PC._czT = Date.now();
      const przed = JSON.stringify((await DB.get('czasStan')) || {}).replace(/"czas":\d+/, '');
      odsw().then(async () => { if (UI.cur !== 'pcCzas') return;   // od 1.59.0: przerysowanie tylko, gdy dane z serwera się zmieniły
        if (JSON.stringify((await DB.get('czasStan')) || {}).replace(/"czas":\d+/, '') !== przed) Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); }); }
    const W = await Czas.lista(), auto = await Czas.auto(), autoB = await Czas.autoBiuro(), pl = await DB.get('plan'), bazaP = (await DB.get('projektyBaza')) || [];
    const prac = (S.boot && S.boot.pracownicy) || [], ek = n => String((prac.find(p => p.name === n) || {}).ekipa || '');
    const proj = (S.boot && S.boot.projekty) || [], budZ = t => proj.find(p => (p.listaCU && p.listaCU === t.lista) || (t.kod && p.kod === t.kod));
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
    const dec = akt.filter(w => w.stan !== 'zatw').concat(braki).filter(w => !Czas.ukr.has(w.wid));   // od 1.59.1: decyzje w toku znikają od razu
    const ZPL = (((await DB.get('czasStan')) || {}).zadProp || []).filter(x => (!x.status || x.status === 'do zatwierdzenia') && !Czas.ukr.has(x.zid)).sort((a, b) => (a.data + a.od < b.data + b.od ? -1 : 1));   // od 1.59.0: nowe zadania od pracowników
    PC._czN = dec.length + ZPL.length; PC.plakietki();
    const zpHtml = () => !ZPL.length || f.st === 'zatw' ? '' : `<div class="card" style="margin-bottom:14px"><div class="row"><b class="grow">Nowe zadania od pracowników (${ZPL.length})</b><span class="mute">zatwierdzone trafią do planu osób i do ClickUp</span></div>
      <div class="pctw"><table class="pct pctzp"><thead><tr><th>Dzień</th><th>Godziny</th><th>Osoby</th><th>Budowa · faza · zadanie</th><th>Dodał(a)</th><th></th></tr></thead><tbody>
      ${ZPL.map((x, i) => `<tr><td>${U.esc(PC_dzien(x.data))}</td><td>${U.esc(x.od)}–${U.esc(x.do)} · ${CZ.hTxt(CZ.h(x.od, x.do))}</td><td>${U.esc(x.osoby.join(', '))}</td>
        <td><b>${U.esc(x.kod)}</b> · ${U.esc(x.faza)}<br>${U.esc(x.nazwa)}${x.notatka ? `<br><small>${U.esc(x.notatka.slice(0, 120))}</small>` : ''}</td><td>${U.esc(x.autor)}<br><small>${U.esc(x.utw)}</small></td>
        <td style="white-space:nowrap"><button class="btn sm ok" data-zpa="${i}">Zatwierdź</button> <button class="btn sm" data-zpz="${i}">Zmień</button> <button class="btn sm" data-zpc="${i}">Anuluj</button></td></tr>`).join('')}</tbody></table></div></div>`;
    let lista = (f.st === 'zatw' ? akt.filter(w => w.stan === 'zatw' && !Czas.ukr.has(w.wid)) : dec).filter(w => wZak(w.data) && (!f.ek || ek(w.osoba) === f.ek))
      .sort((a, b) => (a.data + a.osoba + a.od < b.data + b.osoba + b.od ? -1 : 1));
    // od 1.59.0: sortowanie po kolumnach (dotknięcie nagłówka; ponowne – odwrotnie)
    const so = PC._czSort || (PC._czSort = { k: 'data', d: 1 });
    const zrTxt = w => w.brak ? '0' : w.stan === 'prop' ? '1' + w.kto : w.kto === w.osoba ? '2' : '3';
    const stTxt = w => w.brak ? '0' : w.stan === 'zatw' ? '4' : w.stan === 'prop' ? '1' : '3';
    const KL = { data: w => w.data + w.od + w.osoba, osoba: w => w.osoba + w.data + w.od, bud: w => (w.kod || '') + ' ' + (w.nazwa || w.opis || ''), plan: w => w.plan ? w.plan.od : '~',
      zgl: w => w.brak ? -1 : w.nieob ? 99 : CZ.h(w.od, w.do), zr: zrTxt, st: stTxt };
    const kl = KL[so.k] || KL.data;
    lista.sort((a, b) => { const x = kl(a), y = kl(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pl')) * so.d || (a.data + a.osoba < b.data + b.osoba ? -1 : 1); });
    const th = (k, t) => `<th class="pcso${so.k === k ? ' on' : ''}" data-so="${k}">${t}${so.k === k ? (so.d > 0 ? ' ▲' : ' ▼') : ''}</th>`;
    const sel = PC._czSel || (PC._czSel = new Set()), auto7 = akt.filter(w => w.stan === 'zatw' && w.zatw && w.zatw.auto && w.data >= PC.plus(dzis, -7)).length;
    const zrodlo = w => w.brak ? '<span class="czchip c-gr">nic nie wpisano</span>' : w.stan === 'prop' ? `<span class="czchip c-pro">propozycja ${U.esc(w.kto)}</span>` : w.kto === w.osoba ? '<span class="czchip c-ok">własne</span>' : '<span class="czchip c-ok">potwierdzona</span>';
    const stat = w => w.brak ? '<span class="czchip c-bad">decyzja biura</span>' : nak(w) ? '<span class="czchip c-bad">nakładanie godzin</span>' : w.stan === 'zatw' ? `<span class="czchip c-lock">🔒 ${w.zatw && w.zatw.auto ? 'auto' : U.esc((w.zatw || {}).kto || '')}</span>` : w.stan === 'prop' ? '<span class="czchip c-bad">brak potwierdzenia</span>' : '';
    const plTxt = w => w.plan ? `${U.esc(w.plan.od)}–${U.esc(w.plan.do)} · ${CZ.hTxt(CZ.h(w.plan.od, w.plan.do))}` : '–';
    const wyb = PC._czWyb || (PC._czWyb = { w: null, od: 0, do: 0, powod: '', termin: null });   // zaznaczenia i otwarty wpis zostają po odświeżeniu
    if (wyb.w) { const wid = wyb.w.wid; wyb.w = lista.find(w => w.wid === wid) || null; }
    [...sel].forEach(wid => { if (!lista.some(w => w.wid === wid)) sel.delete(wid); });
    let scrN = scr0;
    const rys = () => {
      const scr = scrN || PC.scrZapisz(); scrN = null;
      PC.widok(f.st === 'zatw' ? 'Zatwierdzone godziny' : 'Do zatwierdzenia',
        `<label class="cb"><input type="checkbox" id="czAuto" ${auto ? 'checked' : ''}> Auto-zatwierdzaj zgodne z planem</label>
         <label class="cb" title="Wpisy roli biuro – własne i dodane za innych (także nieobecności) – zatwierdzane od razu"><input type="checkbox" id="czAutoB" ${autoB ? 'checked' : ''}> Wpisy biura bez zatwierdzania</label>
         <select id="czT"><option value="wsz"${f.tyg === 'wsz' ? ' selected' : ''}>Wszystkie dni</option><option value="ten"${f.tyg === 'ten' ? ' selected' : ''}>Ten tydzień</option><option value="pop"${f.tyg === 'pop' ? ' selected' : ''}>Poprzedni tydzień</option></select>
         <select id="czE"><option value="">Wszystkie ekipy</option>${['1', '2', '3'].map(x => `<option value="${x}"${f.ek === x ? ' selected' : ''}>Ekipa ${x}</option>`).join('')}</select>
         <button class="btn sm" id="czOdsw">Odśwież</button>`,
        `${zpHtml()}${f.st === 'zatw' ? '' : `<div class="pcsum4"><div><b>${dec.length}</b><span>do decyzji</span></div><div><b>${dec.filter(w => w.stan === 'prop').length}</b><span>bez potwierdzenia osoby</span></div><div><b>${braki.length}</b><span>nic nie wpisano</span></div><div><b>${dec.filter(w => !w.brak && nak(w)).length}</b><span>nakładanie godzin</span></div><div><b>${auto7}</b><span>zatw. auto (7 dni)</span></div></div>`}
         <div class="pcczas"><div class="grow">${!lista.length ? '<p class="mute">Brak wpisów dla wybranych filtrów.</p>' : `<div class="pctw"><table class="pct"><thead><tr>${f.st === 'zatw' ? '' : '<th></th>'}${th('data', 'Dzień')}${th('osoba', 'Osoba')}${th('bud', 'Budowa · zadanie')}${th('plan', 'Plan')}${th('zgl', 'Zgłoszone')}${th('zr', 'Źródło')}${th('st', 'Status')}${f.st === 'zatw' ? '' : '<th></th>'}</tr></thead><tbody>
          ${lista.map((w, i) => `<tr class="pcrow${wyb.w === w ? ' sel1' : ''}" data-i="${i}">${f.st === 'zatw' ? '' : `<td><input type="checkbox" data-s="${i}" ${sel.has(w.wid) ? 'checked' : ''} ${w.brak ? 'disabled' : ''}></td>`}<td>${U.esc(PC_dzien(w.data))}</td><td><b>${U.esc(w.osoba)}</b></td>
            <td>${w.nieob ? `<b>${nbTxt(w)}</b>${w.uwagi ? '<br><small>' + U.esc(w.uwagi) + '</small>' : ''}` : `${U.esc(w.kod || '')} · ${w.zad ? '' : '<i>spoza planu:</i> '}${U.esc(w.nazwa || w.opis || '')}`}${w.notatka ? `<br><small>${U.esc(String(w.notatka).slice(0, 90))}</small>` : ''}</td><td>${plTxt(w)}</td>
            <td class="${w.plan && !w.brak && !zgodny(w) ? 'o-badt' : ''}">${w.nieob ? 'cały dzień' : w.brak ? '–' : `${U.esc(w.od)}–${U.esc(w.do)} · ${CZ.hTxt(CZ.h(w.od, w.do))}`}<br><small>${w.brak ? '' : U.esc(CZ_ST_TXT[w.st] || '')}${w.termin ? ' · dokończenie ' + U.esc(PC_dzien(w.termin.data) + ' ' + w.termin.od + '–' + w.termin.do) : ''}</small></td>
            <td>${zrodlo(w)}</td><td>${stat(w)}</td>${f.st === 'zatw' ? '' : `<td>${w.brak ? `<button class="btn sm" data-wp="${i}">Wg planu</button>` : `<button class="btn sm ok" data-ok="${i}">Zatwierdź</button>`}</td>`}</tr>`).join('')}</tbody></table></div>`}
          ${f.st === 'zatw' || !lista.length ? '' : `<div class="row" style="gap:8px;margin-top:10px"><button class="btn sm" id="czZg">Zaznacz zgodne z planem</button><button class="btn sm ok" id="czZz">Zatwierdź zaznaczone (${sel.size})</button><span class="grow"></span><span class="mute">Zatwierdzone trafiają do arkusza „ELWIS – Harmonogram” i do ClickUp</span></div>`}</div>
          ${wyb.w ? detal() : ''}</div>`,
        f.st === 'zatw' ? `${lista.length} wpisów · ${CZ.hTxt(lista.reduce((a, w) => a + godz(w), 0))}` : '');
      PC.scrPrzywroc(scr);
      $('#czAuto').onchange = async e => { try { await API.fg('Zapisuję ustawienie', () => API.czas({ op: 'ust', auto: e.target.checked })); await Czas.sync(); UI.toast(e.target.checked ? 'Auto-zatwierdzanie włączone' : 'Auto-zatwierdzanie wyłączone'); } catch (er) { UI.toast(er.message); e.target.checked = !e.target.checked; } };
      $('#czAutoB').onchange = async e => { try { await API.fg('Zapisuję ustawienie', () => API.czas({ op: 'ust', autoBiuro: e.target.checked })); await Czas.sync(); UI.toast(e.target.checked ? 'Wpisy biura zatwierdzane od razu' : 'Wpisy biura – do zatwierdzenia'); } catch (er) { UI.toast(er.message); e.target.checked = !e.target.checked; } };
      $('#czT').onchange = e => { f.tyg = e.target.value; UI.par.f = Object.assign({}, f); Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); };
      $('#czE').onchange = e => { f.ek = e.target.value; UI.par.f = Object.assign({}, f); Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); };
      $('#czOdsw').onclick = () => { PC._czT = 0; Views.pcCzas(Object.assign({}, UI.par, { _bez: 0 })); };
      $('#view').querySelectorAll('[data-so]').forEach(h => h.onclick = () => { const k = h.dataset.so; if (so.k === k) so.d = -so.d; else { so.k = k; so.d = 1; } Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 })); });
      const poZp = () => Views.pcCzas(Object.assign({}, UI.par, { _bez: 1 }));
      $('#view').querySelectorAll('[data-zpa]').forEach(b => b.onclick = () => Dialogs.zpDecyzja(ZPL[+b.dataset.zpa].zid, 'zatw'));
      $('#view').querySelectorAll('[data-zpc]').forEach(b => b.onclick = () => Dialogs.zpDecyzja(ZPL[+b.dataset.zpc].zid, 'anul'));
      $('#view').querySelectorAll('[data-zpz]').forEach(b => b.onclick = () => { const x = ZPL[+b.dataset.zpz]; Dialogs.zadPlanForm(x.data, { ed: Object.assign({}, x), admin: true, po: poZp }); });
      $('#view').querySelectorAll('[data-s]').forEach(c => c.onclick = e => { e.stopPropagation(); const w = lista[+c.dataset.s]; c.checked ? sel.add(w.wid) : sel.delete(w.wid);
        if ($('#czZz')) $('#czZz').textContent = 'Zatwierdź zaznaczone (' + sel.size + ')'; });   // od 1.59.0: bez przerysowania listy
      $('#view').querySelectorAll('[data-i]').forEach(r => r.onclick = e => { if (e.target.closest('button,input')) return; const w = lista[+r.dataset.i]; wyb.w = w; wyb.tryb = 'pod'; wyb.dod = []; wyb.od = CZ.min(w.od); wyb.do = CZ.min(w.do); wyb.powod = ''; wyb.termin = w.termin || null;
        const tz = w.zad ? ((pl || {}).zadania || []).find(z => z.id === w.zad) || {} : {};   // od 1.58.6: budowa / faza / nazwa z harmonogramu, gdy wpis ich nie ma
        wyb.e = { data: w.data, osoba: w.osoba, kod: w.kod || tz.kod || '', faza: w.faza || tz.faza || '', nazwa: w.nazwa || w.opis || tz.nazwa || '', st: w.st || 'complete', notatka: w.notatka || '', rodzaj: w.rodzaj || 'urlop', dni: w.dni || 1, uwagi: w.uwagi || '', terminData: (w.termin || {}).data || '' }; wyb.e0 = Object.assign({}, wyb.e); rys(); });
      $('#view').querySelectorAll('[data-ok]').forEach(b => b.onclick = () => wyslij([{ w: lista[+b.dataset.ok] }]));
      $('#view').querySelectorAll('[data-wp]').forEach(b => b.onclick = () => wyslij([{ w: lista[+b.dataset.wp] }]));
      if ($('#czZg')) $('#czZg').onclick = () => { lista.forEach(w => { if (!w.brak && zgodny(w) && !nak(w)) sel.add(w.wid); }); rys(); };
      if ($('#czZz')) $('#czZz').onclick = () => { if (!sel.size) return UI.toast('Nic nie zaznaczono'); wyslij(lista.filter(w => sel.has(w.wid)).map(w => ({ w }))); };
      if (wyb.w) $('#czDX').onclick = () => { wyb.w = null; rys(); };
      if (wyb.w && wyb.tryb !== 'ed') {   // od 1.59.0: najpierw podgląd wszystkich danych, zmiany po „Modyfikuj”
        const w = wyb.w;
        if ($('#czDOk1')) $('#czDOk1').onclick = () => wyslij([{ w }]);
        $('#czDMod').onclick = () => { wyb.tryb = 'ed'; rys(); };
        $('#czDZw').onclick = () => {
          const pw = prompt(w.brak ? 'Osoba nie pracowała przy tym zadaniu – powód (opcjonalnie):' : w.stan === 'zatw' ? 'Zwrócić zatwierdzony wpis do użytkownika? Wpisze godziny ponownie. Powód (zobaczy go):' : 'Cofnąć do poprawy? Powód (zobaczy go osoba):');
          if (pw === null) return; if (!w.brak && !pw.trim()) return UI.toast('Podaj powód – osoba zobaczy go na tablecie'); odrzuc(w, pw.trim()); };
      }
      if (wyb.w && wyb.tryb === 'ed') {
        $('#czDPod').onclick = () => { wyb.tryb = 'pod'; rys(); };
        if ($('#czEDod')) CZ.combo($('#czEDod'), () => CZ.osoby([wyb.e.osoba, ...wyb.dod]), x => { wyb.dod.push(x.v); rys(); });
        $('#view').querySelectorAll('[data-dx]').forEach(b => b.onclick = () => { wyb.dod.splice(+b.dataset.dx, 1); rys(); });
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
        if ($('#czDNo')) $('#czDNo').onclick = () => { const pw = prompt(wyb.w.brak ? 'Osoba nie pracowała przy tym zadaniu – powód (opcjonalnie):' : 'Cofnąć do poprawy? Powód:'); if (pw === null) return; odrzuc(wyb.w, pw); };
      }
    };
    const detal = () => { const w = wyb.w, hist = W.filter(x => x.osoba === w.osoba && x.data === w.data && (w.zad ? x.zad === w.zad : x.wid === w.wid)).sort((a, b) => (a.ts < b.ts ? -1 : 1));
      return `<aside class="pcdet"><div class="row"><span class="lbl grow">Szczegóły</span><button class="btn sm" id="czDX">✕</button></div><h3>${U.esc(w.osoba)} · ${U.esc(PC_dzien(w.data))}</h3>
        <p class="mute">${w.nieob ? nbTxt(w) + (w.uwagi ? ' · ' + U.esc(w.uwagi) : '') : `${U.esc(w.kod || '')} · ${U.esc(w.nazwa || w.opis || '')}${w.plan ? ' · plan ' + plTxt(w) : ''}`}</p>
        <div class="czhist">${hist.map(x => `<div class="${x.stan}"><b>${U.esc(PC.data(x.ts))} ${U.esc(x.kto)}</b>: ${U.esc(x.od)}–${U.esc(x.do)} · ${U.esc(CZ_ST_TXT[x.st] || '')} <span class="czchip c-gr">${U.esc({ wlasne: 'własne', prop: 'propozycja', zatw: 'zatwierdzone', zastapiony: 'zastąpiony', odrzucone: 'odrzucony przez osobę', odrzB: 'odrzucony przez biuro', zignorowany: 'pominięty' }[x.stan] || x.stan)}</span>${x.notatka ? `<br><small>${U.esc(x.notatka)}</small>` : ''}</div>`).join('') || '<p class="mute">Nic nie wpisano – zdecyduj za osobę.</p>'}</div>
        ${wyb.tryb === 'ed' ? '<button class="btn sm" id="czDPod">← Podgląd</button>' + edycja(w) : podglad(w)}</aside>`; };
    const podglad = w => { const tz = w.zad ? ((pl || {}).zadania || []).find(z => z.id === w.zad) || {} : {}, kod = w.kod || tz.kod || '', b = proj.find(p => p.kod === kod) || bazaP.find(p => p.kod === kod);
      const f = (l, v) => v ? `<div class="pcpd"><span>${l}</span><b>${v}</b></div>` : '';
      const stanTxt = w.brak ? 'nic nie wpisano – decyzja biura' : w.stan === 'zatw' ? `🔒 zatwierdził(a) ${w.zatw && w.zatw.auto ? 'automatycznie (zgodne z planem)' : U.esc((w.zatw || {}).kto || '')} · ${U.esc(PC.data((w.zatw || {}).ts))}` : w.stan === 'prop' ? 'propozycja – osoba jeszcze nie potwierdziła' : 'czeka na zatwierdzenie';
      return `<div class="card pcpod">${[
        f('Osoba', U.esc(w.osoba) + (ek(w.osoba) ? ' · ekipa ' + U.esc(ek(w.osoba)) : '')),
        f('Dzień', U.esc(PC_dzien(w.data)) + (w.nieob && w.dataDo && w.dataDo !== w.data ? ' – ' + U.esc(PC_dzien(w.dataDo)) : '')),
        w.nieob ? f('Rodzaj', U.esc(CZ.NB[w.rodzaj] || w.nazwa || '') + ' · ' + CZ.dniTxt(w.dni)) : '',
        w.nieob ? '' : f('Projekt', U.esc(kod || '–') + (b ? ' ' + U.esc(String(b.nazwa || '').replace(b.kod, '').trim()) : '')),
        w.nieob ? '' : f('Faza', U.esc(w.faza || tz.faza || '–')),
        w.nieob ? '' : f('Zadanie', (w.zad ? '' : '<i>spoza planu:</i> ') + U.esc(w.nazwa || w.opis || tz.nazwa || '')),
        w.plan ? f('Plan', plTxt(w) + (w.plan.osoby && w.plan.osoby.length ? ' · ' + U.esc(w.plan.osoby.join(', ')) : '')) : '',
        w.nieob || w.brak ? '' : f('Zgłoszone', `${U.esc(w.od)}–${U.esc(w.do)} · ${CZ.hTxt(CZ.h(w.od, w.do))} · ${U.esc(CZ_ST_TXT[w.st] || '')}`),
        w.termin ? f('Dokończenie', U.esc(PC_dzien(w.termin.data) + ' ' + w.termin.od + '–' + w.termin.do)) : '',
        f('Powód', U.esc(w.powod || '')), f('Notatka', U.esc(w.notatka || '')), f('Komentarz', U.esc(w.kom || '')), f('Uwagi', U.esc(w.uwagi || '')),
        tz.opis ? f('Opis zadania', U.esc(String(tz.opis).slice(0, 300))) : '',
        w.brak ? '' : f('Wpisał(a)', U.esc(w.kto || '') + ' · ' + U.esc(PC.data(w.ts)) + (w.potw ? ' · potwierdził(a) ' + U.esc(PC.data(w.potw)) : '')),
        f('Stan', stanTxt), w.zatw && w.zatw.korekta ? f('Korekta', U.esc(w.zatw.korekta)) : '', w.zatw && w.zatw.powod ? f('Powód decyzji', U.esc(w.zatw.powod)) : ''].join('')}</div>
        <div class="row" style="gap:8px;flex-wrap:wrap">${w.stan === 'zatw' ? '<button class="btn pri" id="czDMod">Modyfikuj</button><button class="btn" id="czDZw">Zwróć do użytkownika</button>'
          : `<button class="btn ok" id="czDOk1">${w.brak ? 'Zatwierdź wg planu' : 'Zatwierdź'}</button><button class="btn pri" id="czDMod">Modyfikuj</button><button class="btn" id="czDZw">${w.brak ? 'Nie pracował' : 'Cofnij do poprawy'}</button>`}</div>`; };
    // edycja wszystkich pól przez administratora (także po zatwierdzeniu – wtedy jako korekta)
    const zmiany = w => { const e = wyb.e; if (!e) return false; return (wyb.dod || []).length > 0 || e.data !== w.data || e.osoba !== w.osoba || (w.nieob ? e.rodzaj !== w.rodzaj || e.dni !== (w.dni || 1) || e.uwagi !== (w.uwagi || '')
      : e.kod !== (wyb.e0 || {}).kod || e.faza !== (wyb.e0 || {}).faza || e.nazwa !== (wyb.e0 || {}).nazwa || e.st !== (w.st || 'complete') || e.notatka !== (w.notatka || '') || e.terminData !== ((w.termin || {}).data || '')); };
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
          <label><span class="lbl">Osoba</span><span class="cbsel"><b>${U.esc(e.osoba)}</b><input type="text" id="czEO" class="cbin" placeholder="zmień – wpisz lub wybierz"></span></label>
          ${w.nieob ? '' : `<div><span class="lbl">Dodaj osobę (ten sam wpis i godziny)</span><div class="row czos">${(wyb.dod || []).map((o, k) => `<button class="czchip c-pro" data-dx="${k}">${U.esc(o)} ✕</button>`).join('')}<span class="cbw"><input type="text" id="czEDod" class="cbin" placeholder="＋ osoba"></span></div></div>`}${pola}
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
      const e = wpisEd(w), pw = (w.brak ? 'decyzja biura' : 'edycja biura') + (wyb.powod.trim() ? ': ' + wyb.powod.trim() : '');
      const dod = (wyb.dod || []).map(n => { const d = Object.assign({}, e.d, { wid: U.uid('w'), osoba: n, notatka: '' }); delete d.kor; return Czas.zdarzenie('wpis', d); });   // od 1.59.0: dodatkowe osoby
      wyb.w = null;
      Czas.wTle(w.stan === 'zatw' ? 'Korekta' : 'Zatwierdzenie', () => API.czas({ op: 'zatw', wpisy: [e, ...dod], lista: [e, ...dod].map(x => ({ wid: x.d.wid, powod: pw })) }), w.stan === 'zatw' ? [] : [w.wid]); };
    const wyslij = async pozycje => {
      if (!navigator.onLine) return UI.toast('Zatwierdzanie wymaga internetu');
      const wpisy = [], l = [];
      pozycje.forEach(({ w, od, do: dd, powod }) => { if (w.brak) { const e = nowyWpis(w, { od, do: dd }); wpisy.push(e); l.push({ wid: e.d.wid, powod: 'decyzja biura' + (powod ? ': ' + powod : '') }); }
        else l.push(Object.assign({ wid: w.wid }, od ? { od, do: dd, powod } : {}, w.termin ? { termin: w.termin } : {})); });
      wyb.w = null; sel.clear();
      Czas.wTle('Zatwierdzenie (' + l.length + ')', () => API.czas({ op: 'zatw', wpisy, lista: l }), pozycje.map(p => p.w.wid));
    };
    const odrzuc = async (w, pw) => {
      const wpisy = [], l = [];
      if (w.brak) { const e = nowyWpis(w, {}); wpisy.push(e); l.push({ wid: e.d.wid, powod: pw || 'nie pracował' }); } else l.push({ wid: w.wid, powod: pw || '' });
      wyb.w = null;
      Czas.wTle(w.stan === 'zatw' ? 'Zwrot do użytkownika' : w.brak ? 'Decyzja „nie pracował”' : 'Cofnięcie do poprawy', () => API.czas({ op: 'odrzB', wpisy, lista: l }), [w.wid]);
    };
    rys();
  }
});
