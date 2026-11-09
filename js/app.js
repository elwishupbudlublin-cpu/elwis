/* ELWIS – widoki aplikacji. */
const $ = (s, r = document) => r.querySelector(s);
const view = $('#view'), modal = $('#modal');
const ST = { 'czeka': 'czeka', 'w toku': 'wtoku', 'gotowe': 'gotowe', 'brak': 'brak' };
/* ikony liniowe (wygląd B, od 1.12.0) */
const IKONY = { plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"></path>', doc: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"></path>',
  warn: '<path d="M12 3l9 17H3zM12 10v4M12 17v.5"></path>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"></path>',
  note: '<path d="M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5"></path>', chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"></path>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"></path>', book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"></path>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"></path>', pin: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>',
  chev: '<path d="M9 5l7 7-7 7"></path>', check: '<path d="M5 12l5 5 9-10"></path>', pause: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 9v6M14 9v6"></path>',
  x: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6"></path>', bud: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>', proto: '<path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12l2 2 4-4"></path>' };
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IKONY[n] || ''}</svg>`;

const UI = {
  cur: 'home', par: {},
  toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(this._t); this._t = setTimeout(() => el.classList.remove('show'), 2600); },
  net() {
    const n = $('#net'), t = $('#netText');
    n.className = 'net' + (!navigator.onLine ? ' off' : S.syncErr ? ' err' : '');
    const p = S.pending ? ` · ${S.pending} do wysłania` : '';
    t.textContent = S.syncing ? 'Synchronizuję…' + (S.prog ? ' ' + Math.round(S.prog.p * 100) + '%' : '') : !navigator.onLine ? 'Offline' + p : S.syncErr ? 'Błąd sync' + p : (S.lastSync ? 'Zsynchr. ' + new Date(S.lastSync).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : 'Online') + p;
    $('#btnSync').classList.toggle('spin', S.syncing);
    this.prog();
    $('#memWarn').hidden = !(S.malo && S.user);
    if ($('#nPend')) { $('#nPend').hidden = !S.pending; $('#nPend').textContent = S.pending || ''; }
  },
  /* pasek postępu pod nagłówkiem (od 1.7.0) */
  prog() {
    const on = !!(S.syncing && S.prog);
    $('#syncStrip').hidden = !on || $('#top').hidden;
    if (!on) return;
    $('#syncFill').style.width = Math.round(S.prog.p * 100) + '%';
    $('#syncTxt').textContent = S.prog.t;
    $('#netText').textContent = 'Synchronizuję… ' + Math.round(S.prog.p * 100) + '%';
  },
  header(sub, back) {
    $('#top').hidden = false; $('#topSub').textContent = sub || '';
    $('#btnBack').hidden = !back; $('#btnBack').onclick = back || null;
    $('#btnUser').textContent = S.user ? S.user.name : '';
  },
  // nawigacja ze stosem (od 1.11.7): „wstecz” wraca do ekranu, z którego przyszliśmy (z tym samym widokiem i ewentualnie otwartą kartą urządzenia)
  stos: [],
  go(v, par = {}, opc = {}) {
    if (['setup', 'login', 'plan'].includes(v) && !opc.zostaw) this.stos = [];
    else if (this.cur && v !== this.cur) {
      const i = this.stos.findIndex(e => e.v === v);
      if (i >= 0) this.stos.length = i;                       // powrót do ekranu, który już jest na stosie
      else this.stos.push({ v: this.cur, par: this.par, dlg: opc.dlg || null });
    }
    this.cur = v; this.par = par; this.pv = null; this.refresh(); window.scrollTo(0, 0);
  },
  wstecz(domyslny = 'home') {
    const e = this.stos.pop();
    if (!e) return this.go(domyslny);
    this.cur = e.v; this.par = e.par; this.pv = null; this.refresh(); window.scrollTo(0, 0);
    if (e.dlg) Dialogs.device(e.dlg);
  },
  refresh() {
    if (this.cur === 'rzut' && this.pv && document.contains(this.pv.box)) {   // bez przeładowania rzutu (zachowuje powiększenie)
      const F = fold(S.ev); const urz = urzE();
      this.pv.recolor(id => { const u = urz.find(x => x.id === id); const st = u ? devStatus(u, F) : 'czeka'; return { cls: ST[st], label: id + ' – ' + st }; });
      const side = $('.planbox .side'); const ark = this.pv.ark;
      if (side) { const a = urz.filter(u => u.arkusz === ark); side.innerHTML = legend(a, F) + attention(a, F); side.querySelectorAll('[data-u]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.u)); }
      this.net(); return;
    }
    const f = Views[this.cur]; if (f) f(this.par); this.net(); this.bnav();
  },
  close() { modal.innerHTML = ''; },
  /* dolny pasek: Plan · Budowy · Synchronizuj (od 1.12.0) */
  bnav() {
    const b = $('#bnav'); b.hidden = $('#top').hidden || !S.user;
    $('#nPlan').classList.toggle('on', this.cur === 'plan');
    $('#nBud').classList.toggle('on', this.cur !== 'plan');
    const n = $('#nPend'); n.hidden = !S.pending; n.textContent = S.pending || '';
  }
};

/* ---------- Widoki ---------- */
const Views = {
  /* Pierwsze uruchomienie tabletu */
  setup() {
    $('#top').hidden = true;
    view.innerHTML = `
      <div style="max-width:560px;margin:40px auto" class="stack">
        <h1>ELWIS – konfiguracja tabletu</h1><div class="mute" style="margin-top:-8px">Designed by Łukasz Pomarański</div>
        <p class="mute">Jednorazowo, przy WiFi. Adres i klucz tabletu podaje biuro (zakładka Tablety w Bazie projektów).</p>
        <div class="card">
          <label class="f" for="cUrl">Adres serwera ELWIS</label>
          <input id="cUrl" type="url" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off">
          <label class="f" for="cKey">Klucz tabletu</label>
          <input id="cKey" type="text" autocomplete="off" placeholder="np. T2-…">
          <label class="f" for="cName">Nazwa tabletu</label>
          <input id="cName" type="text" placeholder="np. Tablet 2 – ekipa 2">
          <div class="row" style="margin-top:16px"><button class="btn pri grow" id="cGo">Połącz i pobierz dane</button></div>
          <p class="mute" id="cMsg"></p>
        </div>
        <p class="mute">Wersja aplikacji ${APP_VERSION}</p>
      </div>`;
    $('#cGo').onclick = async () => {
      const url = $('#cUrl').value.trim(), key = $('#cKey').value.trim(), tablet = $('#cName').value.trim();
      if (!/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url) || !key) { $('#cMsg').textContent = 'Podaj adres (https://…) i klucz.'; return; }
      $('#cMsg').textContent = 'Łączę…';
      try {
        const b = await API.test(url, key);
        await API.setCfg({ url, key, tablet: tablet || b.tablet || 'Tablet' });
        S.boot = b; await DB.set('boot', b);
        UI.toast('Tablet skonfigurowany'); UI.go('login');
      } catch (e) { $('#cMsg').textContent = 'Nie udało się połączyć: ' + e.message; }
    };
  },

  /* Logowanie PIN-em */
  login() {
    $('#top').hidden = true;
    const users = (S.boot && S.boot.pracownicy) || [];
    let sel = null, pin = '';
    view.innerHTML = `
      <div class="login">
        <div class="side">
          <div class="big">ELWIS</div>
          <div class="designed">Designed by Łukasz Pomarański</div>
          <div>Elektryczne Wsparcie<br>Instalatora i Serwisu</div>
          <div class="mute" style="color:#dbe6f2;margin-top:auto">${U.esc((API.cfg() || {}).tablet || '')}<br>Wersja ${APP_VERSION}<br>${navigator.onLine ? 'Online' : 'Offline – logowanie działa bez internetu'}</div>
        </div>
        <div class="body">
          <div class="grow" style="min-width:300px"><h1>Kto pracuje?</h1>
            <div class="users" id="users">${users.length ? users.map((u, i) => `
              <button class="user" data-i="${i}"><span class="av">${U.esc(u.name.split(' ').map(w => w[0]).join(''))}</span>
              <span><b>${U.esc(u.name)}</b><br><span class="mute">${U.esc(u.ekipa || '')}</span></span></button>`).join('') : '<p class="mute">Brak pracowników – połącz tablet z siecią i zsynchronizuj.</p>'}</div>
          </div>
          <div class="pin">
            <div class="mute">PIN dla</div><b id="pinWho" style="font-size:20px">wybierz osobę</b>
            <div class="dots" id="dots">${'<span></span>'.repeat(6)}</div>
            <div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => `<button data-k="${k}" aria-label="${k === 'C' ? 'Wyczyść' : k === '⌫' ? 'Usuń' : 'Cyfra ' + k}">${k}</button>`).join('')}</div>
            <button class="btn pri" style="width:100%" id="pinGo">Zaloguj</button>
            <div class="mute" id="pinMsg" style="text-align:center">Tablet pamięta logowanie ${S.boot ? S.boot.sesjaGodziny : 12} h albo do wylogowania.</div>
            ${!navigator.onLine ? '' : '<button class="btn sm" id="pinSync">Odśwież listę pracowników</button>'}
          </div>
        </div>
      </div>`;
    const dots = () => [...$('#dots').children].forEach((d, i) => { d.className = i < pin.length ? 'f' : ''; d.hidden = i >= Math.max(4, pin.length); });
    dots();
    view.querySelectorAll('.user').forEach(b => b.onclick = () => {
      view.querySelectorAll('.user').forEach(x => x.classList.remove('on')); b.classList.add('on');
      sel = users[+b.dataset.i]; pin = ''; dots(); $('#pinWho').textContent = sel.name;
    });
    view.querySelectorAll('.keys button').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      if (k === 'C') pin = ''; else if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 6) pin += k;
      dots();
    });
    if ($('#pinSync')) $('#pinSync').onclick = async () => { await Sync.run(); UI.go('login'); };
    $('#pinGo').onclick = async () => {
      if (!sel) { $('#pinMsg').textContent = 'Wybierz osobę.'; return; }
      const lock = (await DB.get('lock')) || { n: 0, until: 0 };
      if (lock.until > Date.now()) { $('#pinMsg').textContent = 'Za dużo prób. Spróbuj za ' + Math.ceil((lock.until - Date.now()) / 60000) + ' min.'; return; }
      const h = await U.sha256(S.boot.salt + ':' + pin);
      if (h === sel.hash) {
        await DB.set('lock', { n: 0, until: 0 }); await Session.login(sel); UI.go('plan'); if (navigator.onLine) Sync.run();
      } else {
        lock.n++; if (lock.n >= 5) { lock.until = Date.now() + 5 * 60e3; lock.n = 0; }
        await DB.set('lock', lock); pin = ''; dots(); $('#pinMsg').textContent = 'Błędny PIN.';
      }
    };
  },

  /* Mój plan – zadania z ClickUp na dzień (pierwszy ekran po zalogowaniu; wygląd od 1.10.0) */
  async plan(par) {
    UI.header('mój plan', null);
    const pl = (await DB.get('plan')) || null;
    const dzis = U.day(new Date());
    const dzien = par.d || dzis;
    const wszyscy = !!par.all;
    // kalendarzy roli biuro (administrator) nie widzą pracownicy (od 1.11.2)
    const prac = ((S.boot && S.boot.pracownicy) || []).filter(x => x.cu && (Session.isBiuro() || x.rola !== 'biuro' || (S.user && x.name === S.user.name)));
    const ja = prac.find(x => S.user && x.name === S.user.name);
    // wszyscy: zalogowany pierwszy, potem pozostali (biuro też – jego zadania były poza ekranem)
    const kolejnosc = [...(ja ? [ja] : []), ...prac.filter(x => x !== ja)];
    // statusy wysłane z tabletu, a jeszcze niepotwierdzone przez ClickUp (od 1.12.0)
    const kolejka = (await DB.get('zadKolejka')) || [];
    const wszystkieZad = ((pl && pl.zadania) || []).map(t => { const q = kolejka.filter(z => z.task === t.id).pop();
      return q ? { ...t, status: q.status, czeka: true, zamk: q.status === 'complete' } : t; });
    // domyślnie w „Wszyscy” kolumny tylko osób, które mają zadania tego dnia (pozostałe – jednym dotknięciem w pasku osób)
    const ileOs = o => wszystkieZad.filter(t => naDzien(t, dzien) && t.osoby.includes(String(o.cu))).length;
    const ukryci = new Set(par.ukryj || kolejnosc.filter(o => o !== ja && !ileOs(o)).map(o => o.name));
    const osoby = wszyscy ? kolejnosc.filter(o => !ukryci.has(o.name)) : (ja ? [ja] : []);
    const mojeZad = t => !wszyscy ? (ja && t.osoby.includes(String(ja.cu))) : osoby.some(o => t.osoby.includes(String(o.cu)));
    const zad = wszystkieZad.filter(t => naDzien(t, dzien));
    const proj = (S.boot && S.boot.projekty) || [];
    const budowaZ = t => proj.find(p => p.listaCU && p.listaCU === t.lista);
    // miejsce prognozy: budowa z lokalizacją, na której zalogowany ma zadania tego dnia; inaczej Lublin
    const lokDnia = k => { const b2 = wszystkieZad.filter(t => naDzien(t, k) && mojeZad(t)).map(budowaZ).find(b => b && wspolrzedne(lokBudowy(b))); return b2 ? { klucz: wspolrzedne(lokBudowy(b2)).klucz, miejsce: b2.nazwa } : { klucz: POGODA_DOM.klucz, miejsce: POGODA_DOM.miejsce }; };
    const kol = t => { const k = t.lista || '?'; let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PLAN_KOLORY[h % PLAN_KOLORY.length]; };
    const kolumny = osoby.map(o => ({ o, z: zad.filter(t => t.osoby.includes(String(o.cu))) }));
    // zadania bez godzin z „Estimated Time” → wolne miejsca od 7:00 (osobno w każdej kolumnie; od 1.10.0)
    const wpasowane = new Set();
    kolumny.forEach(k => {
      const zajete = k.z.filter(maGodziny).map(t => { const a = new Date(t.start), b = new Date(t.koniec); return [a.getHours() * 60 + a.getMinutes(), b.getHours() * 60 + b.getMinutes()]; });
      k.auto = [];
      // najpierw zadania z szacowanym czasem, potem bez – te dostają czas dobrany do wielkości kafelka (1,5 h)
      k.z.filter(t => !maGodziny(t)).sort((a, b) => (b.est > 0) - (a.est > 0)).forEach(t => {
        const dl = t.est > 0 ? Math.max(15, Math.round(t.est / 60000)) : 90;
        let od = 7 * 60;
        for (let i = 0; i < 200; i++) { const kol = zajete.find(([a, b]) => od < b && od + dl > a); if (!kol) break; od = kol[1]; }
        zajete.push([od, od + dl]); k.auto.push({ t, od, dl, bezEst: !(t.est > 0) }); wpasowane.add(t.id);
      });
    });
    let h0 = 6, h1 = 18;
    kolumny.forEach(k => {
      k.z.filter(maGodziny).forEach(t => { h0 = Math.min(h0, new Date(t.start).getHours()); h1 = Math.max(h1, Math.ceil((new Date(t.koniec).getHours() * 60 + new Date(t.koniec).getMinutes()) / 60)); });
      k.auto.forEach(x => { h1 = Math.max(h1, Math.ceil((x.od + x.dl) / 60)); });
    });
    const PX = 64;
    // pasek 7 dni przesuwany o pojedyncze dni (od 1.10.2): par.od = pierwszy widoczny dzień; domyślnie wybrany dzień w środku
    const d0 = new Date(dzien + 'T12:00');
    const dzienPlus = (k, n) => U.day(new Date(new Date(k + 'T12:00').getTime() + n * 864e5));
    const od = par.od || dzienPlus(dzien, -3);
    const ZAPAS = 7;   // dni ukryte po obu stronach – przy przeciąganiu wjeżdżają płynnie (od 1.11.5)
    const tydzien = Array.from({ length: 7 + 2 * ZAPAS }, (_, i) => { const k = dzienPlus(od, i - ZAPAS); const d = new Date(k + 'T12:00'); return { k, d, n: wszystkieZad.filter(t => naDzien(t, k) && mojeZad(t)).length }; });
    const dzienTxt = d0.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
    const mojeDzis = zad.filter(mojeZad);
    const budowy = new Set(mojeDzis.map(t => t.lista).filter(Boolean));
    const godz = new Date().getHours();
    const powitanie = (godz < 12 ? 'Dzień dobry' : godz < 18 ? 'Cześć' : 'Dobry wieczór') + (S.user ? ', ' + S.user.name.split(' ')[0] : '');
    // położenie kafelka: nakładające się zadania obok siebie (tory), krótkie – w jednej linii (od 1.11.9)
    const poz = (top, hgt, tor) => {
      const st = `top:${top}px;height:${hgt}px` + (tor && tor.n > 1 ? `;left:calc(4px + (100% - 8px) * ${tor.i} / ${tor.n});right:auto;width:calc((100% - 8px) / ${tor.n} - 3px)` : '');
      return { st, kl: hgt < 58 ? ' pkr' : '' };
    };
    const blok = (t, tor) => {
      const a = new Date(t.start), b2 = new Date(t.koniec);
      const top = ((a.getHours() - h0) * 60 + a.getMinutes()) / 60 * PX, hgt = Math.max(30, (b2 - a) / 36e5 * PX - 3);
      const { st, kl } = poz(top, hgt, tor);
      return `<button class="pblk${kl} ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="${st};--c:${kol(t)}">${pogodaZad(t)}
        <span class="pt">${hm(a)}–${hm(b2)}${t.zamk ? ' · ✓' : ''}</span>${pbud(t)}<b>${U.esc(t.nazwa)}</b>${pst(t)}</button>`;
    };
    // status ustawiony z tabletu (Wykonane / Do kontynuacji / Zadanie niepodjęte) – od 1.12.0
    const pst = t => { const k = STATUS_ZAD[String(t.status || '').toLowerCase()]; return k ? `<span class="pstan ${k.kl}${t.czeka ? ' czeka' : ''}">${k.t}</span>` : ''; };
    // numer i nazwa budowy szarą małą czcionką nad nazwą zadania (od 1.11.6)
    const pbud = t => { const b = budowaZ(t); const n = b ? String(b.nazwa || '').replace(new RegExp('^' + b.kod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '') : '';
      const txt = b ? `${b.kod} ${n}${b.wojskowy === 'tak' && !/\bW$/.test(n) ? ' · W' : ''}` : (t.listaNazwa || 'zadanie spoza budów ELWIS');
      return `<span class="pbud">${U.esc(txt)}</span>`; };
    // pogoda na kafelku zadania – tylko gdy budowa ma lokalizację (od 1.11.5)
    const pogodaZad = t => { const b = budowaZ(t), w = b && wspolrzedne(lokBudowy(b)); const p = w && pogodaDnia(dzien, { klucz: w.klucz, miejsce: b.nazwa });
      return p ? `<span class="ptw" title="${U.esc(b.nazwa)}: 7–16 ${p.tmin}°…${p.tmax}°${p.pada ? ', pada' : ''}"><span class="ptwi">${p.ikona}</span>${p.tmin}°/${p.tmax}°</span>` : ''; };
    const hmMin = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const blokAuto = ({ t, od, dl, bezEst }, tor) => {
      const top = (od - h0 * 60) / 60 * PX, hgt = Math.max(30, dl / 60 * PX - 3);
      const { st, kl } = poz(top, hgt, tor);
      return `<button class="pblk pauto${kl} ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="${st};--c:${kol(t)}">${pogodaZad(t)}
        <span class="pt">~${hmMin(od)}–${hmMin(od + dl)} · ${bezEst ? 'czas nieokreślony' : String(Math.round(dl / 6) / 10).replace('.', ',') + ' h'}${t.zamk ? ' · ✓' : ''}</span>${pbud(t)}<b>${U.esc(t.nazwa)}</b>${pst(t)}<span class="pauton">Kierownik nie określił pory dnia</span></button>`;
    };
    // tory: zadania nachodzące na siebie dzielą szerokość kolumny; stykające się (koniec = początek) – nie
    const kolumnaHtml = k => {
      const mn = d => d.getHours() * 60 + d.getMinutes(), minDl = 30 / PX * 60;
      const el = [...k.z.filter(maGodziny).map(t => ({ s: mn(new Date(t.start)), e: mn(new Date(t.koniec)), h: tor => blok(t, tor) })),
        ...k.auto.map(x => ({ s: x.od, e: x.od + x.dl, h: tor => blokAuto(x, tor) }))].map(x => ({ ...x, e: Math.max(x.e, x.s + minDl) })).sort((a, b) => a.s - b.s || b.e - a.e);
      let grupa = [], koniecGr = -1; const tory = [];
      const zamknij = () => { const n = Math.max(1, ...grupa.map(x => x.i + 1)); grupa.forEach(x => x.tor = { i: x.i, n }); grupa = []; tory.length = 0; };
      el.forEach(x => {
        if (x.s >= koniecGr) zamknij();
        let i = tory.findIndex(e => e <= x.s); if (i < 0) i = tory.length; tory[i] = x.e; x.i = i;
        grupa.push(x); koniecGr = Math.max(koniecGr, x.e);
      });
      zamknij();
      return el.map(x => x.h(x.tor)).join('');
    };
    const karta = t => { const bud = budowaZ(t); return `<button class="pcard ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="--c:${kol(t)}">${pogodaZad(t)}${pbud(t)}<b>${U.esc(t.nazwa)}</b>${pst(t)}
      ${t.status ? `<span class="mute">${U.esc(t.status)}</span>` : ''}${wszyscy ? `<span class="pwho">${U.esc(osobyTxt(t, prac))}</span>` : ''}</button>`; };
    const bezGodz = [...new Set(kolumny.flatMap(k => k.z.filter(t => !maGodziny(t) && !wpasowane.has(t.id))))];
    const terazTop = dzien === dzis ? ((new Date().getHours() - h0) * 60 + new Date().getMinutes()) / 60 * PX : -1;
    const inicjaly = n => n.split(' ').map(w => w[0]).join('');
    view.innerHTML = `
      <section class="phero">
        <div class="phtop">
          <div class="grow"><div class="phhi">${U.esc(powitanie)}</div><h1>${wszyscy ? 'Plan wszystkich' : 'Twój plan'}</h1></div>
          <div class="seg pseg"><button id="pMy" class="${wszyscy ? '' : 'on'}">Mój plan</button><button id="pAll" class="${wszyscy ? 'on' : ''}">Wszyscy</button></div>
          <button class="btn pbudbtn" id="pBud" style="display:flex;align-items:center;gap:8px">${ic('bud')}Wszystkie budowy</button>
        </div>
        <div class="pweekwrap" id="pWeekWrap"><div class="pweek" id="pWeek" title="Przeciągnij w lewo / prawo, aby przesunąć dni">
          ${tydzien.map(x => { const w = pogodaDnia(x.k, lokDnia(x.k)); return `<button class="pday ${x.k === dzien ? 'on' : ''} ${x.k === dzis ? 'today' : ''}" data-day="${x.k}" title="${w ? w.tmin + '°/' + w.tmax + '° (7–16)' + (w.pada ? ', pada' : '') : ''}"><span>${x.d.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '')}</span><span class="pmid"><b>${x.d.getDate()}</b>${w ? `<span class="pico" aria-hidden="true">${w.ikona}</span>` : ''}</span><i>${x.n ? '•'.repeat(Math.min(x.n, 4)) : ''}${w ? `<em>${w.tmin}°/${w.tmax}°</em>` : ''}${!x.n && !w ? '&nbsp;' : ''}</i></button>`; }).join('')}
        </div></div>
        <div class="phsum"><span class="pchip">${U.esc(dzienTxt)}${dzien === dzis ? ' · dziś' : ''}</span>${(w => w ? `<span class="pchip ${w.pada ? 'pwarn' : ''}"><span class="pchipico">${w.ikona}</span> 7–16: ${w.tmin}°…${w.tmax}° · ${w.pada ? '☔ będzie padać (do ' + w.szansa + '%)' : 'bez opadów'} · ${U.esc(w.miejsce)}</span>` : '')(pogodaDnia(dzien, lokDnia(dzien)))}<span class="pchip">${mojeDzis.length} ${odm(mojeDzis.length, 'zadanie', 'zadania', 'zadań')}</span><span class="pchip">${budowy.size} ${odm(budowy.size, 'budowa', 'budowy', 'budów')}</span>${dzien !== dzis ? '<button class="pchip pnow" data-day="' + dzis + '">↺ dziś</button>' : ''}</div>
      </section>
      ${!pl ? `<p class="mute">${U.esc(S.planErr || 'Plan pobierze się przy najbliższej synchronizacji (potrzebny internet).')}</p>` : pl.brakKlucza ? '<p class="mute">Plan z ClickUp nie jest jeszcze włączony na serwerze (brak klucza ClickUp).</p>' : ''}
      ${pl ? `<p class="planage ${Date.now() - pl.pobrano > 12 * 36e5 ? 'old' : ''}">Plan z: ${U.esc(planWiek(pl.pobrano))}${S.planErr ? ' · ' + U.esc(S.planErr) : !navigator.onLine ? ' · offline – zmiany w ClickUp pojawią się po połączeniu' : ''}</p>` : ''}
      ${!ja && !wszyscy ? '<p class="mute">Twoje konto nie ma wpisanego ID ClickUp – poproś biuro o uzupełnienie.</p>' : ''}
      ${wszyscy ? `<div class="ppeople">${kolejnosc.map(o => { const n = zad.filter(t => t.osoby.includes(String(o.cu))).length; return `<button class="pperson ${ukryci.has(o.name) ? '' : 'on'}" data-who="${U.esc(o.name)}"><span class="av">${U.esc(inicjaly(o.name))}</span>${U.esc(o.name)}${o === ja ? ' (ty)' : ''}<span class="pn">${n}</span></button>`; }).join('')}</div>` : ''}
      <div class="ptime" style="--n:${kolumny.length || 1}">
        ${wszyscy ? `<div class="pheads">${kolumny.map(k => `<div class="phead">${U.esc(k.o.name)}</div>`).join('')}</div>` : ''}
        <div class="pgrid" style="height:${(h1 - h0) * PX}px">
          <div class="phours">${Array.from({ length: h1 - h0 + 1 }, (_, i) => `<span style="top:${i * PX}px">${h0 + i}:00</span>`).join('')}</div>
          ${terazTop >= 0 && terazTop <= (h1 - h0) * PX ? `<div class="pnowline" style="top:${terazTop}px"><span>${hm(new Date())}</span></div>` : ''}
          ${kolumny.map(k => `<div class="pcol" aria-label="Plan: ${U.esc(k.o.name)}">${kolumnaHtml(k)}</div>`).join('') || '<div class="pcol"></div>'}
        </div>
      </div>
      ${bezGodz.length ? `<h2>Bez godziny <span class="mute">(${bezGodz.length})</span></h2><div class="pcards">${bezGodz.map(karta).join('')}</div>` : ''}`;
    const idz = o => UI.go('plan', { ...par, ...o });
    view.querySelectorAll('[data-day]').forEach(b => b.onclick = () => idz({ d: b.dataset.day, od: b.classList.contains('pnow') ? undefined : od, ukryj: undefined }));
    // przeciąganie paska dni: 21 kafelków (7 widocznych), tor przesuwa się za palcem; po puszczeniu dociąga do pełnych dni
    (() => {
      const wrap = $('#pWeekWrap'), w = $('#pWeek'), GAP = 6;
      let szer = 0, baza = 0, x0 = null, dx = 0, przeciagniete = false;
      const uloz = () => {
        const W = wrap.getBoundingClientRect().width; szer = (W - 6 * GAP) / 7;
        w.querySelectorAll('.pday').forEach(k => { k.style.flex = `0 0 ${szer}px`; });
        baza = -ZAPAS * (szer + GAP); w.style.transition = 'none'; w.style.transform = `translateX(${baza}px)`;
      };
      uloz(); window.addEventListener('resize', uloz, { once: true });
      const ruch = e => { if (x0 === null) return; dx = e.clientX - x0; if (Math.abs(dx) > 10) przeciagniete = true;
        if (przeciagniete) w.style.transform = `translateX(${Math.max(Math.min(baza + dx, 0), 2 * baza)}px)`; };
      const koniec = () => {
        if (x0 === null) return; x0 = null; window.removeEventListener('pointermove', ruch);
        const krok = szer + GAP; let n = Math.round(-dx / krok); if (!n && Math.abs(dx) > krok / 3) n = dx < 0 ? 1 : -1;
        n = Math.max(-ZAPAS, Math.min(ZAPAS, n));
        w.style.transition = 'transform .18s ease-out'; w.style.transform = `translateX(${baza - n * krok}px)`;
        if (n) setTimeout(() => idz({ od: dzienPlus(od, n) }), 180);
      };
      w.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; przeciagniete = false; w.style.transition = 'none'; window.addEventListener('pointermove', ruch); window.addEventListener('pointerup', koniec, { once: true }); window.addEventListener('pointercancel', koniec, { once: true }); });
      w.addEventListener('click', e => { if (przeciagniete) { e.stopPropagation(); e.preventDefault(); przeciagniete = false; } }, true);
    })();
    $('#pAll').onclick = () => idz({ all: true, ukryj: undefined });
    $('#pMy').onclick = () => idz({ all: false });
    $('#pBud').onclick = () => UI.go('home');
    view.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { const u = new Set(ukryci); u.has(b.dataset.who) ? u.delete(b.dataset.who) : u.add(b.dataset.who); idz({ ukryj: [...u] }); });
    // dotknięcie zadania → okienko z danymi z ClickUp, statusem i „Przejdź do budowy” (od 1.12.0)
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      const t = zad.find(x => x.id === b.dataset.t); if (t) Dialogs.zadanie(t, budowaZ(t), osobyTxt(t, (S.boot && S.boot.pracownicy) || []));
    });
    // przewiń oś do „teraz” (albo do pierwszego zadania)
    const pt = view.querySelector('.pnowline') || view.querySelector('.pblk');
    if (pt) pt.scrollIntoView({ block: 'center', behavior: 'instant' });
    window.scrollTo(0, 0);
  },

  /* Lista budów */
  async home() {
    UI.header('wybór budowy', () => UI.wstecz('plan'));
    const all = (S.boot && S.boot.projekty) || [];
    const recent = (await DB.get('recent')) || [];
    const q = UI.par.q || '';
    const rec = recent.map(k => all.find(p => p.kod === k)).filter(Boolean).slice(0, 3);
    const off = new Set(await Pamiec.lista());
    const nq = U.norm(q);
    const list = all.filter(p => !nq || U.norm([p.kod, p.nazwa, p.adres].join(' ')).includes(nq));
    view.innerHTML = `
      <h1>Na której budowie dziś pracujesz?</h1>
      <label class="search"><span aria-hidden="true">🔎</span><span hidden>Szukaj budowy</span>
        <input type="search" id="q" value="${U.esc(q)}" placeholder="nazwa, kod lub adres" autocomplete="off"></label>
      ${rec.length && !q ? `<h2>Ostatnio na tym tablecie</h2><div class="grid2">${rec.map(card).join('')}</div>` : ''}
      <h2>${q ? 'Wyniki' : 'Wszystkie aktywne budowy'} (${list.length})</h2>
      <div class="list">${list.map(p => `<button class="li" data-k="${U.esc(p.kod)}"><b>${U.esc(p.kod)}</b><span class="grow">${U.esc(p.nazwa.replace(p.kod, '').trim())}</span>
        ${p.wojskowy === 'tak' ? `<span class="chip warn">${dostepDoBudowy(p) ? '' : '🔒 '}obiekt wojskowy</span>` : ''}<span class="mute">${U.esc(p.adres || '')}</span>${off.has(p.kod) ? '<span class="chip ok" title="Dane w pamięci tabletu">✓ offline</span>' : ''}</button>`).join('') || '<div class="li mute">Brak aktywnych budów. Połącz się z siecią, aby pobrać listę.</div>'}</div>`;
    function card(p) { return `<button class="tile" data-k="${U.esc(p.kod)}"><b>${U.esc(p.nazwa)}</b><span class="mute">${U.esc(p.adres || '')}</span>${off.has(p.kod) ? '<span class="chip ok" style="align-self:flex-start">✓ offline</span>' : ''}</button>`; }
    const inp = $('#q');
    inp.oninput = () => { UI.par.q = inp.value; Views.home(); const i = $('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => openProject(b.dataset.k));
  },

  /* Karta budowy – wygląd B (od 1.12.0): nagłówek, nawigacja/pinezka, 4 główne kafelki, „Więcej” */
  async budowa() {
    const p = curProj(); if (!p) return UI.go('home');
    if (!dostepDoBudowy(p)) { S.kod = null; UI.go('home'); return brakDostepu(p); }
    UI.header(p.kod + ' · budowa', () => UI.wstecz('home'));
    const pd = S.proj || {};
    const F = fold(S.ev);
    const urz = urzE();
    const cnt = liczStatusy(urz, F);
    const openB = Object.values(F.braki).filter(b => !b.zamk && brakWEtapie(b));
    const pilne = openB.filter(b => b.blokuje).length;
    const pct = urz.length ? Math.round(cnt.gotowe / urz.length * 100) : 0;
    const prot = Object.values(F.prot);
    const rob = prot.filter(x => x.stan === 'roboczy').length;
    const bezProt = Prot.wszystkie().length ? urz.filter(u => protZnacznik(u.id, F).k === 'do').length : 0;
    const fotki = Object.keys(F.fotoInfo).length;
    const dzis = U.day(); const fotDzis = Object.values(F.fotoInfo).filter(f => U.day(f.ts) === dzis).length;
    const notatki = F.notes.length;
    const tech = (await DB.get('tech')) || [];
    const lok = lokBudowy(p), wsp = wspolrzedne(lok), link = /^https?:/.test(lok);
    const cel = wsp ? wsp.lat + ',' + wsp.lon : link ? '' : p.adres;
    const navUrl = link ? lok : cel ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(cel) : '';
    const mozePin = !wsp && !link;
    const nazwa = String(p.nazwa || '').replace(new RegExp('^' + p.kod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '');
    const C = 2 * Math.PI * 44, PUSTY = '<span class="chip" style="visibility:hidden">–</span>';   // wyrównanie kafelków bez etykiety
    view.innerHTML = etapSwitch() + `
      <section class="bhero">
        <div class="row"><span class="bkod">${U.esc(p.kod)}</span>${p.wojskowy === 'tak' ? '<span class="bpill">obiekt wojskowy · uprawnienie M</span>' : ''}${S.etap ? `<span class="bpill">etap ${U.esc(S.etap)}</span>` : ''}</div>
        <div><h1>${U.esc(nazwa || p.nazwa)}</h1><div class="bsub">${U.esc([p.adres, p.kontakt && 'kontakt: ' + p.kontakt].filter(Boolean).join(' · ') || 'brak adresu')}</div></div>
        ${p.uwagi ? `<div class="bsub" style="color:#E5ECF6">${U.esc(p.uwagi)}</div>` : ''}
        <div class="bhact">
          ${navUrl ? `<a class="hb pri" href="${U.esc(navUrl)}" target="_blank" rel="noopener">${ic('nav')}Nawiguj</a>` : ''}
          ${mozePin ? `<button class="hb ${navUrl ? '' : 'pri'}" id="bPin">${ic('pin')}${navUrl ? 'Zapisz pinezkę' : 'Dodaj pinezkę'}</button>` : ''}
          <button class="hb" id="bBrak">${ic('warn')}Zgłoś brak</button>
          <button class="hb" id="bNote">${ic('note')}Notatka</button>
        </div>
      </section>
      ${Session.isBiuro() && (pd.ostrzezenia || []).length ? `<div class="badbox" style="margin-top:14px"><b>Dane do poprawy (widzi tylko biuro)</b><br>${pd.ostrzezenia.map(U.esc).join('<br>')}</div>` : ''}
      <section class="card bstat" style="margin-top:14px">
        <div class="ring"><svg viewBox="0 0 100 100" role="img" aria-label="Postęp ${pct} procent"><circle cx="50" cy="50" r="44" fill="none" stroke="#E2E8F0" stroke-width="10"></circle><circle cx="50" cy="50" r="44" fill="none" stroke="#1D4ED8" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"></circle></svg><span>${pct}%</span></div>
        <div class="bsg"><div><span class="n">${cnt.gotowe}<small>/${urz.length}</small></span><span>urządzeń gotowych</span></div><div><span class="n">${prot.length}</span><span>protokołów${rob ? ' · ' + rob + ' robocze' : ''}</span></div><div><span class="n ${openB.length ? 'red' : ''}">${openB.length}</span><span>otwartych braków</span></div></div>
      </section>
      <div class="bgrid" style="margin-top:14px">
        <button class="big" id="tPodl">${`<span class="bi">${ic('plug')}</span><span class="bn2">${urz.length}</span><span class="bt"><b>Urządzenia</b><span>Lista, rzuty, podłączenia</span></span>`}${bezProt ? `<span class="chip warn">${bezProt} bez protokołu</span>` : cnt.brak ? `<span class="chip bad">${cnt.brak} z brakiem</span>` : PUSTY}</button>
        <button class="big" id="tProt" ${Prot.wszystkie().length ? '' : 'disabled'}><span class="bi">${ic('proto')}</span><span class="bn2">${prot.length}</span><span class="bt"><b>Protokoły</b><span>Uruchomienia i pomiary</span></span>${rob ? `<span class="chip warn">${rob} robocze</span>` : PUSTY}</button>
        <button class="big" id="tBraki"><span class="bi">${ic('warn')}</span><span class="bn2">${openB.length}</span><span class="bt"><b>${Session.isBiuro() ? 'Braki i tematy' : 'Braki'}</b><span>Zgłoś i zamknij</span></span>${pilne ? `<span class="chip bad">${pilne} ${odm(pilne, 'blokuje', 'blokują', 'blokuje')} pracę</span>` : PUSTY}</button>
        <button class="big" id="tFoto"><span class="bi">${ic('cam')}</span><span class="bn2">${fotki}</span><span class="bt"><b>Zdjęcia</b><span>Wszystkie z budowy</span></span>${fotDzis ? `<span class="chip gr">+${fotDzis} dziś</span>` : PUSTY}</button>
      </div>
      <section class="card more" style="margin-top:14px"><span class="lbl">Więcej</span>
        <button class="mrow" id="mNot">${ic('note')}<b>Notatki</b><span>${notatki}</span>${ic('chev')}</button>
        <button class="mrow" id="mPost">${ic('chart')}<b>Postęp${maEtapy() ? ' i etapy' : ''}</b><span>${pct}%</span>${ic('chev')}</button>
        <button class="mrow" id="mDokP">${ic('folder')}<b>Dokumenty projektowe</b><span>${(pd.pliki || []).length}</span>${ic('chev')}</button>
        <button class="mrow" id="mDokT">${ic('book')}<b>Dokumenty techniczne</b><span>${tech.length}</span>${ic('chev')}</button>
      </section>`;
    bindEtap();
    $('#tPodl').onclick = () => UI.go('rzut', {});
    $('#tProt').onclick = () => UI.go('protokoly');
    $('#tBraki').onclick = () => UI.go('braki');
    $('#tFoto').onclick = () => UI.go('zdjecia');
    $('#mNot').onclick = () => UI.go('notatki');
    $('#mPost').onclick = () => UI.go('postep');
    $('#mDokP').onclick = () => UI.go('dokumenty', { typ: 'proj' });
    $('#mDokT').onclick = () => UI.go('dokumenty', { typ: 'tech' });
    $('#bBrak').onclick = () => Dialogs.brak('');
    $('#bNote').onclick = () => Dialogs.notatka('');
    if ($('#bPin')) $('#bPin').onclick = () => zapiszPinezke(p);
  },

  /* Dokumenty projektowe (pliki budowy) i techniczne (DTR z _Techniczne) – od 1.12.0 osobne ekrany */
  async dokumenty(par) {
    const p = curProj(); if (!p) return UI.go('home');
    const tech = par.typ === 'tech';
    UI.header(p.kod + (tech ? ' · dokumenty techniczne' : ' · dokumenty projektowe'), () => UI.wstecz('budowa'));
    const pliki = tech ? ((await DB.get('tech')) || []) : ((S.proj || {}).pliki || []);
    const grupy = groupBy(pliki, f => f.grupa || '');
    view.innerHTML = `<h1>${tech ? 'Dokumenty techniczne' : 'Dokumenty projektowe'}</h1>
      ${tech && S.techInfo ? `<p class="mute">${U.esc(S.techInfo)}</p>` : ''}
      <p class="mute">${tech ? 'DTR i karty urządzeń – wspólne dla wszystkich budów.' : 'Rzuty, schematy i dokumenty tej budowy.'} Pliki z ✓ są w pamięci tabletu.</p>
      ${grupy.map(([g, arr]) => `${g || grupy.length > 1 ? `<h2>${U.esc(g || 'Ogólne')}</h2>` : ''}<div class="list">${arr.map(f => `<button class="li" data-f="${U.esc(f.id)}">${ic(tech ? 'book' : 'doc')}<span class="grow">${U.esc(f.name)}</span><span class="mute" data-fs="${U.esc(f.id)}">${mb(f.size)}</span></button>`).join('')}</div>`).join('') || '<p class="mute">Brak plików.</p>'}`;
    view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => openFile(b.dataset.f));
    pliki.forEach(async f => { const el = view.querySelector(`[data-fs="${CSS.escape(f.id)}"]`); if (el && await DB.hasFile(f.id)) el.textContent = mb(f.size) + ' ✓'; });
  },

  /* Notatki z budowy (od 1.12.0) */
  notatki() {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · notatki', () => UI.wstecz('budowa'));
    const q = U.norm(UI.par.q || '');
    const F = fold(S.ev);
    const lista = F.notes.slice().sort((a, b) => a.ts < b.ts ? 1 : -1).filter(e => !q || U.norm([e.d.tekst, e.kto, e.urz].join(' ')).includes(q));
    view.innerHTML = `<div class="row"><h1 class="grow" style="margin:0">Notatki (${F.notes.length})</h1><button class="btn pri" id="nNew">${ic('plus')} Nowa notatka</button></div>
      <label class="search" style="margin:14px 0"><span hidden>Szukaj w notatkach</span><input type="search" id="q" value="${U.esc(UI.par.q || '')}" placeholder="słowo, urządzenie, osoba" autocomplete="off"></label>
      <div class="stack">${lista.map(e => `<article class="card note"><div class="row"><b>${U.esc(e.kto)}</b><span class="mute">${U.fmt(e.ts)}</span>${e.urz ? `<button class="chip" data-u="${U.esc(e.urz)}">${U.esc(e.urz)}</button>` : ''}</div>
        <p>${U.esc(e.d.tekst || '')}</p>${(e.d.foto || []).filter(f => F.fotoInfo[f]).length ? `<div class="thumbs" style="margin-top:8px" data-fotos="${U.esc(e.d.foto.filter(f => F.fotoInfo[f]).join(','))}"></div>` : ''}</article>`).join('') || '<p class="mute">Brak notatek.</p>'}</div>`;
    $('#nNew').onclick = () => Dialogs.notatka('');
    const inp = $('#q'); inp.oninput = () => { UI.par.q = inp.value; Views.notatki(); const i = $('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    view.querySelectorAll('[data-u]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.u));
    hydrateFotos(view);
  },

  /* Wszystkie zdjęcia z budowy z opisem urządzenia / braku / notatki (od 1.12.0) */
  zdjecia(par) {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · zdjęcia', () => UI.wstecz('budowa'));
    const F = fold(S.ev);
    const filtr = par.f || 'all', ile = par.ile || 40;
    const wszystkie = Object.values(F.fotoInfo).sort((a, b) => a.ts < b.ts ? 1 : -1);
    const rodz = f => f.rodzaj === 'brak' ? 'brak' : f.rodzaj === 'notatka' ? 'notatka' : 'urz';
    const lista = wszystkie.filter(f => filtr === 'all' || rodz(f) === filtr);
    const n = k => wszystkie.filter(f => rodz(f) === k).length;
    view.innerHTML = `<h1>Zdjęcia z budowy (${wszystkie.length})</h1>
      <div class="tabs">${[['all', 'Wszystkie', wszystkie.length], ['urz', 'Urządzenia', n('urz')], ['brak', 'Braki', n('brak')], ['notatka', 'Notatki', n('notatka')]].map(([k, l, c]) => `<button class="tab ${k === filtr ? 'on' : ''}" data-fl="${k}">${l} ${c}</button>`).join('')}</div>
      ${groupBy(lista.slice(0, ile), f => U.day(f.ts)).map(([d, arr]) => `<h2>${new Date(d + 'T12:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <div class="gal">${arr.map(f => { const o = opisZdjecia(f, F); return `<button class="gph" data-g="${U.esc(f.fid)}"><span class="gimg" data-gi="${U.esc(f.fid)}">zdjęcie na Dysku</span><span class="gcap"><b>${U.esc(o.t)}</b>${o.s ? `<span>${U.esc(o.s)}</span>` : ''}<span class="m">${U.esc(f.kto)} · ${U.fmt(f.ts)}</span></span></button>`; }).join('')}</div>`).join('') || '<p class="mute">Brak zdjęć.</p>'}
      ${lista.length > ile ? `<div class="row" style="margin-top:14px"><button class="btn grow" id="gMore">Pokaż kolejne (${lista.length - ile})</button></div>` : ''}
      <p class="mute">Pełna rozdzielczość tylko dla zdjęć z tego tabletu – pozostałe pobierane w podglądzie pomniejszonym.</p>`;
    view.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => UI.go('zdjecia', { f: b.dataset.fl }));
    if ($('#gMore')) $('#gMore').onclick = () => UI.go('zdjecia', { ...par, ile: ile + 40 });
    view.querySelectorAll('[data-g]').forEach(b => b.onclick = () => Foto.podglad(b.dataset.g));
    view.querySelectorAll('[data-gi]').forEach(async el => {
      const fid = el.dataset.gi; const ph = await DB.getPhoto(fid), m = ph ? null : await DB.getFile('mini:' + fid);
      if (ph || m) { const img = new Image(); img.alt = 'zdjęcie'; img.src = URL.createObjectURL((ph || m).blob); el.innerHTML = ''; el.appendChild(img); }
    });
  },

  /* Rzuty + lista urządzeń */
  async rzut(par) {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · urządzenia', () => UI.wstecz('budowa'));
    const pd = S.proj || {}; const F = fold(S.ev);
    const urz = urzE();
    const sheets = [...new Set(urz.map(u => u.arkusz).filter(Boolean))];
    const mode = par.mode || 'rzut';
    const ark = sheets.includes(par.ark) ? par.ark : sheets[0] || '';
    const filt = par.f || 'all';
    const sOf = u => devStatus(u, F);
    const vis = urz.filter(u => filt === 'all' || (filt === 'todo' ? sOf(u) !== 'gotowe' : filt === 'brak' ? sOf(u) === 'brak' : filt.startsWith('p:') ? protZnacznik(u.id, F).k === filt.slice(2) : U.prefix(u.id) === filt));
    const prefixes = [...new Set(urz.map(u => U.prefix(u.id)))];
    view.innerHTML = etapSwitch() + `
      <div class="row" style="margin-bottom:10px">
        <div class="tabs grow" style="margin:0">${['rzut', 'lista'].map(m => `<button class="tab ${m === mode ? 'on' : ''}" data-m="${m}">${m === 'rzut' ? 'Rzut' : 'Lista'}</button>`).join('')}
        <span style="width:12px"></span>${[['all', 'Wszystkie'], ['todo', 'Do zrobienia'], ['brak', 'Z brakiem'], ...(Prot.wszystkie().length ? [['p:do', 'Bez protokołu'], ['p:rob', 'Protokół roboczy'], ['p:ok', 'Z protokołem']] : []), ...prefixes.map(x => [x, typOf(x + '1').nazwa])].map(([k, l]) => `<button class="tab ${k === filt ? 'on' : ''}" data-fl="${U.esc(k)}">${U.esc(l)}</button>`).join('')}</div>
      </div>
      ${mode === 'rzut' ? `
        <div class="tabs">${sheets.map(s => `<button class="tab ${s === ark ? 'on' : ''}" data-a="${U.esc(s)}">${U.esc(s)} · ${U.esc((urz.find(u => u.arkusz === s) || {}).kond || '')}</button>`).join('')}</div>
        <div class="planbox"><div class="plan" id="plan"><div class="noplan" id="noplan">Ładuję rzut…</div>
          <div class="planctl"><button id="zin" aria-label="Powiększ">+</button><button id="zout" aria-label="Pomniejsz">−</button><button id="zfit" aria-label="Cały rzut">⤢</button></div></div>
          <div class="side">${legend(urz.filter(u => u.arkusz === ark), F)}${attention(urz.filter(u => u.arkusz === ark), F)}</div></div>`
        : `<div class="list">${groupBy(vis, u => u.kond + ' · ' + u.arkusz).map(([g, arr]) => `<div class="li" style="background:#eef1f5;font-weight:600">${U.esc(g)}</div>` + arr.map(u => `
            <button class="li" data-u="${U.esc(u.id)}"><span class="st ${ST[sOf(u)]}"></span><b>${U.esc(u.id)}</b><span class="grow">${U.esc(u.typ)}<br><span class="mute">${U.esc(u.grupa)}${u.uwagi ? ' · ' + U.esc(u.uwagi) : ''}</span></span>${(z => z.k ? `<span class="pmark ${z.k}">${U.esc(z.t)}</span>` : '')(protZnacznik(u.id, F))}<span class="mute m">${progress(u, F)}</span></button>`).join('')).join('') || '<div class="li mute">Brak urządzeń dla filtra.</div>'}</div>`}
      ${mode === 'rzut' && !sheets.length ? '<p class="mute">Brak urządzeń w tym etapie.</p>' : ''}`;
    bindEtap();
    view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => UI.go('rzut', { ...par, mode: b.dataset.m }));
    view.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => UI.go('rzut', { ...par, f: b.dataset.fl }));
    view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => UI.go('rzut', { ...par, ark: b.dataset.a, focus: null }));
    view.querySelectorAll('[data-u]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.u));
    if (mode === 'rzut' && ark) {
      const fid = (pd.rzuty || {})[ark];
      const f = fid && await DB.getFile(fid);
      if (!f) { $('#noplan').textContent = 'Brak rzutu ' + ark + ' w pamięci tabletu. Połącz się z WiFi i zsynchronizuj (plik „' + ark + '.jpg” w folderze Do wglądu).'; return; }
      $('#noplan').remove();
      const marks = vis.filter(u => u.arkusz === ark && u.x !== '' && u.x != null).map(u => ({ id: u.id, x: +u.x, y: +u.y, cls: ST[sOf(u)], label: u.id + ' – ' + sOf(u) }));
      const pv = PlanView($('#plan'), URL.createObjectURL(f.blob), marks, id => Dialogs.device(id)); pv.ark = ark; UI.pv = pv;
      $('#zin').onclick = () => pv.zoomIn(); $('#zout').onclick = () => pv.zoomOut(); $('#zfit').onclick = () => pv.fit();
      if (par.focus) setTimeout(() => pv.focus(par.focus), 300);
    }
  },

  /* Braki i tematy */
  braki(par) {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · braki', () => UI.wstecz('budowa'));
    const F = fold(S.ev); const showClosed = par.closed;
    const br = Object.values(F.braki).filter(b => (showClosed ? b.zamk : !b.zamk) && brakWEtapie(b)).sort((a, b) => a.ts < b.ts ? 1 : -1);
    const temE = t => { if (!maEtapy() || !S.etap || !t.urz) return true; const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === t.urz); return !u || u.etap === S.etap; };
    const tem = ((S.proj || {}).tematy || []).filter(t => (showClosed ? t.status === 'zamknięty' : t.status !== 'zamknięty') && temE(t));
    view.innerHTML = etapSwitch() + `
      <div class="row"><div class="tabs grow" style="margin:0"><button class="tab ${!showClosed ? 'on' : ''}" data-c="0">Otwarte</button><button class="tab ${showClosed ? 'on' : ''}" data-c="1">Zamknięte</button></div>
        <button class="btn bad" id="nb">+ Zgłoś brak</button></div>
      <div class="grid2" style="margin-top:12px">
        <div class="stack"><h2>Braki z budowy (${br.length})</h2>${br.map(issueHtml).join('') || '<p class="mute">Brak.</p>'}</div>
        ${!Session.isBiuro() ? '' : `<div class="stack"><h2>Tematy do wyjaśnienia (${tem.length})</h2>${tem.map(t => `<div class="card"><div class="row"><b>${U.esc(t.urz || t.id)}</b><span class="chip">${U.esc(t.kat || 'Do wyjaśnienia')}</span></div><div>${U.esc(t.opis)}</div></div>`).join('') || '<p class="mute">Brak.</p>'}<p class="mute">Tematy widzi tylko biuro; prowadzone w liście urządzeń → Tematy.</p></div>`}
      </div>`;
    bindEtap();
    view.querySelectorAll('[data-c]').forEach(b => b.onclick = () => UI.go('braki', { closed: b.dataset.c === '1' }));
    $('#nb').onclick = () => Dialogs.brak('');
    bindIssue(view); hydrateFotos(view);
  },

  /* Protokoły (js/prot.js) */
  protokoly(par) { return ProtViews.protokoly(par); },
  protokol(par) { return ProtViews.protokol(par); },

  /* Postęp */
  postep() {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · postęp', () => UI.wstecz('budowa'));
    const F = fold(S.ev); const urz = urzE(); const all = (S.proj || {}).urzadzenia || [];
    const groups = groupBy(urz, u => U.prefix(u.id));
    const today = U.day();
    const todayEv = S.ev.filter(e => U.day(e.ts) === today);
    const who = [...new Set(todayEv.map(e => e.kto))];
    view.innerHTML = etapSwitch() + `
      <div class="grid2">
        ${maEtapy() ? `<div class="card stack"><h2 style="margin:0">Według etapów</h2>
          ${etapyOf().map(e => barRow(etapOpis(e.id), all.filter(u => u.etap === e.id), F)).join('')}
          ${barRow('Łącznie', all, F, true)}</div>` : ''}
        <div class="card stack"><h2 style="margin:0">Według typu urządzeń${S.etap ? ' · etap ' + U.esc(S.etap) : ''}</h2>
          ${groups.map(([pre, arr]) => barRow(typOf(arr[0].id).nazwa, arr, F)).join('') || '<p class="mute">Brak urządzeń.</p>'}
        </div>
        <div class="card stack"><h2 style="margin:0">Dziś na budowie</h2>
          <div>${who.length ? U.esc(who.join(', ')) : 'Brak wpisów z dzisiaj.'}</div>
          <div class="mute">${todayEv.filter(e => e.typ === 'krok' && e.d.wart).length} zaliczonych kroków · ${todayEv.filter(e => e.typ === 'brak').length} nowych braków · ${todayEv.filter(e => e.typ === 'foto').length} zdjęć</div>
        </div>
      </div>`;
    bindEtap();
  }
};

/* ---------- Okna ---------- */
const Dialogs = {
  device(id) {
    const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === id); if (!u) return;
    const F = fold(S.ev); const st = F.dev[id] || { kroki: {}, sn: '', foto: [], hist: [] };
    const t = typOf(id); const status = devStatus(u, F);
    const sn = st.sn || u.sn || '';
    const hasTab = st.foto.some(f => f.rodzaj === 'tabliczka');
    const br = Object.values(F.braki).filter(b => b.urz === id);
    const blocked = br.some(b => !b.zamk && b.blokuje);
    modal.innerHTML = `<div class="ov" id="ov"><div class="sheet" role="dialog" aria-label="Urządzenie ${U.esc(id)}">
      <div class="shead"><span class="st ${ST[status]}"></span><h3>${U.esc(id)} <span class="mute" style="font-size:15px">${U.esc(t.nazwa)}</span></h3><button class="btn sm" id="dx" aria-label="Zamknij">✕</button></div>
      <div class="sbody">
        <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px">
          <div><div class="mute">Typ</div>${U.esc(u.typ)}</div><div><div class="mute">Zasilanie</div>${U.esc(u.zasilanie || '—')}</div>
          <div><div class="mute">Kondygnacja</div>${U.esc(u.kond || '—')}</div><div><div class="mute">Arkusz</div>${U.esc(u.arkusz || '—')}</div>
          ${maEtapy() || u.etap ? `<div style="grid-column:1/3"><div class="mute">Etap budowy</div>${U.esc(u.etap ? etapOpis(u.etap) : '— (brak przypisania)')}</div>` : ''}
          ${u.uwagi ? `<div style="grid-column:1/3"><div class="mute">Uwagi</div>${U.esc(u.uwagi)}</div>` : ''}
        </div>
        <div class="card stack"><div class="row"><b class="grow">Nr seryjny</b>${t.sn ? '<span class="chip warn">wymagany</span>' : ''}</div>
          <div class="row"><input type="text" id="sn" value="${U.esc(sn)}" placeholder="zeskanuj kod lub wpisz" class="grow" style="flex:1"><button class="btn sm" id="snSave">Zapisz</button></div>
          <div class="row"><button class="btn sm pri" id="scan">Skanuj kod</button><button class="btn sm" id="tab">Zdjęcie tabliczki${hasTab ? ' ✓' : ''}</button></div></div>
        ${protKarta(id, F)}
        <div><div class="lbl">Kroki</div><div class="stack" style="margin-top:8px">${t.kroki.map((k, i) => {
          const s = st.kroki[i]; const done = s && s.val;
          const last = i === t.kroki.length - 1;
          const needSn = last && t.sn && !sn && !hasTab && !done;
          const dis = (!done && (blocked || needSn));
          return `<button class="step ${done ? 'done' : ''}" data-k="${i}" ${dis ? 'disabled' : ''}><span class="box">${done ? '✓' : ''}</span><span class="grow"><b>${U.esc(k)}</b><br><span class="mute">${done ? U.esc(s.kto) + ' · ' + U.fmt(s.ts) : blocked ? 'Zablokowane: otwarty brak' : needSn ? 'Wymaga nr seryjnego lub zdjęcia tabliczki' : 'do zrobienia'}</span></span></button>`;
        }).join('')}</div></div>
        <div><div class="lbl">Braki (${br.filter(b => !b.zamk).length} otwartych)</div><div class="stack" style="margin-top:8px">${br.map(issueHtml).join('') || '<span class="mute">Brak.</span>'}</div></div>
        <div><div class="lbl">Zdjęcia</div><div class="thumbs" id="thumbs" style="margin-top:8px"></div></div>
        <div><div class="lbl">Historia</div><div class="hist" style="margin-top:8px">${st.hist.slice().reverse().slice(0, 30).map(e => `<div><b>${U.fmt(e.ts)}</b> ${U.esc(e.kto)} – ${U.esc(histTxt(e))}</div>`).join('') || '<span class="mute">Brak wpisów.</span>'}</div></div>
      </div>
      <div class="sfoot"><button class="btn bad" id="dBrak">Zgłoś brak</button><button class="btn" id="dFoto">Zdjęcie</button><button class="btn" id="dPlan">Na rzucie</button></div>
    </div></div>`;
    $('#dx').onclick = UI.close; $('#ov').onclick = e => { if (e.target.id === 'ov') UI.close(); };
    modal.querySelectorAll('.step').forEach(b => b.onclick = async () => {
      const i = +b.dataset.k; const s = st.kroki[i];
      await addEvent('krok', id, { krok: i, nazwa: t.kroki[i], wart: !(s && s.val) });
      Dialogs.device(id); UI.refresh();
    });
    $('#snSave').onclick = async () => { const v = $('#sn').value.trim(); if (!v) return; await saveSn(id, v); };
    $('#scan').onclick = () => Dialogs.scan(v => saveSn(id, v));
    $('#tab').onclick = () => pickPhoto(id, 'tabliczka');
    $('#dFoto').onclick = () => pickPhoto(id, 'zdjecie');
    $('#dBrak').onclick = () => Dialogs.brak(id);
    modal.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => { const z = UI.cur; UI.close(); UI.go('protokol', { pid: b.dataset.pid }, { dlg: z !== 'protokol' ? id : null }); });
    modal.querySelectorAll('[data-npr]').forEach(b => b.onclick = () => { UI.close(); UI.go('protokol', { nowy: b.dataset.npr, urz: id }, { dlg: id }); });
    $('#dPlan').onclick = async () => { if (!wEtapie(u)) await ustawEtap(u.etap || ''); const z = UI.cur; UI.close(); UI.go('rzut', { mode: 'rzut', ark: u.arkusz, focus: id }, { dlg: z !== 'rzut' ? id : null }); };
    bindIssue(modal, () => Dialogs.device(id));
    thumbs($('#thumbs'), st.foto); hydrateFotos(modal);
  },

  brak(urz) {
    const kats = (S.boot.slowniki.kategorie || []);
    let kat = kats[0] || 'Inne'; let photos = [];
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Zgłoś brak">
      <div class="shead"><h3>Zgłoś brak</h3><span class="mute">${U.esc(S.user.name)}</span></div>
      <div class="sbody">
        <div><div class="mute">Dotyczy</div><b>${urz ? U.esc(urz) : (maEtapy() && S.etap ? 'Etap ' + U.esc(etapOpis(S.etap)) : 'Cała budowa')}</b></div>
        <div><div class="mute" style="margin-bottom:8px">Rodzaj braku</div><div class="cats">${kats.map(k => `<button data-k="${U.esc(k)}" class="${k === kat ? 'on' : ''}">${U.esc(k)}</button>`).join('')}</div></div>
        <label><span class="f" style="display:block">Opis – co jest nie tak i co jest potrzebne</span><textarea id="bo"></textarea></label>
        <div class="row"><button class="btn" id="bf">+ Zdjęcie</button><span class="mute" id="bfc"></span>
          <label class="row" style="margin-left:auto"><input type="checkbox" id="bb" style="width:24px;height:24px"> Blokuje dalszą pracę</label></div>
      </div>
      <div class="sfoot"><button class="btn" id="bx">Anuluj</button><button class="btn bad" id="bs">Zapisz brak</button></div></div></div>`;
    modal.querySelectorAll('.cats button').forEach(b => b.onclick = () => { kat = b.dataset.k; modal.querySelectorAll('.cats button').forEach(x => x.classList.toggle('on', x === b)); });
    $('#bf').onclick = () => pickFile(async f => { const id = await storePhoto(f, urz || 'BUDOWA', 'brak'); photos.push(id); $('#bfc').textContent = photos.length + ' zdjęć'; });
    $('#bx').onclick = () => urz ? Dialogs.device(urz) : UI.close();
    $('#bs').onclick = async () => {
      const opis = $('#bo').value.trim(); if (!opis) { UI.toast('Dodaj krótki opis.'); return; }
      const d = { kat, opis, blokuje: $('#bb').checked, foto: photos };
      if (!urz && maEtapy() && S.etap) d.etap = S.etap;
      await addEvent('brak', urz, d);
      UI.toast('Brak zapisany'); urz ? Dialogs.device(urz) : UI.close(); UI.refresh();
    };
  },

  /* Okno braku (od 1.9.0): edycja i komentarz – każdy; usunięcie – autor i biuro; ponowne otwarcie – biuro */
  brakOkno(bid, after) {
    const F = fold(S.ev), b = F.braki[bid]; if (!b) { UI.toast('Brak nie istnieje (usunięty?)'); return; }
    const kats = (S.boot.slowniki.kategorie || []);
    const autor = b.kto === S.user.name, biuro = Session.isBiuro();
    let kat = b.kat, nowe = [], komFoto = [];
    const wroc = () => { if (after) after(); else UI.close(); UI.refresh(); };
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Brak">
      <div class="shead"><h3>Brak – ${b.urz ? U.esc(b.urz) : b.etap ? 'etap ' + U.esc(b.etap) : 'budowa'}</h3><span class="chip ${b.zamk ? 'ok' : 'bad'}">${b.zamk ? 'zamknięty' : 'otwarty'}</span></div>
      <div class="sbody">
        <div class="mute">Zgłosił: ${U.esc(b.kto)} · ${U.fmt(b.ts)}${b.zamk ? ' · zamknął ' + U.esc(b.zamk.kto) + ' ' + U.fmt(b.zamk.ts) + (b.zamk.opis ? ' – ' + U.esc(b.zamk.opis) : '') : ''}</div>
        <div><div class="mute" style="margin-bottom:8px">Rodzaj braku</div><div class="cats">${kats.map(k => `<button data-k="${U.esc(k)}" class="${k === kat ? 'on' : ''}">${U.esc(k)}</button>`).join('')}</div></div>
        <label><span class="f" style="display:block">Opis</span><textarea id="eo">${U.esc(b.opis)}</textarea></label>
        <div class="row"><button class="btn" id="ef">+ Zdjęcie</button><span class="mute" id="efc"></span>
          <label class="row" style="margin-left:auto"><input type="checkbox" id="eb" style="width:24px;height:24px" ${b.blokuje ? 'checked' : ''}> Blokuje dalszą pracę</label></div>
        <div class="thumbs" data-fotos="${U.esc(b.foto.join(','))}"></div>
        <div class="lbl">Komentarze (${b.kom.length})</div>
        <div class="stack">${b.kom.map(k => `<div class="card"><div class="mute">${U.esc(k.kto)} · ${U.fmt(k.ts)}</div><div>${U.esc(k.tekst)}</div>${k.foto.length ? `<div class="thumbs" data-fotos="${U.esc(k.foto.join(','))}"></div>` : ''}</div>`).join('') || '<span class="mute">Brak komentarzy.</span>'}</div>
        <textarea id="ek" placeholder="Dodaj komentarz"></textarea>
        <div class="row"><button class="btn sm" id="ekf">+ Zdjęcie do komentarza</button><span class="mute" id="ekc"></span><button class="btn sm pri" id="eks" style="margin-left:auto">Dodaj komentarz</button></div>
        ${b.zm.length ? `<div class="mute">Zmiany: ${b.zm.map(z => U.esc(z.co + ' – ' + z.kto + ' ' + U.fmt(z.ts))).join(' · ')}</div>` : ''}
      </div>
      <div class="sfoot">
        ${autor || biuro ? '<button class="btn bad" id="eDel">Usuń</button>' : ''}
        ${b.zamk ? (biuro ? '<button class="btn" id="eOpen">Otwórz ponownie</button>' : '') : '<button class="btn ok" id="eClose">Zamknij brak</button>'}
        ${b.urz ? '<button class="btn" id="eUrz">Urządzenie</button>' : ''}
        <button class="btn" id="eX">Anuluj</button><button class="btn pri" id="eS">Zapisz zmiany</button></div></div></div>`;
    hydrateFotos(modal);
    modal.querySelectorAll('.cats button').forEach(x => x.onclick = () => { kat = x.dataset.k; modal.querySelectorAll('.cats button').forEach(y => y.classList.toggle('on', y === x)); });
    $('#ef').onclick = () => pickFile(async f => { nowe.push(await storePhoto(f, b.urz || 'BUDOWA', 'brak')); $('#efc').textContent = '+' + nowe.length + ' zdjęć'; });
    $('#ekf').onclick = () => pickFile(async f => { komFoto.push(await storePhoto(f, b.urz || 'BUDOWA', 'brak')); $('#ekc').textContent = komFoto.length + ' zdjęć'; });
    $('#eX').onclick = wroc;
    if ($('#eUrz')) $('#eUrz').onclick = () => Dialogs.device(b.urz);
    $('#eS').onclick = async () => {
      const opis = $('#eo').value.trim(), blok = $('#eb').checked; if (!opis) { UI.toast('Opis nie może być pusty.'); return; }
      const d = { bid };
      if (kat !== b.kat) d.kat = kat; if (opis !== b.opis) d.opis = opis; if (blok !== !!b.blokuje) d.blokuje = blok; if (nowe.length) d.foto = nowe;
      if (Object.keys(d).length === 1) { wroc(); return; }
      await addEvent('brak_edyc', b.urz, d); UI.toast('Zmiany zapisane'); wroc();
    };
    $('#eks').onclick = async () => {
      const t = $('#ek').value.trim(); if (!t && !komFoto.length) { UI.toast('Wpisz komentarz.'); return; }
      await addEvent('brak_kom', b.urz, { bid, tekst: t, foto: komFoto }); UI.toast('Komentarz dodany'); Dialogs.brakOkno(bid, after);
    };
    if ($('#eClose')) $('#eClose').onclick = async () => {
      const opis = prompt('Jak usunięto brak? (opcjonalnie)'); if (opis === null) return;
      await addEvent('brak_zamk', b.urz, { bid, opis: opis.trim() }); UI.toast('Brak zamknięty'); wroc();
    };
    if ($('#eOpen')) $('#eOpen').onclick = async () => { await addEvent('brak_edyc', b.urz, { bid, otworz: true }); UI.toast('Brak otwarty ponownie'); wroc(); };
    if ($('#eDel')) $('#eDel').onclick = async () => {
      if (!confirm('Usunąć ten brak? Zniknie z list (historia zostaje).')) return;
      await addEvent('brak_edyc', b.urz, { bid, usun: true }); UI.toast('Brak usunięty'); wroc();
    };
  },

  notatka(urz) {
    let photos = [];
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Notatka">
      <div class="shead"><h3>Notatka z budowy</h3></div>
      <div class="sbody"><textarea id="nt" placeholder="Co ustalono, co zrobiono, co trzeba przekazać do biura"></textarea>
        <div class="row"><button class="btn" id="nf">+ Zdjęcie</button><span class="mute" id="nfc"></span></div></div>
      <div class="sfoot"><button class="btn" id="nx">Anuluj</button><button class="btn pri" id="ns">Zapisz</button></div></div></div>`;
    $('#nf').onclick = () => pickFile(async f => { photos.push(await storePhoto(f, urz || 'BUDOWA', 'notatka')); $('#nfc').textContent = photos.length + ' zdjęć'; });
    $('#nx').onclick = UI.close;
    $('#ns').onclick = async () => { const t = $('#nt').value.trim(); if (!t) return; await addEvent('notatka', urz, { tekst: t, foto: photos }); UI.toast('Notatka zapisana'); UI.close(); };
  },

  /* Okienko zadania z kalendarza (od 1.12.0): dane z ClickUp, 3 statusy (offline), przejście do budowy */
  zadanie(t, bud, osoby) {
    let wyb = null, powod = '';
    const a = t.start ? new Date(t.start) : null, b = t.koniec ? new Date(t.koniec) : null;
    const kiedy = maGodziny(t) ? hm(a) + ' – ' + hm(b) : b ? 'do ' + b.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + (t.godzKoniec ? ' ' + hm(b) : '') : '—';
    const draw = () => {
      modal.innerHTML = `<div class="ov bottom" id="ov"><section class="zsheet" role="dialog" aria-label="Zadanie">
        <div class="grab"></div>
        <div class="row">${bud ? `<span class="chip">${U.esc(bud.kod)} · ${U.esc(String(bud.nazwa).replace(bud.kod, '').trim())}</span>` : `<span class="chip gr">${U.esc(t.listaNazwa || 'spoza budów ELWIS')}</span>`}<span class="chip gr">${U.esc(t.status || '')}${t.czeka ? ' · czeka na wysłanie' : ''}</span></div>
        <h2>${U.esc(t.nazwa)}</h2>
        <div class="zfacts"><div>Kiedy<b class="m">${U.esc(kiedy)}</b>${t.est ? 'szac. ' + String(Math.round(t.est / 36e5 * 10) / 10).replace('.', ',') + ' h' : ''}</div><div>Kto<b>${U.esc(osoby || '—')}</b></div></div>
        ${t.opis ? `<div><span class="lbl">Opis z ClickUp</span><p class="zopis">${U.esc(t.opis)}</p></div>` : ''}
        <div><span class="lbl">Jak poszło?</span>
          <div class="st3" style="margin-top:8px">${Object.entries(STATUS_ZAD).map(([k, v]) => `<button class="sb ${v.b} ${wyb === k ? 'on' : ''}" data-st="${k}">${ic(v.ic)}${v.t}<small>${k}</small></button>`).join('')}</div></div>
        ${wyb && wyb !== 'complete' ? `<div class="zwhy"><span class="lbl">Powód (opcjonalnie)</span>
          <div class="cats">${POWODY_ZAD.map(x => `<button data-pw="${U.esc(x)}" class="${x === powod ? 'on' : ''}">${U.esc(x)}</button>`).join('')}</div>
          <label><span class="lbl" style="display:block;margin-bottom:4px">Komentarz (opcjonalnie)</span><textarea id="zk" placeholder="Co zrobione, co zostało, warunek powrotu"></textarea></label></div>` : ''}
        <div class="zact">${bud ? `<button class="btn out" id="zBud">${ic('bud')}Przejdź do budowy</button>` : '<button class="btn" id="zX">Zamknij</button>'}<button class="btn pri" id="zOk" ${wyb ? '' : 'disabled'}>Zapisz status</button></div>
      </section></div>`;
      $('#ov').onclick = e => { if (e.target.id === 'ov') UI.close(); };
      modal.querySelectorAll('[data-st]').forEach(x => x.onclick = () => { const k = $('#zk') ? $('#zk').value : ''; wyb = x.dataset.st; draw(); if (k && $('#zk')) $('#zk').value = k; });
      modal.querySelectorAll('[data-pw]').forEach(x => x.onclick = () => { const k = $('#zk').value; powod = powod === x.dataset.pw ? '' : x.dataset.pw; draw(); $('#zk').value = k; });
      if ($('#zX')) $('#zX').onclick = UI.close;
      if ($('#zBud')) $('#zBud').onclick = () => { UI.close(); openProject(bud.kod); };
      $('#zOk').onclick = async () => {
        if (!wyb) return;
        const kom = $('#zk') ? $('#zk').value.trim() : '';
        const k = (await DB.get('zadKolejka')) || [];
        k.push({ id: U.uid('z'), task: t.id, status: wyb, powod: wyb === 'complete' ? '' : powod, komentarz: wyb === 'complete' ? '' : kom, kto: S.user.name, ts: U.now(), nazwa: t.nazwa });
        await DB.set('zadKolejka', k); await liczOczekujace();
        UI.close(); UI.toast(navigator.onLine ? 'Status zapisany' : 'Status zapisany – wyśle się po połączeniu z siecią'); UI.refresh();
        if (navigator.onLine) Sync.soon();
      };
    };
    draw();
  },

  async scan(onCode) {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices) {
      UI.toast('Ten tablet nie ma czytnika kodów – wpisz numer albo zrób zdjęcie tabliczki.'); return;
    }
    let stream, stop = false;
    const back = modal.innerHTML;
    const div = document.createElement('div');
    div.innerHTML = `<div class="ov center" id="ovs" style="z-index:60"><div class="dialog"><div class="shead"><h3>Skanuj kod</h3><button class="btn sm" id="sx">Zamknij</button></div>
      <div class="sbody"><video class="scan" id="vid" playsinline muted></video><p class="mute">Nakieruj aparat na kod kreskowy lub QR z tabliczki.</p></div></div></div>`;
    document.body.appendChild(div);
    const end = () => { stop = true; if (stream) stream.getTracks().forEach(t => t.stop()); div.remove(); };
    $('#sx').onclick = end;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = $('#vid'); v.srcObject = stream; await v.play();
      const det = new BarcodeDetector();
      const loop = async () => {
        if (stop) return;
        try { const r = await det.detect(v); if (r.length) { end(); onCode(r[0].rawValue); return; } } catch (e) { }
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { end(); UI.toast('Brak dostępu do aparatu.'); }
  }
};

/* ---------- Plan dnia ---------- */
const STATUS_ZAD = { 'complete': { t: 'Wykonane', kl: 'complete', ic: 'check', b: 'ok' }, 'update required': { t: 'Do kontynuacji', kl: 'update', ic: 'pause', b: 'wip' }, 'on hold': { t: 'Zadanie niepodjęte', kl: 'hold', ic: 'x', b: 'no' } };
const POWODY_ZAD = ['Brak materiału', 'Brak dostępu', 'Brak zasilania', 'Brak frontu robót', 'Koniec dnia', 'Inne'];
const PLAN_KOLORY = ['#0b4f8a', '#1f7a4d', '#a3561b', '#6b3fa0', '#b02e4c', '#0e7c86', '#5a6b1e', '#8a5a0b'];
function planWiek(t) {
  const d = new Date(t);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ', ' + hm(d);
}
/* Prognoza pogody (od 1.11.0) – tylko godziny 7–16: temperatura min/maks i czy będzie padać. S.pogoda = { 'lat,lon': { 'rrrr-mm-dd': {tmin,tmax,opad,szansa} } } */
const POGODA_DOM = { lat: 51.2465, lon: 22.5684, klucz: '51.25,22.57', miejsce: 'Lublin' };
function wspolrzedne(v) {
  const m = String(v || '').match(/(-?\d{1,2}[.,]\d+)\s*[,;\s]\s*(-?\d{1,3}[.,]\d+)/); if (!m) return null;
  const lat = +m[1].replace(',', '.'), lon = +m[2].replace(',', '.');
  return { lat, lon, klucz: lat.toFixed(2) + ',' + lon.toFixed(2) };
}
function pogodaDnia(k, lok) {
  const d = S.pogoda && lok && S.pogoda[lok.klucz] && S.pogoda[lok.klucz][k]; if (!d) return null;
  const pada = d.opad >= 0.2 || d.szansa >= 60, c = d.kod || 0;
  // ikona: najgorsza pogoda w godzinach 7–16 (kod WMO); deszcz zawsze widoczny
  const ikona = c >= 95 ? '⛈️' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? '🌨️' : pada || c >= 51 ? '🌧️' : c >= 45 ? '🌫️' : c >= 3 ? '☁️' : c >= 1 ? '⛅' : '☀️';
  return { tmin: Math.round(d.tmin), tmax: Math.round(d.tmax), pada, szansa: d.szansa, ikona, miejsce: lok.miejsce };
}
function odm(n, a, b, c) { return n === 1 ? a : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? b : c; }
function hm(d) { return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); }
function maGodziny(t) { return t.start && t.koniec && t.godzStart && t.godzKoniec && U.day(new Date(t.start)) === U.day(new Date(t.koniec)); }
function naDzien(t, dzien) {
  const k = t.koniec ? U.day(new Date(t.koniec)) : null, s0 = t.start ? U.day(new Date(t.start)) : k;
  return !!k && s0 <= dzien && dzien <= k;
}
function osobyTxt(t, prac) { return t.osoby.map(i => (prac.find(p => String(p.cu) === i) || {}).name).filter(Boolean).join(', '); }

/* ---------- Etapy budowy ---------- */
function etapSwitch() {
  if (!maEtapy()) return '';
  const opt = [['', 'Wszystkie', 'cała budowa'], ...etapyOf().map(e => [e.id, e.id, e.opis])];
  return `<div class="etapy" role="tablist" aria-label="Etap budowy">${opt.map(([id, l, o]) => `<button class="etap ${id === S.etap ? 'on' : ''}" data-e="${U.esc(id)}" role="tab" aria-selected="${id === S.etap}"><b>${U.esc(l)}</b>${o ? `<span>${U.esc(o)}</span>` : ''}</button>`).join('')}</div>`;
}
function bindEtap() {
  view.querySelectorAll('[data-e]').forEach(b => b.onclick = async () => {
    await ustawEtap(b.dataset.e);
    const par = { ...UI.par }; delete par.ark; delete par.focus;
    UI.go(UI.cur, par);
  });
}
function liczStatusy(arr, F) { const c = { czeka: 0, 'w toku': 0, gotowe: 0, brak: 0 }; arr.forEach(u => c[devStatus(u, F)]++); return c; }
function barRow(label, arr, F, bold) {
  const c = liczStatusy(arr, F), n = arr.length || 1;
  return `<div><div class="row"><span class="grow">${bold ? '<b>' + U.esc(label) + '</b>' : U.esc(label)}</span><b>${c.gotowe} / ${arr.length}</b></div>
    <div class="bar"><i style="width:${c.gotowe / n * 100}%;background:var(--ok)"></i><i style="width:${c['w toku'] / n * 100}%;background:var(--wip)"></i><i style="width:${c.brak / n * 100}%;background:var(--bad)"></i></div></div>`;
}
function etapTile(e, F) {
  const arr = ((S.proj || {}).urzadzenia || []).filter(u => u.etap === e.id);
  const c = liczStatusy(arr, F), pct = arr.length ? Math.round(c.gotowe / arr.length * 100) : 0;
  return `<button class="tile ${S.etap === e.id ? 'main' : ''}" data-e="${U.esc(e.id)}"><b>Etap ${U.esc(e.id)}</b><span class="mute">${U.esc(e.opis || '')}</span>
    <div class="bar"><i style="width:${pct}%;background:var(--ok)"></i></div>
    <span class="mute">${pct}% · ${c.gotowe} gotowe · ${c['w toku']} w toku · ${c.brak} z brakiem · ${arr.length} urządzeń</span></button>`;
}

/* ---------- Pinezka GPS budowy (od 1.12.0) ---------- */
// Baza: kolumna D „Pinezka GPS (lat,lon)”; zapis z tabletu czeka w S.pinezki, dopóki serwer go nie potwierdzi
function lokBudowy(p) { return !p ? '' : (p.lokalizacja || ((S.pinezki || {})[p.kod]) || ''); }
function zapiszPinezke(p) {
  if (!navigator.geolocation) { UI.toast('Ten tablet nie udostępnia lokalizacji.'); return; }
  UI.toast('Ustalam pozycję GPS…');
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon, accuracy } = pos.coords;
    const dokl = Math.round(accuracy || 0);
    if (dokl > 50 && !confirm(`Dokładność GPS to ok. ${dokl} m (słaby sygnał). Zapisać mimo to?\n\nLepiej wyjść na zewnątrz i spróbować ponownie.`)) return;
    if (!confirm(`Zapisać aktualną pozycję jako pinezkę budowy ${p.kod}?\n${lat.toFixed(5)}, ${lon.toFixed(5)} (±${dokl} m)`)) return;
    await addEvent('pinezka', '', { lat: +lat.toFixed(5), lon: +lon.toFixed(5), dokl });
    S.pinezki = { ...(S.pinezki || {}), [p.kod]: lat.toFixed(5) + ',' + lon.toFixed(5) }; await DB.set('pinezki', S.pinezki);
    UI.toast(navigator.onLine ? 'Pinezka zapisana' : 'Pinezka zapisana – wyśle się po połączeniu z siecią'); UI.refresh();
  }, err => UI.toast(err.code === 1 ? 'Brak zgody na lokalizację – włącz ją w ustawieniach przeglądarki.' : 'Nie udało się ustalić pozycji GPS.'),
  { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}
/* znacznik protokołu przy urządzeniu (od 1.12.0): ok – przesłany z numerem, rob – roboczy, do – dedykowany do wykonania, '' – nie dotyczy */
function protZnacznik(id, F) {
  const ist = Prot.dlaUrzStan(id, F);
  const gotowy = ist.find(x => x.stan !== 'roboczy');
  if (gotowy) return { k: 'ok', t: '✓ ' + (gotowy.nr || 'przesłany') };
  if (ist.length) return { k: 'rob', t: 'roboczy' };
  return Prot.dedykowaneUrz(id).length ? { k: 'do', t: 'do wykonania' } : { k: '', t: '' };
}
/* opis zdjęcia w galerii: urządzenie (ID, typ, kondygnacja, arkusz) albo brak / notatka */
function opisZdjecia(f, F) {
  const u = f.urz && ((S.proj || {}).urzadzenia || []).find(x => x.id === f.urz);
  if (f.rodzaj === 'brak') { const b = Object.values(F.braki).find(x => (x.foto || []).includes(f.fid) || x.kom.some(k => k.foto.includes(f.fid)));
    return { t: 'Brak' + (b ? ' – ' + b.kat : '') + (u ? ' · ' + u.id : ''), s: b ? b.opis.slice(0, 80) : '' }; }
  if (f.rodzaj === 'notatka') { const n = F.notes.find(e => (e.d.foto || []).includes(f.fid)); return { t: 'Notatka' + (u ? ' · ' + u.id : ''), s: n ? String(n.d.tekst || '').slice(0, 80) : '' }; }
  if (u) return { t: u.id + ' · ' + typOf(u.id).nazwa + (f.rodzaj === 'tabliczka' ? ' · tabliczka' : ''), s: [u.kond, u.arkusz].filter(Boolean).join(' · ') };
  return { t: f.urz && f.urz !== 'BUDOWA' ? f.urz : 'Budowa', s: '' };
}

/* ---------- Pomocnicze widoków ---------- */
function curProj() { return ((S.boot && S.boot.projekty) || []).find(p => p.kod === S.kod); }
function groupBy(arr, f) { const m = new Map(); arr.forEach(x => { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return [...m.entries()]; }
function progress(u, F) { const t = typOf(u.id); const st = F.dev[u.id]; const d = st ? t.kroki.filter((k, i) => st.kroki[i] && st.kroki[i].val).length : 0; return d + '/' + t.kroki.length; }
function legend(arr, F) {
  const c = { czeka: 0, 'w toku': 0, gotowe: 0, brak: 0 }; arr.forEach(u => c[devStatus(u, F)]++);
  return `<div class="card"><div class="mute">${arr.length} urządzeń na arkuszu</div><div class="stack" style="margin-top:8px;font-size:14px">
    ${[['gotowe', 'gotowe'], ['w toku', 'w toku'], ['brak', 'z brakiem'], ['czeka', 'czeka']].map(([k, l]) => `<span class="row"><span class="st ${ST[k]}"></span>${l}: <b>${c[k]}</b></span>`).join('')}</div></div>`;
}
function attention(arr, F) {
  const b = arr.filter(u => devStatus(u, F) === 'brak');
  if (!b.length) return '';
  return `<div class="lbl">Wymaga uwagi</div><div class="list">${b.map(u => { const x = Object.values(F.braki).find(q => q.urz === u.id && !q.zamk);
    return `<button class="li" data-u="${U.esc(u.id)}"><span class="st brak"></span><span class="grow"><b>${U.esc(u.id)}</b> ${U.esc(u.typ)}<br><span class="mute">${U.esc(x ? x.kat : '')}</span></span></button>`; }).join('')}</div>`;
}
function issueHtml(b) {
  const canClose = !b.zamk;   // od 1.9.0 brak może zamknąć każdy
  return `<div class="issue link ${b.zamk ? 'closed' : ''}" data-bid="${U.esc(b.id)}" role="button" tabindex="0" aria-label="Otwórz brak"><div class="row"><span class="chip ${b.zamk ? 'ok' : 'bad'}">${U.esc(b.kat)}</span>${b.urz ? `<b>${U.esc(b.urz)}</b>` : b.etap ? `<b>Etap ${U.esc(b.etap)}</b>` : '<b>Budowa</b>'}${b.blokuje && !b.zamk ? '<span class="chip warn">blokuje</span>' : ''}<span class="mute" style="margin-left:auto">${U.fmt(b.ts)}</span></div>
    <div>${U.esc(b.opis)}</div>${b.foto && b.foto.length ? `<div class="thumbs" data-fotos="${U.esc(b.foto.join(','))}"></div>` : ''}<div class="mute">Zgłosił: ${U.esc(b.kto)}${b.kom && b.kom.length ? ' · ' + b.kom.length + ' kom.' : ''}${b.zm && b.zm.length ? ' · edytowano' : ''}${b.zamk ? ' · zamknął ' + U.esc(b.zamk.kto) + ' ' + U.fmt(b.zamk.ts) + (b.zamk.opis ? ' – ' + U.esc(b.zamk.opis) : '') : ''}</div>
    ${canClose ? `<div><button class="btn sm ok" data-close="${U.esc(b.id)}">Zamknij brak</button></div>` : ''}</div>`;
}
function bindIssue(root, after) {
  // dotknięcie kafelka braku → okno braku (podgląd, edycja, komentarze – od 1.9.0)
  root.querySelectorAll('[data-bid]').forEach(el => {
    const open = e => { if (e.target.closest('button') || e.target.closest('[data-foto]')) return; Dialogs.brakOkno(el.dataset.bid, after); };
    el.onclick = open; el.onkeydown = e => { if (e.key === 'Enter') open(e); };
  });
  root.querySelectorAll('[data-close]').forEach(btn => btn.onclick = async () => {
    const opis = prompt('Jak usunięto brak? (opcjonalnie)');
    if (opis === null) return;   // Anuluj – brak zostaje otwarty
    const b = fold(S.ev).braki[btn.dataset.close];
    await addEvent('brak_zamk', b ? b.urz : '', { bid: btn.dataset.close, opis: opis.trim() });
    UI.toast('Brak zamknięty'); if (after) after(); UI.refresh();
  });
}
function histTxt(e) {
  const d = e.d || {};
  return e.typ === 'krok' ? (d.wart ? '✓ ' : 'cofnięto: ') + d.nazwa : e.typ === 'nr' ? 'nr seryjny ' + d.sn : e.typ === 'foto' ? (d.rodzaj === 'tabliczka' ? 'zdjęcie tabliczki' : 'zdjęcie') : e.typ === 'brak' ? 'brak: ' + d.kat : e.typ === 'brak_zamk' ? 'zamknięcie braku' : e.typ === 'notatka' ? 'notatka' : e.typ === 'protokol' ? 'protokół: ' + Prot.opisStanu(e.d) : e.typ === 'foto_usun' ? 'usunięto zdjęcie' : e.typ === 'brak_edyc' ? (d.usun ? 'usunięto brak' : d.otworz ? 'ponownie otwarto brak' : 'edycja braku') : e.typ === 'brak_kom' ? 'komentarz do braku' : e.typ;
}
async function thumbs(el, foto) {
  if (!el) return;
  if (!foto.length) { el.innerHTML = '<span class="mute">Brak zdjęć.</span>'; return; }
  el.innerHTML = '';
  for (const f of foto.slice(-12)) {
    const fid = f.fid || f;
    const p = await DB.getPhoto(fid), m = p ? null : await DB.getFile('mini:' + fid);
    let n;
    if (p || m) { n = new Image(); n.src = URL.createObjectURL((p || m).blob); n.alt = f.rodzaj || 'zdjęcie'; }
    else { n = document.createElement('button'); n.type = 'button'; n.className = 'chip fotochip'; n.textContent = '📷 ' + (f.rodzaj && f.rodzaj !== 'zdjecie' ? f.rodzaj : 'zdjęcie'); }
    n.dataset.foto = fid; n.title = 'Podgląd';
    n.onclick = ev => { ev.stopPropagation(); Foto.podglad(fid); };
    el.appendChild(n);
  }
}
/* miniatury zdjęć w kartach braków (data-fotos="fid,fid") */
function hydrateFotos(root) { (root || document).querySelectorAll('[data-fotos]').forEach(el => thumbs(el, el.dataset.fotos.split(',').filter(String))); }

/* Podgląd i usuwanie zdjęć (od 1.8.0): pełna rozdzielczość – zdjęcia z tego tabletu; z innych tabletów – pomniejszone, pobierane na żądanie */
const Foto = {
  info(fid) { return fold(S.ev).fotoInfo[fid] || {}; },
  mozeUsunac(fid) { const i = this.info(fid); return Session.isBiuro() || (i.kto && S.user && i.kto === S.user.name); },
  async obraz(fid) {
    const p = await DB.getPhoto(fid); if (p) return { blob: p.blob, pelne: true };
    const m = await DB.getFile('mini:' + fid); if (m) return { blob: m.blob, pelne: false };
    if (!navigator.onLine) throw new Error('Zdjęcie jest na Dysku – połącz się z siecią, aby je zobaczyć.');
    const r = await API.foto(S.kod, fid);
    const mini = await U.compress(U.b64ToBlob(r.b64, r.mime || 'image/jpeg'), 800, 0.6);   // pomniejszone – nie zapycha pamięci
    await DB.putFile('mini:' + fid, { blob: mini, mime: 'image/jpeg', name: fid + '.jpg' });
    return { blob: mini, pelne: false };
  },
  async podglad(fid) {
    const wrap = document.createElement('div'); wrap.className = 'fotoview'; wrap.id = 'fotoView';
    const i = this.info(fid);
    wrap.innerHTML = `<div class="fvbar"><span class="grow">${U.esc(i.urz || '')} ${U.esc(({ tabliczka: 'tabliczka', brak: 'zdjęcie braku', notatka: 'zdjęcie notatki' })[i.rodzaj] || 'zdjęcie')} · ${U.esc(i.kto || '')} ${i.ts ? U.fmt(i.ts) : ''} <span class="mute" id="fvJak"></span></span>
      ${this.mozeUsunac(fid) ? '<button class="btn bad sm" id="fvDel">Usuń zdjęcie</button>' : ''}<button class="btn sm" id="fvX">✕ Zamknij</button></div>
      <div class="fvimg" id="fvImg"><span class="mute">Wczytuję…</span></div>`;
    document.body.appendChild(wrap);
    const zamknij = () => wrap.remove();
    $('#fvX').onclick = zamknij;
    if ($('#fvDel')) $('#fvDel').onclick = async () => {
      if (!confirm('Usunąć to zdjęcie? Zniknie z aplikacji, a plik na Dysku trafi do kosza.')) return;
      await this.usun(fid); zamknij();
    };
    try {
      const o = await this.obraz(fid);
      $('#fvImg').innerHTML = ''; const img = new Image(); img.src = URL.createObjectURL(o.blob); img.alt = 'zdjęcie'; $('#fvImg').appendChild(img);
      $('#fvJak').textContent = o.pelne ? '· z tego tabletu' : '· podgląd pomniejszony';
    } catch (e) { $('#fvImg').innerHTML = `<p class="mute" style="color:#fff">${U.esc(e.message)}</p>`; }
  },
  async usun(fid) {
    const i = this.info(fid);
    await addEvent('foto_usun', i.urz || '', { fid });
    await DB.delPhoto(fid); await DB.delFile('mini:' + fid);   // niewysłane zdjęcie nie zostanie już wysłane
    await liczOczekujace();
    UI.toast('Zdjęcie usunięte');
    if ($('#ov') && i.urz && $('#thumbs')) Dialogs.device(i.urz); else UI.refresh();
  }
};
async function saveSn(id, v) {
  const urz = (S.proj.urzadzenia || []);
  const F = fold(S.ev);
  const dup = urz.find(u => u.id !== id && ((F.dev[u.id] && F.dev[u.id].sn) || u.sn) === v);
  if (dup && !confirm('Ten numer jest już przypisany do ' + dup.id + '. Zapisać mimo to?')) return;
  await addEvent('nr', id, { sn: v }); UI.toast('Nr seryjny zapisany'); Dialogs.device(id); UI.refresh();
}
function pickFile(cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.capture = 'environment';
  i.onchange = () => { if (i.files[0]) cb(i.files[0]); }; i.click();
}
/* treść opisu wtapianego w zdjęcie (od 1.12.0) */
function opisNaZdjecie(urz, rodzaj) {
  const p = curProj() || {}, u = urz && ((S.proj || {}).urzadzenia || []).find(x => x.id === urz);
  const l = [p.nazwa && p.nazwa.indexOf(p.kod) === 0 ? p.nazwa : [p.kod, p.nazwa].filter(Boolean).join(' ')];
  const co = rodzaj === 'brak' ? 'Brak' : rodzaj === 'notatka' ? 'Notatka' : rodzaj === 'tabliczka' ? 'Tabliczka' : '';
  if (u) l.push([u.id, typOf(u.id).nazwa, [u.kond, u.arkusz].filter(Boolean).join(' '), co].filter(Boolean).join(' · '));
  else if (co) l.push(co + (urz && urz !== 'BUDOWA' ? ' · ' + urz : ''));
  const d = new Date();
  l.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + hm(d) + ' · ' + (S.user ? S.user.name : ''));
  return l.filter(Boolean);
}
async function storePhoto(file, urz, rodzaj) {
  const blob = await U.compress(file, 1600, 0.75, opisNaZdjecie(urz, rodzaj));
  const id = U.uid('f');
  const n = (await DB.eventsFor(S.kod)).filter(e => e.typ === 'foto' && e.urz === urz).length + 1;
  const name = rodzaj === 'tabliczka' ? `${urz}_tabliczka.jpg` : `${urz}_${U.day()}_${n}_${id.slice(-4)}.jpg`;
  await DB.putPhoto({ id, kod: S.kod, name, blob, sent: 0 });
  return id;
}
function pickPhoto(urz, rodzaj) {
  pickFile(async f => {
    const fid = await storePhoto(f, urz, rodzaj);
    await addEvent('foto', urz, { fid, rodzaj });
    UI.toast(rodzaj === 'tabliczka' ? 'Zdjęcie tabliczki zapisane' : 'Zdjęcie zapisane'); Dialogs.device(urz); UI.refresh();
  });
}
function brakDostepu(p) {
  modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="alertdialog" aria-label="Brak dostępu">
    <div class="shead"><h3>🔒 Brak dostępu</h3></div>
    <div class="sbody"><p><b>${U.esc(p.nazwa)}</b> to <b>obiekt wojskowy</b>.</p><p>Wejście na budowę i jej dane wymaga uprawnienia M. Twoje konto go nie ma – skontaktuj się z biurem.</p></div>
    <div class="sfoot"><button class="btn pri" id="bdOk">Rozumiem</button></div></div></div>`;
  $('#bdOk').onclick = UI.close; $('#bdOk').focus();
}
async function openProject(kod) {
  const pp = ((S.boot && S.boot.projekty) || []).find(x => x.kod === kod);
  if (!dostepDoBudowy(pp)) return brakDostepu(pp);
  S.kod = kod;
  S.proj = await DB.get('proj:' + kod) || null;
  S.ev = await DB.eventsFor(kod);
  await wczytajEtap(kod);
  const r = ((await DB.get('recent')) || []).filter(k => k !== kod); r.unshift(kod); await DB.set('recent', r.slice(0, PAMIEC_BUDOW));
  UI.go('budowa');
  if (navigator.onLine) Sync.run();
  else if (!S.proj) UI.toast('Dane tej budowy nie są jeszcze w tablecie – połącz się z WiFi.');
}
function dtrHtml(tech) {
  const groups = groupBy(tech, f => f.grupa || '');
  return `<details class="card dtr"><summary class="lbl">Pozostałe DTR (${tech.length})</summary>
    ${S.techInfo ? `<p class="mute">${U.esc(S.techInfo)}</p>` : ''}
    <div class="stack" style="margin-top:8px">${groups.map(([g, arr]) => (g || groups.length > 1 ? `<div class="mute" style="font-weight:600;margin-top:6px">${U.esc(g || 'Ogólne')}</div>` : '') +
      arr.map(f => `<button class="btn sm doc" data-f="${U.esc(f.id)}" style="text-align:left"><span class="grow">${U.esc(f.name)}</span><span class="mute" data-fs="${U.esc(f.id)}">${mb(f.size)}</span></button>`).join('')).join('') || '<span class="mute">Brak plików w folderze _Techniczne.</span>'}</div></details>`;
}
function mb(b) { return b ? (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',') + ' MB' : ''; }
let pobieranie = null;
async function openFile(id) {
  let f = await DB.getFile(id);
  if (!f) {
    if (!navigator.onLine) { UI.toast('Plik nie jest jeszcze w pamięci tabletu – połącz się z WiFi.'); return; }
    if (pobieranie) { UI.toast('Trwa pobieranie pliku…'); return; }
    // okno otwieramy od razu (inaczej przeglądarka zablokuje je po pobraniu)
    const w = window.open('', '_blank');
    if (w) w.document.write('<p style="font:18px sans-serif;padding:24px">Pobieram plik…</p>');
    pobieranie = id; UI.toast('Pobieram plik…');
    try { f = await pobierzPlik(id, (i, n) => UI.toast('Pobieram plik… ' + Math.round(i / n * 100) + '%')); }
    catch (e) { if (w) w.close(); UI.toast('Nie udało się pobrać: ' + e.message); return; }
    finally { pobieranie = null; }
    if (UI.cur === 'budowa') UI.refresh();
    if (w) { w.location.href = URL.createObjectURL(f.blob); return; }
  }
  window.open(URL.createObjectURL(f.blob), '_blank');
}
function settings() {
  const c = API.cfg() || {};
  modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog"><div class="shead"><h3>${U.esc(S.user ? S.user.name : '')}</h3><button class="btn sm" id="sx">✕</button></div>
    <div class="sbody">
      <div class="card stack" style="font-size:14px"><div>Tablet: <b>${U.esc(c.tablet || '')}</b></div><div>Wersja aplikacji: <b>${APP_VERSION}</b></div>
        <div>Sesja do: <b>${S.user ? new Date(S.user.exp).toLocaleString('pl-PL') : ''}</b></div>
        <div>Ostatnia synchronizacja: <b>${S.lastSync ? new Date(S.lastSync).toLocaleString('pl-PL') : '—'}</b></div>
        <div>Do wysłania: <b>${S.pending}</b></div>
        <div>Budowy w pamięci: <b id="sBud">…</b> (limit <b id="sLim">…</b> z ${PAMIEC_BUDOW}) · zajęte: <b id="sMem">…</b> · wolne: <b id="sFree">…</b></div>
        ${S.malo ? '<div class="badbox">Mało miejsca na tablecie – zgłoś to administratorowi (Łukasz P).</div>' : ''}${S.syncErr ? `<div class="badbox">${U.esc(S.syncErr)}</div>` : ''}</div>
      <button class="btn pri" id="sLogout">Wyloguj</button>
      <button class="btn" id="sFull">Pobierz wszystko ponownie (WiFi)</button>
      ${Session.isBiuro() ? '<button class="btn bad" id="sReset">Resetuj tablet (usuwa dane z tego urządzenia)</button>' : ''}
    </div></div></div>`;
  (async () => { const st = await Pamiec.stan(); $('#sBud').textContent = st.budowy; $('#sLim').textContent = st.limit; $('#sMem').textContent = st.usage ? mbTxt(st.usage) : 'brak danych'; $('#sFree').textContent = st.quota ? mbTxt(st.wolne) : 'brak danych'; })();
  $('#sx').onclick = UI.close;
  $('#sLogout').onclick = async () => { await Session.logout(); UI.close(); UI.go('login'); };
  $('#sFull').onclick = () => { UI.close(); Sync.run(true); };
  if ($('#sReset')) $('#sReset').onclick = async () => {
    if ((await DB.unsynced()).length && !confirm('Na tablecie są niewysłane wpisy. Na pewno usunąć?')) return;
    if (!confirm('Usunąć konfigurację i dane z tego tabletu?')) return;
    await DB.clearAll(); location.reload();
  };
}

/* ---------- Start ---------- */
(async function start() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  await API.load();
  S.boot = await DB.get('boot'); S.lastSync = await DB.get('lastSync');
  S.pogoda = await DB.get('pogoda');
  S.pinezki = (await DB.get('pinezki')) || {};
  await liczOczekujace().catch(() => { });
  try { await Pamiec.limit(); } catch (e) { }
  $('#topVer').textContent = 'v' + APP_VERSION;
  $('#btnSync').onclick = () => Sync.run();
  $('#btnUser').onclick = settings;
  window.addEventListener('online', () => { UI.net(); Sync.run(); });
  window.addEventListener('offline', () => UI.net());
  // systemowy przycisk „wstecz” Androida: zamyka okno albo cofa ekran tak jak strzałka w aplikacji (od 1.11.7)
  history.pushState({ elwis: 1 }, '');
  // od 1.12.0: na ekranie głównym (plan) pytanie „Zamknąć aplikację?”; kolejne „wstecz” przy otwartym pytaniu zamyka aplikację
  window.addEventListener('popstate', () => {
    if ($('#fotoView')) { $('#fotoView').remove(); history.pushState({ elwis: 1 }, ''); return; }
    const okno = !!modal.innerHTML, ekran = !$('#btnBack').hidden;
    if (okno || ekran) { history.pushState({ elwis: 1 }, ''); okno ? UI.close() : $('#btnBack').click(); return; }
    if (!S.user) return;
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="alertdialog" aria-label="Zamknąć aplikację?" style="max-width:480px">
      <div class="shead"><h3>Zamknąć aplikację?</h3></div>
      <div class="sbody"><p style="margin:0">Jesteś na ekranie głównym. Niewysłane dane zostaną na tablecie i wyślą się przy następnym uruchomieniu.</p><p class="mute" style="margin:0">Naciśnij jeszcze raz systemowe „wstecz”, aby zamknąć.</p></div>
      <div class="sfoot"><button class="btn" id="exNo">Nie, zostań</button><button class="btn pri" id="exYes">Tak, zamknij</button></div></div></div>`;
    const zostan = () => { UI.close(); history.pushState({ elwis: 1 }, ''); };
    $('#exNo').onclick = zostan; $('#ov').onclick = e => { if (e.target.id === 'ov') zostan(); };
    $('#exYes').onclick = () => { window.close(); history.back(); setTimeout(() => UI.toast('Naciśnij systemowe „wstecz”, aby zamknąć aplikację.'), 400); };
  });
  setInterval(() => { if (navigator.onLine && S.user) Sync.run(); }, 3 * 60e3);
  setInterval(async () => { if (S.user && S.user.exp < Date.now()) { await Session.logout(); UI.close(); UI.toast('Sesja wygasła – zaloguj się ponownie.'); UI.go('login'); } }, 60e3);
  if (!API.ready()) return UI.go('setup');
  await Session.load();
  if (!S.user) { UI.go('login'); if (navigator.onLine) Sync.run(); return; }
  UI.go('plan');
  if (navigator.onLine) Sync.run();
})();
