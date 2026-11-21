/* ELWIS – widoki aplikacji. */
const $ = (s, r = document) => r.querySelector(s);
const view = $('#view'), modal = $('#modal');
const ST = { 'czeka': 'czeka', 'w toku': 'wtoku', 'gotowe': 'gotowe', 'brak': 'brak' };
/* ikony liniowe (wygląd B, od 1.12.0) */
const IKONY = { tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path>', edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"></path>', trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3"></path>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"></path>', plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"></path>', doc: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"></path>',
  warn: '<path d="M12 3l9 17H3zM12 10v4M12 17v.5"></path>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"></path>',
  note: '<path d="M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5"></path>', chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"></path>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"></path>', book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"></path>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"></path>', kier: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"></path><path d="M9 4.5h6"></path>', front: '<path d="M13 12v.01M3 21h18M5 21V5a2 2 0 0 1 2-2h7.5M17 13.5V21M14 7h7M18 4l3 3-3 3"></path>', offline: '<path d="M19 18a3.5 3.5 0 0 0 0-7h-1a5 4.5 0 0 0-11-2 4.6 4.4 0 0 0-2.1 8.4"></path><path d="M12 13v9M9 19l3 3 3-3"></path>', offline0: '<path d="M19 18a3.5 3.5 0 0 0 0-7h-1a5 4.5 0 0 0-11-2 4.6 4.4 0 0 0-2.1 8.4"></path><path d="M12 13v9M9 19l3 3 3-3"></path><path d="M3 3l18 18"></path>', cel: '<circle cx="12" cy="12" r="3"></circle><circle cx="12" cy="12" r="8"></circle><path d="M12 2v2M12 20v2M20 12h2M2 12h2"></path>', pin: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>',
  chev: '<path d="M9 5l7 7-7 7"></path>', box: '<path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3"></path><circle cx="10" cy="19.5" r="1.5"></circle><circle cx="17" cy="19.5" r="1.5"></circle>', check: '<path d="M5 12l5 5 9-10"></path>', pause: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 9v6M14 9v6"></path>',
  x: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6"></path>', bud: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>', proto: '<path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12l2 2 4-4"></path>' };
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IKONY[n] || ''}</svg>`;

const UI = {
  cur: 'home', par: {},
  toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(this._t); this._t = setTimeout(() => el.classList.remove('show'), 2600); },
  net() {
    const n = $('#btnSync'), t = $('#netText');   // od 1.53.0: stan sieci i synchronizacja w jednym przycisku
    n.className = 'net' + (!navigator.onLine ? ' off' : S.syncErr ? ' err' : '') + (S.syncing ? ' sync' : '');
    const p = '';   // liczba do wysłania – czerwona plakietka na przycisku
    t.textContent = S.syncing ? (S.prog && S.prog.t ? S.prog.t : 'Synchronizuję…') + (S.prog ? ' · ' + Math.round(S.prog.p * 100) + '%' : '') : !navigator.onLine ? 'Offline' + p : S.syncErr ? 'Błąd sync' + p : (S.lastSync ? 'Zsynchr. ' + new Date(S.lastSync).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : 'Online') + p;
    $('#btnSync .spinico').classList.toggle('spin', S.syncing);
    this.prog();
    $('#memWarn').hidden = !(S.malo && S.user);
    if ($('#nPend')) { $('#nPend').hidden = !S.pending; $('#nPend').textContent = S.pending || ''; }
  },
  /* Oczekiwanie na serwer z odliczaniem (od 1.56.1). Praca w tle: dopisek przy wskaźniku synchronizacji (po 3 s);
     działanie z przycisku: pasek „Czekam na serwer” na wierzchu (po 0,6 s) z przyciskiem Przerwij. */
  czekTlo() {
    const w = API.oczekujace().filter(x => !x.et && Date.now() - x.start > 3000);
    if (!w.length) return '';
    const r = Math.max(0, Math.ceil(Math.min(...w.map(x => x.start + x.lim - Date.now())) / 1000));
    return ' · czekam na serwer, limit ' + r + ' s';
  },
  czekaj() {
    const w = API.oczekujace();
    if (w.length && !this._czT) this._czT = setInterval(() => this.czekaj(), 500);
    if (!w.length && this._czT) { clearInterval(this._czT); this._czT = null; }
    if (S.syncing && S.prog) this.prog(); else if (S.syncing) $('#netText').textContent = 'Synchronizuję…' + this.czekTlo();
    const fgw = w.filter(x => x.et && Date.now() - x.start > 600);
    let el = $('#czeka');
    if (!fgw.length) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'czeka'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    const html = fgw.map(x => { const r = Math.max(0, Math.ceil((x.start + x.lim - Date.now()) / 1000)), up = Math.round((Date.now() - x.start) / 1000);
      return `<div class="czr"><span class="czs"></span><span class="czt"><b>${U.esc(x.et)}… ${up} s</b><small>Czekam na serwer – ${!navigator.onLine ? 'brak internetu' : up > 15 ? 'wolne łącze albo serwer zajęty' : 'proszę czekać'} · przerwę za ${r} s</small></span><button class="btn sm" data-czp="${x.id}">Przerwij</button></div>`; }).join('');
    if (el._h !== html) { el._h = html; el.innerHTML = html; el.querySelectorAll('[data-czp]').forEach(b => b.onclick = () => API.przerwij(+b.dataset.czp)); }
  },
  /* pasek postępu pod nagłówkiem (od 1.7.0) */
  prog() {
    const on = !!(S.syncing && S.prog);
    // od 1.53.0: postęp jako zielone tło przycisku synchronizacji (pasek pod nagłówkiem tylko, gdy nagłówek ukryty)
    $('#btnSync').style.setProperty('--p', on ? Math.round(S.prog.p * 100) + '%' : '0%');
    $('#syncStrip').hidden = true;
    if (!on) return;
    $('#syncFill').style.width = Math.round(S.prog.p * 100) + '%';
    // od 1.31.9: bieżąca czynność synchronizacji w polu stanu sieci (zamiast „Online”), bez osobnej plakietki
    $('#syncTxt').textContent = '';
    $('#netText').textContent = (S.prog.t || 'Synchronizuję…') + ' · ' + Math.round(S.prog.p * 100) + '%' + this.czekTlo();
    $('#btnSync').classList.add('sync');
  },
  header(sub, back) {
    $('#top').hidden = false; $('#topSub').textContent = '';
    // od 1.53.0: ścieżka pod nagłówkiem – nr budowy › nazwa › ekran; nr i nazwa wracają do ekranu budowy
    const p = curProj(), s = String(sub || ''), cr = $('#crumb');
    let parts;
    if (p && s.startsWith(p.kod)) {
      const naz = String(p.nazwa || '').replace(p.kod, '').trim(), reszta = s.slice(p.kod.length).replace(/^\s*·\s*/, '');
      parts = [[p.kod, 1], ...(naz ? [[naz, 1]] : []), ...(reszta && reszta !== 'budowa' ? [[reszta.charAt(0).toUpperCase() + reszta.slice(1), 0]] : [])];
    } else parts = s ? [[s.charAt(0).toUpperCase() + s.slice(1), 0]] : [];
    cr.innerHTML = parts.map(([t, link], i) => (i ? '<span class="csep">›</span>' : '') + (link && i < parts.length - 1 ? `<button class="clink">${U.esc(t)}</button>` : `<span class="${i === parts.length - 1 ? 'ccur' : ''}">${U.esc(t)}</span>`)).join('');
    cr.hidden = !parts.length;
    cr.querySelectorAll('.clink').forEach(b => b.onclick = () => UI.go('budowa', {}));
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
    this.cur = v; this.par = par; this.pv = null; this.refresh(); window.scrollTo(0, 0); this.zapamietaj();
  },
  /* ostatni ekran użytkownika – po ponownym otwarciu aplikacji wraca w to samo miejsce (od 1.13.0) */
  zapamietaj() {
    if (!S.user || ['setup', 'login'].includes(this.cur)) return;
    let par = {}; try { par = JSON.parse(JSON.stringify(this.par || {})); } catch (e) { }
    DB.set('ostatni:' + S.user.name, { v: this.cur, par, kod: S.kod || null, stos: this.stos.map(e => ({ v: e.v, par: e.par })), ts: Date.now() }).catch(() => { });
  },
  wstecz(domyslny = 'home') {
    const e = this.stos.pop();
    if (!e) return this.go(domyslny);
    this.cur = e.v; this.par = e.par; this.pv = null; this.refresh(); window.scrollTo(0, 0); this.zapamietaj();
    if (e.dlg) Dialogs.device(e.dlg);
  },
  refresh() {
    // bez przeładowania rzutu (zachowuje powiększenie) – chyba że zmieniła się lista znaczników (nowe urządzenie, ID nadane przez serwer)
    const znaczniki = this.pv && [...this.pv.box.querySelectorAll('.mk[data-id]')].map(b => b.dataset.id);
    if (this.cur === 'rzut' && this.pv && document.contains(this.pv.box) && znaczniki.every(id => urzE().some(u => u.id === id))
      && !urzE().some(u => u._nowe && u.arkusz === this.pv.ark && u.x !== '' && u.x != null && !znaczniki.includes(u.id))) {
      const F = fold(S.ev); const urz = urzE();
      this.pv.recolor(id => { const u = urz.find(x => x.id === id); const st = u ? devStatus(u, F) : 'czeka'; return { cls: ST[st], label: id + ' – ' + st }; });
      const side = $('.planbox .side'); const ark = this.pv.ark;
      if (side) { const a = urz.filter(u => u.arkusz === ark); side.innerHTML = legend(a, F) + attention(a, F); side.querySelectorAll('[data-u]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.u)); }
      this.net(); return;
    }
    const f = Views[this.cur]; if (f) f(this.par); this.net(); this.bnav();
    if (typeof PC !== 'undefined') PC.nav();   // od 1.57.0: panel biura na komputerze
  },
  close() { modal.innerHTML = ''; },
  /* dolny pasek: Plan · Budowy · Synchronizuj (od 1.12.0) */
  bnav() {
    const b = $('#bnav'); b.hidden = $('#top').hidden || !S.user || (typeof PC !== 'undefined' && PC.on());
    const dok = this.cur === 'dokumenty' && this.par.typ === 'tech';
    const prio = this.cur === 'priorytety' || this.cur === 'wydajnosc' || this.cur === 'zmiany' || this.cur === 'powiad';
    $('#nPrio').hidden = !Session.isBiuro(); b.classList.toggle('n4', Session.isBiuro());
    $('#nPlan').hidden = podw(); b.classList.toggle('n2', podw());   // od 1.43.0: dostęp podwykonawcy – bez planu dnia
    $('#nPrio').classList.toggle('on', prio);
    powPlakietka(); zakPlakietka();
    $('#nPlan').classList.toggle('on', this.cur === 'plan');
    $('#nDok').classList.toggle('on', dok);
    $('#nZak').hidden = podw(); $('#nZak').classList.toggle('on', this.cur === 'zakupy');   // od 1.48.0
    b.classList.toggle('n5', Session.isBiuro() && !podw()); b.classList.toggle('n4', !Session.isBiuro() && !podw());   // pracownik: Plan · Budowy · Dok. · Zapotrzebowanie
    $('#nBud').classList.toggle('on', this.cur !== 'plan' && !dok && !prio && this.cur !== 'zakupy');
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
          <div class="row"><input id="cUrl" class="grow" type="url" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off">
            <button class="btn" id="cScan" type="button">Skanuj QR</button></div>
          <label class="f" for="cKey">Klucz tabletu</label>
          <input id="cKey" type="text" autocomplete="off" placeholder="np. T2-…">
          <label class="f" for="cName">Nazwa tabletu</label>
          <input id="cName" type="text" placeholder="np. Tablet 2 – ekipa 2">
          <div class="row" style="margin-top:16px"><button class="btn pri grow" id="cGo">Połącz i pobierz dane</button></div>
          <p class="mute" id="cMsg"></p>
        </div>
        <p class="mute">Wersja aplikacji ${APP_VERSION}</p>
      </div>`;
    // od 1.21.0: adres serwera z kodu QR (kod robi się na komputerze z adresu …/exec; adres nie trafia do repozytorium)
    $('#cScan').onclick = () => Dialogs.scan(code => {
      const t = String(code || '').trim();
      // 1.21.1: QR z przeglądarki otwartej na …/exec bywa adresem przekierowania script.googleusercontent.com/…/echo – jednorazowym, nie serwerem
      if (/script\.googleusercontent\.com/.test(t)) { $('#cMsg').textContent = 'To adres przekierowania, nie serwera. Zrób kod QR z adresu …/exec (wklej go w polu okna „Utwórz kod QR”).'; return; }
      const m = t.match(/https:\/\/script\.google\.com\/macros\/\S+/);
      if (!m) { $('#cMsg').textContent = 'Kod QR nie zawiera adresu serwera ELWIS (https://script.google.com/…/exec).'; return; }
      $('#cUrl').value = m[0];
      $('#cMsg').textContent = /\/exec$/.test(m[0]) ? 'Adres serwera wczytany z kodu QR.' : 'Adres wczytany – sprawdź, czy kończy się na /exec.';
      $('#cKey').focus();
    });
    $('#cGo').onclick = async () => {
      const url = $('#cUrl').value.trim(), key = $('#cKey').value.trim(), tablet = $('#cName').value.trim();
      if (!/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url) || !key) { $('#cMsg').textContent = 'Podaj adres (https://…) i klucz.'; return; }
      if (/script\.googleusercontent\.com/.test(url)) { $('#cMsg').textContent = 'To adres przekierowania, nie serwera. Wpisz adres …/exec z Apps Script (Wdróż → Zarządzaj wdrożeniami).'; return; }
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
          <div class="big">ELW<span class="elwis-i">I</span>S</div>
          <div class="designed">Designed by<br>Łukasz Pomarański</div>
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
            <div class="wmark" aria-hidden="true"><img src="icons/icon-192.png" alt=""><span>Designed by Łukasz Pomarański<br>for HUP-BUD Sp. z o.o.</span></div>
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
    if ($('#pinSync')) $('#pinSync').onclick = () => { Sync.run().then(() => { if (UI.cur === 'login') UI.go('login'); }); UI.toast('Synchronizuję w tle – lista osób odświeży się po pobraniu'); };   // od 1.56.1 bez czekania
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
    if (podw()) {   // dostęp podwykonawcy (od 1.43.0): zamiast planu – jego budowa (jedna) albo lista jego budów
      const pr = (S.boot.projekty || []);
      if (pr.length === 1) return openProject(pr[0].kod);
      return UI.go('home');
    }
    UI.header('mój plan', null);
    const pl = (await DB.get('plan')) || null;
    const dzis = U.day(new Date());
    const dzien = par.d || dzis;
    // widok planu zapamiętany dla użytkownika (od 1.13.0): Mój plan / Wszyscy i wybrane osoby – zostają po zmianie dnia i po zamknięciu aplikacji
    const kluczWid = 'widokPlanu:' + (S.user ? S.user.name : '');
    const wid = (await DB.get(kluczWid)) || {};
    const wszyscy = par.all !== undefined ? !!par.all : !!wid.all;
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
    const ukryci = new Set(par.ukryj || (wid.wybrani ? kolejnosc.filter(o => !wid.wybrani.includes(o.name)).map(o => o.name) : kolejnosc.filter(o => o !== ja && !ileOs(o)).map(o => o.name)));
    const osoby = wszyscy ? kolejnosc.filter(o => !ukryci.has(o.name)) : (ja ? [ja] : []);
    const mojeZad = t => !wszyscy ? (ja && t.osoby.includes(String(ja.cu))) : osoby.some(o => t.osoby.includes(String(o.cu)));
    const zad = wszystkieZad.filter(t => naDzien(t, dzien));
    const proj = (S.boot && S.boot.projekty) || [];
    const budowaZ = t => proj.find(p => p.listaCU && p.listaCU === t.lista);
    // miejsce prognozy: budowa z lokalizacją, na której zalogowany ma zadania tego dnia; inaczej Lublin
    const lokDnia = k => { const b2 = wszystkieZad.filter(t => naDzien(t, k) && mojeZad(t)).map(budowaZ).find(b => b && wspolrzedne(lokBudowy(b))); return b2 ? { klucz: wspolrzedne(lokBudowy(b2)).klucz, miejsce: b2.nazwa } : { klucz: POGODA_DOM.klucz, miejsce: POGODA_DOM.miejsce }; };
    const kol = t => { const k = t.lista || '?'; let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PLAN_KOLORY[h % PLAN_KOLORY.length]; };
    // od 1.58.0: czas pracy – zatwierdzone godziny z bazy (kłódka) zastępują zadanie z planu; wpisy spoza planu jako bloki
    const CZW = (await Czas.lista()).filter(w => w.data === dzien && Czas.akt(w) && !w.nieob);
    const NBW = await Czas.nieob(null, dzien);   // urlop / nieobecność w tym dniu (także odrzucone)
    const BKD = S.user ? new Set((await Czas.braki(S.user.name)).map(x => x.d)) : new Set();
    const kolumny = osoby.map(o => { const zat = CZW.filter(w => w.osoba === o.name && w.stan === 'zatw' && w.zad);
      return { o, z: zad.filter(t => t.osoby.includes(String(o.cu)) && !zat.some(w => w.zad === t.id)), cz: CZW.filter(w => w.osoba === o.name && (w.stan === 'zatw' || !w.zad) && w.stan !== 'prop').concat(NBW.filter(w => w.osoba === o.name)) }; });
    // oś dnia 7:00–24:00 (od 1.14.1); każde zadanie → odcinek tego dnia [s, e] w minutach
    //  • z godzinami, jeden dzień – wg godzin (przycięte do 7–24)
    //  • z godzinami, kilka dni – 1. dzień od startu, środkowe 7–15, ostatni do końca
    //  • całodniowe (bez godzin, bez „Estimated Time”) i wielodniowe bez godzin – 7:00–15:00
    //  • bez godzin z „Estimated Time” – wpasowane w wolne miejsca od 7:00, najpóźniej do 24:00
    const D_OD = 7 * 60, D_DO = 24 * 60, CAL_DO = 15 * 60;
    const mnD = d => d.getHours() * 60 + d.getMinutes();
    const przytnij = (s, e) => { s = Math.min(Math.max(s, D_OD), D_DO - 30); e = Math.min(Math.max(e, s + 30), D_DO); return [s, e]; };
    const odcinek = t => {
      const a = t.start ? new Date(t.start) : null, b = t.koniec ? new Date(t.koniec) : null;
      const dA = a ? U.day(a) : dzien, dB = b ? U.day(b) : dzien;
      if (t.godzStart && t.godzKoniec && a && b) {
        if (dA === dB) return { rodz: 'fix', se: przytnij(mnD(a), mnD(b)) };
        const s = dzien === dA ? mnD(a) : D_OD, e = dzien === dB ? mnD(b) : (dzien === dA && s >= CAL_DO ? D_DO : CAL_DO);
        return { rodz: 'fix', wiel: true, se: przytnij(s, e) };
      }
      if (dA === dB && t.est > 0) return { rodz: 'auto' };
      return { rodz: 'cal', wiel: dA !== dB, se: [D_OD, CAL_DO] };
    };
    kolumny.forEach(k => {
      k.el = [];
      k.z.forEach(t => { const o = odcinek(t); if (o.rodz !== 'auto') k.el.push({ t, os: k.o.name, ...o, s: o.se[0], e: o.se[1] }); });
      (k.cz || []).forEach(w => k.el.push({ cz: w, t: { id: 'cz-' + w.wid }, rodz: 'fix', s: CZ.min(w.od), e: CZ.min(w.do) }));
      // wolne miejsca liczone tylko względem zadań z godzinami (całodniowe stoją obok – nie wypychają innych)
      const zajete = k.el.filter(x => x.rodz === 'fix').map(x => [x.s, x.e]);
      k.z.filter(t => odcinek(t).rodz === 'auto').forEach(t => {
        const dl = Math.min(D_DO - D_OD, Math.max(15, Math.round(t.est / 60000)));
        let od = D_OD;
        for (let i = 0; i < 200; i++) { const kol = zajete.find(([a, b]) => od < b && od + dl > a); if (!kol) break; od = kol[1]; }
        if (od + dl > D_DO) od = D_DO - dl;   // nie mieści się przed północą → ostatnie miejsce, obok innych
        zajete.push([od, od + dl]); k.el.push({ t, os: k.o.name, rodz: 'auto', s: od, e: od + dl });
      });
    });
    const wpasowane = new Set(kolumny.flatMap(k => k.el.map(x => x.t.id)));
    const h0 = 7; let h1 = 18;
    kolumny.forEach(k => k.el.forEach(x => { h1 = Math.max(h1, Math.ceil(x.e / 60)); }));
    h1 = Math.min(24, h1);
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
    const dzTyg = d => d.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '');
    const blok = (x, tor) => {
      const { t, rodz, s, e } = x;
      const top = (s - h0 * 60) / 60 * PX, hgt = Math.max(30, (e - s) / 60 * PX - 3);
      const { st, kl } = poz(top, hgt, tor);
      if (x.cz && x.cz.nieob) { const w = x.cz;   // urlop / nieobecność
        return `<button class="pblk${kl} pczas pnieob${w.rodzaj === 'zwolnienie' ? ' l4' : ''} ${w.stan === 'zatw' ? 'zamk' : w.stan === 'odrzB' ? 'odrz' : ''}" data-cz="${U.esc(w.wid)}" style="${st}"><span class="pt">${U.esc(PC_dzien(w.data))}${w.dataDo && w.dataDo !== w.data ? ' – ' + U.esc(PC_dzien(w.dataDo)) : ''}</span><b>${U.esc(w.nazwa || CZ_ST_TXT[w.st] || '')}</b>${czChip(w)}</button>`; }
      if (x.cz) { const w = x.cz, bp = proj.find(p => p.kod === w.kod);   // od 1.58.0: czas pracy z bazy
        return `<button class="pblk${kl} pczas ${w.stan === 'zatw' ? 'zamk' : ''}" data-cz="${U.esc(w.wid)}" style="${st}"><span class="pt">${U.esc(w.od)}–${U.esc(w.do)} · ${CZ.hTxt(CZ.h(w.od, w.do))}</span>${bp ? `<span class="pbud">${U.esc(bp.kod)}</span>` : ''}<b>${U.esc(w.nazwa || w.opis || '')}</b>${czChip(w)}</button>`; }
      const cw = CZW.find(w => w.zad === t.id && w.osoba === x.os);
      const a = t.start ? new Date(t.start) : null, b2 = t.koniec ? new Date(t.koniec) : null;
      let czas;
      if (rodz === 'fix') czas = x.wiel ? `${dzTyg(a)} ${hm(a)} – ${dzTyg(b2)} ${hm(b2)}` : `${hm(a)}–${hm(b2)}`;
      else if (rodz === 'auto') czas = `~${hmMin(s)}–${hmMin(e)} · ${String(Math.round((e - s) / 6) / 10).replace('.', ',')} h`;
      else czas = 'cały dzień' + (x.wiel && a && b2 ? ` · ${a.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}–${b2.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}` : '');
      return `<button class="pblk${kl}${rodz === 'auto' ? ' pauto' : ''} ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="${st};--c:${kol(t)}">${pogodaZad(t)}
        <span class="pt">${czas}${t.zamk ? ' · ✓' : ''}</span>${pbud(t)}<b>${U.esc(t.nazwa)}</b>${cw ? czChip(cw) + ` <span class="czchip c-gr">${U.esc(cw.od)}–${U.esc(cw.do)}</span>` : pst(t)}${rodz === 'auto' ? '<span class="pauton">Kierownik nie określił pory dnia</span>' : ''}</button>`;
    };
    // tory: zadania nachodzące na siebie dzielą szerokość kolumny; stykające się (koniec = początek) – nie
    const kolumnaHtml = k => {
      const minDl = 30 / PX * 60;
      const el = k.el.map(x => ({ x, s: x.s, e: Math.max(x.e, x.s + minDl) })).sort((a, b) => a.s - b.s || b.e - a.e);
      let grupa = [], koniecGr = -1; const tory = [];
      const zamknij = () => { const n = Math.max(1, ...grupa.map(x => x.i + 1)); grupa.forEach(x => x.tor = { i: x.i, n }); grupa = []; tory.length = 0; };
      el.forEach(x => {
        if (x.s >= koniecGr) zamknij();
        let i = tory.findIndex(e => e <= x.s); if (i < 0) i = tory.length; tory[i] = x.e; x.i = i;
        grupa.push(x); koniecGr = Math.max(koniecGr, x.e);
      });
      zamknij();
      return el.map(y => blok(y.x, y.tor)).join('');
    };
    const karta = t => { const bud = budowaZ(t); return `<button class="pcard ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="--c:${kol(t)}">${pogodaZad(t)}${pbud(t)}<b>${U.esc(t.nazwa)}</b>${pst(t)}
      ${t.status ? `<span class="mute">${U.esc(t.status)}</span>` : ''}${wszyscy ? `<span class="pwho">${U.esc(osobyTxt(t, prac))}</span>` : ''}</button>`; };
    const bezGodz = [...new Set(kolumny.flatMap(k => k.z.filter(t => !wpasowane.has(t.id))))];
    const terazTop = dzien === dzis ? ((new Date().getHours() - h0) * 60 + new Date().getMinutes()) / 60 * PX : -1;
    const inicjaly = n => n.split(' ').map(w => w[0]).join('');
    if (UI.cur !== 'plan' || UI.par !== par) return;   // od 1.56.1: późniejsze przerysowanie (np. po synchronizacji) nie cofa wybranego dnia
    view.innerHTML = `
      <section class="phero">
        <div class="phtop">
          <div class="grow"><div class="phhi">${U.esc(powitanie)}</div><h1>${wszyscy ? 'Plan wszystkich' : 'Twój plan'}</h1></div>
          ${Session.isBiuro() ? `<button class="btn sm pnz" id="pNZ">${ic('plus')} Nowe zadanie<span class="bn" id="pNZn" hidden></span></button>` : ''}
          <div class="seg pseg"><button id="pMy" class="${wszyscy ? '' : 'on'}">Mój plan</button><button id="pAll" class="${wszyscy ? 'on' : ''}">Wszyscy</button></div>
        </div>
        <div class="pweekwrap" id="pWeekWrap"><div class="pweek" id="pWeek" title="Przeciągnij w lewo / prawo, aby przesunąć dni">
          ${tydzien.map(x => { const w = pogodaDnia(x.k, lokDnia(x.k)); const sw = U.swieto(x.k); return `<button class="pday ${x.k === dzien ? 'on' : ''} ${x.k === dzis ? 'today' : ''} ${U.wolny(x.k) ? 'wolne' : ''} ${BKD.has(x.k) ? 'czbrak' : ''}" data-day="${x.k}" title="${sw ? U.esc(sw) + ' – dzień wolny' + (w ? '; ' : '') : ''}${w ? w.tmin + '°/' + w.tmax + '° (7–16)' + (w.pada ? ', pada' : '') : ''}"><span>${x.d.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '')}</span><span class="pmid"><b>${x.d.getDate()}</b>${w ? `<span class="pico" aria-hidden="true">${w.ikona}</span>` : ''}</span><i>${x.n ? '•'.repeat(Math.min(x.n, 4)) : ''}${w ? `<em>${w.tmin}°/${w.tmax}°</em>` : ''}${!x.n && !w ? '&nbsp;' : ''}</i></button>`; }).join('')}
        </div></div>
        <div class="phsum"><span class="pchip">${U.esc(dzienTxt)}${dzien === dzis ? ' · dziś' : ''}</span>${(h => h ? `<span class="pchip">Moje godziny: ${CZ.hTxt(h)}</span>` : '')(CZW.filter(w => S.user && w.osoba === S.user.name && w.stan !== 'prop').reduce((a, w) => a + CZ.h(w.od, w.do), 0))}${BKD.has(dzien) ? '<span class="pchip pwolne">brak godzin</span>' : ''}${U.wolny(dzien) ? `<span class="pchip pwolne">${U.swieto(dzien) ? U.esc(U.swieto(dzien)) : 'Weekend'} · dzień wolny</span>` : ''}${(w => w ? `<span class="pchip ${w.pada ? 'pwarn' : ''}"><span class="pchipico">${w.ikona}</span> 7–16: ${w.tmin}°…${w.tmax}° · ${w.pada ? '☔ będzie padać (do ' + w.szansa + '%)' : 'bez opadów'} · ${U.esc(w.miejsce)}</span>` : '')(pogodaDnia(dzien, lokDnia(dzien)))}<span class="pchip">${mojeDzis.length} ${odm(mojeDzis.length, 'zadanie', 'zadania', 'zadań')}</span><span class="pchip">${budowy.size} ${odm(budowy.size, 'budowa', 'budowy', 'budów')}</span>${dzien !== dzis ? '<button class="pchip pnow" data-day="' + dzis + '">↺ dziś</button>' : ''}</div>
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
    view.querySelectorAll('[data-day]').forEach(b => b.onclick = () => idz({ d: b.dataset.day, od: b.classList.contains('pnow') ? undefined : od }));
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
    // od 1.41.0: przesunięcie palcem po harmonogramie w lewo → następny dzień, w prawo → poprzedni
    // (tylko wyraźny ruch poziomy; gdy kolumny osób przewijają się w poziomie – dopiero na krawędzi przewijania)
    (() => {
      const pt = view.querySelector('.ptime'); if (!pt) return;
      let x0 = null, y0 = 0, t0 = 0, sl0 = 0, poziomo = false;
      const doRuchu = (dx) => { pt.style.transition = 'none'; pt.style.transform = `translateX(${dx * 0.35}px)`; pt.style.opacity = String(1 - Math.min(Math.abs(dx) / 600, 0.35)); };
      const wroc = () => { pt.style.transition = 'transform .15s ease-out, opacity .15s'; pt.style.transform = ''; pt.style.opacity = ''; };
      pt.addEventListener('touchstart', e => { if (e.touches.length !== 1) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); sl0 = pt.scrollLeft; poziomo = false; }, { passive: true });
      pt.addEventListener('touchmove', e => {
        if (x0 === null || e.touches.length !== 1) { x0 = null; wroc(); return; }
        const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
        if (!poziomo && Math.abs(dx) > 14 && Math.abs(dx) > 1.6 * Math.abs(dy) && pt.scrollLeft === sl0) poziomo = true;
        if (poziomo) doRuchu(dx);
      }, { passive: true });
      pt.addEventListener('touchend', e => {
        if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
        const przew = pt.scrollWidth > pt.clientWidth + 2, naKrawedzi = dx < 0 ? pt.scrollLeft + pt.clientWidth >= pt.scrollWidth - 2 : pt.scrollLeft <= 2;
        if (poziomo && Math.abs(dx) > 70 && Math.abs(dx) > 1.6 * Math.abs(dy) && Date.now() - t0 < 900 && (!przew || (naKrawedzi && pt.scrollLeft === sl0))) {
          const n = dx < 0 ? 1 : -1, nowy = dzienPlus(dzien, n), konOd = dzienPlus(od, 6);
          pt.style.transition = 'transform .14s ease-in, opacity .14s'; pt.style.transform = `translateX(${n < 0 ? 60 : -60}px)`; pt.style.opacity = '0.3';
          setTimeout(() => idz({ d: nowy, od: nowy < od || nowy > konOd ? dzienPlus(od, n) : od }), 140);
        } else wroc();
      }, { passive: true });
      pt.addEventListener('touchcancel', () => { x0 = null; wroc(); }, { passive: true });
    })();
    const zapiszWid = async o => DB.set(kluczWid, { ...wid, ...o });
    $('#pAll').onclick = async () => { await zapiszWid({ all: true }); idz({ all: true }); };
    if ($('#pNZ')) { $('#pNZ').onclick = async () => { const q = (await DB.get('zadNoweKolejka')) || []; if (q.length) Dialogs.zadKolejka(); else Dialogs.noweZadanie(null, dzien); }; planNZ(); }
    $('#pMy').onclick = async () => { await zapiszWid({ all: false }); idz({ all: false }); };
    { const pp = view.querySelector('.ppeople'); if (pp && ppScroll) pp.scrollLeft = ppScroll; }   // 1.23.2: pasek osób zostaje w miejscu po wyborze osoby
    view.querySelectorAll('[data-who]').forEach(b => b.onclick = async () => { ppScroll = b.closest('.ppeople').scrollLeft; const u = new Set(ukryci); u.has(b.dataset.who) ? u.delete(b.dataset.who) : u.add(b.dataset.who);
      await zapiszWid({ wybrani: kolejnosc.filter(o => !u.has(o.name)).map(o => o.name) }); idz({ ukryj: [...u] }); });
    // dotknięcie zadania → okienko z danymi z ClickUp, statusem i „Przejdź do budowy” (od 1.12.0)
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      const t = zad.find(x => x.id === b.dataset.t); if (t) Dialogs.zadanie(t, budowaZ(t), osobyTxt(t, (S.boot && S.boot.pracownicy) || []));
    });
    // od 1.58.0: czas pracy – podgląd wpisu; dotknięcie pustego miejsca w swojej kolumnie → „Co robiłem?” (praca spoza planu)
    view.querySelectorAll('[data-cz]').forEach(b => b.onclick = () => { const w = CZW.concat(NBW).find(x => x.wid === b.dataset.cz); if (w) Dialogs.czasInfo(w); });
    // przytrzymanie pustego miejsca w swojej kolumnie: kółko z zielonym postępem (jak na rzutach) → praca spoza planu / urlop / nieobecność
    view.querySelectorAll('.pcol').forEach((c, i) => {
      let tm = null, ring = null, x0 = 0, y0 = 0;
      const stop = () => { clearTimeout(tm); tm = null; if (ring) { ring.remove(); ring = null; } };
      c.addEventListener('pointerdown', e => {
        if (e.target !== c || !kolumny[i] || !S.user || (kolumny[i].o.name !== S.user.name && !Session.isBiuro())) return;   // biuro – także w kolumnach innych osób
        x0 = e.clientX; y0 = e.clientY; const r = c.getBoundingClientRect(), y = e.clientY - r.top;
        ring = document.createElement('span'); ring.className = 'pring'; ring.style.left = (e.clientX - r.left) + 'px'; ring.style.top = y + 'px'; c.appendChild(ring);
        const m = h0 * 60 + Math.floor(y / PX * 2) * 30;
        tm = setTimeout(() => { stop(); if (navigator.vibrate) navigator.vibrate(30); Dialogs.coRobilem(dzien, { start: m, osoba: kolumny[i].o.name }); }, 2000);   // jak przytrzymanie kropki na rzucie
      });
      c.addEventListener('pointermove', e => { if (tm && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) stop(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => c.addEventListener(ev, stop));
    });
    if (S.user && !S._czasPokaz && !Session.isBiuro()) { S._czasPokaz = true; setTimeout(() => { if (UI.cur === 'plan' && !modal.innerHTML.trim()) Dialogs.doUzupelnienia(); }, 500); }
    // przewiń oś do „teraz” (albo do pierwszego zadania)
    const pt = view.querySelector('.pnowline') || view.querySelector('.pblk');
    if (pt) pt.scrollIntoView({ block: 'center', behavior: 'instant' });
    window.scrollTo(0, 0);
  },

  /* Lista budów – od 1.13.0: ciemny nagłówek „Wyszukaj budowę” z polem wyszukiwania, postęp podłączeń przy każdej budowie */
  async home() {
    UI.header('budowy', () => UI.wstecz('plan'));
    const all = (S.boot && S.boot.projekty) || [];
    const recent = (await DB.get('recent')) || [];
    const q = UI.par.q || '';
    const rec = recent.map(k => all.find(p => p.kod === k)).filter(Boolean).slice(0, 4);
    const off = new Set(await Pamiec.lista());
    const nq = U.norm(q);
    let list = all.filter(p => !nq || U.norm([p.kod, p.nazwa, p.adres].join(' ')).includes(nq));
    const naz = p => String(p.nazwa || '').replace(p.kod, '').trim() || p.nazwa;
    // liczniki (od 1.23.0): uruchomione (wszystkie kroki) / podłączone (kroki „podłącz…”) / rozpoczęte (≥1 krok) / wszystkie + otwarte braki;
    // budowy zapisane na tablecie – liczone lokalnie, pozostałe – z serwera (licz); starszy serwer: tylko [gotowe, wszystkie] (postep)
    const LM = await liczLokalne(all);   // od 1.25.1: liczone na tablecie dla każdej zapisanej budowy, reszta – z serwera
    if (UI.cur !== 'home') return;       // użytkownik zdążył przejść dalej
    const licz = p => LM[p.kod] || null;
    // sortowanie listy (od 1.29.0): nr budowy / nazwa / podłączone; ponowne dotknięcie odwraca kierunek; zapamiętane na tablecie
    const so = Object.assign({ k: 'kod', d: 1 }, (await DB.get('sortBud')) || {});
    if (UI.cur !== 'home') return;
    const SORT = { kod: (a, b) => natCmp(a.kod, b.kod), naz: (a, b) => naz(a).localeCompare(naz(b), 'pl', { sensitivity: 'base' }),
      // od 1.31.2: % urządzeń z rozpoczętą pracą (rozp. / wszystkie); budowy bez liczników – zawsze na końcu
      podl: (a, b) => { const pr = p => { const L = licz(p); return L && L.w ? L.d / L.w : -1; };
        const x = pr(a), y = pr(b); if ((x < 0) !== (y < 0)) return (x < 0 ? 1 : -1) * so.d; return (x - y) || natCmp(a.kod, b.kod); },
      // od 1.33.3: liczba urządzeń z otwartym frontem; budowy bez liczników – zawsze na końcu
      front: (a, b) => { const fr = p => { const L = licz(p); return L ? (L.f || 0) : -1; };
        const x = fr(a), y = fr(b); if ((x < 0) !== (y < 0)) return (x < 0 ? 1 : -1) * so.d; return (x - y) || natCmp(a.kod, b.kod); } };
    list.sort((a, b) => (SORT[so.k] || SORT.kod)(a, b) * so.d);
    const sBtn = (k, t) => `<button class="tab ${so.k === k ? 'on' : ''}" data-sb="${k}" title="Sortuj: ${k === 'kod' ? 'nr budowy' : k === 'naz' ? 'nazwa' : k === 'front' ? 'liczba urządzeń z otwartym frontem' : '% urządzeń z rozpoczętą pracą'}">${t}${so.k === k ? (so.d > 0 ? ' ↑' : ' ↓') : ''}</button>`;
    const stat = (p, maly) => {
      const L = licz(p);
      if (!L) { const x = p.postep; if (!x || !x[1]) return `<span class="lstat mute">${maly ? '' : 'postęp po pierwszym pobraniu'}</span>`;
        const v = Math.round(x[0] / x[1] * 100); return `<span class="lstat"><span class="m"><b>${x[0]} / ${x[1]}</b></span> <small>gotowych · ${v}%</small><span class="tbar${maly ? ' sm' : ''}"><i style="width:${v}%"></i></span></span>`; }
      // od 1.33.0: do rozp. / otw. f. – odstęp – uruch. / podł. / rozp. / wszystkie; pod spodem usterki i notatki
      const f = L.f || 0;
      // od 1.33.1: na kafelkach „Ostatnio” otwarty front tylko jako ikona drzwi z liczbą (obok usterek i notatek)
      const dod = [!maly && f ? `<span class="lfront" title="Otworzył się front – ${f} ${odm(f, 'urządzenie', 'urządzenia', 'urządzeń')}">${ic('front')} ${f}</span>` : '', L.b ? `<span class="usterki">⚠ ${L.b} ${odmUsterki(L.b)}</span>` : '', L.nt ? `<span class="lnot">${ic('note')} ${L.nt} ${odm(L.nt, 'notatka', 'notatki', 'notatek')}</span>` : ''].filter(Boolean).join('');
      return `<span class="lstat"><span class="lgrp kol">${kolDoRozp(L, maly)}${kolPostep(L)}</span>${dod ? `<span class="ldod">${dod}</span>` : ''}${pasek3(L, maly)}</span>`;
    };
    // kierownik HUP-BUD opiekujący się budową (od 1.33.0, Baza → Projekty → Kierownik)
    const kier = (p, maly) => p.kierownik ? `<span class="lkier${maly ? ' sm' : ''}" title="Kierownik budowy HUP-BUD">${ic('kier')}${U.esc(p.kierownik)}</span>` : '';
    const znaczki = p => `${p.wojskowy === 'tak' ? `<span class="chip warn">${dostepDoBudowy(p) ? '' : '🔒 '}obiekt wojskowy</span>` : ''}${off.has(p.kod) ? `<span class="offbox"><span class="chip ok chipic" title="Dostępne offline – zapisane w tablecie">${ic('offline')} offline</span>${Session.isBiuro() ? `<span class="chip chipic zwolnij" role="button" tabindex="0" data-zw="${U.esc(p.kod)}" title="Usuń dane tej budowy z tabletu – pobiorą się ponownie przy otwarciu">Zwolnij</span>` : ''}</span>` : `<span class="chip gr chipic offno" title="Nie pobrano na tablet – pobierze się przy otwarciu (wymaga internetu)">${ic('offline0')} offline</span>`}`;   // od 1.46.0: przekreślona ikona = budowa niepobrana
    wstawWidok(`
      <section class="bhero">
        <h1>Wyszukaj budowę</h1>
        <label class="search hsearch"><span hidden>Szukaj budowy</span><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4"></path></svg>
          <input type="search" id="q" value="${U.esc(q)}" placeholder="nazwa, kod lub adres" autocomplete="off"></label>
      </section>
      <div id="wyn">${rec.length && !q ? `<h2>Ostatnio na tym tablecie</h2><div class="grid2">${rec.map(p => `<button class="tile btc" data-k="${U.esc(p.kod)}"><span class="row"><span class="m bkd">${U.esc(p.kod)}</span><span style="margin-left:auto" class="row">${znaczki(p)}</span></span><b>${U.esc(naz(p))}</b><span class="mute">${U.esc(p.adres || '')}</span>${kier(p)}${stat(p)}</button>`).join('')}</div>` : ''}
      <div class="row bsort"><h2 class="grow">${q ? 'Wyniki' : '<span class="hdl">Wszystkie aktywne budowy</span><span class="hkr">Aktywne budowy</span>'} (${list.length})</h2>
        <div class="seg2" role="group" aria-label="Sortowanie listy budów">${sBtn('kod', 'Nr')}${sBtn('naz', 'Naz.')}${sBtn('podl', 'Rozp')}${sBtn('front', 'Fr.otw')}</div></div>
      <div class="list blist" id="blist">${list.map(p => `<button class="li" data-k="${U.esc(p.kod)}"><b class="m bkd">${U.esc(p.kod)}</b><span class="grow">${U.esc(naz(p))}<br><span class="mute">${U.esc(p.adres || '')}</span>${kier(p, true)}</span>${stat(p, true)}${znaczki(p)}</button>`).join('') || '<div class="li mute">Brak aktywnych budów. Połącz się z siecią, aby pobrać listę.</div>'}</div></div>`, '#wyn');
    dopasujListeBudow();
    szukajNaZywo($('#q'), () => Views.home());
    view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => openProject(b.dataset.k));
    // „Zwolnij” (od 1.46.0): usuwa budowę z pamięci tabletu i z synchronizacji; wróci przy otwarciu
    view.querySelectorAll('[data-zw]').forEach(b => b.onclick = async ev => {
      ev.stopPropagation(); const kod = b.dataset.zw;
      if (!confirm(`Zwolnić pamięć budowy ${kod}?\nRzuty, dokumenty i zdjęcia tej budowy zostaną usunięte z tabletu i nie będą synchronizowane. Pobiorą się ponownie przy otwarciu budowy (wymaga internetu).`)) return;
      const r = await Pamiec.zwolnij(kod); delete LICZ_PAM[kod];
      UI.toast(r === 'ok' ? `Zwolniono pamięć budowy ${kod}` : `Budowa ${kod} ma niewysłane wpisy lub zdjęcia – najpierw zsynchronizuj.`);
      Views.home();
    });
    view.querySelectorAll('[data-sb]').forEach(b => b.onclick = async () => {
      const k = b.dataset.sb; await DB.set('sortBud', { k, d: so.k === k ? -so.d : (k === 'podl' || k === 'front' ? -1 : 1) });   // podłączone – domyślnie od największej
      Views.home();
    });
  },

  /* Karta budowy – od 1.13.0: ciemny nagłówek (nazwa, adres, nawigacja), pod nim etapy, 6 kafelków ze statystykami, „Więcej” */
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
    const zn = Prot.wszystkie().length ? urz.map(u => protZnacznik(u.id, F).k).filter(Boolean) : [];
    const protWym = zn.length, protOk = zn.filter(k => k === 'ok').length;
    const rob = Object.values(F.prot).filter(x => x.stan === 'roboczy').length;
    const fotki = Object.keys(F.fotoInfo).length;
    const dzis = U.day(); const fotDzis = Object.values(F.fotoInfo).filter(f => U.day(f.ts) === dzis).length;
    const pliki = pd.pliki || [];
    let plikiOff = 0; for (const f of pliki) if (await DB.hasFile(f.id)) plikiOff++;
    const tech = (await DB.get('tech')) || [];
    const lok = lokBudowy(p), wsp = wspolrzedne(lok), link = /^https?:/.test(lok);
    const cel = wsp ? wsp.lat + ',' + wsp.lon : link ? '' : p.adres;
    const navUrl = link ? lok : cel ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(cel) : '';
    const mozePin = !wsp && !link;
    const nazwa = String(p.nazwa || '').replace(new RegExp('^' + p.kod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '');
    const pasek = v => `<span class="tbar"><i style="width:${v}%"></i></span>`;
    const LB = liczBudowy(urz, F);   // od 1.23.1: liczniki jak na liście budów (etap wg przełącznika)
    const PUSTY = '<span class="chip" style="visibility:hidden">–</span>';
    view.innerHTML = `
      <section class="bhero">
        <div><div class="row" style="align-items:flex-start"><h1 class="grow">${U.esc(nazwa || p.nazwa)} <span class="bkod">${U.esc(p.kod)}</span></h1><button class="binfo" id="bInfo" aria-label="Informacje o budowie" title="Pełna informacja o budowie">i</button></div>${p.wojskowy === 'tak' ? '<span class="bpill" style="margin:6px 0 2px">obiekt wojskowy · uprawnienie M</span>' : ''}<div class="bsub">${U.esc([p.adres, p.kontakt && 'kontakt: ' + p.kontakt].filter(Boolean).join(' · ') || 'brak adresu')}</div>
          ${(a => a && a.nazwa ? `<div class="bkier">${ic('kier')}<span>K.&nbsp;AKPiA:&nbsp;<b>${U.esc(a.nazwa)}</b></span>${a.tel ? `<a href="tel:${U.esc(a.tel.replace(/[^\d+]/g, ''))}">${ic('tel')}${U.esc(a.tel)}</a>` : ''}</div>` : '')(S.boot && S.boot.kierownikAkpia)}
          ${p.kierownik ? `<div class="bkier">${ic('kier')}<span>K.&nbsp;Sanit.:&nbsp;<b>${U.esc(p.kierownik)}</b></span>${telKier(p) ? `<a href="tel:${U.esc(telKier(p).replace(/[^\d+]/g, ''))}">${ic('tel')}${U.esc(telKier(p))}</a>` : ''}</div>` : ''}</div>
        ${p.uwagi ? `<div class="bsub buwagi" id="bUw" role="button" tabindex="0" title="Pokaż całość">${U.esc(p.uwagi)}</div>` : ''}
        ${navUrl || mozePin ? `<div class="bhact">
          ${navUrl ? `<a class="hb pri" href="${U.esc(navUrl)}" target="_blank" rel="noopener">${ic('nav')}Nawiguj</a>` : ''}
          ${mozePin ? `<button class="hb ${navUrl ? '' : 'pri'}" id="bPin">${ic('pin')}${navUrl ? 'Zapisz pinezkę' : 'Dodaj pinezkę'}</button>` : ''}
        </div>` : ''}
      </section>
      <div style="margin-top:12px">${etapSwitch()}</div>
      ${Session.isBiuro() && (pd.ostrzezenia || []).length ? `<div class="badbox" style="margin-bottom:12px"><b>Dane do poprawy (widzi tylko biuro)</b><br>${pd.ostrzezenia.map(U.esc).join('<br>')}</div>` : ''}
      <div class="bgrid">
        <button class="big" id="tPodl"><span class="bi">${ic('plug')}</span><span class="bt"><b>Urządzenia</b><span>Lista, rzuty, podłączenia</span></span>
          <span class="bst bst2 kol">${kolDoRozp(LB, true)}${kolPostep(LB)}${pasek3(LB)}</span>${openB.length ? `<span class="chip bad">⚠ ${openB.length} ${odmUsterki(openB.length)}</span>` : PUSTY}</button>
        <button class="big" id="tProt" ${Prot.wszystkie().length ? '' : 'disabled'}><span class="bi">${ic('proto')}</span><span class="bt"><b>Protokoły</b><span>Uruchomienia i pomiary</span></span>
          <span class="bst"><span class="sv">${protOk} / ${protWym} <small>wykonanych</small></span>${pasek(protWym ? Math.round(protOk / protWym * 100) : 0)}</span>${rob ? `<span class="chip warn">${rob} ${odm(rob, 'roboczy', 'robocze', 'roboczych')}</span>` : PUSTY}</button>
        <div class="big" id="tBraki" role="button" tabindex="0"><span class="bi">${ic('warn')}</span><span class="bt"><b>${Session.isBiuro() ? 'Braki i tematy' : 'Braki'}</b><span>Lista i zamykanie</span></span>
          <span class="bst"><span class="sv">${openB.length} <small>${odm(openB.length, 'otwarty', 'otwarte', 'otwartych')}</small></span></span>
          <span class="brow">${pilne ? `<span class="chip bad">${pilne} ${odm(pilne, 'blokuje', 'blokują', 'blokuje')} pracę</span>` : '<span></span>'}<span class="inbs"><button class="inb bad" id="bBrak">${ic('plus')}Zgłoś brak</button><button class="inb" id="bZak" title="Zgłoś zapotrzebowanie na tę budowę">${ic('box')}Zapotrzebowanie</button></span></span></div>
        <button class="big" id="tFoto"><span class="bi">${ic('cam')}</span><span class="bt"><b>Zdjęcia</b><span>Wszystkie z budowy</span></span>
          <span class="bst"><span class="sv">${fotki} <small>${odm(fotki, 'zdjęcie', 'zdjęcia', 'zdjęć')}</small></span></span>${fotDzis ? `<span class="chip gr">+${fotDzis} dziś</span>` : PUSTY}</button>
        <div class="big" id="tNot" role="button" tabindex="0"><span class="bi">${ic('note')}</span><span class="bt"><b>Notatki</b><span>Ustalenia z budowy</span></span>
          <span class="bst"><span class="sv">${F.notes.length} <small>${odm(F.notes.length, 'notatka', 'notatki', 'notatek')}</small></span></span>
          <span class="brow"><span></span><button class="inb" id="bNote">${ic('plus')}Notatka</button></span></div>
        <button class="big" id="tDokP"><span class="bi">${ic('folder')}</span><span class="bt"><b>Dokumenty projektowe</b><span>Rzuty, schematy, dokumenty budowy</span></span>
          <span class="bst"><span class="sv">${pliki.length} <small>${odm(pliki.length, 'plik', 'pliki', 'plików')}</small></span></span>${pliki.length ? `<span class="chip chipic ${plikiOff === pliki.length ? 'ok' : 'gr'}" title="Pliki dostępne offline">${ic('offline')} ${plikiOff} offline</span>` : PUSTY}</button>
      </div>
      <section class="card more" style="margin-top:14px"><span class="lbl">Więcej</span>
        <button class="mrow" id="mDokT">${ic('book')}<b>Dokumenty techniczne</b><span>${tech.length}</span>${ic('chev')}</button>
        <button class="mrow" id="mPost">${ic('chart')}<b>Postęp${maEtapy() ? ' i etapy' : ''}</b><span>${pct}%</span>${ic('chev')}</button>
      </section>`;
    bindEtap();
    $('#tPodl').onclick = () => UI.go('rzut', {});
    $('#tProt').onclick = () => UI.go('protokoly');
    const kaf = (el, f) => { el.onclick = e => { if (!e.target.closest('.inb')) f(); }; el.onkeydown = e => { if (e.key === 'Enter') f(); }; };
    kaf($('#tBraki'), () => UI.go('braki'));
    kaf($('#tNot'), () => UI.go('notatki'));
    $('#tFoto').onclick = () => UI.go('zdjecia');
    $('#tDokP').onclick = () => UI.go('dokumenty', { typ: 'proj' });
    $('#mDokT').onclick = () => UI.go('dokumenty', { typ: 'tech' });
    $('#mPost').onclick = () => UI.go('postep');
    $('#bBrak').onclick = () => Dialogs.brak('');
    $('#bZak').onclick = () => Dialogs.zakNowe(S.kod);   // od 1.48.0: budowa wpisana automatycznie
    $('#bNote').onclick = () => Dialogs.notatka('');
    $('#bInfo').onclick = () => Dialogs.infoBudowy(p.kod);
    if ($('#bUw')) $('#bUw').onclick = () => Dialogs.infoBudowy(p.kod);
    if ($('#bPin')) $('#bPin').onclick = () => zapiszPinezke(p);
  },

  /* Dokumenty projektowe (pliki budowy) i techniczne (DTR z _Techniczne) – od 1.12.0 osobne ekrany */
  /* Priorytety budów (od 1.17.0) – tylko rola biuro; wynik silnika reguł z serwera, kafelki w kolejności wymaganego działania */
  /* Priorytety – wycofane w 1.55.0 (decyzja 20.11.2026); stary adres prowadzi do „Ostatnich zmian” */
  async priorytety() { return UI.go('zmiany', {}, { zastap: true }); },
  /* Ostatnie zmiany (od 1.24.0) – tylko rola biuro: aktywne budowy od najnowszej zmiany (ostatni wpis z tabletu), z licznikami i usterkami */
  async zmiany() {
    if (!Session.isBiuro()) return UI.go('plan');
    UI.header('ostatnie zmiany', () => UI.wstecz('plan'));
    const all = (S.boot && S.boot.projekty) || [];
    const LM = await liczLokalne(all);
    if (UI.cur !== 'zmiany') return;
    const L = p => LM[p.kod] || null;
    const lista = all.map(p => ({ p, l: L(p) })).sort((a, b) => ((b.l && b.l.t) || '') < ((a.l && a.l.t) || '') ? -1 : ((b.l && b.l.t) || '') > ((a.l && a.l.t) || '') ? 1 : 0);
    const kiedy = t => { if (!t) return 'brak zmian od wdrożenia liczników'; const d = new Date(t), dz = U.day(new Date()), dd = U.day(d);
      const g = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      return dd === dz ? 'dziś ' + g : dd === U.day(new Date(Date.now() - 864e5)) ? 'wczoraj ' + g : d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' }) + ' ' + g; };
    const naz = p => String(p.nazwa || '').replace(p.kod, '').trim() || p.nazwa;
    const wiersz = ({ p, l }) => `<button class="zrow" data-k="${U.esc(p.kod)}">
        <span class="zkto"><b class="m bkd">${U.esc(p.kod)}</b><b>${U.esc(naz(p))}</b><span class="mute">${U.esc(p.adres || '')}</span></span>
        <span class="zkiedy"><b>${U.esc(kiedy(l && l.t))}</b><span class="mute">${l && l.k ? U.esc(l.k) + (l.n ? ` · ${l.n} ${odm(l.n, 'wpis', 'wpisy', 'wpisów')} tego dnia` : '') : ''}</span></span>
        ${l && l.w != null ? `<span class="lstat"><span class="m"><b>${l.u} / ${l.p} / ${l.d} / ${l.w}</b></span><small>uruch. / podł. / rozp. / wszystkie</small>${l.b ? `<span class="usterki">⚠ ${l.b} ${odmUsterki(l.b)}</span>` : ''}${pasek3(l, true)}</span>` : '<span class="lstat mute">brak danych</span>'}
      </button>`;
    view.innerHTML = `<section class="phero"><h1>Ostatnie zmiany</h1><div class="mute" style="color:#dbe7ff">${lista.length} aktywnych budów · od ostatniego wpisu z tabletu</div>
        <div class="pseg" style="margin-top:10px"><button class="on">Ostatnie zmiany</button><button id="zWyd">Wydajność ekip</button><button id="zPow">Powiadomienia</button></div></section>
      <div class="list" style="margin-top:12px">${lista.map(wiersz).join('') || '<div class="li mute">Brak aktywnych budów.</div>'}</div>`;
    $('#zWyd').onclick = () => UI.go('wydajnosc');
    $('#zPow').onclick = () => UI.go('powiad');
    view.querySelectorAll('[data-k]').forEach(b => b.onclick = () => openProject(b.dataset.k));
  },

  /* Powiadomienia (od 1.56.0, tylko rola biuro): dziennik zdarzeń ze wszystkich budów, zapotrzebowań i harmonogramu.
     Źródło: zakładka „Powiadomienia” w Bazie (dopisuje serwer przy push / zakupach / planowaniu); pobierane tylko na tablet biura. */
  async powiad(par) {
    if (!Session.isBiuro()) return UI.go('plan');
    UI.header('powiadomienia', () => UI.wstecz('zmiany'));
    const TYPY = { kol: ['Kolizje w harmonogramie', '⚠'], zad: ['Zadania zaplanowane / zmienione', '📅'], brak: ['Nowe braki (usterki)', '🔴'], bzam: ['Zamknięte braki', '✅'], zap: ['Zapotrzebowania', '🛒'], prot: ['Protokoły przesłane', '📄'], nota: ['Notatki', '📝'], urz: ['Nowe / zmienione urządzenia', '➕'], tab: ['Tabliczki nieczytelne / powtórzone', '🏷️'] };
    const ust = (await DB.get('powUst')) || { typy: Object.keys(TYPY).filter(k => k !== 'nota'), moje: false };
    const lista = (await DB.get('powiad')) || [];
    const widz = (await DB.get('powWidz')) || 0;
    if (navigator.onLine && !par.bez) { pullPowiad().then(() => { if (UI.cur === 'powiad') UI.go('powiad', { bez: 1 }, { zastap: true }); }).catch(() => { }); }
    const L = lista.filter(x => ust.typy.includes(x.t) && (ust.moje || x.kto !== (S.user && S.user.name)));
    const kiedy = ts => { const d = new Date(ts); return (U.day(d) === U.day(new Date()) ? 'dziś ' : d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' }) + ' ') + hm(d); };
    view.innerHTML = `<section class="phero"><div class="row"><h1 class="grow">Powiadomienia</h1><button class="btn sm pri" id="pwUst" style="background:#fff;color:#0E1A2B">Filtr (${ust.typy.length}/${Object.keys(TYPY).length})</button></div>
        <div class="mute" style="color:#dbe7ff">${L.filter(x => x.ts > widz).length} nowych · tylko na tablecie biura · ostatnie 60 dni</div>
        <div class="pseg" style="margin-top:10px"><button id="pwZm">Ostatnie zmiany</button><button id="pwWyd">Wydajność ekip</button><button class="on">Powiadomienia</button></div></section>
      <div class="pwfil card" id="pwFil" hidden>${Object.keys(TYPY).map(k => `<label class="chk"><input type="checkbox" data-t="${k}" ${ust.typy.includes(k) ? 'checked' : ''}> ${TYPY[k][1]} ${TYPY[k][0]}</label>`).join('')}<label class="chk"><input type="checkbox" id="pwMoje" ${ust.moje ? 'checked' : ''}> Pokaż też moje wpisy</label></div>
      <div class="list pwlist" style="margin-top:12px">${L.map(x => `<button class="li pwli ${x.ts > widz ? 'nowe' : ''} t-${x.t}" data-k="${U.esc(x.kod || '')}"><span class="pwico">${TYPY[x.t][1]}</span>
          <span class="grow"><span class="pwtyt"><b class="m bkd">${U.esc(x.kod || '')}</b> ${U.esc(x.tyt)}</span><span class="mute">${U.esc(x.opis || '')}</span></span>
          <span class="pwkiedy"><b>${kiedy(x.ts)}</b><span class="mute">${U.esc(x.kto || '')}</span></span></button>`).join('') || '<div class="li mute">Brak powiadomień wybranych typów.</div>'}</div>`;
    $('#pwZm').onclick = () => UI.go('zmiany');
    $('#pwWyd').onclick = () => UI.go('wydajnosc');
    $('#pwUst').onclick = () => { $('#pwFil').hidden = !$('#pwFil').hidden; };
    view.querySelectorAll('#pwFil input').forEach(c => c.onchange = async () => {
      const typy = [...view.querySelectorAll('#pwFil [data-t]')].filter(x => x.checked).map(x => x.dataset.t);
      await DB.set('powUst', { typy, moje: $('#pwMoje').checked }); UI.refresh(); setTimeout(() => { if ($('#pwFil')) $('#pwFil').hidden = false; }, 50);
    });
    view.querySelectorAll('.pwli[data-k]').forEach(b => b.onclick = () => { if (b.dataset.k) openProject(b.dataset.k); });
    // po obejrzeniu – wszystkie widoczne oznaczone jako przeczytane (plakietka na przycisku znika)
    const maks = lista.reduce((m, x) => Math.max(m, x.ts), 0); if (maks > widz) { await DB.set('powWidz', maks); powPlakietka(); }
  },
  /* Wydajność ekip (od 1.18.0) – tylko rola biuro: trend tygodniowy / miesięczny w 4 kategoriach, porównanie ekip */
  async wydajnosc(par) {
    if (!Session.isBiuro()) return UI.go('plan');
    const ekN = e => /^\d+$/.test(e) ? 'Ekipa ' + e : e;
    UI.header('wydajność ekip', () => UI.wstecz('zmiany'));
    const r = await DB.get('prio'), w = (r && r.wyd) || { tyg: [], serie: [] };
    const KAT = { podl: ['Podłączenia', '% normy dnia'], term: ['Terminowość', '% zadań w terminie'], kompl: ['Kompletność wpisów', '% z nr seryjnym'], prz: ['Przestoje', 'braki blokujące'] };
    const kat = KAT[par.k] ? par.k : 'podl', mies = par.o === 'm';
    // okresy: tygodnie albo miesiące (średnia z tygodni; przestoje – suma)
    let okresy = w.tyg.map((t, i) => ({ et: t.slice(8, 10) + '.' + t.slice(5, 7), idx: [i] }));
    if (mies) { const m = {}; w.tyg.forEach((t, i) => { (m[t.slice(0, 7)] = m[t.slice(0, 7)] || []).push(i); }); okresy = Object.keys(m).sort().map(k => ({ et: k.slice(5, 7) + '.' + k.slice(2, 4), idx: m[k] })); }
    const wart = (s, o) => {
      const d = o.idx.map(i => s.dane[i]).filter(x => x && x[kat] != null); if (!d.length) return null;
      const dni = d.reduce((a, x) => a + (x.dni || 0), 0), suma = d.reduce((a, x) => a + x[kat], 0);
      return { v: kat === 'prz' ? suma : Math.round(suma / d.length), malo: dni < (mies ? 5 : 2) };
    };
    const KOL = ['#1D4ED8', '#D97706', '#15803D', '#B91C1C', '#7C3AED', '#0E7490'], DASH = ['', '6 4', '2 4', '10 3 2 3', '', '6 4'];
    const serie = w.serie.map((s, i) => ({ ek: s.ekipa, kol: KOL[i % 6], dash: DASH[i % 6], p: okresy.map(o => wart(s, o)), typy: s.typy || [] }));
    const maks = Math.max(kat === 'prz' ? 3 : 100, ...serie.flatMap(s => s.p.filter(Boolean).map(x => x.v)));
    const X0 = 44, X1 = 572, Y0 = 20, Y1 = 220, x = i => okresy.length < 2 ? (X0 + X1) / 2 : X0 + (X1 - X0) * i / (okresy.length - 1), y = v => Y1 - (Y1 - Y0) * v / maks;
    const siatka = [0, 0.25, 0.5, 0.75, 1].map(f => `<line x1="${X0}" x2="${X1}" y1="${y(maks * f)}" y2="${y(maks * f)}" stroke="#E2E8F0"/><text x="${X0 - 6}" y="${y(maks * f) + 4}" text-anchor="end" class="wt">${Math.round(maks * f)}</text>`).join('');
    const linie = serie.map(s => {
      const odc = []; let cur = []; s.p.forEach((q, i) => { if (q) cur.push(`${x(i).toFixed(1)},${y(q.v).toFixed(1)}`); else { if (cur.length) odc.push(cur); cur = []; } }); if (cur.length) odc.push(cur);
      return odc.map(o => `<polyline points="${o.join(' ')}" fill="none" stroke="${s.kol}" stroke-width="2.5" stroke-dasharray="${s.dash}"/>`).join('') +
        s.p.map((q, i) => q ? `<circle cx="${x(i).toFixed(1)}" cy="${y(q.v).toFixed(1)}" r="4" fill="${q.malo ? '#fff' : s.kol}" stroke="${s.kol}" stroke-width="2"><title>${U.esc(ekN(s.ek))} · ${okresy[i].et}: ${q.v}${q.malo ? ' (mało danych)' : ''}</title></circle>` : '').join('');
    }).join('');
    const osX = okresy.map((o, i) => `<text x="${x(i)}" y="${Y1 + 18}" text-anchor="middle" class="wt">${o.et}</text>`).join('');
    const karta = s => {
      const d = s.p.filter(Boolean), ost = d[d.length - 1], wcz = d.slice(-5, -1), sr = wcz.length ? wcz.reduce((a, q) => a + q.v, 0) / wcz.length : null;
      const lepiej = kat === 'prz' ? -1 : 1, roz = ost && sr != null ? (ost.v - sr) * lepiej : 0, strz = !ost || sr == null || Math.abs(ost.v - sr) < Math.max(1, sr * 0.05) ? '→' : roz > 0 ? '↑' : '↓';
      const al = ((r && r.alarmy) || []).some(a => a.ekipa === s.ek);
      return `<div class="card wkar${al ? ' al' : ''}"><div class="row"><span class="wkol" style="background:${s.kol}"></span><b class="grow">${U.esc(ekN(s.ek))}</b>${al ? '<span class="chip bad">alarm</span>' : ''}</div>
        <div class="wnum">${ost ? ost.v + (kat === 'prz' ? '' : '%') : '—'} <span class="${strz === '↑' ? 'wup' : strz === '↓' ? 'wdn' : 'mute'}">${strz}</span></div>
        <div class="mute">${ost && ost.malo ? 'mało danych · ' : ''}${sr != null ? 'średnia z poprzednich: ' + Math.round(sr) + (kat === 'prz' ? '' : '%') : 'brak wcześniejszych danych'}</div>
        ${s.typy.length ? `<div class="mute wtyp">${s.typy.sort((a, b) => b.n - a.n).slice(0, 4).map(t => `${U.esc(t.typ)}: ${t.czas} min (norma ${t.norma}, n=${t.n})`).join(' · ')}</div>` : ''}</div>`;
    };
    view.innerHTML = `<section class="phero"><div class="row"><h1 class="grow">Wydajność ekip</h1><button class="btn sm pri" id="wOdsw" style="background:#fff;color:#0E1A2B">Przelicz teraz</button></div><div class="mute" style="color:#dbe7ff">${r && r.czas ? 'Stan na ' + new Date(r.czas).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' · liczone na żądanie · widok tylko dla biura' : 'Brak danych – naciśnij „Przelicz teraz” (potrzebna sieć).'}</div>
        <div class="pseg" style="margin-top:10px"><button id="wZm">Ostatnie zmiany</button><button class="on">Wydajność ekip</button><button id="wPow">Powiadomienia</button></div></section>
      ${((r && r.alarmy) || []).map(a => `<div class="card palarm">⚠ ${U.esc(a.txt)}</div>`).join('')}
      <div class="tabs" style="margin:10px 0">${Object.keys(KAT).map(k => `<button class="tab ${k === kat ? 'on' : ''}" data-wk="${k}">${KAT[k][0]}</button>`).join('')}
        <span style="width:12px"></span><button class="tab ${!mies ? 'on' : ''}" data-wo="t">Tygodnie</button><button class="tab ${mies ? 'on' : ''}" data-wo="m">Miesiące</button></div>
      ${serie.length ? `<div class="card"><div class="mute" style="margin-bottom:4px">${KAT[kat][0]} – ${KAT[kat][1]} · puste kółko = mało danych</div>
        <svg viewBox="0 0 600 250" class="wchart" role="img" aria-label="Wykres: ${KAT[kat][0]} wg ekip">${siatka}${linie}${osX}</svg>
        <div class="row wleg">${serie.map(s => `<span class="row"><svg width="28" height="8"><line x1="0" x2="28" y1="4" y2="4" stroke="${s.kol}" stroke-width="3" stroke-dasharray="${s.dash}"/></svg>${U.esc(ekN(s.ek))}</span>`).join('')}</div></div>
        <div class="grid2" style="margin-top:12px">${serie.map(karta).join('')}</div>` : '<div class="card mute">Brak wpisów ekip z ostatnich 12 tygodni.</div>'}`;
    $('#wOdsw').onclick = async () => {   // od 1.55.0: wydajność liczona tylko na żądanie (bez przeliczania co godzinę)
      if (!navigator.onLine) { UI.toast('Brak sieci.'); return; }
      $('#wOdsw').disabled = true; $('#wOdsw').textContent = 'Przeliczam… (do kilku minut)';
      try { await DB.set('prio', await API.fg('Przeliczam', () => API.priorytety(true))); UI.toast('Przeliczono'); } catch (e) { UI.toast('Nie udało się: ' + (e.message || e)); }
      if (UI.cur === 'wydajnosc') UI.refresh();
    };
    $('#wZm').onclick = () => UI.go('zmiany');
    $('#wPow').onclick = () => UI.go('powiad');
    view.querySelectorAll('[data-wk]').forEach(b => b.onclick = () => UI.go('wydajnosc', { ...par, k: b.dataset.wk }, { zastap: true }));
    view.querySelectorAll('[data-wo]').forEach(b => b.onclick = () => UI.go('wydajnosc', { ...par, o: b.dataset.wo }, { zastap: true }));
  },
  async dokumenty(par) {
    const tech = par.typ === 'tech';
    const p = curProj(); if (!p && !tech) return UI.go('home');
    UI.header(tech ? 'dokumenty techniczne' : p.kod + ' · dokumenty projektowe', () => UI.wstecz(tech ? 'plan' : 'budowa'));
    const pliki = tech ? ((await DB.get('tech')) || []) : ((S.proj || {}).pliki || []);
    const grupy = groupBy(pliki, f => f.grupa || '');
    view.innerHTML = `<h1>${tech ? 'Dokumenty techniczne' : 'Dokumenty projektowe'}</h1>
      ${tech && S.techInfo ? `<p class="mute">${U.esc(S.techInfo)}</p>` : ''}
      <p class="mute">${tech ? 'DTR i karty urządzeń – wspólne dla wszystkich budów.' : 'Rzuty, schematy i dokumenty tej budowy.'} Pliki z ✓ są w pamięci tabletu.</p>
      ${grupy.map(([g, arr]) => `${g || grupy.length > 1 ? `<h2>${U.esc(g || 'Ogólne')}</h2>` : ''}<div class="list">${arr.map(f => `<button class="li" data-f="${U.esc(f.id)}">${ic(tech ? 'book' : 'doc')}<span class="grow">${U.esc(f.name)}</span><span class="mute" data-fs="${U.esc(f.id)}">${mb(f.size)}</span></button>`).join('')}</div>`).join('') || '<p class="mute">Brak plików.</p>'}`;
    view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => openFile(b.dataset.f));
    pliki.forEach(async f => { const el = view.querySelector(`[data-fs="${CSS.escape(f.id)}"]`); if (el && await DB.hasFile(f.id)) el.textContent = mb(f.size) + ' ✓'; });
  },

  /* Zapotrzebowanie (od 1.48.0): zgłoszenia na budowę lub ogólne (AKPiA); na tablecie trwające + 20 ostatnich zakończonych */
  async zakupy(par) {
    zakWidziane();   // od 1.56.0: po otwarciu – licznik nowych na „Zapotrzebowanie” znika
    UI.header('zapotrzebowanie', () => UI.wstecz('plan'));
    const L = await Zakupy.lista(), f = par.f || 'tok', bud = par.bud || '';
    const zamk = z => z.poz.every(x => x.st === 'dostarczone' || x.st === 'odrzucone');
    const wid = L.filter(z => (f === 'tok' ? !zamk(z) : zamk(z)) && (!bud || (bud === '-' ? !z.kod : z.kod === bud)));
    const kody = [...new Set(L.map(z => z.kod).filter(Boolean))].sort();
    const ts = ((await DB.get('zakupy')) || {}).ts;
    view.innerHTML = `<section class="phero"><div class="row"><h1 class="grow">Zapotrzebowanie</h1><button class="btn sm pri" id="zkNew" style="background:#fff;color:#0E1A2B">${ic('plus')} Zgłoś</button></div>
        <div class="mute" style="color:#dbe7ff">${L.filter(z => !zamk(z)).length} w toku · ${ts ? 'lista z ' + U.fmt(new Date(ts).toISOString()) : 'połącz się z siecią, aby pobrać listę'}</div></section>
      <div class="row" style="margin:10px 0;gap:8px;flex-wrap:wrap"><div class="tabs grow" style="margin:0"><button class="tab ${f === 'tok' ? 'on' : ''}" data-zf="tok">W toku</button><button class="tab ${f === 'kon' ? 'on' : ''}" data-zf="kon">Zakończone</button></div>
        <label class="tsel ${bud ? 'on' : ''}"><span hidden>Budowa</span><select id="zkBud"><option value="">Wszystkie</option><option value="-" ${bud === '-' ? 'selected' : ''}>Zakupy ogólne (AKPiA)</option>${kody.map(k => `<option ${k === bud ? 'selected' : ''}>${U.esc(k)}</option>`).join('')}</select></label></div>
      <div class="stack">${wid.map(zakKarta).join('') || `<div class="card mute">${f === 'tok' ? 'Brak zgłoszeń w toku.' : 'Brak zakończonych zgłoszeń (tablet trzyma 20 ostatnich).'}</div>`}</div>`;
    view.querySelectorAll('[data-zf]').forEach(b => b.onclick = () => UI.go('zakupy', { ...par, f: b.dataset.zf }, { zastap: true }));
    $('#zkBud').onchange = e => UI.go('zakupy', { ...par, bud: e.target.value }, { zastap: true });
    $('#zkNew').onclick = () => Dialogs.zakNowe('');
    view.querySelectorAll('[data-zk]').forEach(b => b.onclick = () => Dialogs.zakOkno(wid.find(z => (z.nr || z.id) === b.dataset.zk)));
  },

  /* Notatki z budowy (od 1.12.0) */
  notatki() {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · notatki', () => UI.wstecz('budowa'));
    const q = U.norm(UI.par.q || '');
    const F = fold(S.ev);
    // kosz notatek (od 1.34.0, tylko rola biuro): notatki usunięte, z możliwością przywrócenia
    const biuro = Session.isBiuro(), kosz = biuro && !!S.notKosz;
    const zrodlo = kosz ? F.notesKosz : F.notes;
    const lista = zrodlo.slice().sort((a, b) => a.ts < b.ts ? 1 : -1).filter(e => !q || U.norm([e.d.tekst, e.kto, e.urz].join(' ')).includes(q));
    const fotyN = e => kosz ? (e.d.foto || []) : (e.d.foto || []).filter(f => F.fotoInfo[f]);
    wstawWidok(`<div class="row"><h1 class="grow" style="margin:0">${kosz ? 'Kosz notatek' : 'Notatki'} (${zrodlo.length})</h1>${biuro ? `<button class="btn ${kosz ? 'pri' : ''}" id="nKosz" title="Notatki usunięte – można je przywrócić">${ic('trash')} ${kosz ? 'Wróć do notatek' : `Kosz (${F.notesKosz.length})`}</button>` : ''}${kosz ? '' : `<button class="btn pri" id="nNew">${ic('plus')} Nowa notatka</button>`}</div>
      <label class="search" style="margin:14px 0"><span hidden>Szukaj w notatkach</span><input type="search" id="q" value="${U.esc(UI.par.q || '')}" placeholder="słowo, urządzenie, osoba" autocomplete="off"></label>
      <div class="stack" id="wyn">${lista.map(e => `<article class="card note${kosz ? ' wkoszu' : ''}" role="button" tabindex="0" data-nt="${U.esc(e.id)}"><div class="row"><b>${U.esc(e.kto)}</b><span class="mute">${U.fmt(e.ts)}</span>${e.urz ? `<button class="chip" data-u="${U.esc(e.urz)}">${U.esc(idOz(e.urz))}</button>` : ''}${e.zm.some(z => z.co === 'edycja') ? '<span class="mute">· edytowana</span>' : ''}${kosz ? `<span class="mute">· usunięta ${U.esc(e.usun.kto)} ${U.fmt(e.usun.ts)}</span>` : ''}</div>
        <p>${U.esc(e.d.tekst || '')}</p>${fotyN(e).length ? `<div class="thumbs" style="margin-top:8px" data-fotos="${U.esc(fotyN(e).join(','))}"></div>` : ''}</article>`).join('') || `<p class="mute">${kosz ? 'Kosz jest pusty.' : 'Brak notatek.'}</p>`}</div>`, '#wyn');
    if ($('#nNew')) $('#nNew').onclick = () => Dialogs.notatka('');
    if ($('#nKosz')) $('#nKosz').onclick = () => { S.notKosz = !kosz; Views.notatki(); };
    szukajNaZywo($('#q'), () => Views.notatki());
    view.querySelectorAll('[data-u]').forEach(b => b.onclick = e => { e.stopPropagation(); Dialogs.device(b.dataset.u); });
    view.querySelectorAll('[data-nt]').forEach(a => a.onclick = e => { if (e.target.closest('.thumbs')) return; Dialogs.notatkaOkno(a.dataset.nt); });   // od 1.33.0: otwarcie notatki
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
    view.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:10px"><h1 class="grow" style="margin:0">Zdjęcia z budowy (${wszystkie.length})</h1>${Session.isBiuro() && lista.length ? `<button class="btn" id="gMini" title="Archiwum ZIP ze zdjęciami z wybranej zakładki w zmniejszonej rozdzielczości (800 px)">${ic('download')} Pobierz miniatury (${lista.length})</button>` : ''}</div>
      <div class="tabs">${[['all', 'Wszystkie', wszystkie.length], ['urz', 'Urządzenia', n('urz')], ['brak', 'Braki', n('brak')], ['notatka', 'Notatki', n('notatka')]].map(([k, l, c]) => `<button class="tab ${k === filtr ? 'on' : ''}" data-fl="${k}">${l} ${c}</button>`).join('')}</div>
      ${groupBy(lista.slice(0, ile), f => U.day(f.ts)).map(([d, arr]) => `<h2>${new Date(d + 'T12:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        <div class="gal">${arr.map(f => { const o = opisZdjecia(f, F); return `<button class="gph" data-g="${U.esc(f.fid)}"><span class="gimg" data-gi="${U.esc(f.fid)}">zdjęcie na Dysku</span><span class="gcap"><b>${U.esc(o.t)}</b>${o.s ? `<span>${U.esc(o.s)}</span>` : ''}<span class="m">${U.esc(f.kto)} · ${U.fmt(f.ts)}</span></span>${f.urz && maPozycje(f.urz) ? `<span class="gnav" role="button" tabindex="0" data-gr="${U.esc(f.urz)}" title="Pokaż ${U.esc(f.urz)} na rzucie" aria-label="Na rzucie">${ic('cel')}</span>` : ''}</button>`; }).join('')}</div>`).join('') || '<p class="mute">Brak zdjęć.</p>'}
      ${lista.length > ile ? `<div class="row" style="margin-top:14px"><button class="btn grow" id="gMore">Pokaż kolejne (${lista.length - ile})</button></div>` : ''}
      <p class="mute">Pełna rozdzielczość tylko dla zdjęć z tego tabletu – pozostałe pobierane w podglądzie pomniejszonym.</p>`;
    view.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => UI.go('zdjecia', { f: b.dataset.fl }));
    if ($('#gMini')) $('#gMini').onclick = () => Foto.pobierzMiniatury(lista, filtr);
    if ($('#gMore')) $('#gMore').onclick = () => UI.go('zdjecia', { ...par, ile: ile + 40 });
    view.querySelectorAll('[data-gr]').forEach(b => b.onclick = e => { e.stopPropagation(); pokazNaRzucie(b.dataset.gr); });
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
    // rzuty od najniższego poziomu do najwyższego (od 1.15.0)
    const sheets = [...new Set(urz.map(u => u.arkusz).filter(Boolean))].sort((a, b) => (poziomNr(kondArkusza(a, urz)) - poziomNr(kondArkusza(b, urz))) || natCmp(a, b));
    const mode = par.mode || 'rzut';
    const ark = sheets.includes(par.ark) ? par.ark : mode === 'lista' ? '' : sheets[0] || '';
    const biuro = Session.isBiuro();
    // zbiorcze zaznaczanie (od 1.47.0, rola biuro, widok listy): wybór urządzeń → kroki / nr seryjny dla wszystkich naraz
    if (ZB.kod !== S.kod) { ZB.kod = S.kod; ZB.on = false; ZB.sel.clear(); }
    const zb = biuro && mode === 'lista' && ZB.on;
    const arkBtn = (a, on) => `<button class="tab tpoz ${on ? 'on' : ''}" data-a="${U.esc(a)}">${U.esc(poziomTxt(kondArkusza(a, urz)))}<span class="tsub">${U.esc(a)}</span></button>`;
    const filt = par.f || 'all';
    const sOf = u => devStatus(u, F);
    // sortowanie listy (od 1.14.0): ID ELWIS albo oznaczenie z projektu – zawsze w grupach kondygnacji; wybór zapamiętany na tablecie
    const sortUrz = par.s || (await DB.get('sortUrz')) || 'id';
    const q = U.norm(par.q || '');
    // system (od 1.31.0): wybór z listy rozwijanej – urządzenia, które w kolumnie System mają ID tej szafy; „-” = bez systemu
    const sysF = par.sys || '';
    const systemy = [...new Set(urz.flatMap(u => sysList(u)))].sort(natCmp);
    const wSys = u => !sysF || (sysF === '-' ? !sysList(u).length : sysList(u).includes(sysF));
    // ikonki na liście (od 1.32.2): otwarty brak i zdjęcia urządzenia (także zdjęcia jego braków)
    const nBrak = {}, nFoto = {};
    Object.values(F.braki).forEach(b => { if (!b.urz) return; if (!b.zamk) nBrak[b.urz] = (nBrak[b.urz] || 0) + 1; if (b.foto && b.foto.length) nFoto[b.urz] = (nFoto[b.urz] || 0) + b.foto.length; });
    Object.entries(F.dev).forEach(([id, st]) => { if (st.foto && st.foto.length) nFoto[id] = (nFoto[id] || 0) + st.foto.length; });
    const uIkony = id => (nBrak[id] || nFoto[id] || (F.dev[id] && F.dev[id].front)) ? `<span class="uico">${F.dev[id] && F.dev[id].front ? `<span class="ui-front" title="Otworzył się front – brak usunięty, można wrócić do pracy">${ic('front')}</span>` : ''}${nBrak[id] ? `<span class="ui-brak" title="${nBrak[id]} ${odm(nBrak[id], 'otwarty brak', 'otwarte braki', 'otwartych braków')}">${ic('warn')}${nBrak[id] > 1 ? `<small>${nBrak[id]}</small>` : ''}</span>` : ''}${nFoto[id] ? `<span class="ui-foto" title="${nFoto[id]} ${odm(nFoto[id], 'zdjęcie', 'zdjęcia', 'zdjęć')}">${ic('cam')}${nFoto[id] > 1 ? `<small>${nFoto[id]}</small>` : ''}</span>` : ''}</span>` : '';
    const vis = urz.filter(wSys).filter(u => mode !== 'lista' || !ark || u.arkusz === ark).filter(u => filt === 'all' || (filt === 'todo' ? sOf(u) !== 'gotowe' : filt === 'brak' ? sOf(u) === 'brak' : filt === 'front' ? !!(F.dev[u.id] && F.dev[u.id].front) : filt === 'rozp0' ? nicNieWpisano(u, F) : filt.startsWith('p:') ? protZnacznik(u.id, F).k === filt.slice(2) : U.prefix(u.id) === filt))
      .filter(u => !q || U.norm([u.id, u.oz, u.typ, u.grupa, u.uwagi, u.sn, u.sys].join(' ')).includes(q));
    const posort = arr => arr.slice().sort((a, b) => sortUrz === 'oz' ? (natCmp(a.oz || '~', b.oz || '~') || natCmp(a.id, b.id)) : natCmp(a.id, b.id));
    const maOz = urz.some(u => u.oz);
    const prefixes = [...new Set(urz.map(u => U.prefix(u.id)))];
    wstawWidok(etapSwitch() + `
      <div class="ubar">
      <div class="row" style="margin-bottom:${mode === 'lista' ? 8 : 0}px">
        <div class="tabs grow ubtn" style="margin:0">${['rzut', 'lista'].map(m => `<button class="tab ${m === mode ? 'on' : ''}" data-m="${m}">${m === 'rzut' ? 'Rzut' : 'Lista'}</button>`).join('')}
        <span style="width:8px;flex:none"></span>
        <label class="tsel ${sysF ? 'on' : ''}"><span hidden>System</span><select id="uSys" aria-label="System">
          <option value="">Wszystkie systemy</option><optgroup label="System (szafa / rozdzielnica)">${systemy.map(x => `<option value="${U.esc(x)}" ${x === sysF ? 'selected' : ''}>${U.esc(idOz(x))} (${urz.filter(u => sysList(u).includes(x)).length})</option>`).join('')}
</optgroup>
          <option value="-" ${sysF === '-' ? 'selected' : ''}>Bez systemu (${urz.filter(u => !sysList(u).length).length})</option></select></label>
        <label class="tsel ${filt !== 'all' ? 'on' : ''}"><span hidden>Filtr</span><select id="uFil" aria-label="Filtr">${[['all', 'Wszystkie urządzenia'], ['todo', 'Do zrobienia'], ['brak', 'Z brakiem'], ['rozp0', 'Do rozp.'], ['front', 'Otw. f.'], ...(Prot.wszystkie().length ? [['p:do', 'Bez protokołu'], ['p:rob', 'Protokół roboczy'], ['p:ok', 'Z protokołem']] : [])].map(([k, l]) => `<option value="${U.esc(k)}" ${k === filt ? 'selected' : ''}>${U.esc(l)}</option>`).join('')}
          <optgroup label="Typ urządzenia">${prefixes.map(x => `<option value="${U.esc(x)}" ${x === filt ? 'selected' : ''}>${U.esc(typOf(x + '1').nazwa)}</option>`).join('')}</optgroup></select></label>
</div>
        ${biuro ? '<button class="tab pri" id="uAdd" title="Dodaj urządzenie (tylko rola biuro)" style="flex:none">+ Dodaj<span class="szer"> urządzenie</span></button>' : ''}
      </div>
      ${mode === 'lista' && sheets.length > 1 ? `<div class="tabs" style="margin:8px 0 0"><button class="tab tpoz ${!ark ? 'on' : ''}" data-a="">Wszystkie poziomy<span class="tsub">${sheets.length} rzutów</span></button>${sheets.map(a => arkBtn(a, a === ark)).join('')}</div>` : ''}
      ${mode === 'lista' ? `<div class="row">
        <label class="search grow" style="margin:0"><span hidden>Szukaj urządzenia</span><input type="search" id="uq" value="${U.esc(par.q || '')}" placeholder="ID, oznaczenie z projektu, typ, nr seryjny" autocomplete="off"></label>
        <div class="seg2" role="group" aria-label="Sortowanie"><span class="mute">Sortuj:</span><button class="tab ${sortUrz === 'id' ? 'on' : ''}" data-s="id">ID ELWIS</button><button class="tab ${sortUrz === 'oz' ? 'on' : ''}" data-s="oz" ${maOz ? '' : 'disabled title="Lista nie ma oznaczeń z projektu"'}>Oznaczenie proj.</button></div>
        ${biuro ? `<button class="tab ${zb ? 'on' : ''}" id="uZb" title="Zaznaczanie wielu urządzeń naraz (rola biuro)">${ic('check')} Zaznaczanie</button>` : ''}
      </div>
      ${zb ? `<div class="zbhead row"><button class="btn sm" id="zbAll">Zaznacz widoczne (${vis.length})</button><button class="btn sm" id="zbNone" ${ZB.sel.size ? '' : 'disabled'}>Odznacz wszystko</button><span class="mute grow" style="text-align:right">dotknij wiersz, aby zaznaczyć</span></div>` : ''}` : ''}
      </div>
      ${mode === 'rzut' ? `
        <div class="tabs">${sheets.map(a => arkBtn(a, a === ark)).join('')}</div>
        ${par.wskaz ? `<div class="wskazbar">${ic('plus')} <b class="grow">${par.wskaz.urz ? `Dotknij miejsce urządzenia ${U.esc(idOz(par.wskaz.urz))} na rzucie ${U.esc(ark)}${sheets.length > 1 ? ' – inny rzut wybierz wyżej' : ''}` : `Dotknij miejsce nowego urządzenia na rzucie ${U.esc(ark)}`}</b><button class="btn sm" id="wAnul">Anuluj</button></div>` : ''}
        <div class="planbox"><div class="plan" id="plan"><div class="noplan" id="noplan">Ładuję rzut…</div>
          <div class="planctl"><button id="zin" aria-label="Powiększ">+</button><button id="zout" aria-label="Pomniejsz">−</button><button id="zfit" aria-label="Cały rzut">⤢</button></div></div>
          <div class="side">${legend(urz.filter(u => u.arkusz === ark), F)}${attention(urz.filter(u => u.arkusz === ark), F)}</div></div>`
        : `<div class="list" id="wyn" style="margin-top:10px">${groupBy(vis.slice().sort((a, b) => (poziomNr(a.kond) - poziomNr(b.kond)) || natCmp(a.arkusz || '', b.arkusz || '')), u => u.kond + '\u0001' + u.arkusz).map(([g, arr]) => `<div class="li lgrp">${U.esc(poziomTxt(arr[0].kond))} <span class="mute">${U.esc(arr[0].arkusz || '')} (${arr.length})</span></div>` + posort(arr).map(u => `
            <button class="li${zb && ZB.sel.has(u.id) ? ' zbon' : ''}" data-u="${U.esc(u.id)}">${zb ? `<span class="zbchk">${ZB.sel.has(u.id) ? ic('check') : ''}</span>` : ''}<span class="st ${ST[sOf(u)]}"></span><span class="uid">${sortUrz === 'oz' && u.oz ? `<b>${U.esc(u.oz)}</b><span class="mute m">${U.esc(u.id)}</span>` : `<b>${U.esc(u.id)}</b>${u.oz ? `<span class="oz">${U.esc(u.oz)}</span>` : ''}`}</span><span class="grow">${U.esc(u.typ)}<br><span class="mute">${U.esc(u.grupa)}${u.uwagi ? ' · ' + U.esc(u.uwagi) : ''}</span></span>${(z => z.k ? `<span class="pmark ${z.k}">${U.esc(z.t)}</span>` : '')(protZnacznik(u.id, F))}${u.x === '' || u.x == null ? `<span class="btn sm bezpoz" role="button" tabindex="0" data-poz="${U.esc(u.id)}" title="Urządzenie nie ma pozycji na rzucie">${ic('pin')} Ustaw na rzucie</span>` : ''}${uIkony(u.id)}<span class="mute m">${progress(u, F)}</span></button>`).join('')).join('') || '<div class="li mute">Brak urządzeń dla filtra.</div>'}</div>`}
      ${mode === 'rzut' && !sheets.length ? '<p class="mute">Brak urządzeń w tym etapie.</p>' : ''}
      ${zb ? zbPasek(urz) : ''}`, '#wyn');
    bindEtap();
    view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => UI.go('rzut', { ...par, mode: b.dataset.m }));
    $('#uFil').onchange = e => UI.go('rzut', { ...par, f: e.target.value });
    $('#uSys').onchange = e => UI.go('rzut', { ...par, sys: e.target.value });
    view.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => { await DB.set('sortUrz', b.dataset.s); UI.go('rzut', { ...par, s: b.dataset.s }); });
    if ($('#uq')) szukajNaZywo($('#uq'), () => Views.rzut(UI.par));
    view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => UI.go('rzut', { ...par, ark: b.dataset.a, focus: null, wskaz: par.wskaz && par.wskaz.urz ? { urz: par.wskaz.urz } : null }));
    // urządzenie bez pozycji na rzucie (od 1.30.0): „Ustaw na rzucie” → tryb wskazywania dla tego urządzenia
    view.querySelectorAll('[data-poz]').forEach(b => b.onclick = e => { e.stopPropagation(); const u = urz.find(x => x.id === b.dataset.poz) || {};
      UI.go('rzut', { ...par, mode: 'rzut', ark: sheets.includes(u.arkusz) ? u.arkusz : sheets[0], wskaz: { urz: u.id }, focus: null }); });
    // dodanie urządzenia – rola biuro (od 1.15.0): na rzucie najpierw wskazanie miejsca, na liście od razu formularz
    if ($('#uAdd')) $('#uAdd').onclick = () => mode === 'rzut' && ark ? UI.go('rzut', { ...par, wskaz: { ark } }) : Dialogs.noweUrz({ ark });
    if ($('#wAnul')) $('#wAnul').onclick = () => UI.go('rzut', { ...par, wskaz: null });
    view.querySelectorAll('[data-u]').forEach(b => b.onclick = () => {
      if (!zb) return Dialogs.device(b.dataset.u);
      const id = b.dataset.u, on = !ZB.sel.has(id); on ? ZB.sel.add(id) : ZB.sel.delete(id);   // bez przerysowania listy – zostaje miejsce przewinięcia
      b.classList.toggle('zbon', on); b.querySelector('.zbchk').innerHTML = on ? ic('check') : ''; zbOdswiezPasek(urz);
    });
    if ($('#uZb')) $('#uZb').onclick = () => { ZB.on = !ZB.on; if (!ZB.on) ZB.sel.clear(); Views.rzut(UI.par); };
    const zbZnaki = () => { view.querySelectorAll('.li[data-u]').forEach(r => { const on = ZB.sel.has(r.dataset.u); r.classList.toggle('zbon', on); const c = r.querySelector('.zbchk'); if (c) c.innerHTML = on ? ic('check') : ''; }); zbOdswiezPasek(urz); };
    if ($('#zbAll')) $('#zbAll').onclick = () => { vis.forEach(u => ZB.sel.add(u.id)); zbZnaki(); };
    if ($('#zbNone')) $('#zbNone').onclick = () => { ZB.sel.clear(); zbZnaki(); };
    if (zb) zbPodepnij(urz);
    if (mode === 'rzut' && ark) {
      const fid = (pd.rzuty || {})[ark];
      const f = fid && await DB.getFile(fid);
      if (!f) { $('#noplan').textContent = 'Brak rzutu ' + ark + ' w pamięci tabletu. Połącz się z WiFi i zsynchronizuj (plik „' + ark + '.jpg” w folderze Do wglądu).'; return; }
      $('#noplan').remove();
      const marks = vis.filter(u => u.arkusz === ark && u.x !== '' && u.x != null).map(u => ({ id: u.id, x: +u.x, y: +u.y, cls: ST[sOf(u)], label: idOz(u) + ' – ' + sOf(u) }));
      // przytrzymanie znacznika i przesunięcie = zmiana pozycji z potwierdzeniem (od 1.30.0)
      const pv = PlanView($('#plan'), URL.createObjectURL(f.blob), marks, id => Dialogs.device(id),
        { onMove: (id, x, y, wroc, ok) => Dialogs.pozycja(id, { x, y, ark }, wroc, ok) }); pv.ark = ark; UI.pv = pv;
      $('#zin').onclick = () => pv.zoomIn(); $('#zout').onclick = () => pv.zoomOut(); $('#zfit').onclick = () => pv.fit();
      if (par.focus) setTimeout(() => pv.focus(par.focus), 300);
      if (par.wskaz) pv.wskaz((x, y) => {
        if (par.wskaz.urz) { const id = par.wskaz.urz; Dialogs.pozycja(id, { x, y, ark, nowa: true }, () => {}, () => UI.go('rzut', { ...par, wskaz: null, focus: id })); return; }
        pv.wskaz(null); Dialogs.noweUrz({ ...par.wskaz, ark, x, y }); });
    }
  },

  /* Braki i tematy */
  braki(par) {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.kod + ' · braki', () => UI.wstecz('budowa'));
    const F = fold(S.ev); const showClosed = par.closed;
    const fo = par.odp || '';   // filtr odpowiedzialnego (od 1.52.0)
    const br0 = Object.values(F.braki).filter(b => (showClosed ? b.zamk : !b.zamk) && brakWEtapie(b));
    const br = br0.filter(b => !fo || (fo === '-' ? !b.odp : b.odp === fo)).sort((a, b) => a.ts < b.ts ? 1 : -1);
    const temE = t => { if (!maEtapy() || !S.etap || !t.urz) return true; const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === t.urz); return !u || u.etap === S.etap; };
    const tem = ((S.proj || {}).tematy || []).filter(t => (showClosed ? t.status === 'zamknięty' : t.status !== 'zamknięty') && temE(t));
    view.innerHTML = etapSwitch() + `
      <div class="row"><div class="tabs grow" style="margin:0"><button class="tab ${!showClosed ? 'on' : ''}" data-c="0">Otwarte</button><button class="tab ${showClosed ? 'on' : ''}" data-c="1">Zamknięte</button></div>
        <button class="btn bad" id="nb">+ Zgłoś brak</button></div>
      <div class="grid2" style="margin-top:12px">
        <div class="stack"><div class="row" style="flex-wrap:wrap;gap:10px"><h2 style="margin:0">Braki z budowy (${br.length})</h2><label class="tsel ${fo ? 'on' : ''}"><span hidden>Odpowiedzialny</span><select id="bOdp" aria-label="Odpowiedzialny">${[['', 'Odpowiedzialny: wszyscy'], ...odpLista().map(k => [k, k]), ...(br0.some(b => !b.odp) ? [['-', 'Bez odpowiedzialnego']] : [])].map(([k, l]) => `<option value="${U.esc(k)}" ${k === fo ? 'selected' : ''}>${U.esc(l)} (${br0.filter(b => !k || (k === '-' ? !b.odp : b.odp === k)).length})</option>`).join('')}</select></label></div>${br.map(issueHtml).join('') || '<p class="mute">Brak.</p>'}</div>
        ${!Session.isBiuro() ? '' : `<div class="stack"><h2>Tematy do wyjaśnienia (${tem.length})</h2>${tem.map(t => `<div class="card"><div class="row"><b>${U.esc(t.urz || t.id)}</b><span class="chip">${U.esc(t.kat || 'Do wyjaśnienia')}</span></div><div>${U.esc(t.opis)}</div></div>`).join('') || '<p class="mute">Brak.</p>'}<p class="mute">Tematy widzi tylko biuro; prowadzone w liście urządzeń → Tematy.</p></div>`}
      </div>`;
    bindEtap();
    view.querySelectorAll('[data-c]').forEach(b => b.onclick = () => UI.go('braki', { closed: b.dataset.c === '1', odp: fo }));
    $('#bOdp').onchange = e => UI.go('braki', { closed: showClosed, odp: e.target.value });
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

let ppScroll = 0;   // przewinięcie paska osób w planie „Wszyscy” (od 1.23.2)

/* System (od 1.25.0, schemat 1.9): kolumna „System” = ID urządzenia sterującego (szafy), kilka przez średnik */
const sysList = u => String((u && u.sys) || '').split(';').map(x => x.trim()).filter(Boolean);
function sysHtml(u) {
  const sy = sysList(u); if (!sy.length) return '';
  const all = (S.proj && S.proj.urzadzenia) || [];
  return sy.map(s => {
    if (s === u.id) {   // szafa / sterownik – podsumowanie jego systemu
      const czl = all.filter(x => x.id !== u.id && sysList(x).includes(s));
      const L = liczBudowy(czl, fold(S.ev));
      return `<div style="grid-column:1/3"><div class="mute">System ${U.esc(s)}</div>${czl.length ? `${czl.length} ${odm(czl.length, 'urządzenie', 'urządzenia', 'urządzeń')} · podłączone ${L.p} / ${L.w} · uruchomione ${L.u}${pasek3(L, true)}` : 'brak przypisanych urządzeń'}</div>`;
    }
    const st = all.find(x => x.id === s);
    return `<div style="grid-column:1/3"><div class="mute">System</div><button class="btn sm" data-sys="${U.esc(s)}">${U.esc(s)}${st && st.oz ? ' · ' + U.esc(st.oz) : ''}${st ? ' – ' + U.esc(typOf(s).nazwa || '') : ''}</button></div>`;
  }).join('');
}

/* Liczniki budowy (od 1.23.0) – te same zasady co na serwerze (przelicz_) */
/* Lista budów przewijana w sobie (od 1.26.0): wysokość od górnej krawędzi listy do dolnego paska skrótów, min. 280 px */
function dopasujListeBudow() {
  const el = document.getElementById('blist'); if (!el) return;
  const nav = document.querySelector('.bnav:not([hidden])'), m = el.closest('main');
  const dol = Math.max(nav ? nav.getBoundingClientRect().height + 12 : 0, m ? parseFloat(getComputedStyle(m).paddingBottom) || 0 : 0);   // dolny margines strony (miejsce na pasek)
  const top = el.getBoundingClientRect().top + window.scrollY;
  el.style.maxHeight = Math.max(280, window.innerHeight - top - dol) + 'px';
}
window.addEventListener('resize', () => { if (UI.cur === 'home') dopasujListeBudow(); });
/* Zapotrzebowanie – pomocnicze (od 1.48.0) */
const ZAK_KL = { nowe: 'warn', realizacja: '', dostarczone: 'ok', odrzucone: 'bad' };
function zakBud(kod) { if (!kod) return 'Zakupy ogólne (AKPiA)'; const p = ((S.boot && S.boot.projekty) || []).find(x => x.kod === kod); return p ? (p.nazwa && p.nazwa.indexOf(kod) === 0 ? p.nazwa : kod + ' ' + (p.nazwa || '')) : kod; }
function zakChip(z) {   // stan zgłoszenia ze statusów pozycji
  const n = z.poz.length, c = k => z.poz.filter(x => x.st === k).length;
  if (c('nowe') === n) return '<span class="chip warn">Nowe</span>';
  if (c('dostarczone') === n) return '<span class="chip ok">Dostarczone</span>';
  if (c('odrzucone') === n) return '<span class="chip bad">Odrzucone</span>';
  if (c('dostarczone') + c('odrzucone') === n) return `<span class="chip ok">Zakończone</span>`;
  return `<span class="chip">W realizacji${c('dostarczone') ? ` · ${c('dostarczone')}/${n} dostarcz.` : ''}</span>`;
}
function zakKarta(z) {
  return `<button class="card zkarta" data-zk="${U.esc(z.nr || z.id)}">
    <span class="row">${zakChip(z)}<b class="m zknr">${z.nr ? U.esc(z.nr) : '<span class="mute">czeka na wysłanie</span>'}</b><span class="grow"></span><span class="mute">${U.esc(z.kto)} · ${U.fmt(z.ts)}</span></span>
    <span class="zkbud">${U.esc(zakBud(z.kod))}</span>
    <span class="zpozl">${z.poz.slice(0, 5).map(x => `<span class="row" style="gap:8px"><span class="zst ${x.st}" title="${ZAK_ST[x.st]}"></span><b>${U.esc(x.n)}</b> <span class="m">${U.esc(String(x.il).replace('.', ','))} ${U.esc(x.j || '')}</span></span>`).join('')}${z.poz.length > 5 ? `<span class="mute">+ ${z.poz.length - 5} poz.</span>` : ''}</span>
    ${z.uwagi ? `<span class="mute">${U.esc(z.uwagi)}</span>` : ''}</button>`;
}
async function zakMiniatury(el, z) {
  el.innerHTML = '';
  for (const fid of z.foto || []) {
    const lok = await DB.get('zakFoto:' + fid);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip fotochip';
    if (lok) { b.className = ''; const im = new Image(); im.src = URL.createObjectURL(lok.blob); im.alt = 'zdjęcie'; b.appendChild(im); b.onclick = () => zakPodglad(lok.blob); }
    else { b.textContent = '📷 zdjęcie'; b.onclick = async () => { if (!z.nr) return UI.toast('Zdjęcie jeszcze niewysłane.'); try { UI.toast('Pobieram zdjęcie…'); const r = await API.zakupy({ foto: { fid, zid: z.nr } }); if (!r.ok) throw new Error(r.error); const bl = U.b64ToBlob(r.b64, r.mime); await DB.set('zakFoto:' + fid, { blob: bl, zid: z.nr }); zakPodglad(bl); } catch (e) { UI.toast(e.message || 'Brak sieci'); } }; }
    el.appendChild(b);
  }
}
function zakPodglad(blob) {
  const w = document.createElement('div'); w.className = 'fotoview';
  w.innerHTML = '<div class="fvbar"><span class="grow">Zapotrzebowanie – zdjęcie</span><button class="btn sm" id="zfvX">✕ Zamknij</button></div><div class="fvimg"></div>';
  const im = new Image(); im.src = URL.createObjectURL(blob); w.querySelector('.fvimg').appendChild(im);
  document.body.appendChild(w); w.querySelector('#zfvX').onclick = () => w.remove();
}

/* Zbiorcze zaznaczanie urządzeń (od 1.47.0, rola biuro): wybór na liście → kroki zaznaczone / odznaczone i opcjonalnie wspólny nr seryjny.
   Tablet zapisuje zwykłe zdarzenia `krok` i `nr` (d.zb = 1 – oznaczenie wpisu zbiorczego), także offline; serwer przelicza status jak zwykle. */
const ZB = { kod: null, on: false, sel: new Set(), akcja: 'on', kroki: null, war: {}, sn: '' };
function zbWybrane(urz) { return urz.filter(u => ZB.sel.has(u.id)); }
function zbTypy(wyb) { return [...new Set(wyb.map(u => U.prefix(u.id)))]; }
function zbPasek(urz) {   // zwarty pasek na dole listy; opcje w oknie „Dalej”
  const n = zbWybrane(urz).length;
  return `<div class="zbbar" id="zbBar"><b class="grow">${n ? `Zaznaczono: ${n} ${odm(n, 'urządzenie', 'urządzenia', 'urządzeń')}` : '<span class="mute">Dotknij urządzenia na liście</span>'}</b>${n ? '<button class="btn sm" id="zbClr">Wyczyść</button>' : ''}<button class="btn pri" id="zbGo" ${n ? '' : 'disabled'}>Dalej: kroki / nr ›</button></div>`;
}
function zbPodepnij(urz) {
  const bar = $('#zbBar'); if (!bar) return;
  if ($('#zbClr')) $('#zbClr').onclick = () => { ZB.sel.clear(); view.querySelectorAll('.li.zbon').forEach(r => { r.classList.remove('zbon'); r.querySelector('.zbchk').innerHTML = ''; }); zbOdswiezPasek(urz); };
  $('#zbGo').onclick = () => zbOkno(urz);
}
function zbOdswiezPasek(urz) { const b = $('#zbBar'); if (!b) return; b.outerHTML = zbPasek(urz); zbPodepnij(urz); const z = $('#zbNone'); if (z) z.disabled = !ZB.sel.size; }
/* okno zbiorczej zmiany: akcja, kroki (jeden typ), warianty, wspólny nr seryjny, ostrzeżenia, Zastosuj z potwierdzeniem */
function zbOkno(urz) {
  const F = fold(S.ev), wyb = zbWybrane(urz), typy = zbTypy(wyb), jeden = typy.length === 1 ? typOf(typy[0] + '1') : null;
  if (jeden && (!ZB.kroki || ZB.kroki.typ !== typy[0])) ZB.kroki = { typ: typy[0], i: new Set(jeden.kroki.map((_, i) => i)) };
  const idxTypu = t => jeden ? [...ZB.kroki.i].sort((a, b) => a - b) : t.kroki.map((_, i) => i);
  const on = ZB.akcja === 'on';
  const warianty = on ? typy.flatMap(pre => { const t = typOf(pre + '1'); return idxTypu(t).map(i => ({ pre, i, kr: U.krok(t.kroki[i]), t })).filter(x => x.kr.op.length); }) : [];
  const bezSn = on && !ZB.sn.trim() ? wyb.filter(u => typOf(u.id).sn && !((F.dev[u.id] && F.dev[u.id].sn) || u.sn)).length : 0;
  modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Zbiorcza zmiana">
    <div class="shead"><h3>Zbiorczo: ${wyb.length} ${odm(wyb.length, 'urządzenie', 'urządzenia', 'urządzeń')}</h3><button class="btn sm" id="zx">✕</button></div>
    <div class="sbody stack zbokno">
      <div class="mute" style="font-size:13px">${U.esc(wyb.slice(0, 30).map(u => idOz(u.id)).join(', '))}${wyb.length > 30 ? ' …' : ''}</div>
      <div class="tabs" style="margin:0"><button class="tab ${on ? 'on' : ''}" data-ak="on">Zaznacz kroki</button><button class="tab ${!on ? 'on' : ''}" data-ak="off">Odznacz kroki</button></div>
      ${jeden ? `<div><div class="lbl">Kroki – ${U.esc(jeden.nazwa)}</div><div class="zbkroki">${jeden.kroki.map((k, i) => `<button class="chip ${ZB.kroki.i.has(i) ? 'ok' : 'gr'} chipic" data-zk="${i}">${ZB.kroki.i.has(i) ? ic('check') : ''}${U.esc(U.krok(k).n)}</button>`).join('')}</div></div>`
        : `<div class="mute" style="font-size:13px">Różne typy (${typy.length}) – ${on ? 'zaznaczone' : 'odznaczone'} zostaną wszystkie kroki każdego typu. Pojedyncze kroki – gdy wybierzesz urządzenia jednego typu (np. filtr typu na liście).</div>`}
      ${warianty.map(x => `<label class="fld"><span class="mute">${U.esc(x.t.nazwa)} – ${U.esc(x.kr.n)}</span><select data-zw2="${x.pre}:${x.i}"><option value="">— wybierz wariant —</option>${x.kr.op.map(o => `<option ${ZB.war[x.pre + ':' + x.i] === o ? 'selected' : ''}>${U.esc(o)}</option>`).join('')}</select></label>`).join('')}
      ${on ? `<label class="fld"><span class="mute">Nr seryjny wspólny (opcjonalnie – tylko tam, gdzie brak numeru)</span><input id="zbSn" type="text" value="${U.esc(ZB.sn)}" placeholder="np. poza dost. HB" autocomplete="off"></label>` : ''}
      ${bezSn ? `<div class="warnbox">${bezSn} ${odm(bezSn, 'urządzenie wymaga', 'urządzenia wymagają', 'urządzeń wymaga')} nr seryjnego i go nie ma – kroki się zaznaczą, numer można dopisać później.</div>` : ''}
    </div>
    <div class="sfoot"><button class="btn" id="zx2">Anuluj</button><button class="btn pri" id="zbOk">Zastosuj</button></div></div></div>`;
  const zamknij = () => UI.close();
  $('#zx').onclick = zamknij; $('#zx2').onclick = zamknij; $('#ov').onclick = e => { if (e.target.id === 'ov') zamknij(); };
  const snNow = () => { if ($('#zbSn')) ZB.sn = $('#zbSn').value; };
  modal.querySelectorAll('[data-ak]').forEach(b => b.onclick = () => { snNow(); ZB.akcja = b.dataset.ak; zbOkno(urz); });
  modal.querySelectorAll('[data-zk]').forEach(b => b.onclick = () => { snNow(); const i = +b.dataset.zk; ZB.kroki.i.has(i) ? ZB.kroki.i.delete(i) : ZB.kroki.i.add(i); zbOkno(urz); });
  modal.querySelectorAll('[data-zw2]').forEach(sel => sel.onchange = () => { ZB.war[sel.dataset.zw2] = sel.value; });
  if ($('#zbSn')) $('#zbSn').oninput = () => { snNow(); const w = modal.querySelector('.zbokno .warnbox'); if (w) w.hidden = !!ZB.sn.trim(); };   // bez przerysowania okna (pole traci fokus)
  $('#zbOk').onclick = async () => {
    snNow();
    const F = fold(S.ev), sn = on ? ZB.sn.trim() : '';
    const plan = []; let brakWar = '';
    for (const u of wyb) {
      const t = typOf(u.id), pre = U.prefix(u.id), st = F.dev[u.id] || { kroki: {} };
      for (const i of idxTypu(t)) {
        const kr = U.krok(t.kroki[i]), s = (st.kroki || {})[i];
        if (!on) { if (s && s.val) plan.push([u.id, 'krok', { krok: i, nazwa: kr.n, wart: false, zb: 1 }]); continue; }
        if (kr.op.length) {
          const w = ZB.war[pre + ':' + i]; if (!w) { brakWar = t.nazwa + ' – ' + kr.n; continue; }
          if (!(s && s.val && s.war === w)) plan.push([u.id, 'krok', { krok: i, nazwa: kr.n + ' – ' + w, wart: w, zb: 1 }]);
        } else if (!(s && s.val)) plan.push([u.id, 'krok', { krok: i, nazwa: t.kroki[i], wart: true, zb: 1 }]);
      }
      if (sn && !(st.sn || u.sn)) plan.push([u.id, 'nr', { sn, zb: 1 }]);   // wspólny numer tylko tam, gdzie go nie ma – nie nadpisuje prawdziwych numerów
    }
    if (brakWar) return UI.toast('Wybierz wariant: ' + brakWar);
    if (!plan.length) return UI.toast(on ? 'Nic do zmiany – wybrane kroki są już zaznaczone.' : 'Nic do zmiany – wybrane kroki nie są zaznaczone.');
    const nU = new Set(plan.map(x => x[0])).size, nK = plan.filter(x => x[1] === 'krok').length, nN = plan.filter(x => x[1] === 'nr').length;
    if (!confirm(`${on ? 'Zaznaczyć' : 'Odznaczyć'} kroki w ${nU} ${odm(nU, 'urządzeniu', 'urządzeniach', 'urządzeniach')}?\n${nK} ${odm(nK, 'krok', 'kroki', 'kroków')}${nN ? `, nr seryjny „${sn}” w ${nN} ${odm(nN, 'urządzeniu', 'urządzeniach', 'urządzeniach')}` : ''}.\nWpis zbiorczy: ${S.user.name}. Zmiany zostaną w historii (cofnięcie = odznaczenie).`)) return;
    UI.close(); UI.toast('Zapisuję…');
    for (const [id, typ, d] of plan) await addEvent(typ, id, d);
    ZB.sel.clear(); UI.toast(`Zapisano: ${nK} ${odm(nK, 'krok', 'kroki', 'kroków')}${nN ? ` i ${nN} nr seryjnych` : ''} w ${nU} ${odm(nU, 'urządzeniu', 'urządzeniach', 'urządzeniach')}`);
    const y = window.scrollY; await Views.rzut(UI.par); window.scrollTo(0, y);
  };
}
/* Liczniki budów z danych na tablecie (od 1.25.1): każda budowa zapisana na tablecie (proj:+kod i jej zdarzenia) – nie tylko otwarta.
   Wynik łączony z licz z serwera; czas/autor ostatniej zmiany – nowszy z dwóch. Pamięć 15 s, żeby wyszukiwanie nie liczyło przy każdej literze. */
const LICZ_PAM = {};
async function liczLokalne(projekty) {
  const m = {};
  for (const p of projekty) {
    const kod = p.kod; let L = null;
    if (kod === S.kod && S.proj) L = liczZdarzen(S.proj.urzadzenia || [], S.ev || []);
    else {
      const c = LICZ_PAM[kod];
      if (c && Date.now() - c.at < 15000) L = c.L;
      else {
        try { const pr = await DB.get('proj:' + kod);
          if (pr && pr.urzadzenia) { const ev = await DB.eventsFor(kod); L = liczZdarzen(urzZNowymi(pr.urzadzenia, ev), ev); } } catch (e) { L = null; }
        LICZ_PAM[kod] = { at: Date.now(), L };
      }
    }
    const sv = p.licz || null;
    if (!L) { m[kod] = sv; continue; }
    const o = Object.assign({}, sv || {}, L);
    if (sv && sv.t && (!L.t || sv.t > L.t)) { o.t = sv.t; o.k = sv.k; o.n = sv.n; }
    m[kod] = o;
  }
  return m;
}
function urzZNowymi(urz, ev) {   // jak dolaczNowe, bez zmiany S
  const lst = (urz || []).filter(u => !u._nowe), ids = new Set(lst.map(u => u.id));
  ev.filter(e => e.typ === 'urz_nowe').forEach(e => { const d = e.d || {}, id = e.urz || d.tmp; if (!id || ids.has(id)) return; ids.add(id); lst.push({ id }); });
  return lst;
}
function liczZdarzen(urz, ev) {
  const L = liczBudowy(urz, fold(ev));
  if (ev.length) {
    const s = ev.map(e => e.ts).filter(Boolean).sort(), t = s[s.length - 1];
    if (t) { const last = ev.find(e => e.ts === t); L.t = t; L.k = last && last.kto || ''; L.n = s.filter(x => U.day(x) === U.day(t)).length; }
  }
  return L;
}
/* Urządzenie rozpoczęte (od 1.35.1 wspólna reguła listy budów i filtra „Do rozp.”): ≥1 krok albo nr seryjny */
function rozpoczete(u, F) {
  const st = F.dev[u.id]; if ((st && st.sn) || u.sn) return true;
  return (typOf(u.id).kroki || []).some((k, i) => !!(st && st.kroki[i] && st.kroki[i].val));
}
/* Urządzenie „do rozpoczęcia” (od 1.38.0): nic na nim nie wpisano – żadnego kroku, nr seryjnego, zdjęcia, braku (także zamkniętego),
   notatki ani protokołu. Zmiany biura (pozycja, system, edycja danych) się nie liczą. */
function nicNieWpisano(u, F) {
  if (rozpoczete(u, F)) return false;
  const st = F.dev[u.id];
  if (st && st.foto.some(f => !F.usuniete.has(f.fid))) return false;
  if (Object.values(F.braki).some(b => b.urz === u.id)) return false;
  if (F.notes.some(n => n.urz === u.id)) return false;
  return !Object.values(F.prot).some(x => x.urz === u.id);
}
function liczBudowy(urz, F) {
  const L = { u: 0, p: 0, d: 0, w: 0, f: 0, r: 0, nt: F.notes.length, b: Object.values(F.braki).filter(b => !b.zamk).length };
  urz.forEach(u => {
    const kroki = typOf(u.id).kroki || [], st = F.dev[u.id];
    const zrob = kroki.map((k, i) => !!(st && st.kroki[i] && st.kroki[i].val));
    const pk = kroki.map((k, i) => /podłącz/i.test(k) ? i : -1).filter(i => i >= 0);
    L.w++;
    if (nicNieWpisano(u, F)) L.r++;
    if (zrob.some(Boolean) || (st && st.sn) || u.sn) L.d++;
    if (st && st.front) L.f++;   // od 1.33.0: otworzył się front   // od 1.30.0: wpisany nr seryjny = prace rozpoczęte
    if (pk.length ? pk.every(i => zrob[i]) : zrob[0]) L.p++;
    if (kroki.length && zrob.every(Boolean)) L.u++;
  });
  return L;
}
/* Liczniki w kolumnach (od 1.38.0): każda liczba dokładnie nad swoim opisem; grupy oddzielone odstępem */
const kolG = arr => `<span class="kolg">${arr.map(([v, l, c]) => `<span class="kc"><b class="m${c ? ' ' + c : ''}">${v}</b><small>${l}</small></span>`).join('')}</span>`;
const doRozp = L => L.r != null ? L.r : L.w - L.d;   // starszy serwer bez L.r – przybliżenie
const kolDoRozp = (L, zFrontem) => kolG([[doRozp(L), 'do rozp.'], ...(zFrontem ? [[L.f || 0, 'otw. f.', L.f ? 'fr' : '']] : [])]);
const kolPostep = L => kolG([[L.u, 'uruch.'], [L.p, 'podł.'], [L.d, 'rozp.'], [L.w, 'wszystkie']]);
const pasek3 = (L, maly) => { const pr = n => L.w ? Math.round(n / L.w * 100) : 0;
  return `<span class="tbar3${maly ? ' sm' : ''}" title="uruchomione ${pr(L.u)}% · podłączone ${pr(L.p)}% · rozpoczęte ${pr(L.d)}%"><i class="t3" style="width:${pr(L.d)}%"></i><i class="t2" style="width:${pr(L.p)}%"></i><i class="t1" style="width:${pr(L.u)}%"></i></span>`; };
const odmUsterki = n => n === 1 ? 'usterka' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'usterki' : 'usterek';

/* Wyszukiwanie bez zamykania klawiatury (od 1.22.1): przy wpisywaniu odświeżana jest tylko część z wynikami,
   pole wyszukiwania zostaje w DOM (pełne przerysowanie zdejmowało fokus i Android chował klawiaturę po każdej literze). */
function wstawWidok(html, sel) {
  const a = document.activeElement;
  // pole wyszukiwania tego widoku ma fokus (trwa wpisywanie) → podmień tylko wyniki
  if (a && a.type === 'search' && a.id && view.contains(a)) {
    const t = document.createElement('template'); t.innerHTML = html;
    const nowy = t.content.querySelector(sel), stary = view.querySelector(sel);
    if (nowy && stary && t.content.getElementById(a.id)) { stary.replaceWith(nowy); return; }
  }
  view.innerHTML = html;
}
function szukajNaZywo(inp, odswiez) { inp.oninput = () => { UI.par.q = inp.value; odswiez(); }; }

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
    modal.innerHTML = `<div class="ov" id="ov"><div class="sheet" role="dialog" aria-label="Urządzenie ${U.esc(idOz(u))}">
      <div class="shead"><span class="st ${ST[status]}"></span><h3>${U.esc(id)}${u.oz ? ` <span class="oz big">${U.esc(u.oz)}</span>` : ''} <span class="mute" style="font-size:15px">${U.esc(t.nazwa)}</span></h3>${Session.isBiuro() && !czyTmp(id) ? `<button class="btn sm" id="dEd" title="Edytuj dane urządzenia (biuro)">${ic('edit')} Edytuj</button>` : ''}<button class="btn sm binfo2" id="dTy" title="Typy urządzeń – prefiksy, kroki, opis" aria-label="Typy urządzeń">i</button><button class="btn sm" id="dx" aria-label="Zamknij">✕</button></div>
      <div class="sbody">
        ${czyTmp(id) ? '<div class="card mute">Nowe urządzenie dodane na tablecie – numer nada serwer przy synchronizacji.</div>' : ''}
        <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px">
          <div><div class="mute">Typ</div>${U.esc(u.typ)}</div><div><div class="mute">Zasilanie</div>${U.esc(u.zasilanie || '—')}</div>
          <div><div class="mute">Kondygnacja</div>${U.esc(u.kond ? poziomTxt(u.kond) : '—')}</div><div><div class="mute">Arkusz</div>${U.esc(u.arkusz || '—')}</div>
          ${maEtapy() || u.etap ? `<div style="grid-column:1/3"><div class="mute">Etap budowy</div>${U.esc(u.etap ? etapOpis(u.etap) : '— (brak przypisania)')}</div>` : ''}
          ${u.uwagi ? `<div style="grid-column:1/3"><div class="mute">Uwagi</div>${U.esc(u.uwagi)}</div>` : ''}
          ${sysHtml(u)}
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
          return `<button class="step ${done ? 'done' : ''}" data-k="${i}" ${dis ? 'disabled' : ''}><span class="box">${done ? '✓' : ''}</span><span class="grow"><b>${U.esc(U.krok(k).n)}${done && s.war ? ' – ' + U.esc(s.war) : ''}</b><br><span class="mute">${!done && U.krok(k).op.length && !dis ? 'wybierz: ' + U.krok(k).op.map(U.esc).join(' / ') + ' · ' : ''}${done ? U.esc(s.kto) + ' · ' + U.fmt(s.ts) : blocked ? 'Zablokowane: otwarty brak' : needSn ? 'Wymaga nr seryjnego lub zdjęcia tabliczki' : 'do zrobienia'}</span></span></button>`;
        }).join('')}</div></div>
        <div><div class="lbl">Braki (${br.filter(b => !b.zamk).length} otwartych)</div><div class="stack" style="margin-top:8px">${br.map(issueHtml).join('') || '<span class="mute">Brak.</span>'}</div></div>
        <div><div class="lbl">Zdjęcia</div><div class="thumbs" id="thumbs" style="margin-top:8px"></div></div>
        <div><div class="lbl">Historia</div><div class="hist" style="margin-top:8px">${st.hist.slice().reverse().slice(0, 30).map(e => `<div><b>${U.fmt(e.ts)}</b> ${U.esc(e.kto)} – ${U.esc(histTxt(e))}</div>`).join('') || '<span class="mute">Brak wpisów.</span>'}</div></div>
        ${Session.isBiuro() && !czyTmp(id) ? `<div class="card stack admin"><div class="lbl">Administracja (biuro)</div>
          <div class="row" style="flex-wrap:wrap"><span class="grow">System: <b>${U.esc(u.sys || '— brak (autonomiczne)')}</b></span><button class="btn sm" id="aSys">Zmień system</button></div>
          <div class="row" style="flex-wrap:wrap"><span class="grow">Pozycja: <b>${u.x === '' || u.x == null ? 'brak na rzucie' : 'rzut ' + U.esc(u.arkusz || '—')}</b></span><button class="btn sm" id="aPoz">${u.x === '' || u.x == null ? 'Ustaw na rzucie' : 'Ustaw ponownie'}</button><button class="btn sm bad" id="aDel">Usuń urządzenie</button></div></div>` : ''}
      </div>
      <div class="sfoot"><button class="btn bad" id="dBrak">Zgłoś brak</button><button class="btn" id="dFoto">Zdjęcie</button><button class="btn" id="dPlan" title="Pokaż urządzenie na rzucie">${ic('cel')} Na rzucie</button></div>
    </div></div>`;
    modal.querySelectorAll('[data-sys]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.sys));
    modal.querySelectorAll('[data-otw]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.otw));   // od 1.28.0: braki systemu → karta urządzenia
    $('#dx').onclick = UI.close; $('#ov').onclick = e => { if (e.target.id === 'ov') UI.close(); };
    modal.querySelectorAll('.step').forEach(b => b.onclick = async () => {
      const i = +b.dataset.k; const s = st.kroki[i]; const kr = U.krok(t.kroki[i]);
      if (kr.op.length) {   // krok z wariantami (od 1.22.0): wybór wariantu pod krokiem, ponowne dotknięcie – zmiana lub cofnięcie
        const nx = b.nextElementSibling; if (nx && nx.classList.contains('kopt')) { nx.remove(); return; }
        modal.querySelectorAll('.kopt').forEach(x => x.remove());
        b.insertAdjacentHTML('afterend', `<div class="kopt row" style="flex-wrap:wrap;gap:8px;margin:-2px 0 4px 44px">${kr.op.map((o, j) => `<button class="btn ${s && s.val && s.war === o ? 'pri' : ''}" data-o="${j}">${U.esc(o)}</button>`).join('')}${s && s.val ? '<button class="btn" data-o="-1">Cofnij</button>' : ''}</div>`);
        b.nextElementSibling.querySelectorAll('[data-o]').forEach(x => x.onclick = async () => {
          const j = +x.dataset.o;
          await addEvent('krok', id, j < 0 ? { krok: i, nazwa: kr.n, wart: false } : { krok: i, nazwa: kr.n + ' – ' + kr.op[j], wart: kr.op[j] });
          Dialogs.device(id); UI.refresh();
        });
        return;
      }
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
    if ($('#aSys')) $('#aSys').onclick = () => Dialogs.systemUrz(id);
    if ($('#dEd')) $('#dEd').onclick = () => Dialogs.edytujUrz(id);
    $('#dTy').onclick = () => Dialogs.typyInfo(U.prefix(id));   // od 1.51.0
    if ($('#aDel')) $('#aDel').onclick = () => Dialogs.usunUrz(id);
    if ($('#aPoz')) $('#aPoz').onclick = async () => { if (!wEtapie(u)) await ustawEtap(u.etap || ''); UI.close(); UI.go('rzut', { mode: 'rzut', ark: u.arkusz, wskaz: { urz: id } }); };
    bindIssue(modal, () => Dialogs.device(id));
    thumbs($('#thumbs'), st.foto); hydrateFotos(modal);
  },

  /* Zmiana pozycji urządzenia na rzucie (od 1.30.0): potwierdzenie po przesunięciu znacznika lub wskazaniu miejsca */
  pozycja(id, p, wroc, ok) {
    const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === id); if (!u) return wroc();
    const inny = u.arkusz && u.arkusz !== p.ark;
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Zmiana pozycji">
      <div class="shead"><h3>${p.nowa ? 'Ustawić pozycję' : 'Zmienić pozycję'} – ${U.esc(idOz(u))}?</h3></div>
      <div class="sbody"><div>${p.nowa ? 'Urządzenie pojawi się na rzucie' : 'Znacznik zostanie w nowym miejscu na rzucie'} <b>${U.esc(p.ark)}</b>${inny ? ` (dotąd: ${U.esc(u.arkusz)})` : ''}.</div>
        <div class="mute">Zmiana trafi do listy urządzeń przy synchronizacji; w historii urządzenia zostaje wpis z autorem.</div></div>
      <div class="sfoot"><button class="btn" id="pzx">Anuluj</button><button class="btn pri" id="pzs">Zapisz pozycję</button></div></div></div>`;
    $('#pzx').onclick = () => { UI.close(); wroc(); };
    $('#pzs').onclick = async () => { await addEvent('urz_poz', id, { x: p.x, y: p.y, ark: p.ark }); UI.close(); ok(); UI.toast('Pozycja zapisana'); };
  },

  /* Edycja danych urządzenia (od 1.37.0) – tylko rola biuro: Typ, Zasilanie, Oznaczenie proj., Uwagi.
     ID i rodzaj urządzenia (prefiks ze Słowników) się nie zmieniają; zapis = zdarzenie urz_edyc, serwer poprawia wiersz w Urządzeniach */
  edytujUrz(id) {
    if (!Session.isBiuro()) return;
    const wsz = (S.proj || {}).urzadzenia || [], u = wsz.find(x => x.id === id); if (!u) return;
    const podp = (k, filtr) => [...new Set(wsz.filter(filtr || (() => true)).map(x => (x[k] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pl')).slice(0, 40);
    const dl = (nm, arr) => `<datalist id="${nm}">${arr.map(v => `<option value="${U.esc(v)}">`).join('')}</datalist>`;
    const pola = [['typ', 'Typ', 'np. HAT.160.1B.HD'], ['zasilanie', 'Zasilanie', 'np. 230 V'], ['oz', 'Oznaczenie z projektu', 'np. Wk5'], ['uwagi', 'Uwagi', '']];
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Edycja urządzenia">
      <div class="shead"><h3>Edycja – ${U.esc(idOz(u))}</h3><span class="chip">biuro</span></div>
      <div class="sbody stack">
        <div class="mute">Rodzaj urządzenia (${U.esc(typOf(id).nazwa)}) i ID ${U.esc(id)} się nie zmieniają.</div>
        ${pola.map(([k, l, ph]) => `<label class="fld"><span class="mute">${l}</span>${k === 'uwagi' ? `<textarea id="e_${k}" rows="3" style="width:100%">${U.esc(u[k] || '')}</textarea>` : `<input type="text" id="e_${k}" value="${U.esc(u[k] || '')}" placeholder="${U.esc(ph)}" list="dl_${k}" autocomplete="off" style="width:100%">`}</label>`).join('')}
        ${dl('dl_typ', podp('typ', x => U.prefix(x.id) === U.prefix(id)))}${dl('dl_zasilanie', podp('zasilanie'))}
      </div>
      <div class="sfoot"><button class="btn" id="edx">Anuluj</button><button class="btn pri" id="eds">Zapisz</button></div></div></div>`;
    $('#edx').onclick = () => Dialogs.device(id);
    $('#eds').onclick = async () => {
      const zm = {}, było = {};
      pola.forEach(([k]) => { const v = $('#e_' + k).value.trim(); if (v !== (u[k] || '').trim()) { zm[k] = v; było[k] = u[k] || ''; } });
      if (!Object.keys(zm).length) { Dialogs.device(id); return; }
      await addEvent('urz_edyc', id, Object.assign(zm, { było })); UI.toast('Dane urządzenia zapisane'); Dialogs.device(id); UI.refresh();
    };
  },

  /* Zmiana systemu urządzenia (od 1.30.0) – tylko rola biuro */
  systemUrz(id) {
    if (!Session.isBiuro()) return;
    const wsz = (S.proj || {}).urzadzenia || [], u = wsz.find(x => x.id === id); if (!u) return;
    const szafy = wsz.filter(x => sysList(x).indexOf(x.id) >= 0 && x.id !== id).sort((a, b) => natCmp(a.id, b.id));
    const wyb = new Set(sysList(u));
    const lst = () => modal.querySelector('#sysl').innerHTML = szafy.map(x => `<button type="button" class="tab ${wyb.has(x.id) ? 'on' : ''}" data-sy="${U.esc(x.id)}">${U.esc(x.id)}${x.oz ? ` <span class="tsub">${U.esc(x.oz)}</span>` : ''}</button>`).join('') || '<span class="mute">Na budowie nie ma szaf z systemem.</span>';
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="System urządzenia">
      <div class="shead"><h3>System – ${U.esc(idOz(u))}</h3><span class="chip">biuro</span></div>
      <div class="sbody"><div class="mute">Wybierz szafę / rozdzielnicę sterującą (można kilka). Pusty wybór = urządzenie autonomiczne.</div>
        <div class="tabs" id="sysl" style="flex-wrap:wrap"></div>
        ${sysList(u).indexOf(id) >= 0 ? '<div class="mute">To urządzenie jest szafą swojego systemu – jej ID zostaje.</div>' : ''}</div>
      <div class="sfoot"><button class="btn" id="syx">Anuluj</button><button class="btn pri" id="sys">Zapisz</button></div></div></div>`;
    lst();
    modal.querySelector('#sysl').onclick = e => { const b = e.target.closest('[data-sy]'); if (!b) return; wyb.has(b.dataset.sy) ? wyb.delete(b.dataset.sy) : wyb.add(b.dataset.sy); lst(); };
    $('#syx').onclick = () => Dialogs.device(id);
    $('#sys').onclick = async () => {
      const nowy = [...(sysList(u).indexOf(id) >= 0 ? [id] : []), ...[...wyb].filter(x => x !== id).sort(natCmp)].join('; ');
      await addEvent('urz_sys', id, { sys: nowy, było: u.sys || '' }); UI.toast('System zapisany'); Dialogs.device(id); UI.refresh();
    };
  },

  /* Usunięcie urządzenia (od 1.30.0) – tylko rola biuro; serwer przenosi wiersz do zakładki „Usunięte” */
  usunUrz(id) {
    if (!Session.isBiuro()) return;
    const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === id); if (!u) return;
    const F = fold(S.ev), st = F.dev[id], ile = st ? st.hist.length : 0;
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Usuń urządzenie">
      <div class="shead"><h3>Usunąć ${U.esc(idOz(u))}?</h3><span class="chip bad">biuro</span></div>
      <div class="sbody"><div>Urządzenie zniknie z listy, rzutu, liczników i protokołów tej budowy. Wiersz trafi do zakładki <b>Usunięte</b> listy urządzeń; ID nie wróci do puli.</div>
        ${ile ? `<div class="badbox" style="font-size:14px">Urządzenie ma ${ile} ${odm(ile, 'wpis', 'wpisy', 'wpisów')} w historii (kroki, zdjęcia, braki) – zostaną w archiwum zdarzeń.</div>` : ''}
        <label><span class="f" style="display:block">Powód (do historii)</span><input type="text" id="uuP" placeholder="np. dubel, poza zakresem, zmiana projektu"></label></div>
      <div class="sfoot"><button class="btn" id="uux">Anuluj</button><button class="btn bad" id="uus">Usuń urządzenie</button></div></div></div>`;
    $('#uux').onclick = () => Dialogs.device(id);
    $('#uus').onclick = async () => { const pow = $('#uuP').value.trim(); if (!pow) { UI.toast('Podaj powód usunięcia.'); return; }
      await addEvent('urz_usun', id, { powod: pow }); UI.close(); UI.toast(id + ' usunięte'); UI.refresh(); };
  },

  /* Nowe urządzenie (od 1.15.0) – tylko rola biuro; działa offline (zdarzenie urz_nowe), ID nada serwer */
  noweUrz(o) {
    if (!Session.isBiuro()) return;
    o = o || {};
    const urz = urzE(), wszystkie = (S.proj || {}).urzadzenia || [];
    const typy = (S.boot.slowniki.typy || []);
    const arkusze = [...new Set([...wszystkie.map(u => u.arkusz).filter(Boolean), ...Object.keys((S.proj || {}).rzuty || {})])]
      .sort((a, b) => (poziomNr(kondArkusza(a, wszystkie)) - poziomNr(kondArkusza(b, wszystkie))) || natCmp(a, b));
    const kondy = [...new Set(wszystkie.map(u => u.kond).filter(Boolean))].sort((a, b) => poziomNr(a) - poziomNr(b));
    const pref = o.prefix || (urz[0] ? U.prefix(urz[0].id) : (typy[0] || {}).prefix || '');
    const ma = o.x != null && o.x !== '';
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Dodaj urządzenie">
      <div class="shead"><h3>Dodaj urządzenie</h3><span class="mute">${maEtapy() && S.etap ? 'Etap ' + U.esc(S.etap) : ''}</span></div>
      <div class="sbody">
        <label><span class="f" style="display:block">Typ (ze Słowników)</span><select id="nuT">${typy.map(t => `<option value="${U.esc(t.prefix)}" ${t.prefix === pref ? 'selected' : ''}>${U.esc(t.prefix + ' – ' + t.nazwa)}</option>`).join('')}</select></label>
        <div class="row"><label class="grow"><span class="f" style="display:block">Rzut</span><select id="nuA"><option value="">— bez rzutu —</option>${arkusze.map(a => `<option value="${U.esc(a)}" ${a === o.ark ? 'selected' : ''}>${U.esc(poziomTxt(kondArkusza(a, wszystkie)) + ' · ' + a)}</option>`).join('')}</select></label>
          <label class="grow"><span class="f" style="display:block">Kondygnacja</span><input id="nuK" list="nuKl" value="${U.esc(o.kond != null ? o.kond : o.ark ? kondArkusza(o.ark, wszystkie) : '')}" placeholder="np. -1, 0, dach"><datalist id="nuKl">${kondy.map(k => `<option value="${U.esc(k)}">${U.esc(poziomTxt(k))}</option>`).join('')}</datalist></label></div>
        <div class="row"><b class="grow" id="nuP">${ma ? 'Pozycja na rzucie: ustawiona ✓' : 'Pozycja na rzucie: brak'}</b><button class="btn sm" id="nuW">${ma ? 'Zmień miejsce' : 'Wskaż na rzucie'}</button></div>
        <label><span class="f" style="display:block">Oznaczenie z projektu</span><input id="nuO" value="${U.esc(o.oz || '')}" placeholder="np. Wk5, OD1, WI-1.3"></label>
        <label><span class="f" style="display:block">Uwagi (np. model, zasilanie)</span><textarea id="nuU">${U.esc(o.uwagi || '')}</textarea></label>
        <p class="mute" style="margin:0">ID (prefiks + kolejny numer) nada serwer przy synchronizacji. Do tego czasu urządzenie ma numer tymczasowy.</p>
      </div>
      <div class="sfoot"><button class="btn" id="nuX">Anuluj</button><button class="btn pri" id="nuS">Dodaj</button></div></div></div>`;
    const stan = () => ({ prefix: $('#nuT').value, ark: $('#nuA').value, kond: $('#nuK').value.trim(), oz: $('#nuO').value.trim(), uwagi: $('#nuU').value.trim(), x: o.x, y: o.y });
    $('#nuA').onchange = () => { const a = $('#nuA').value; if (a) $('#nuK').value = kondArkusza(a, wszystkie); if (a !== o.ark) { o.x = o.y = null; $('#nuP').textContent = 'Pozycja na rzucie: brak'; } };
    $('#nuW').onclick = () => {
      const st = stan(); if (!st.ark) { UI.toast('Najpierw wybierz rzut.'); return; }
      UI.close(); UI.go('rzut', { ...(UI.cur === 'rzut' ? UI.par : {}), mode: 'rzut', ark: st.ark, wskaz: st, focus: null });
    };
    $('#nuX').onclick = UI.close;
    $('#nuS').onclick = async () => {
      const st = stan(); if (!st.prefix) { UI.toast('Wybierz typ.'); return; }
      const tmp = st.prefix + '~' + Math.random().toString(36).slice(2, 6);
      const d = { tmp, prefix: st.prefix, kond: st.kond, arkusz: st.ark, oz: st.oz, uwagi: st.uwagi };
      if (st.ark && st.x != null && st.x !== '') { d.x = st.x; d.y = st.y; }
      if (maEtapy() && S.etap) d.etap = S.etap;
      await addEvent('urz_nowe', tmp, d);
      UI.close(); UI.toast('Urządzenie dodane – numer nada serwer przy synchronizacji');
      if (UI.cur === 'rzut') UI.go('rzut', { ...UI.par, wskaz: null, ark: st.ark || UI.par.ark, focus: d.x != null ? tmp : null }); else UI.refresh();
    };
  },

  brak(urz) {
    const kats = (S.boot.slowniki.kategorie || []);
    let kat = '', odp = ''; let photos = [];   // od 1.30.0: bez domyślnego rodzaju; opis wymagany tylko przy „Inne” lub bez rodzaju
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Zgłoś brak">
      <div class="shead"><h3>Zgłoś brak</h3><span class="mute">${U.esc(S.user.name)}</span></div>
      <div class="sbody">
        <div><div class="mute">Dotyczy</div><b>${urz ? U.esc(urz) : (maEtapy() && S.etap ? 'Etap ' + U.esc(etapOpis(S.etap)) : 'Cała budowa')}</b></div>
        <div><div class="mute" style="margin-bottom:8px">Rodzaj braku</div><div class="cats">${kats.map(k => `<button data-k="${U.esc(k)}" class="${k === kat ? 'on' : ''}">${U.esc(k)}</button>`).join('')}</div></div>
        ${odpHtml(odp)}
        <label><span class="f" style="display:block">Opis – co jest nie tak i co jest potrzebne <span class="mute" id="bow"></span></span><textarea id="bo"></textarea></label>
        <div class="row"><button class="btn" id="bf">+ Zdjęcie</button><span class="mute" id="bfc"></span>
          <label class="row" style="margin-left:auto"><input type="checkbox" id="bb" style="width:24px;height:24px"> Blokuje dalszą pracę</label></div>
      </div>
      <div class="sfoot"><button class="btn" id="bx">Anuluj</button><button class="btn bad" id="bs">Zapisz brak</button></div></div></div>`;
    const opisWym = () => !kat || /^inn/i.test(kat);
    const pokazWym = () => { $('#bow').textContent = opisWym() ? '(wymagany)' : '(opcjonalny)'; };
    modal.querySelectorAll('.cats button[data-k]').forEach(b => b.onclick = () => { kat = kat === b.dataset.k ? '' : b.dataset.k; modal.querySelectorAll('.cats button[data-k]').forEach(x => x.classList.toggle('on', x.dataset.k === kat)); pokazWym(); });
    modal.querySelectorAll('.cats button[data-o]').forEach(b => b.onclick = () => { odp = b.dataset.o; modal.querySelectorAll('.cats button[data-o]').forEach(x => x.classList.toggle('on', x.dataset.o === odp)); });
    pokazWym();
    $('#bf').onclick = () => pickFile(async f => { const id = await storePhoto(f, urz || 'BUDOWA', 'brak'); photos.push(id); $('#bfc').textContent = photos.length + ' zdjęć'; });
    $('#bx').onclick = () => urz ? Dialogs.device(urz) : UI.close();
    $('#bs').onclick = async () => {
      if (!odp) { UI.toast('Wybierz odpowiedzialnego: ' + odpLista().join(' / ') + '.'); return; }
      const opis = $('#bo').value.trim(); if (!opis && opisWym()) { UI.toast(kat ? 'Przy rodzaju „' + kat + '” dodaj krótki opis.' : 'Wybierz rodzaj braku albo dodaj opis.'); return; }
      const d = { kat: kat || 'Inne', odp, opis, blokuje: $('#bb').checked, foto: photos };
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
    let kat = b.kat, odp = b.odp || '', nowe = [], komFoto = [];
    const wroc = () => { if (after) after(); else UI.close(); UI.refresh(); };
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Brak">
      <div class="shead"><h3>Brak – ${b.urz ? U.esc(idOz(b.urz)) : b.etap ? 'etap ' + U.esc(b.etap) : 'budowa'}</h3><span class="chip ${b.zamk ? 'ok' : 'bad'}">${b.zamk ? 'zamknięty' : 'otwarty'}</span></div>
      <div class="sbody">
        ${b.urz ? `<div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn sm" id="eUrz">Urządzenie ${U.esc(idOz(b.urz))}</button>${(u => `<button class="btn sm pri" id="eRys" ${u && u.arkusz && u.x !== '' && u.x != null ? '' : 'disabled title="Urządzenie nie ma pozycji na rzucie"'}>${ic('cel')} Na rzucie</button>`)(((S.proj || {}).urzadzenia || []).find(x => x.id === b.urz))}</div>` : ''}
        <div class="mute">Zgłosił: ${U.esc(b.kto)} · ${U.fmt(b.ts)}${b.zamk ? ' · zamknął ' + U.esc(b.zamk.kto) + ' ' + U.fmt(b.zamk.ts) + (b.zamk.opis ? ' – ' + U.esc(b.zamk.opis) : '') : ''}</div>
        <div><div class="mute" style="margin-bottom:8px">Rodzaj braku</div><div class="cats">${kats.map(k => `<button data-k="${U.esc(k)}" class="${k === kat ? 'on' : ''}">${U.esc(k)}</button>`).join('')}</div></div>
        ${odpHtml(odp)}
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
        <button class="btn" id="eX">Anuluj</button><button class="btn pri" id="eS">Zapisz zmiany</button></div></div></div>`;
    hydrateFotos(modal);
    modal.querySelectorAll('.cats button[data-k]').forEach(x => x.onclick = () => { kat = x.dataset.k; modal.querySelectorAll('.cats button[data-k]').forEach(y => y.classList.toggle('on', y === x)); });
    modal.querySelectorAll('.cats button[data-o]').forEach(x => x.onclick = () => { odp = x.dataset.o; modal.querySelectorAll('.cats button[data-o]').forEach(y => y.classList.toggle('on', y === x)); });
    // od 1.43.0: nowe zdjęcia widać od razu w oknie i są zapisywane także przy „Zamknij brak”, komentarzu i „Otwórz ponownie”
    $('#ef').onclick = () => pickFile(async f => { nowe.push(await storePhoto(f, b.urz || 'BUDOWA', 'brak')); $('#efc').textContent = '+' + nowe.length + ' ' + odm(nowe.length, 'zdjęcie', 'zdjęcia', 'zdjęć') + ' – niezapisane'; const t = modal.querySelector('.thumbs[data-fotos]'); if (t) thumbs(t, [...b.foto, ...nowe]); });
    const zmiany = () => { const d = { bid }, opis = $('#eo').value.trim(), blok = $('#eb').checked;
      if (kat !== b.kat) d.kat = kat; if (odp && odp !== (b.odp || '')) d.odp = odp; if (opis && opis !== b.opis) d.opis = opis; if (blok !== !!b.blokuje) d.blokuje = blok; if (nowe.length) d.foto = nowe;
      return Object.keys(d).length > 1 ? d : null; };
    const zapiszZmiany = async () => { const d = zmiany(); if (d) { await addEvent('brak_edyc', b.urz, d); nowe = []; } return !!d; };
    $('#ekf').onclick = () => pickFile(async f => { komFoto.push(await storePhoto(f, b.urz || 'BUDOWA', 'brak')); $('#ekc').textContent = komFoto.length + ' zdjęć'; });
    $('#eX').onclick = async () => {
      if (zmiany()) { if (confirm(nowe.length ? 'Dodane zdjęcia nie są zapisane. Zapisać je przy braku?' : 'Zapisać zmiany w braku?')) { await zapiszZmiany(); UI.toast('Zmiany zapisane'); } else if (nowe.length) await Promise.all(nowe.map(fid => DB.delPhoto ? DB.delPhoto(fid) : null)); }
      wroc();
    };
    if ($('#eUrz')) $('#eUrz').onclick = () => Dialogs.device(b.urz);
    // od 1.31.0: rzut z urządzeniem braku – przybliżenie i pulsująca kropka
    if ($('#eRys')) $('#eRys').onclick = async () => { const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === b.urz); if (!u) return;
      if (!wEtapie(u)) await ustawEtap(u.etap || ''); UI.close(); UI.go('rzut', { mode: 'rzut', ark: u.arkusz, focus: u.id, sys: '', f: 'all' }); };
    $('#eS').onclick = async () => {
      // opis wymagany tylko bez kategorii albo przy „Inne” (jak przy zgłaszaniu, od 1.30.0; w oknie braku od 1.43.1)
      if (!odp) { UI.toast('Wybierz odpowiedzialnego: ' + odpLista().join(' / ') + '.'); return; }
      const opis = $('#eo').value.trim(), blok = $('#eb').checked; if (!opis && (!kat || kat === 'Inne')) { UI.toast(kat === 'Inne' ? 'Przy „Inne” opisz brak.' : 'Wybierz rodzaj braku albo wpisz opis.'); return; }
      const d = { bid };
      if (kat !== b.kat) d.kat = kat; if (odp !== (b.odp || '')) d.odp = odp; if (opis && opis !== (b.opis || '')) d.opis = opis; if (blok !== !!b.blokuje) d.blokuje = blok; if (nowe.length) d.foto = nowe;
      if (Object.keys(d).length === 1) { wroc(); return; }
      await addEvent('brak_edyc', b.urz, d); UI.toast('Zmiany zapisane'); wroc();
    };
    $('#eks').onclick = async () => {
      const t = $('#ek').value.trim(); if (!t && !komFoto.length) { UI.toast('Wpisz komentarz.'); return; }
      await zapiszZmiany(); await addEvent('brak_kom', b.urz, { bid, tekst: t, foto: komFoto }); UI.toast('Komentarz dodany'); Dialogs.brakOkno(bid, after);
    };
    if ($('#eClose')) $('#eClose').onclick = async () => {
      const opis = prompt('Jak usunięto brak? (opcjonalnie)'); if (opis === null) return;
      await zapiszZmiany(); await addEvent('brak_zamk', b.urz, { bid, opis: opis.trim() }); UI.toast('Brak zamknięty'); wroc();
    };
    if ($('#eOpen')) $('#eOpen').onclick = async () => { await zapiszZmiany(); await addEvent('brak_edyc', b.urz, { bid, otworz: true }); UI.toast('Brak otwarty ponownie'); wroc(); };
    if ($('#eDel')) $('#eDel').onclick = async () => {
      if (!confirm('Usunąć ten brak? Zniknie z list (historia zostaje).')) return;
      await addEvent('brak_edyc', b.urz, { bid, usun: true }); UI.toast('Brak usunięty'); wroc();
    };
  },

  /* Informacja o budowie (od 1.44.0): kierownik HUP-BUD z telefonem, notatka o budowie (Uwagi dla ekip), pełne dane z Bazy.
     Rola biuro: edycja notatki, kierownika i telefonu – zdarzenie projekt_edyc, serwer zapisuje w Bazie → Projekty (H, P, Q). */
  infoBudowy(kod, edycja, opcje = {}) {
    const p = ((S.boot && S.boot.projekty) || []).find(x => x.kod === kod); if (!p) return;
    const biuro = Session.isBiuro();
    const wiersz = (l, v) => v ? `<div class="irow"><span class="mute">${l}</span><span>${v}</span></div>` : '';
    const tk = telKier(p), tel = tk ? `<a class="btn sm" href="tel:${U.esc(tk.replace(/[^\d+]/g, ''))}">${ic('tel')} ${U.esc(tk)}</a>` : '';
    const etapy = (p.etapy || []).map(e => U.esc(e.id + (e.opis ? ': ' + e.opis : ''))).join('<br>');
    // znani kierownicy i ich telefony – z innych budów w Bazie (źródło: ekipy-i-pracownicy.md)
    const znani = {}; ((S.boot && S.boot.projekty) || []).forEach(x => { if (x.kierownik && (x.telKier || !znani[x.kierownik])) znani[x.kierownik] = x.telKier || ''; });
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Informacje o budowie">
      <div class="shead"><h3>${U.esc(String(p.nazwa || '').replace(p.kod, '').trim() || p.nazwa)} <span style="color:var(--accent,#2563eb);white-space:nowrap">${U.esc(p.kod)}</span></h3>${biuro && !edycja ? `<button class="btn sm" id="iEd">${ic('edit')} Edytuj</button>` : ''}</div>
      <div class="sbody stack">
        ${edycja ? `
          <label class="fld"><span class="mute">K. Sanit.</span><input id="iK" type="text" list="dlK" value="${U.esc(p.kierownik || '')}" autocomplete="off" style="width:100%"><datalist id="dlK">${Object.keys(znani).sort((a, b) => a.localeCompare(b, 'pl')).map(k => `<option value="${U.esc(k)}">`).join('')}</datalist></label>
          <label class="fld"><span class="mute">Telefon kierownika</span><input id="iT" type="text" inputmode="tel" value="${U.esc(p.telKier || '')}" placeholder="np. 502 500 669" style="width:100%"></label>
          <label class="fld"><span class="mute">Notatka o budowie (dla ekip)</span><textarea id="iU" rows="9" style="width:100%">${U.esc(p.uwagi || '')}</textarea></label>
          <div><div class="lbl">Inne kontakty</div><div id="iKL" class="stack" style="gap:8px;margin-top:6px"></div>
            <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap"><button class="btn sm" id="iKA" type="button">${ic('plus')} Wpisz ręcznie</button>${'contacts' in navigator && navigator.contacts && navigator.contacts.select ? `<button class="btn sm" id="iKC" type="button">${ic('kier')} Z kontaktów urządzenia</button>` : ''}</div></div>`
        : `<div><div class="row" style="align-items:center"><div class="lbl grow">Kontakty</div>${biuro ? `<button class="btn sm" id="iKon">${ic('plus')} Dodaj kontakt</button>` : ''}</div>
            <div class="ikont">${(() => {   // od 1.45.1: kierownicy i inne kontakty w jednej zwartej liście
              const w = (rola, nazwa, t, kier) => `<div class="ikrow${kier ? ' kier' : ''}"><span class="ikrola">${U.esc(rola)}</span><b class="grow">${U.esc(nazwa || '—')}</b>${t ? `<a class="iktel" href="tel:${U.esc(t.replace(/[^\d+]/g, ''))}">${ic('tel')}${U.esc(t)}</a>` : ''}</div>`;
              const a = S.boot && S.boot.kierownikAkpia;
              return (a && a.nazwa ? w('K. AKPiA', a.nazwa, a.tel, 1) : '') + w('K. Sanit.', p.kierownik || 'nie przypisano', telKier(p), 1)
                + (p.kontakty || []).map(k => w(k.rola || 'kontakt', k.nazwa, k.tel)).join('');
            })()}</div></div>
          <div><div class="lbl">Notatka o budowie</div><p style="white-space:pre-wrap;line-height:1.55;margin:6px 0 0">${U.esc(p.uwagi || '— brak')}</p></div>
          <div class="ilist">${wiersz('Adres', U.esc(p.adres))}${wiersz('Kontakt na budowie', U.esc(p.kontakt))}${wiersz('Zakres prac', U.esc((p.zakres || []).join(', ')))}${wiersz('Etapy budowy', etapy)}${wiersz('Inwestor', U.esc(p.inwestor))}${wiersz('Zamawiający', U.esc(p.zamawiajacy))}${wiersz('Obiekt wojskowy', p.wojskowy === 'tak' ? 'tak – tylko osoby z uprawnieniem M' : '')}</div>`}
      </div>
      <div class="sfoot">${edycja ? '<button class="btn" id="iX">Anuluj</button><button class="btn pri" id="iS">Zapisz</button>' : '<button class="btn" id="iX">Zamknij</button>'}</div></div></div>`;
    $('#iX').onclick = () => edycja ? Dialogs.infoBudowy(kod) : UI.close();
    // inne kontakty (od 1.45.0): rola, imię i nazwisko / firma, telefon – edycja w trybie „Edytuj” (biuro)
    const wierszK = (k = {}) => { const d = document.createElement('div'); d.className = 'ikedit';
      d.innerHTML = `<input class="kR" type="text" placeholder="Rola, np. Elektryk" value="${U.esc(k.rola || '')}" list="dlRol"><input class="kN" type="text" placeholder="Imię i nazwisko / firma" value="${U.esc(k.nazwa || '')}"><input class="kT" type="text" inputmode="tel" placeholder="Telefon" value="${U.esc(k.tel || '')}"><button class="btn sm bad" type="button" aria-label="Usuń kontakt">✕</button>`;
      d.querySelector('button').onclick = () => d.remove(); $('#iKL').appendChild(d); return d; };
    if ($('#iKL')) { (p.kontakty || []).forEach(k => wierszK(k)); if (opcje.dodaj || !(p.kontakty || []).length) wierszK().querySelector('.kR').focus();
      $('#iKL').insertAdjacentHTML('afterend', `<datalist id="dlRol">${['Elektryk', 'Kierownik budowy GW', 'Kierownik robót GW', 'Inspektor nadzoru', 'Projektant', 'Dostawca', 'Serwis', 'Inwestor'].map(r => `<option value="${r}">`).join('')}</datalist>`);
      $('#iKA').onclick = () => wierszK().querySelector('.kR').focus();
      // od 1.45.0: wybór z książki kontaktów tabletu / telefonu (Chrome na Androidzie – Contact Picker API); rolę wpisuje się ręcznie
      if ($('#iKC')) $('#iKC').onclick = async () => {
        try {
          const wyb = await navigator.contacts.select(['name', 'tel'], { multiple: true });
          [...modal.querySelectorAll('.ikedit')].filter(r => !r.querySelector('.kN').value && !r.querySelector('.kT').value && !r.querySelector('.kR').value).forEach(r => r.remove());
          let ost = null; (wyb || []).forEach(c => { ost = wierszK({ nazwa: (c.name || [])[0] || '', tel: (c.tel || [])[0] || '' }); });
          if (ost) { ost.querySelector('.kR').focus(); UI.toast('Dodano z kontaktów – wpisz rolę (np. Elektryk)'); }
        } catch (e) { UI.toast('Nie udało się otworzyć kontaktów urządzenia – wpisz ręcznie.'); }
      }; }
    if ($('#iKon')) $('#iKon').onclick = () => Dialogs.infoBudowy(kod, true, { dodaj: true });
    if ($('#iEd')) $('#iEd').onclick = () => Dialogs.infoBudowy(kod, true);
    if ($('#iK')) $('#iK').oninput = () => { const t = znani[$('#iK').value.trim()]; if (t) $('#iT').value = t; };   // wybór znanego kierownika podstawia jego telefon
    if ($('#iS')) $('#iS').onclick = async () => {
      const nowe = { kierownik: $('#iK').value.trim(), telKier: $('#iT').value.trim(), uwagi: $('#iU').value.replace(/\s+$/, '') }, d = {};
      Object.keys(nowe).forEach(k => { if (nowe[k] !== (p[k] || '')) d[k] = nowe[k]; });
      const kon = [...modal.querySelectorAll('.ikedit')].map(r => ({ rola: r.querySelector('.kR').value.trim(), nazwa: r.querySelector('.kN').value.trim(), tel: r.querySelector('.kT').value.trim() })).filter(k => k.nazwa || k.tel);
      if (JSON.stringify(kon) !== JSON.stringify(p.kontakty || [])) d.kontakty = kon;
      if (!Object.keys(d).length) return Dialogs.infoBudowy(kod);
      await addEvent('projekt_edyc', '', d);
      Object.assign(p, d); await DB.set('boot', S.boot);   // widoczne od razu na tym tablecie; inne – po synchronizacji
      UI.toast('Informacje o budowie zapisane'); Dialogs.infoBudowy(kod); UI.refresh();
    };
  },

  /* Podgląd notatki (od 1.33.0): pełny tekst, autor, urządzenie (karta, na rzucie), zdjęcia; notatek się nie edytuje */
  notatkaOkno(eid) {
    const F = fold(S.ev), e = F.notes.find(x => x.id === eid) || F.notesKosz.find(x => x.id === eid); if (!e) return;
    const biuro = Session.isBiuro(), wKoszu = !!e.usun;
    const fot = wKoszu ? (e.d.foto || []) : (e.d.foto || []).filter(f => F.fotoInfo[f]);
    const ed = e.zm.filter(z => z.co === 'edycja').pop();
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Notatka">
      <div class="shead"><h3>Notatka – ${U.esc(e.kto)}</h3><span class="mute">${U.fmt(e.ts)}</span></div>
      <div class="sbody">${e.urz ? `<div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn sm" id="noU">Urządzenie ${U.esc(idOz(e.urz))}</button>${maPozycje(e.urz) ? `<button class="btn sm" id="noR">${ic('cel')} Na rzucie</button>` : ''}</div>` : ''}
        ${wKoszu ? `<p class="mute" style="margin:0">W koszu – usunął ${U.esc(e.usun.kto)} ${U.fmt(e.usun.ts)}</p>` : ''}
        <p id="noT" style="white-space:pre-wrap;line-height:1.55;margin:0;font-size:17px">${U.esc(e.d.tekst || '')}</p>
        ${ed ? `<p class="mute" style="margin:0;font-size:13px">Edytowana: ${U.esc(ed.kto)} ${U.fmt(ed.ts)}</p>` : ''}
        ${fot.length ? `<div class="thumbs" id="noF" data-fotos="${U.esc(fot.join(','))}"></div>` : ''}</div>
      <div class="sfoot">${wKoszu ? (biuro ? '<button class="btn pri" id="noP">Przywróć</button>' : '') : `${biuro ? `<button class="btn bad" id="noD">${ic('trash')} Usuń</button>` : ''}<button class="btn" id="noE">Edytuj</button>`}<button class="btn" id="noX">Zamknij</button></div></div></div>`;
    $('#noX').onclick = UI.close;
    // edycja tekstu – każdy pracownik (od 1.42.0); kosz i przywrócenie – tylko rola biuro (serwer odrzuca od innych); zmiana = nowe zdarzenie, historia zostaje
    const zm = async (d, msg) => { await addEvent('notatka_edyc', e.urz || '', Object.assign({ nid: e.id }, d)); UI.toast(msg); UI.close(); UI.refresh(); };
    if ($('#noD')) $('#noD').onclick = () => { if (confirm('Przenieść notatkę do kosza? Biuro może ją przywrócić z kosza.')) zm({ usun: true }, 'Notatka w koszu'); };
    if ($('#noP')) $('#noP').onclick = () => zm({ przywroc: true }, 'Notatka przywrócona');
    if ($('#noE')) $('#noE').onclick = () => {
      $('#noT').outerHTML = `<textarea id="noTa" rows="6" style="width:100%;font-size:17px">${U.esc(e.d.tekst || '')}</textarea>`;
      $('#noE').outerHTML = '<button class="btn pri" id="noS">Zapisz</button>'; $('#noTa').focus();
      $('#noS').onclick = () => { const t = $('#noTa').value.trim(); if (!t) { UI.toast('Notatka nie może być pusta – użyj „Usuń”'); return; } if (t === (e.d.tekst || '')) { UI.close(); return; } zm({ tekst: t }, 'Notatka zapisana'); };
    };
    if ($('#noU')) $('#noU').onclick = () => Dialogs.device(e.urz);
    if ($('#noR')) $('#noR').onclick = () => pokazNaRzucie(e.urz);
    hydrateFotos(modal);
  },

  /* Nowe zapotrzebowanie (od 1.48.0) – każdy z tabletu HUP-BUD, offline; kod – budowa wpisana automatycznie, puste = zakupy ogólne (AKPiA) */
  /* Nowe zadanie do zaplanowania (od 1.56.0, rola biuro) – tylko podstawowe dane; termin dobiera Claude */
  async noweZadanie(kod, dzien, zKolejki, osobyStart) {
    if (!Session.isBiuro()) return;
    // projekty: aktywne z tabletu + wszystkie z Bazy (z listą ClickUp) – pobierane przy otwarciu, gdy jest sieć (od 1.56.0)
    let baza = (await DB.get('projektyBaza')) || [];   // od 1.56.1: okno od razu z danymi z tabletu, lista z Bazy doczytywana w tle
    const mapa = new Map(); ((S.boot && S.boot.projekty) || []).forEach(p => mapa.set(p.kod, p)); baza.forEach(p => { if (!mapa.has(p.kod)) mapa.set(p.kod, p); });
    const pr = [...mapa.values()].sort((a, b) => natCmp(b.kod, a.kod));
    const budTxt = p => p.nazwa && p.nazwa.indexOf(p.kod) === 0 ? p.nazwa : p.kod + ' ' + (p.nazwa || '');
    const FAZY = CZ.FAZY;
    const EK = ['Dowolna', 'Ekipa 1', 'Ekipa 2', 'Ekipa 3'];
    const OSOBY = ((S.boot && S.boot.pracownicy) || []).filter(p => p.cu).map(p => p.name);   // od 1.56.1: osobne przyciski osób (także biuro)
    const zk = zKolejki || null;
    let faza = zk ? zk.faza : 'Montaż i Wykonawstwo', ekipa = zk ? (zk.ekipa === 'Dowolna' ? 'Dowolna' : zk.ekipa === 'osoby' ? '' : 'Ekipa ' + zk.ekipa) : (osobyStart && osobyStart.length ? '' : 'Dowolna');
    let osoby = new Set(zk && zk.osoby ? zk.osoby : osobyStart || []);   // od 1.58.4: z harmonogramu – osoba z przytrzymanej kolumny
    let wybKod = kod || '';   // wybrany projekt: kod, '+' = nowy, '' = brak
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog nzdlg" role="dialog" aria-label="Nowe zadanie">
      <div class="shead"><h3>Nowe zadanie</h3><span class="mute">${U.esc(S.user.name)}</span></div>
      <div class="sbody zapform">
        <div class="fld nzpw"><span class="mute">Projekt – wpisz kod lub początek nazwy</span><input id="nzB" type="text" autocomplete="off" placeholder="np. 26_0 albo Kwitn…" value="${U.esc(kod ? budTxt(mapa.get(kod) || { kod }) : '')}"><div class="nzpod" id="nzBL" hidden></div></div>
        <div class="nzproj card" id="nzP" hidden><div class="mute" style="margin-bottom:8px">Nowy projekt – ELWIS założy listę w ClickUp z szablonu projektu (fazy i zadania standardowe) w przestrzeni PROJ wg roku z kodu i wiersz w Bazie projektów (Aktywna = nie). Resztę uzupełni później skill „nowa budowa”.</div>
          <div class="row" style="gap:12px;flex-wrap:wrap"><label class="fld" style="width:150px"><span class="mute">Kod</span><input id="nzPK" type="text" placeholder="26_045 lub 26p045" autocomplete="off"></label>
          <label class="fld grow"><span class="mute">Nazwa</span><input id="nzPN" type="text" placeholder="np. Osiedle Zielone B2" autocomplete="off"></label>
          <label class="fld" style="width:220px"><span class="mute">Miejscowość (zasięg ekip)</span><input id="nzPM" type="text" placeholder="np. Kraśnik" autocomplete="off"></label></div></div>
        <div><div class="mute" style="margin-bottom:6px">Faza</div><div class="cats" id="nzF">${FAZY.map(f => `<button data-f="${U.esc(f)}" class="${f === faza ? 'on' : ''}">${U.esc(f)}</button>`).join('')}</div></div>
        <label class="fld"><span class="mute">Co trzeba zrobić</span><input id="nzN" type="text" placeholder="np. Podłączenie wentylatorów R1–R7 w garażu" autocomplete="off"></label>
        <div class="row" style="gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div><div class="mute" style="margin-bottom:6px">Ekipa</div><div class="cats" id="nzE">${EK.map(e => `<button data-e="${e}" class="${e === ekipa ? 'on' : ''}">${e}</button>`).join('')}</div></div>
          <label class="chk" style="margin-bottom:8px" id="nzDl"><input type="checkbox" id="nzD"> + Dariusz (pomocnik)</label>
        </div>
        <div><div class="mute" style="margin-bottom:6px">albo wybrane osoby (wspólny wolny czas)</div><div class="cats" id="nzO">${OSOBY.map(o => `<button data-o="${U.esc(o)}" class="${osoby.has(o) ? 'on' : ''}">${U.esc(o === S.user.name ? o + ' (ja)' : o)}</button>`).join('')}</div></div>
        <div class="row" style="gap:12px;flex-wrap:wrap">
          <label class="fld" style="width:150px"><span class="mute">Czas pracy (h)</span><input id="nzH" type="number" min="0.5" step="0.5" inputmode="decimal" placeholder="np. 6"></label>
          <label class="fld" style="width:190px"><span class="mute">Nie wcześniej niż</span><input id="nzOd" type="date" value="${U.esc(dzien && dzien > U.day(new Date()) ? dzien : '')}"></label>
          <label class="fld" style="width:190px"><span class="mute">Najpóźniej do</span><input id="nzDo" type="date"></label>
        </div>
        <label class="fld"><span class="mute">Uwagi (warunek startu, po czym, kontakt na budowie)</span><textarea id="nzU" rows="2" placeholder="np. po dostawie szafy SZ1; przed tynkami"></textarea></label>
      </div>
      <div class="sfoot"><button class="btn" id="nzX">Anuluj</button><span class="grow mute nzobc" id="nzObc"></span><button class="btn pri" id="nzS">Znajdź termin →</button></div></div></div>`;
    // podpowiedzi projektu (od 1.56.1): po kodzie lub fragmencie nazwy; brak dopasowania → „utwórz nowy projekt”
    const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
    const nowyZ = t => { wybKod = '+'; $('#nzP').hidden = false; $('#nzBL').hidden = true; const x = t.trim(), m = x.match(/^(\d{2}[_p]\d{3})\s*(.*)$/);
      if (m) { $('#nzPK').value = m[1]; if (m[2]) $('#nzPN').value = m[2]; } else if (x) $('#nzPN').value = x; ($('#nzPK').value ? $('#nzPN') : $('#nzPK')).focus(); };
    const podpowiedz = () => {
      const t = $('#nzB').value.trim(), q = norm(t); wybKod = ''; $('#nzP').hidden = true;
      // od 1.58.4: puste pole = cała lista budów z Bazy, litery filtrują
      const traf = [...mapa.values()].filter(p => !q || norm(p.kod).startsWith(q) || norm(budTxt(p)).includes(q)).sort((a, b) => natCmp(b.kod, a.kod));
      $('#nzBL').innerHTML = traf.map(p => `<button type="button" data-k="${U.esc(p.kod)}"><b class="m bkd">${U.esc(p.kod)}</b> ${U.esc(budTxt(p).replace(p.kod, '').trim())}${p.aktywna === false ? ' <span class="mute">poza ELWIS</span>' : ''}</button>`).join('')
        + (t ? `<button type="button" class="nznowy" data-nowy="1">＋ ${traf.length ? 'Inny – utwórz nowy projekt' : 'Nie znaleziono – utworzyć nowy projekt'} „${U.esc(t)}”?</button>` : '');
      $('#nzBL').hidden = false;
      $('#nzBL').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { wybKod = b.dataset.k; $('#nzB').value = budTxt(mapa.get(wybKod)); $('#nzBL').hidden = true; });
      if ($('#nzBL').querySelector('[data-nowy]')) $('#nzBL').querySelector('[data-nowy]').onclick = () => nowyZ(t);
    };
    $('#nzB').oninput = podpowiedz;
    $('#nzB').onfocus = () => { if (!wybKod) podpowiedz(); };
    // od 1.56.1: w tle, gdy wypełniasz pola – lista projektów z Bazy i odświeżenie obciążenia ekip (z odliczaniem)
    const tok = this._nzTok = U.uid('nz'), ods = { start: Date.now(), done: !navigator.onLine, stan: '', err: navigator.onLine ? '' : 'brak sieci' };
    const sek = (t0, lim) => Math.round((Date.now() - t0) / 1000) + ' s (limit ' + lim + ' s)';
    const t0p = Date.now();
    const tik = () => {
      if (this._nzTok !== tok || !$('#nzObc')) return clearInterval(tim);
      $('#nzObc').textContent = !ods.done ? 'Obciążenie ekip: odświeżam w tle… ' + sek(ods.start, 120) : ods.err ? 'Obciążenie: ' + ods.err + ' – policzę przy wyszukiwaniu' : 'Obciążenie ekip aktualne (stan na ' + ods.stan.slice(11) + ')';
      $('#nzObc').classList.toggle('ok', ods.done && !ods.err);
      const inf = modal.querySelector('.nzwczyt[data-l]'); if (inf) inf.textContent = 'Wczytuję listę projektów z Bazy… ' + sek(t0p, 120);
      if (this._nzCzeka) $('#nzS').textContent = 'Czekam na obciążenie ekip… ' + Math.round((Date.now() - ods.start) / 1000) + ' s';
    };
    const tim = setInterval(tik, 1000);
    if (navigator.onLine) {
      ods.p = API.zadNowe({ op: 'odswiez' }).then(r => { ods.stan = r.stan || ''; }).catch(e => { ods.err = /Brak czasu pracy|Nieznana/.test(e.message) ? 'serwer bez odświeżania' : e.timeout ? 'serwer nie odpowiedział' : 'nie udało się odświeżyć'; }).finally(() => { ods.done = true; tik(); });
      const inf = document.createElement('div'); inf.className = 'mute nzwczyt'; inf.dataset.l = '1'; inf.textContent = 'Wczytuję listę projektów z Bazy…'; $('#nzB').closest('.fld').appendChild(inf);
      API.zadNowe({ op: 'projekty' }).then(async r => {
        await DB.set('projektyBaza', r.projekty || []); (r.projekty || []).forEach(p => { if (!mapa.has(p.kod)) mapa.set(p.kod, p); });
        inf.remove(); if ($('#nzB') && document.activeElement === $('#nzB') && !wybKod) podpowiedz();
      }).catch(() => { delete inf.dataset.l; inf.textContent = 'Nie udało się wczytać listy z Bazy – podpowiadam budowy z tabletu.'; });
    }
    tik();
    if (zk) { wybKod = zk.nowy ? '+' : zk.kod; $('#nzB').value = zk.nowy ? zk.nowy.kod + ' ' + zk.nowy.nazwa : budTxt(mapa.get(zk.kod) || { kod: zk.kod }); $('#nzP').hidden = !zk.nowy; if (zk.nowy) { $('#nzPK').value = zk.nowy.kod; $('#nzPN').value = zk.nowy.nazwa; $('#nzPM').value = zk.nowy.miejsc || ''; }
      $('#nzN').value = zk.nazwa; $('#nzH').value = zk.h; $('#nzOd').value = zk.od || ''; $('#nzDo').value = zk.do || ''; $('#nzU').value = zk.uw || ''; $('#nzD').checked = !!zk.dariusz; }
    modal.querySelectorAll('#nzF [data-f]').forEach(b => b.onclick = () => { faza = b.dataset.f; modal.querySelectorAll('#nzF [data-f]').forEach(x => x.classList.toggle('on', x === b)); });
    const pokazWyb = () => { modal.querySelectorAll('#nzE [data-e]').forEach(x => x.classList.toggle('on', x.dataset.e === ekipa)); modal.querySelectorAll('#nzO [data-o]').forEach(x => x.classList.toggle('on', osoby.has(x.dataset.o))); $('#nzDl').hidden = !ekipa; };
    modal.querySelectorAll('#nzE [data-e]').forEach(b => b.onclick = () => { ekipa = b.dataset.e; osoby.clear(); pokazWyb(); });
    modal.querySelectorAll('#nzO [data-o]').forEach(b => b.onclick = () => { const o = b.dataset.o; osoby.has(o) ? osoby.delete(o) : osoby.add(o); ekipa = osoby.size ? '' : 'Dowolna'; pokazWyb(); });
    pokazWyb();
    $('#nzX').onclick = UI.close;
    $('#nzS').onclick = async () => {
      const n = $('#nzN').value.trim(), h = Number(String($('#nzH').value).replace(',', '.'));
      if (!wybKod) {   // wpisany tekst bez wyboru z podpowiedzi
        const t = $('#nzB').value.trim(); if (!t) return UI.toast('Wpisz projekt.');
        const dok = [...mapa.values()].find(p => norm(p.kod) === norm(t) || norm(budTxt(p)) === norm(t));
        if (dok) wybKod = dok.kod;
        else { if (confirm('Nie znaleziono projektu „' + t + '”. Utworzyć nowy projekt?')) nowyZ(t); return; }
      }
      const k = wybKod; if (!n) return UI.toast('Wpisz, co trzeba zrobić.'); if (!(h > 0)) return UI.toast('Podaj czas pracy w godzinach.');
      const nowy = k === '+' ? { kod: $('#nzPK').value.trim(), nazwa: $('#nzPN').value.trim(), miejsc: $('#nzPM').value.trim() } : null;
      if (nowy && !/^\d{2}[_p]\d{3}$/.test(nowy.kod)) return UI.toast('Kod projektu w formacie RR_NNN lub RRpNNN (np. 26_045).');
      if (nowy && !nowy.nazwa) return UI.toast('Podaj nazwę nowego projektu.');
      if (!ekipa && !osoby.size) return UI.toast('Wybierz ekipę albo osoby.');
      const zgl = { id: (zk && zk.id) || U.uid('zn'), kod: nowy ? nowy.kod : k, nowy, faza, nazwa: n, ekipa: !ekipa ? 'osoby' : ekipa === 'Dowolna' ? 'Dowolna' : ekipa.replace('Ekipa ', ''), osoby: [...osoby], dariusz: $('#nzD').checked, h, od: $('#nzOd').value, do: $('#nzDo').value, uw: $('#nzU').value.trim() };
      const kolejka = async (pow) => { const q = ((await DB.get('zadNoweKolejka')) || []).filter(x => x.id !== zgl.id); q.push(zgl); await DB.set('zadNoweKolejka', q);
        UI.close(); UI.toast('Zapisano ' + pow + ' – termin wybierzesz później (Plan → Nowe zadanie)'); planNZ(); if (UI.cur === 'plan') UI.refresh(); };
      if (!navigator.onLine) return kolejka('bez sieci');
      $('#nzS').disabled = true;
      if (!ods.done && ods.p) { this._nzCzeka = true; tik(); await ods.p.catch(() => { }); this._nzCzeka = false; }
      if (this._nzTok !== tok || !$('#nzS')) return;   // okno zamknięte w trakcie
      $('#nzS').textContent = 'Szukam terminu…';
      try { const w = await API.fg('Szukam terminu', () => API.zadNowe({ op: 'warianty', zgl })); if (this._nzTok !== tok || !$('#nzS')) return; this.zadWarianty(zgl, w); }
      catch (e) {
        if (this._nzTok !== tok || !$('#nzS')) return;
        $('#nzS').disabled = false; $('#nzS').textContent = 'Znajdź termin →';
        if (e.przerwane) return UI.toast('Przerwano – możesz spróbować ponownie.');
        if ((e.timeout || e.siec) && confirm((e.timeout ? 'Serwer nie odpowiada.' : 'Brak połączenia z serwerem.') + ' Zapisać zgłoszenie w kolejce? Termin wybierzesz później.')) return kolejka('w kolejce');
        UI.toast('Nie udało się: ' + (e.message || e));
      }
    };
  },
  /* Zgłoszenia zapisane bez sieci – czekają na wybór terminu (od 1.56.0) */
  async zadKolejka() {
    const q = (await DB.get('zadNoweKolejka')) || [];
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog nzdlg" role="dialog" aria-label="Czekają na termin">
      <div class="shead"><h3>Czekają na wybór terminu (${q.length})</h3></div>
      <div class="sbody"><div class="list">${q.map((x, i) => `<div class="li tzli"><span class="grow"><b class="m bkd">${U.esc(x.kod)}</b> <b>${U.esc(x.nazwa)}</b><span class="mute">${U.esc(x.faza)} · ${x.ekipa === 'Dowolna' ? 'dowolna ekipa' : x.ekipa === 'osoby' ? U.esc((x.osoby || []).join(', ')) : 'Ekipa ' + U.esc(x.ekipa)} · ${String(x.h).replace('.', ',')} h${x.do ? ' · najpóźniej ' + U.esc(x.do) : ''}${x.nowy ? ' · nowy projekt' : ''}</span></span><button class="btn sm pri" data-w="${i}">Wybierz termin</button><button class="btn sm" data-u="${i}">Usuń</button></div>`).join('') || '<div class="li mute">Brak.</div>'}</div></div>
      <div class="sfoot"><button class="btn" id="kqX">Zamknij</button><span class="grow"></span><button class="btn pri" id="kqN">${ic('plus')} Nowe zadanie</button></div></div></div>`;
    $('#kqX').onclick = UI.close;
    $('#kqN').onclick = () => this.noweZadanie();
    modal.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { if (!confirm('Usunąć to zgłoszenie?')) return; q.splice(+b.dataset.u, 1); await DB.set('zadNoweKolejka', q); planNZ(); this.zadKolejka(); });
    modal.querySelectorAll('[data-w]').forEach(b => b.onclick = () => this.noweZadanie(null, null, q[+b.dataset.w]));
  },
  /* Warianty terminu (od 1.56.0): pierwszy wolny termin każdej pasującej ekipy, z podziałem na części i ostrzeżeniami; „Zaplanuj” = akceptacja → zapis w ClickUp */
  zadWarianty(zgl, w, kolizja) {
    const p = ((S.boot && S.boot.projekty) || []).find(q => q.kod === zgl.kod) || {};
    let wyb = (w.warianty.findIndex(v => v.ok) + 1 || 1) - 1;
    const wv = (v, i) => `<button class="wvar ${i === wyb ? 'on' : ''} ${v.ok ? '' : 'zle'}" data-i="${i}">
        <div class="row"><b class="grow">${U.esc(v.ekipa)}${v.prow ? ' <span class="chip">prowadzi budowę</span>' : ''}</b><span class="chip ${v.ok ? 'ok' : 'bad'}">${v.ok ? '✓ w terminie' : '✗ ' + U.esc(v.blad || 'po terminie')}</span></div>
        <div class="wczesci">${v.czesci.map((c, j) => `<div><span class="m">${v.czesci.length > 1 ? 'cz. ' + (j + 1) + ' · ' : ''}${U.esc(c.dz)} ${U.esc(c.od)}–${U.esc(c.do)}</span> <span class="mute">${String(c.h).replace('.', ',')} h</span></div>`).join('')}</div>
        ${v.uwagi.map(u => `<div class="wuw">⚠ ${U.esc(u)}</div>`).join('')}</button>`;
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog nzdlg" role="dialog" aria-label="Termin zadania">
      <div class="shead"><h3>Wybierz termin</h3><span class="mute">obciążenie: stan na ${U.esc(w.stan || '—')}</span></div>
      <div class="sbody">
        ${kolizja ? `<div class="card palarm">⚠ Kolizja – termin zajęty od czasu wyszukania: ${U.esc(kolizja.join('; '))}. Wybierz nowy wariant.</div>` : ''}
        ${!w.warianty.length ? '<div class="card mute">Brak ekip do zaplanowania (sprawdź zakładkę Pracownicy – Ekipa i ID ClickUp).</div>' : ''}
        <div class="card wzgl"><b class="m bkd">${U.esc(zgl.kod)}</b> <b>${U.esc(zgl.nowy ? zgl.nowy.nazwa + ' (nowy projekt – lista w ClickUp powstanie przy „Zaplanuj”)' : String(p.nazwa || '').replace(zgl.kod, '').trim())}</b><div>${U.esc(zgl.nazwa)}</div>
          <div class="mute">${U.esc(zgl.faza)} · ${String(zgl.h).replace('.', ',')} h${zgl.dariusz ? ' · + Dariusz' : ''}${zgl.od ? ' · nie wcześniej ' + U.esc(zgl.od) : ''}${zgl.do ? ' · najpóźniej ' + U.esc(zgl.do) : ''}</div></div>
        <div class="wlista">${w.warianty.map(wv).join('')}</div>
        <p class="mute" style="margin:0">„Zaplanuj” wpisze zadanie (i jego części) do ClickUp: terminy, godziny, szacowany czas i obie osoby ekipy; ekipa zobaczy je w planie po synchronizacji. Trudny przypadek (przesunięcie innych zadań, dostawy) – zapytaj Claude w czacie.</p>
      </div>
      <div class="sfoot"><button class="btn" id="wvW">← Zmień dane</button><span class="grow"></span><button class="btn pri" id="wvZ">Zaplanuj</button></div></div></div>`;
    modal.querySelectorAll('.wvar').forEach(b => b.onclick = () => { wyb = +b.dataset.i; modal.querySelectorAll('.wvar').forEach(x => x.classList.toggle('on', x === b)); });
    $('#wvW').onclick = () => this.noweZadanie(null, null, zgl);
    $('#wvZ').onclick = async () => {
      const v = w.warianty[wyb]; if (!v || !v.czesci.length) return UI.toast('Ten wariant nie ma terminu.');
      if (!v.ok && !confirm('Ten wariant ma problem: ' + (v.blad || '') + '. Zaplanować mimo to?')) return;
      if (zgl.nowy && !confirm('Utworzyć projekt ' + zgl.nowy.kod + ' ' + zgl.nowy.nazwa + ' w ClickUp (lista z szablonu) i w Bazie projektów (Aktywna = nie)?')) return;
      if (!navigator.onLine) return UI.toast('Brak sieci – zaplanuj po połączeniu.');
      $('#wvZ').disabled = true; $('#wvZ').textContent = zgl.nowy ? 'Tworzę projekt i zapisuję…' : 'Zapisuję w ClickUp…';
      try {
        const tz = this._nzTok = U.uid('nz');
        const r = await API.fg(zgl.nowy ? 'Tworzę projekt i zapisuję w ClickUp' : 'Zapisuję zadanie w ClickUp', () => API.zadNowe({ op: 'zaplanuj', zgl, wyb: { osoby: v.osoby, czesci: v.czesci, ekipa: v.ekipa, nr: (wyb + 1) + ' z ' + w.warianty.length } }));
        const otw = this._nzTok === tz && !!$('#wvZ');
        if (r.kolizja) { if (otw) this.zadWarianty(zgl, r, r.kolizja); else UI.toast('Kolizja – termin zajęty, wybierz nowy wariant (Plan → Nowe zadanie)'); return; }
        const q = ((await DB.get('zadNoweKolejka')) || []).filter(x => x.id !== zgl.id); await DB.set('zadNoweKolejka', q);
        if (otw) UI.close(); UI.toast((r.powtorka ? 'Już było zapisane w ClickUp: ' : 'Zaplanowano w ClickUp: ') + v.ekipa.replace(/\s*\(.*/, '') + ', ' + v.czesci.map(c => c.dz + ' ' + c.od + '–' + c.do).join(' + '));
        try { await Sync.pullPlan(); await pullPowiad(); } catch (e) { }
        if (UI.cur === 'plan') UI.refresh(); planNZ();
      } catch (e) {
        if (!$('#wvZ')) return UI.toast('Zapis zadania: ' + (e.message || e));
        $('#wvZ').disabled = false; $('#wvZ').textContent = 'Zaplanuj';
        UI.toast(e.timeout || e.przerwane ? 'Brak potwierdzenia z serwera – zadanie mogło się zapisać. „Zaplanuj” ponownie nie utworzy duplikatu.' : 'Nie udało się: ' + (e.message || e));
      }
    };
  },
  async zakNowe(kod, ed) {   // ed – zgłoszenie do edycji (od 1.49.0, tylko rola biuro)
    if (ed && !Session.isBiuro()) return;
    const pr = ((S.boot && S.boot.projekty) || []).slice().sort((a, b) => natCmp(a.kod, b.kod));
    const znane = [...new Set((await Zakupy.lista()).flatMap(z => z.poz.map(x => x.n)).filter(Boolean))].sort();
    const JEDN = ['szt', 'm', 'kpl', 'op', 'kg', 'l'];
    const poz = ed ? ed.poz.map(x => ({ lp: x.lp, n: x.n, il: String(x.il), j: x.j || 'szt', uw: x.uw || '', foto: [], st: x.st })) : [];   // {lp?, n, il, j, uw, foto:[{fid, blob}]} – lp = pozycja już zapisana
    const usun = [];   // edycja: Lp usuniętych pozycji
    const budTxt = p => p.nazwa && p.nazwa.indexOf(p.kod) === 0 ? p.nazwa : p.kod + ' ' + (p.nazwa || '');
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Zapotrzebowanie">
      <div class="shead"><h3>${ed ? 'Edycja ' + U.esc(ed.nr || 'zgłoszenia') : 'Zapotrzebowanie'}</h3><span class="mute">${U.esc(S.user.name)}</span></div>
      <div class="sbody zapform">
        <label class="fld"><span class="mute">Budowa${ed ? ' (zmiana budowy = to zgłoszenie odrzucone i nowe z tymi samymi pozycjami)' : ''}</span><select id="zB"><option value="">— zakupy ogólne (AKPiA) —</option>${pr.map(p => `<option value="${U.esc(p.kod)}" ${p.kod === kod ? 'selected' : ''}>${U.esc(budTxt(p))}</option>`).join('')}</select></label>
        <div class="row"><div class="lbl grow">Pozycje <span id="zLn"></span></div></div>
        <div id="zL" class="zlist"></div>
        <button class="btn pri" id="zA" type="button">${ic('plus')} Dodaj pozycję</button>
        <label class="fld"><span class="mute">Uwagi do całego zgłoszenia (termin, gdzie dostarczyć)</span><textarea id="zO" rows="2">${ed ? U.esc(ed.uwagi || '') : ''}</textarea></label>
      </div>
      <div class="sfoot"><button class="btn" id="zx">Anuluj</button><button class="btn pri" id="zs">${ed ? 'Zapisz zmiany' : 'Wyślij zapotrzebowanie'}</button></div></div></div>`;
    if (ed) $('#zB').value = ed.kod || '';
    const lista = () => {
      $('#zLn').textContent = poz.length ? `(${poz.length})` : '';
      $('#zL').innerHTML = poz.map((x, i) => `<button class="zli" type="button" data-i="${i}"><span class="zlnr">${i + 1}</span><span class="grow"><b>${U.esc(x.n)}</b>${x.uw ? `<span class="mute">${U.esc(x.uw)}</span>` : ''}</span>${x.foto.length ? `<span class="mute">📷 ${x.foto.length}</span>` : ''}<span class="m zlil">${U.esc(String(x.il).replace('.', ','))} ${U.esc(x.j)}</span>${ic('chev')}</button>`).join('') || '<div class="zpusto mute">Brak pozycji – dodaj pierwszą.</div>';
      $('#zL').querySelectorAll('[data-i]').forEach(b => b.onclick = () => okno(+b.dataset.i));
    };
    // małe okno pozycji – nad oknem zgłoszenia
    const okno = i => {
      const x = i == null ? { n: '', il: '', j: 'szt', uw: '', foto: [] } : Object.assign({}, poz[i], { foto: poz[i].foto.slice() });
      const w = document.createElement('div'); w.className = 'ov center zsub'; w.innerHTML = `<div class="dialog" role="dialog" aria-label="Pozycja">
        <div class="shead"><h3>${i == null ? 'Nowa pozycja' : 'Pozycja ' + (i + 1)}</h3></div>
        <div class="sbody zapform">
          <label class="fld"><span class="mute">Co potrzebne</span><input id="pN" type="text" list="dlZn" value="${U.esc(x.n)}" placeholder="np. Kabel YDY 3×1,5" autocomplete="off"><datalist id="dlZn">${znane.map(n => `<option value="${U.esc(n)}">`).join('')}</datalist></label>
          <div class="row" style="gap:10px"><label class="fld grow"><span class="mute">Ilość</span><input id="pI" type="number" inputmode="decimal" min="0" step="any" value="${U.esc(x.il)}"></label>
            <div class="fld"><span class="mute">Jednostka</span><div class="zjedn">${JEDN.map(j => `<button type="button" class="${j === x.j ? 'on' : ''}" data-j="${j}">${j}</button>`).join('')}</div></div></div>
          <label class="fld"><span class="mute">Uwaga do pozycji (opcjonalnie – typ, producent, zamiennik)</span><input id="pU" type="text" value="${U.esc(x.uw)}"></label>
          <div class="row"><button class="btn" id="pF" type="button">+ Zdjęcie</button><span class="mute" id="pFc">${x.foto.length ? x.foto.length + ' ' + odm(x.foto.length, 'zdjęcie', 'zdjęcia', 'zdjęć') : ''}</span></div>
        </div>
        <div class="sfoot">${i == null ? '' : '<button class="btn bad" id="pDel">Usuń</button>'}<button class="btn" id="pX">Anuluj</button><button class="btn pri" id="pOk">${i == null ? 'Dodaj' : 'Zapisz'}</button></div></div>`;
      modal.appendChild(w);
      const zamk = () => w.remove();
      w.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { x.j = b.dataset.j; w.querySelectorAll('[data-j]').forEach(y => y.classList.toggle('on', y === b)); });
      w.querySelector('#pF').onclick = () => pickFile(async f => {
        const blob = await U.compress(f, 1600, 0.75, ['Zapotrzebowanie · ' + ($('#zB').value || 'AKPiA'), (w.querySelector('#pN').value || '').slice(0, 60), new Date().toLocaleString('pl-PL') + ' · ' + S.user.name]);
        x.foto.push({ fid: U.uid('zf'), blob }); w.querySelector('#pFc').textContent = x.foto.length + ' ' + odm(x.foto.length, 'zdjęcie', 'zdjęcia', 'zdjęć');
      });
      w.querySelector('#pX').onclick = zamk;
      if (w.querySelector('#pDel')) w.querySelector('#pDel').onclick = () => { if (poz[i].lp) usun.push(poz[i].lp); poz.splice(i, 1); zamk(); lista(); };
      w.querySelector('#pOk').onclick = () => {
        x.n = w.querySelector('#pN').value.trim(); x.il = w.querySelector('#pI').value.trim(); x.uw = w.querySelector('#pU').value.trim();
        if (!x.n) { UI.toast('Wpisz, co jest potrzebne.'); return; }
        if (!x.il) { UI.toast('Podaj ilość.'); return; }
        if (i == null) poz.push(x); else poz[i] = x;
        zamk(); lista();
      };
      w.querySelector('#pN').focus();
    };
    lista();
    $('#zA').onclick = () => okno(null);
    $('#zx').onclick = () => { if (ed) return Dialogs.zakOkno(ed); if (poz.length && !confirm('Porzucić zgłoszenie z ' + poz.length + ' ' + odm(poz.length, 'pozycją', 'pozycjami', 'pozycjami') + '?')) return; UI.close(); };
    $('#zs').onclick = async () => {
      if (!poz.length) { UI.toast('Dodaj co najmniej jedną pozycję.'); return; }
      const fot = poz.flatMap(x => x.foto);
      if (ed) {   // zdarzenie zap_edyc: pełna nowa lista pozycji (lp = istniejąca), usunięte Lp, uwagi, budowa + opis zmian do logu
        const kodN = $('#zB').value, uw = $('#zO').value.trim(), il = x => String(x.il).replace('.', ',') + ' ' + (x.j || ''), zm = [];
        if ((ed.kod || '') !== kodN) {   // od 1.50.0: zmiana budowy → odrzucenie tego zgłoszenia i nowe (zgłaszający bez zmian, wszystkie pozycje po edycji)
          if (!confirm(`Zmiana budowy na: ${zakBud(kodN)}.\nZgłoszenie ${ed.nr || ''} zostanie odrzucone, a powstanie nowe z ${poz.length} ${odm(poz.length, 'pozycją', 'pozycjami', 'pozycjami')}; zgłaszający: ${ed.kto}. Kontynuować?`)) return;
          const e = await Zakupy.dodaj('zap_przen', { zid: ed.nr || ed.id, kod: kodN, kto: ed.kto, poz: poz.map(x => ({ n: x.n, il: x.il, j: x.j, uw: x.uw, foto: x.foto.map(f => f.fid) })), uwagi: uw, foto: [...(ed.foto || []), ...fot.map(f => f.fid)] });
          for (const f of fot) await DB.set('zakFoto:' + f.fid, { blob: f.blob, zid: e.id });
          if (fot.length) { await DB.set('zakFotoKolejka', [...((await DB.get('zakFotoKolejka')) || []), ...fot.map(f => f.fid)]); await liczOczekujace(); }
          UI.toast('Zgłoszenie przeniesione – nowe czeka na numer'); UI.close(); if (UI.cur === 'zakupy') UI.refresh(); return;
        }
        poz.filter(x => x.lp).forEach(x => { const o = ed.poz.find(y => y.lp === x.lp); if (!o) return; const r = [];
          if (o.n !== x.n) r.push('„' + o.n + '” → „' + x.n + '”'); if (il(o) !== il(x)) r.push(il(o) + ' → ' + il(x)); if ((o.uw || '') !== x.uw) r.push('uwaga: ' + (x.uw || '—')); if (x.foto.length) r.push('+' + x.foto.length + ' zdj.');
          if (r.length) zm.push(x.n + ': ' + r.join(', ')); });
        poz.filter(x => !x.lp).forEach(x => zm.push('dodano: ' + x.n + ' (' + il(x) + ')'));
        usun.forEach(lp => { const o = ed.poz.find(y => y.lp === lp); if (o) zm.push('usunięto: ' + o.n); });
        if ((ed.uwagi || '') !== uw) zm.push('uwagi zgłoszenia zmienione');
        if (!zm.length) { UI.toast('Bez zmian.'); return; }
        const zid = ed.nr || ed.id;
        await Zakupy.dodaj('zap_edyc', { zid, kod: kodN, poz: poz.map(x => ({ lp: x.lp || 0, n: x.n, il: x.il, j: x.j, uw: x.uw, foto: x.foto.map(f => f.fid) })), usun, uwagi: uw, opis: zm.join('; ').slice(0, 900) });
        for (const f of fot) await DB.set('zakFoto:' + f.fid, { blob: f.blob, zid });
        if (fot.length) { await DB.set('zakFotoKolejka', [...((await DB.get('zakFotoKolejka')) || []), ...fot.map(f => f.fid)]); await liczOczekujace(); }
        UI.toast('Zmiany zapisane'); UI.close(); if (UI.cur === 'zakupy') UI.refresh(); return;
      }
      const e = await Zakupy.dodaj('zap', { kod: $('#zB').value, poz: poz.map(x => ({ n: x.n, il: x.il, j: x.j, uw: x.uw, foto: x.foto.map(f => f.fid) })), uwagi: $('#zO').value.trim(), foto: fot.map(f => f.fid) });
      for (const f of fot) await DB.set('zakFoto:' + f.fid, { blob: f.blob, zid: e.id });
      if (fot.length) { await DB.set('zakFotoKolejka', [...((await DB.get('zakFotoKolejka')) || []), ...fot.map(f => f.fid)]); await liczOczekujace(); }
      UI.toast('Zapotrzebowanie wysłane do biura'); UI.close(); if (UI.cur === 'zakupy') UI.refresh();
    };
    lista();
    if (!ed) okno(null);   // od razu pierwsza pozycja
  },

  /* Okno zgłoszenia (od 1.48.0): pozycje ze statusami; biuro zaznacza pozycje i zmienia status (W realizacji / Dostarczone / Odrzuć) */
  zakOkno(z) {
    if (!z) return;
    const biuro = Session.isBiuro(), wyb = new Set(z.poz.filter(x => x.st !== 'dostarczone' && x.st !== 'odrzucone').map(x => x.lp));
    const rys = () => {
      modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="dialog" aria-label="Zgłoszenie">
        <div class="shead"><h3 class="m" style="font-size:17px">${z.nr ? U.esc(z.nr) : 'Nowe zgłoszenie'}</h3>${zakChip(z)}</div>
        <div class="sbody">
          <div><b>${U.esc(zakBud(z.kod))}</b><div class="mute">Zgłosił: ${U.esc(z.kto)} · ${U.fmt(z.ts)}${z.czeka ? ' · czeka na wysłanie (numer nada serwer)' : ''}</div></div>
          <table class="ztab"><thead><tr>${biuro ? '<th></th>' : ''}<th>Pozycja</th><th>Ilość</th><th>Status</th></tr></thead><tbody>${z.poz.map(x => `<tr>${biuro ? `<td><input type="checkbox" data-lp="${x.lp}" ${wyb.has(x.lp) ? 'checked' : ''} style="width:22px;height:22px"></td>` : ''}<td>${U.esc(x.n)}${x.uw ? `<div class="mute" style="font-size:12px">${U.esc(x.uw)}</div>` : ''}</td><td class="m">${U.esc(String(x.il).replace('.', ','))} ${U.esc(x.j || '')}</td><td><span class="chip ${ZAK_KL[x.st]}">${ZAK_ST[x.st]}</span>${x.zm ? `<div class="mute" style="font-size:11px">${U.esc(x.zm)}</div>` : ''}</td></tr>`).join('')}</tbody></table>
          ${z.uwagi ? `<div><span class="mute">Uwagi:</span> ${U.esc(z.uwagi)}</div>` : ''}
          ${(z.foto || []).length ? `<div class="thumbs" id="zkFot"></div>` : ''}
          ${biuro ? '<label class="fld"><span class="mute">Powód (przy „Odrzuć”)</span><input id="zkP" type="text"></label>' : ''}
          ${biuro ? `<div class="zlog"><div class="lbl">Log zmian</div>${(z.log || []).length ? z.log.slice().reverse().map(l => `<div class="zlogw"><span class="m">${U.esc(U.fmt(l.ts))}</span><b>${U.esc(l.kto)}</b><span>${U.esc(l.opis)}</span></div>`).join('') : '<div class="mute">Brak wpisów.</div>'}</div>` : ''}
        </div>
        <div class="sfoot zfoot">${biuro ? `<div class="zfr"><button class="btn" data-st="realizacja">W realizacji</button><button class="btn ok" data-st="dostarczone">Dostarczone</button><button class="btn bad" data-st="odrzucone">Odrzuć</button></div>` : ''}<div class="zfr"><button class="btn" id="zkX">Zamknij</button>${biuro ? `<button class="btn" id="zkE">${ic('edit')} Edytuj</button>` : ''}</div></div></div></div>`;
      $('#zkX').onclick = UI.close; $('#ov').onclick = e => { if (e.target.id === 'ov') UI.close(); };
      if ($('#zkE')) $('#zkE').onclick = () => Dialogs.zakNowe(z.kod, z);
      if ($('#zkFot')) zakMiniatury($('#zkFot'), z);
      modal.querySelectorAll('[data-lp]').forEach(c => c.onchange = () => { c.checked ? wyb.add(+c.dataset.lp) : wyb.delete(+c.dataset.lp); });
      modal.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => {
        if (!wyb.size) { UI.toast('Zaznacz pozycje.'); return; }
        const st = b.dataset.st, powod = (($('#zkP') || {}).value || '').trim();
        if (st === 'odrzucone' && !powod) { UI.toast('Wpisz powód odrzucenia.'); return; }
        const lp = wyb.size === z.poz.length ? null : [...wyb].sort((a, b2) => a - b2);
        await Zakupy.dodaj('zap_stat', { zid: z.nr || z.id, lp, st, powod });
        UI.toast(`${ZAK_ST[st]}: ${wyb.size} ${odm(wyb.size, 'pozycja', 'pozycje', 'pozycji')}`); UI.close(); UI.refresh();
      });
    };
    rys();
  },

  /* Typy urządzeń ze Słowników (od 1.51.0): prefiks, nazwa, kroki, nr seryjny, opis (kiedy stosować) – okno nad kartą urządzenia */
  typyInfo(pre) {
    const T = ((S.boot && S.boot.slowniki && S.boot.slowniki.typy) || []);
    const w = document.createElement('div'); w.className = 'ov center zsub';
    w.innerHTML = `<div class="dialog tydlg" role="dialog" aria-label="Typy urządzeń"><div class="shead"><h3>Typy urządzeń</h3><button class="btn sm" id="tyX" aria-label="Zamknij">✕</button></div>
      <div class="sbody"><input id="tyQ" type="search" placeholder="Szukaj prefiksu, typu, opisu…" class="tyq"><div id="tyL" class="tylist"></div></div></div>`;
    modal.appendChild(w);
    const rys = () => {
      const q = U.norm(w.querySelector('#tyQ').value || '');
      const L = T.filter(t => !q || U.norm([t.prefix, t.nazwa, t.opis, (t.kroki || []).join(' ')].join(' ')).includes(q));
      w.querySelector('#tyL').innerHTML = L.map(t => `<div class="tyrow${t.prefix === pre ? ' on' : ''}"><span class="typre m">${U.esc(t.prefix)}</span><div class="grow"><b>${U.esc(t.nazwa)}</b>${t.prefix === pre ? ' <span class="chip ok">to urządzenie</span>' : ''}
        ${t.opis ? `<div class="tyopis">${U.esc(t.opis)}</div>` : ''}
        <div class="tykroki">${(t.kroki || []).map(k => `<span>${U.esc(U.krok(k).n)}${U.krok(k).op.length ? ` <i class="mute">(${U.esc(U.krok(k).op.join(' / '))})</i>` : ''}</span>`).join('<span class="mute">›</span>')}</div>
        <div class="mute" style="font-size:12px">Nr seryjny: ${t.sn ? 'wymagany' : 'nie'}</div></div></div>`).join('') || '<div class="mute">Brak wyników.</div>';
    };
    rys();
    w.querySelector('#tyQ').oninput = rys;
    w.querySelector('#tyX').onclick = () => w.remove();
    w.onclick = e => { if (e.target === w) w.remove(); };
    const on = w.querySelector('.tyrow.on'); if (on) on.scrollIntoView({ block: 'center' });
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
  async zadanie(t, bud, osoby, dzien, preSt) {
    let wyb = preSt || null, powod = '';
    dzien = dzien || (UI.cur === 'plan' && UI.par.d) || U.day(new Date());
    const mojW = S.user ? (await Czas.dla(S.user.name, dzien)).find(w => w.zad === t.id) : null;   // od 1.58.0: mój wpis czasu do tego zadania
    const a = t.start ? new Date(t.start) : null, b = t.koniec ? new Date(t.koniec) : null;
    const kiedy = maGodziny(t) ? hm(a) + ' – ' + hm(b) : b ? 'do ' + b.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + (t.godzKoniec ? ' ' + hm(b) : '') : '—';
    const draw = () => {
      modal.innerHTML = `<div class="ov bottom" id="ov"><section class="zsheet" role="dialog" aria-label="Zadanie">
        <div class="grab"></div>
        <div class="row">${bud ? `<span class="chip">${U.esc(bud.kod)} · ${U.esc(String(bud.nazwa).replace(bud.kod, '').trim())}</span>` : `<span class="chip gr">${U.esc(t.listaNazwa || 'spoza budów ELWIS')}</span>`}<span class="chip gr">${U.esc(t.status || '')}${t.czeka ? ' · czeka na wysłanie' : ''}</span></div>
        <h2>${U.esc(t.nazwa)}</h2>
        <div class="zfacts"><div>Kiedy<b class="m">${U.esc(kiedy)}</b>${t.est ? 'szac. ' + String(Math.round(t.est / 36e5 * 10) / 10).replace('.', ',') + ' h' : ''}</div><div>Kto<b>${U.esc(osoby || '—')}</b></div></div>
        ${t.opis ? `<div><span class="lbl">Opis z ClickUp</span><p class="zopis">${U.esc(t.opis)}</p></div>` : ''}
        ${mojW ? `<div class="card czz"><div class="row"><span class="lbl grow">Mój czas pracy – ${U.esc(PC_dzien(dzien))}</span>${czChip(mojW)}</div><b>${U.esc(mojW.od)}–${U.esc(mojW.do)} · ${CZ.hTxt(CZ.h(mojW.od, mojW.do))}</b> <span class="mute">${U.esc(CZ_ST_TXT[mojW.st] || '')}</span></div>` : ''}
        ${mojW && mojW.stan === 'zatw' ? '<p class="mute">🔒 Zatwierdzone przez biuro – zmienić może tylko biuro.</p>' : `<div><span class="lbl">Jak poszło?</span>
          <div class="st3" style="margin-top:8px">${Object.entries(STATUS_ZAD).map(([k, v]) => `<button class="sb ${v.b} ${wyb === k ? 'on' : ''}" data-st="${k}">${ic(v.ic)}${v.t}<small>${k}</small></button>`).join('')}</div></div>`}
        ${wyb && wyb !== 'complete' ? `<div class="zwhy"><span class="lbl">Powód (opcjonalnie)</span>
          <div class="cats">${POWODY_ZAD.map(x => `<button data-pw="${U.esc(x)}" class="${x === powod ? 'on' : ''}">${U.esc(x)}</button>`).join('')}</div>
          <label><span class="lbl" style="display:block;margin-bottom:4px">Komentarz (opcjonalnie)</span><textarea id="zk" placeholder="Co zrobione, co zostało, warunek powrotu"></textarea></label></div>` : ''}
        <div class="zact">${bud ? `<button class="btn out" id="zBud">${ic('bud')}Przejdź do budowy</button>` : '<button class="btn" id="zX">Zamknij</button>'}<button class="btn pri" id="zOk" ${wyb && !(mojW && mojW.stan === 'zatw') ? '' : 'disabled'}>${wyb === 'on hold' ? 'Zapisz i wpisz, co robiłem' : wyb ? 'Dalej – godziny pracy' : 'Zapisz status'}</button></div>
      </section></div>`;
      $('#ov').onclick = e => { if (e.target.id === 'ov') UI.close(); };
      modal.querySelectorAll('[data-st]').forEach(x => x.onclick = () => { const k = $('#zk') ? $('#zk').value : ''; wyb = x.dataset.st; draw(); if (k && $('#zk')) $('#zk').value = k; });
      modal.querySelectorAll('[data-pw]').forEach(x => x.onclick = () => { const k = $('#zk').value; powod = powod === x.dataset.pw ? '' : x.dataset.pw; draw(); $('#zk').value = k; });
      if ($('#zX')) $('#zX').onclick = UI.close;
      if ($('#zBud')) $('#zBud').onclick = () => { UI.close(); openProject(bud.kod); };
      $('#zOk').onclick = async () => {
        if (!wyb) return;
        const kom = $('#zk') ? $('#zk').value.trim() : '';
        // od 1.58.0: Wykonane / Do kontynuacji → godziny pracy (status trafia do ClickUp po zatwierdzeniu przez biuro)
        if (wyb !== 'on hold') { UI.close(); return Dialogs.czasPracy(t, dzien, wyb, { bud, powod, kom }); }
        const k = (await DB.get('zadKolejka')) || [];
        k.push({ id: U.uid('z'), task: t.id, status: wyb, powod: wyb === 'complete' ? '' : powod, komentarz: wyb === 'complete' ? '' : kom, kto: S.user.name, ts: U.now(), nazwa: t.nazwa });
        await DB.set('zadKolejka', k); await liczOczekujace();
        UI.close(); UI.toast(navigator.onLine ? 'Status zapisany' : 'Status zapisany – wyśle się po połączeniu z siecią');
        if (navigator.onLine) Sync.soon();
        Dialogs.coRobilem(dzien, { tytul: '„' + t.nazwa + '” – niepodjęte' + (powod ? ' · powód: ' + powod : ''), kod: bud && bud.kod });   // od 1.58.0
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
  const opt = [['', 'Cała budowa', ''], ...etapyOf().map(e => [e.id, 'Etap ' + e.id, e.opis])];
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

/* ---------- Oznaczenie z projektu (kolumna „Oznaczenie proj.”, schemat 1.7, od 1.14.0) ---------- */
function urzO(id) { return ((S.proj || {}).urzadzenia || []).find(x => x.id === id) || null; }
function ozOf(id) { const u = typeof id === 'object' ? id : urzO(id); return u && u.oz ? u.oz : ''; }
function idOz(id) { const i = typeof id === 'object' ? id.id : id, o = ozOf(id); return o ? i + ' · ' + o : i; }
const ozHtml = id => { const o = ozOf(id); return o ? ` <span class="oz">${U.esc(o)}</span>` : ''; };
/* Poziom kondygnacji (od 1.15.0): opis na przyciskach i nagłówkach oraz kolejność od najniższego do najwyższego.
   Liczba → „-1 garaż”, „0 parter”, „1 piętro”; tekst z kolumny Kondygnacja (np. „+2 poddasze”, „dach niski”) – bez zmian. */
function poziomNr(k) {
  const t = String(k || '').trim().toLowerCase(), m = t.match(/^[+-]?\d+/);
  if (m) return Number(m[0]);
  if (/dach/.test(t)) return 1000 + (/wys/.test(t) ? 2 : /nis/.test(t) ? 0 : 1);
  if (/podd|strych/.test(t)) return 900;
  if (/parter/.test(t)) return 0;
  if (/gara|piwn|podziem/.test(t)) return -1;
  return t ? 500 : 2000;
}
function poziomTxt(k) {
  const t = String(k || '').trim(); if (!t) return 'bez kondygnacji';
  if (/^[+-]?\d+$/.test(t)) { const n = Number(t); return n < 0 ? n + ' garaż' : n === 0 ? '0 parter' : n + ' piętro'; }
  return t;
}
/* kondygnacja rzutu = najczęstsza kondygnacja urządzeń na arkuszu */
function kondArkusza(ark, lista) {
  const c = {}; lista.filter(u => u.arkusz === ark).forEach(u => { c[u.kond] = (c[u.kond] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || '';
}
// sortowanie naturalne: H2 < H10, Wk2 < Wk10
const natCmp = (a, b) => String(a).localeCompare(String(b), 'pl', { numeric: true, sensitivity: 'base' });

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
  if (u) return { t: idOz(u) + ' · ' + typOf(u.id).nazwa + (f.rodzaj === 'tabliczka' ? ' · tabliczka' : ''), s: [u.kond && poziomTxt(u.kond), u.arkusz].filter(Boolean).join(' · ') };
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
    return `<button class="li" data-u="${U.esc(u.id)}"><span class="st brak"></span><span class="grow"><b>${U.esc(u.id)}</b>${ozHtml(u)} ${U.esc(u.typ)}<br><span class="mute">${U.esc(x ? x.kat : '')}</span></span></button>`; }).join('')}</div>`;
}
/* Odpowiedzialny za brak (od 1.52.0): Słowniki kolumna B; serwer < 1.52.0 – lista domyślna */
function odpLista() { const l = (S.boot && S.boot.slowniki && S.boot.slowniki.odpowiedzialni) || []; return l.length ? l : ['Budowa', 'HupBud', 'AKPiA']; }
function odpHtml(sel) { return `<div><div class="mute" style="margin-bottom:8px">Odpowiedzialny <span class="mute">(wymagany)</span></div><div class="cats odp">${odpLista().map(k => `<button data-o="${U.esc(k)}" class="${k === sel ? 'on' : ''}">${U.esc(k)}</button>`).join('')}</div></div>`; }
function issueHtml(b) {
  const canClose = !b.zamk;   // od 1.9.0 brak może zamknąć każdy
  return `<div class="issue link ${b.zamk ? 'closed' : ''}" data-bid="${U.esc(b.id)}" role="button" tabindex="0" aria-label="Otwórz brak"><div class="row"><span class="chip ${b.zamk ? 'ok' : 'bad'}">${U.esc(b.kat)}</span>${b.odp ? `<span class="chip odp">${U.esc(b.odp)}</span>` : ''}${b.urz ? `<b>${U.esc(b.urz)}</b>${ozHtml(b.urz)}` : b.etap ? `<b>Etap ${U.esc(b.etap)}</b>` : '<b>Budowa</b>'}${b.blokuje && !b.zamk ? '<span class="chip warn">blokuje</span>' : ''}<span class="mute" style="margin-left:auto">${U.fmt(b.ts)}</span></div>
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
  return e.typ === 'krok' ? (d.wart ? '✓ ' : 'cofnięto: ') + d.nazwa : e.typ === 'nr' ? 'nr seryjny ' + d.sn : e.typ === 'foto' ? (d.rodzaj === 'tabliczka' ? 'zdjęcie tabliczki' + (d.czytelna ? ` (czytelna${d.odp && d.odp.split(' > ').length > 1 ? ', podejście ' + d.odp.split(' > ').length : ''})` : '') : 'zdjęcie') : e.typ === 'brak' ? 'brak: ' + d.kat : e.typ === 'brak_zamk' ? 'zamknięcie braku' : e.typ === 'notatka' ? 'notatka' : e.typ === 'protokol' ? 'protokół: ' + Prot.opisStanu(e.d) : e.typ === 'foto_usun' ? 'usunięto zdjęcie' : e.typ === 'brak_edyc' ? (d.usun ? 'usunięto brak' : d.otworz ? 'ponownie otwarto brak' : 'edycja braku') : e.typ === 'brak_kom' ? 'komentarz do braku' : e.typ === 'urz_nowe' ? 'dodano urządzenie' : e.typ === 'urz_poz' ? 'zmiana pozycji na rzucie ' + (d.ark || '') : e.typ === 'urz_sys' ? 'system: ' + (d.sys || 'brak') : e.typ === 'urz_edyc' ? 'edycja danych: ' + Object.keys(d).filter(k => k !== 'było').map(k => ({ typ: 'typ', zasilanie: 'zasilanie', oz: 'oznaczenie', uwagi: 'uwagi' })[k] + ' „' + (d[k] || '—') + '”').join(', ') : e.typ === 'urz_usun' ? 'usunięto urządzenie – ' + (d.powod || '') : e.typ;
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

/* Przejście do urządzenia na rzucie (od 1.32.1): wspólne dla karty urządzenia, okna braku i zdjęć */
function maPozycje(id) { const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === id); return !!(u && u.arkusz && u.x !== '' && u.x != null); }
async function pokazNaRzucie(id) {
  const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === id); if (!u || !maPozycje(id)) return;
  if (!wEtapie(u)) await ustawEtap(u.etap || '');
  UI.close(); const fv = document.getElementById('fotoView'); if (fv) fv.remove();
  UI.go('rzut', { mode: 'rzut', ark: u.arkusz, focus: u.id, sys: '', f: 'all' });
}
/* Podgląd i usuwanie zdjęć (od 1.8.0): pełna rozdzielczość – zdjęcia z tego tabletu; z innych tabletów – pomniejszone, pobierane na żądanie */
const Foto = {
  info(fid) { return fold(S.ev).fotoInfo[fid] || {}; },
  mozeUsunac(fid) { const i = this.info(fid); return Session.isBiuro() || (i.kto && S.user && i.kto === S.user.name); },
  async obraz(fid) {
    const p = await DB.getPhoto(fid); if (p) return { blob: p.blob, pelne: true };
    const m = await DB.getFile('mini:' + fid); if (m) return { blob: m.blob, pelne: !!m.pelne, pobrane: !!m.pelne };
    if (!navigator.onLine) throw new Error('Zdjęcie jest na Dysku – połącz się z siecią, aby je zobaczyć.');
    const r = await API.fg('Pobieram zdjęcie', () => API.foto(S.kod, fid));
    const mini = await U.compress(U.b64ToBlob(r.b64, r.mime || 'image/jpeg'), 800, 0.6);   // pomniejszone – nie zapycha pamięci
    await DB.putFile('mini:' + fid, { blob: mini, mime: 'image/jpeg', name: fid + '.jpg' });
    return { blob: mini, pelne: false };
  },
  async podglad(fid) {
    const wrap = document.createElement('div'); wrap.className = 'fotoview'; wrap.id = 'fotoView';
    const i = this.info(fid);
    wrap.innerHTML = `<div class="fvbar"><span class="grow">${U.esc(i.urz || '')} ${U.esc(({ tabliczka: 'tabliczka', brak: 'zdjęcie braku', notatka: 'zdjęcie notatki' })[i.rodzaj] || 'zdjęcie')} · ${U.esc(i.kto || '')} ${i.ts ? U.fmt(i.ts) : ''} <span class="mute" id="fvJak"></span></span>
      ${i.urz && maPozycje(i.urz) ? `<button class="btn sm" id="fvRz" title="Pokaż urządzenie na rzucie">${ic('cel')} Na rzucie</button>` : ''}
      ${Session.isBiuro() ? `<button class="btn sm" id="fvPob" title="Zapisz zdjęcie w pełnej rozdzielczości">${ic('download')} Pobierz</button>` : ''}
      ${this.mozeUsunac(fid) ? '<button class="btn bad sm" id="fvDel">Usuń zdjęcie</button>' : ''}<button class="btn sm" id="fvX">✕ Zamknij</button></div>
      <div class="fvimg" id="fvImg"><span class="mute">Wczytuję…</span></div>`;
    document.body.appendChild(wrap);
    const zamknij = () => wrap.remove();
    $('#fvX').onclick = zamknij;
    if ($('#fvRz')) $('#fvRz').onclick = () => pokazNaRzucie(i.urz);
    if ($('#fvPob')) $('#fvPob').onclick = () => this.pobierz(fid);
    if ($('#fvDel')) $('#fvDel').onclick = async () => {
      if (!confirm('Usunąć to zdjęcie? Zniknie z aplikacji, a plik na Dysku trafi do kosza.')) return;
      await this.usun(fid); zamknij();
    };
    try {
      const o = await this.obraz(fid);
      this.pokaz(o.blob, o.pobrane ? '· pełna jakość (pobrane)' : o.pelne ? '· z tego tabletu' : '· podgląd pomniejszony');
    } catch (e) { $('#fvImg').innerHTML = `<p class="mute" style="color:#fff">${U.esc(e.message)}</p>`; }
  },
  /* Wyświetlenie w podglądzie z własnym powiększaniem (od 1.54.2): szczypanie / podwójne dotknięcie / kółko – powiększa się tylko zdjęcie */
  pokaz(blob, jak) {
    const box = $('#fvImg'); if (!box) return;
    box.innerHTML = ''; const img = new Image(); img.src = URL.createObjectURL(blob); img.alt = 'zdjęcie'; box.appendChild(img);
    if ($('#fvJak')) $('#fvJak').textContent = jak || '';
    let s = 1, x = 0, y = 0; const P = new Map(); let start = null, lastTap = 0;
    const baza = () => { const b = box.getBoundingClientRect(), r = img.getBoundingClientRect(); return { b, w: r.width / s, h: r.height / s }; };
    const ogranicz = () => { const { b, w, h } = baza(); const ox = img.offsetLeft, oy = img.offsetTop;
      if (s <= 1) { s = 1; x = 0; y = 0; return; }
      const minX = b.width - (ox + w * s), minY = b.height - (oy + h * s);
      x = w * s > b.width ? Math.min(-ox, Math.max(minX, x)) : (b.width - w * s) / 2 - ox;
      y = h * s > b.height ? Math.min(-oy, Math.max(minY, y)) : (b.height - h * s) / 2 - oy; };
    const ustaw = () => { ogranicz(); img.style.transform = s === 1 ? '' : `translate(${x}px,${y}px) scale(${s})`; };
    const zoomDo = (ns, cx, cy) => { const b = box.getBoundingClientRect(); const px = cx - b.left - img.offsetLeft, py = cy - b.top - img.offsetTop;
      ns = Math.min(8, Math.max(1, ns)); x = px - (px - x) * ns / s; y = py - (py - y) * ns / s; s = ns; ustaw(); };
    box.onpointerdown = e => { box.setPointerCapture(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const t = Date.now(); if (P.size === 1 && t - lastTap < 300) { zoomDo(s > 1 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; } else lastTap = t;
      start = { s, x, y, P: new Map(P) }; };
    box.onpointermove = e => { if (!P.has(e.pointerId) || !start) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const a = [...P.values()], a0 = [...start.P.values()];
      if (a.length >= 2 && a0.length >= 2) {
        const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y), c = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
        const ns = start.s * d(a[0], a[1]) / Math.max(1, d(a0[0], a0[1])); const c0 = c(a0[0], a0[1]), c1 = c(a[0], a[1]);
        s = start.s; x = start.x; y = start.y; zoomDo(ns, c0.x, c0.y); x += c1.x - c0.x; y += c1.y - c0.y; ustaw();
      } else if (a.length === 1 && s > 1) { const k = [...start.P.keys()][0], p0 = start.P.get(k) || a0[0]; x = start.x + a[0].x - p0.x; y = start.y + a[0].y - p0.y; ustaw(); } };
    const koniec = e => { P.delete(e.pointerId); start = { s, x, y, P: new Map(P) }; };
    box.onpointerup = koniec; box.onpointercancel = koniec;
    box.onwheel = e => { e.preventDefault(); zoomDo(s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); };
  },
  /* Pobranie zdjęcia (od 1.34.0, rola biuro): z tego tabletu – oryginał, z innych – pełny plik z Dysku (nie pomniejszony podgląd) */
  async pobierz(fid) {
    const i = this.info(fid);
    try {
      let blob = ((await DB.getPhoto(fid)) || {}).blob;
      if (!blob) {
        if (!navigator.onLine) { UI.toast('Połącz się z siecią, aby pobrać zdjęcie z Dysku'); return; }
        UI.toast('Pobieram zdjęcie…'); const r = await API.fg('Pobieram zdjęcie', () => API.foto(S.kod, fid)); blob = U.b64ToBlob(r.b64, r.mime || 'image/jpeg');
        // od 1.54.2: pełna jakość zastępuje pomniejszony podgląd – w otwartym oknie i w pamięci tabletu
        await DB.putFile('mini:' + fid, { blob, mime: blob.type || 'image/jpeg', name: fid + '.jpg', pelne: 1 });
        if ($('#fotoView')) this.pokaz(blob, '· pełna jakość (pobrane)');
      }
      const dz = (i.ts || new Date().toISOString()).slice(0, 10);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${S.kod}_${(i.urz && i.urz !== 'BUDOWA') ? i.urz + '_' : ''}${dz}_${fid}.jpg`.replace(/[^\w.\-]+/g, '_');
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    } catch (e) { UI.toast(e.message); }
  },
  /* Miniatury do ZIP (od 1.35.0, rola biuro): zdjęcia z zakładki, 800 px; brakujące na tablecie pobierane z Dysku (i zapamiętane jako podgląd) */
  async pobierzMiniatury(lista, filtr) {
    const b = $('#gMini'); if (!b || b.disabled) return;
    const pliki = [], uzyte = {}; let brak = 0;
    b.disabled = true;
    try {
      for (let k = 0; k < lista.length; k++) {
        b.textContent = `Przygotowuję ${k + 1} / ${lista.length}…`;
        const f = lista[k];
        try {
          let blob; const ph = await DB.getPhoto(f.fid);
          if (ph) blob = await U.compress(ph.blob, 800, 0.7);
          else {
            const m = await DB.getFile('mini:' + f.fid);
            if (m) blob = m.blob;
            else if (navigator.onLine) blob = (await this.obraz(f.fid)).blob;
          }
          if (!blob) { brak++; continue; }
          let nm = `${(f.ts || '').slice(0, 10)}_${(f.urz && f.urz !== 'BUDOWA') ? f.urz : f.rodzaj || 'budowa'}`.replace(/[^\w\-]+/g, '_');
          uzyte[nm] = (uzyte[nm] || 0) + 1; if (uzyte[nm] > 1) nm += '_' + uzyte[nm];
          pliki.push({ name: nm + '.jpg', data: new Uint8Array(await blob.arrayBuffer()) });
        } catch (e) { brak++; }
      }
      if (!pliki.length) { UI.toast('Brak zdjęć do pobrania – połącz się z siecią'); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(U.zip(pliki));
      a.download = `${S.kod}_zdjecia_${filtr === 'all' ? 'wszystkie' : filtr}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      UI.toast(`Pobrano ${pliki.length} ${odm(pliki.length, 'zdjęcie', 'zdjęcia', 'zdjęć')}${brak ? ` · pominięto ${brak} (brak sieci lub pliku na Dysku)` : ''}`);
    } finally { if ($('#gMini')) { b.disabled = false; b.innerHTML = `${ic('download')} Pobierz miniatury (${lista.length})`; } }
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
  if (u) l.push([idOz(u), typOf(u.id).nazwa, [u.kond && poziomTxt(u.kond), u.arkusz].filter(Boolean).join(' '), co].filter(Boolean).join(' · '));
  else if (co) l.push(co + (urz && urz !== 'BUDOWA' ? ' · ' + urz : ''));
  const d = new Date();
  l.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + hm(d) + ' · ' + (S.user ? S.user.name : ''));
  return l.filter(Boolean);
}
async function storePhoto(file, urz, rodzaj, rot = 0) {
  const blob = await U.compress(file, 1600, 0.75, opisNaZdjecie(urz, rodzaj), rot);
  const id = U.uid('f');
  const n = (await DB.eventsFor(S.kod)).filter(e => e.typ === 'foto' && e.urz === urz).length + 1;
  const name = rodzaj === 'tabliczka' ? `${urz}_tabliczka.jpg` : `${urz}_${U.day()}_${n}_${id.slice(-4)}.jpg`;
  await DB.putPhoto({ id, kod: S.kod, name, blob, sent: 0 });
  return id;
}
/* Aparat wbudowany w ELWIS (od 1.54.2, tylko tabliczki): podgląd z kamery, migawka, latarka – bez systemowego ekranu „OK / Powtórz”.
   Brak dostępu do kamery → aparat systemowy (pickFile). */
async function aparat(cb) {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return pickFile(cb);
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 4096 }, height: { ideal: 3072 } }, audio: false }); }
  catch (e) { UI.toast('Brak dostępu do kamery – otwieram aparat systemowy'); return pickFile(cb); }
  const tr = stream.getVideoTracks()[0], cap = (tr.getCapabilities && tr.getCapabilities()) || {};
  const w = document.createElement('div'); w.className = 'kam'; w.id = 'kamView';
  w.innerHTML = `<video playsinline autoplay muted id="kmV"></video>
    <div class="kbar top"><span class="grow">Zdjęcie tabliczki – cała tabliczka w kadrze, bez odblasku</span><button class="btn sm" id="kmX">✕ Zamknij</button></div>
    <div class="kbar bot"><button class="btn sm" id="kmS" title="Aparat systemowy">Aparat systemowy</button>
      <button class="kshot" id="kmF" aria-label="Zrób zdjęcie"></button>
      ${cap.torch ? '<button class="btn sm" id="kmT" aria-pressed="false">🔦 Latarka</button>' : '<span class="kpl"></span>'}</div>`;
  document.body.appendChild(w);
  const v = w.querySelector('#kmV'); v.srcObject = stream;
  const stop = () => { stream.getTracks().forEach(t => t.stop()); w.remove(); };
  let torch = false;
  if (w.querySelector('#kmT')) w.querySelector('#kmT').onclick = async e => { torch = !torch; try { await tr.applyConstraints({ advanced: [{ torch }] }); e.currentTarget.setAttribute('aria-pressed', torch); e.currentTarget.classList.toggle('on', torch); } catch (_) { UI.toast('Latarka niedostępna'); } };
  if (cap.focusMode && cap.focusMode.includes('continuous')) tr.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
  v.onclick = e => { if (!cap.pointsOfInterest) return; const b = v.getBoundingClientRect(); tr.applyConstraints({ advanced: [{ pointsOfInterest: [{ x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }], focusMode: 'single-shot' }] }).catch(() => {}); };
  w.querySelector('#kmX').onclick = stop;
  w.querySelector('#kmS').onclick = () => { stop(); pickFile(cb); };
  w.querySelector('#kmF').onclick = async () => {
    const btn = w.querySelector('#kmF'); if (btn.disabled) return; btn.disabled = true;
    let blob = null;
    try { if (window.ImageCapture) blob = await new ImageCapture(tr).takePhoto(); } catch (_) { blob = null; }
    if (!blob) { const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)); }
    stop(); cb(new File([blob], 'tabliczka.jpg', { type: blob.type || 'image/jpeg' }));
  };
}
/* Tabliczka (od 1.54.2): po zdjęciu pytanie o czytelność – Powtórz / Zachowaj / Anuluj; odpowiedzi zapisane w zdarzeniu foto (pola czytelna, odp) */
function tabliczkaFoto(urz) {
  const odp = [];
  const pytaj = f => {
    const url = URL.createObjectURL(f);
    const w = document.createElement('div'); w.className = 'ov center zsub';
    w.innerHTML = `<div class="dialog tabdlg" role="dialog" aria-label="Czytelność tabliczki"><div class="shead"><h3>Czy tabliczka jest czytelna?</h3></div>
      <div class="sbody"><div class="tabbox" id="tbBox"><img src="${url}" alt="zdjęcie tabliczki" class="tabimg" id="tbImg"></div>
        <div class="tabrot"><button class="btn sm" id="tbL" title="Obróć o 90° w lewo">↺ 90°</button><input type="range" id="tbR" min="-180" max="180" step="1" value="0" aria-label="Obrót zdjęcia"><button class="btn sm" id="tbRr" title="Obróć o 90° w prawo">90° ↻</button><span class="m tabdeg" id="tbD">0°</span><button class="btn sm" id="tb0" title="Bez obrotu, bez powiększenia">Reset</button></div>
        <p class="mute" style="margin:0">Ustaw tekst poziomo, powiększ palcami i sprawdź nr seryjny, model i dane. Zapisuje się całe zdjęcie z obrotem z paska.</p></div>
      <div class="sfoot"><button class="btn" id="tbA">Anuluj</button><span class="grow"></span><button class="btn" id="tbP">↻ Powtórz</button><button class="btn pri" id="tbZ">✓ Zachowaj</button></div></div>`;
    modal.appendChild(w);
    const zamknij = () => { w.remove(); URL.revokeObjectURL(url); };
    // obrót (pasek / ±90°) i powiększanie palcami – tylko podgląd; obrót trafia do zapisu
    let rot = 0, s = 1, x = 0, y = 0; const P = new Map(); let st = null;
    const im = w.querySelector('#tbImg'), box = w.querySelector('#tbBox'), R = w.querySelector('#tbR');
    const nor = v => { v = ((v + 180) % 360 + 360) % 360 - 180; return v === -180 ? 180 : v; };
    const pokaz = () => { if (s <= 1) { s = 1; x = 0; y = 0; } im.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${s})`; R.value = rot; w.querySelector('#tbD').textContent = rot + '°'; };
    R.oninput = () => { rot = +R.value; pokaz(); };
    w.querySelector('#tbL').onclick = () => { rot = nor(rot - 90); pokaz(); };
    w.querySelector('#tbRr').onclick = () => { rot = nor(rot + 90); pokaz(); };
    w.querySelector('#tb0').onclick = () => { rot = 0; s = 1; pokaz(); };
    box.onpointerdown = e => { box.setPointerCapture(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY }); st = { s, x, y, P: new Map(P) }; };
    box.onpointermove = e => { if (!P.has(e.pointerId) || !st) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const a = [...P.values()], a0 = [...st.P.values()], d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
      if (a.length >= 2 && a0.length >= 2) { s = Math.min(8, Math.max(1, st.s * d(a[0], a[1]) / Math.max(1, d(a0[0], a0[1])))); x = st.x + (a[0].x + a[1].x - a0[0].x - a0[1].x) / 2; y = st.y + (a[0].y + a[1].y - a0[0].y - a0[1].y) / 2; }
      else if (a.length === 1 && s > 1) { const p0 = st.P.get(e.pointerId) || a0[0]; x = st.x + a[0].x - p0.x; y = st.y + a[0].y - p0.y; }
      pokaz(); };
    const kon = e => { P.delete(e.pointerId); st = { s, x, y, P: new Map(P) }; };
    box.onpointerup = kon; box.onpointercancel = kon;
    box.onwheel = e => { e.preventDefault(); s = Math.min(8, Math.max(1, s * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); pokaz(); };
    w.querySelector('#tbA').onclick = () => { odp.push('anuluj'); zamknij(); UI.toast('Zdjęcie tabliczki odrzucone'); };
    w.querySelector('#tbP').onclick = () => { odp.push('powtórz'); zamknij(); aparat(pytaj); };
    w.querySelector('#tbZ').onclick = async () => {
      odp.push('zachowaj'); zamknij();
      const fid = await storePhoto(f, urz, 'tabliczka', rot);
      await addEvent('foto', urz, { fid, rodzaj: 'tabliczka', czytelna: 'tak', odp: odp.join(' > '), ...(rot ? { obrot: rot } : {}) });
      UI.toast('Zdjęcie tabliczki zapisane' + (odp.length > 1 ? ` (podejście ${odp.length})` : '')); Dialogs.device(urz); UI.refresh();
    };
  };
  aparat(pytaj);
}
function pickPhoto(urz, rodzaj) {
  if (rodzaj === 'tabliczka') return tabliczkaFoto(urz);
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
async function wczytajBudowe(kod) {
  S.kod = kod;
  S.proj = await DB.get('proj:' + kod) || null;
  S.ev = await DB.eventsFor(kod);
  dolaczNowe();
  await wczytajEtap(kod);
}
/* powrót do ostatniego ekranu po ponownym otwarciu aplikacji (od 1.13.0) */
async function przywrocEkran() {
  const o = S.user && await DB.get('ostatni:' + S.user.name);
  if (!o || !o.v || !Views[o.v]) return false;
  if (o.v === 'protokol' && o.par && o.par.nowy && !o.par.pid) { o.v = 'protokoly'; o.par = {}; }   // nie zakładamy drugiego szkicu
  if (o.kod) { const pp = ((S.boot && S.boot.projekty) || []).find(x => x.kod === o.kod); if (!pp || !dostepDoBudowy(pp)) return false; await wczytajBudowe(o.kod); }
  else if (!['plan', 'home', 'dokumenty'].includes(o.v)) return false;
  UI.stos = (o.stos || []).filter(e => e && Views[e.v]);
  UI.cur = o.v; UI.par = o.par || {}; UI.pv = null; UI.refresh();
  return true;
}
/* Telefon kierownika HUP-BUD (od 1.44.0): Baza → Projekty → Q (wpisuje skill z ekipy-i-pracownicy.md) */
function telKier(p) { return (p && p.kierownik && p.telKier) || ''; }
/* Dostęp podwykonawcy (od 1.43.0): klucz z ograniczeniem do wybranych budów – serwer odsyła `dostep` w bootstrap */
function podw() { return !!(S.boot && S.boot.dostep); }
async function openProject(kod) {
  const pp = ((S.boot && S.boot.projekty) || []).find(x => x.kod === kod);
  if (!dostepDoBudowy(pp)) return brakDostepu(pp);
  await wczytajBudowe(kod);
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
    try { f = await API.fg('Pobieram plik', () => pobierzPlik(id, (i, n) => UI.toast('Pobieram plik… ' + Math.round(i / n * 100) + '%'))); }
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
  $('#sFull').onclick = async () => {   // od 1.46.0: potwierdzenie przed pełnym pobraniem
    const st = await Pamiec.stan();
    if (!confirm(`Pobrać wszystko ponownie?\nTablet pobierze od nowa dane ${st.budowy} ${odm(st.budowy, 'budowy', 'budów', 'budów')} z pamięci i dokumenty techniczne. Może to potrwać kilka–kilkanaście minut i zużyć dużo danych – używaj tylko przez WiFi.`)) return;
    UI.close(); Sync.run(true);
  };
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
  await API.load(); API.onWait = () => UI.czekaj(); if (typeof PC !== 'undefined') await PC.init();   // od 1.56.1: odliczanie oczekiwania na serwer
  // link podwykonawcy (od 1.43.0): …/elwis/#cfg=<adres serwera i klucz> – zapis konfiguracji i usunięcie z paska adresu
  try {
    const m = location.hash.match(/#cfg=([\w\-=]+)/);
    if (m) {
      history.replaceState(null, '', location.pathname + location.search);
      const c = JSON.parse(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')));
      const stary = API.cfg();
      if (c && /^https:\/\/script\.google\.com\//.test(c.s) && c.k && (!stary || stary.key !== c.k)) {
        if (stary && (await DB.unsynced()).length) { if (!confirm('Na tym urządzeniu są niewysłane wpisy innego dostępu. Zastąpić konfigurację?')) throw 0; }
        if (stary) await DB.clearAll();
        await API.setCfg({ url: c.s, key: c.k, tablet: 'Dostęp przez link' });
        const b = await API.test(c.s, c.k); await DB.set('boot', b);
      }
    }
  } catch (e) { if (e) console.warn('link', e); }
  S.boot = await DB.get('boot'); S.lastSync = await DB.get('lastSync');
  S.pogoda = await DB.get('pogoda');
  S.pinezki = (await DB.get('pinezki')) || {};
  await liczOczekujace().catch(() => { });
  try { await Pamiec.limit(); } catch (e) { }
  $('#topVer').textContent = 'v' + APP_VERSION;
  $('#btnSync').onclick = () => Sync.run();
  // dolny pasek (od 1.13.0: Plan · Budowy · Dokumenty techniczne)
  $('#nPlan').onclick = () => { UI.close(); UI.go('plan'); };
  $('#nBud').onclick = () => { UI.close(); UI.go('home'); };
  $('#nDok').onclick = () => { UI.close(); UI.go('dokumenty', { typ: 'tech' }); };
  $('#nPrio').onclick = () => { UI.close(); UI.go('zmiany'); };
  $('#nZak').onclick = () => { UI.close(); UI.go('zakupy'); };
  // od 1.50.1: przy otwartym oknie (modal) tło nie przewija się i nie powiększa (blokada gestu powiększania poza oknem)
  new MutationObserver(() => document.body.classList.toggle('mopen', !!modal.firstElementChild)).observe(modal, { childList: true });
  $('#btnUser').onclick = settings;
  window.addEventListener('online', () => { UI.net(); Sync.run(); });
  window.addEventListener('offline', () => UI.net());
  // systemowy przycisk „wstecz” Androida: zamyka okno albo cofa ekran tak jak strzałka w aplikacji (od 1.11.7)
  // od 1.13.0: Chrome na Androidzie pomija przy „wstecz” wpisy historii dodane bez dotknięcia ekranu –
  // wpis „straży” dodajemy dopiero przy dotknięciu (z aktywacją użytkownika) i odnawiamy po każdym „wstecz”
  let straz = false;
  const uzbroj = () => { if (!straz) { history.pushState({ elwis: 1 }, ''); straz = true; } };
  document.addEventListener('pointerdown', uzbroj, true);
  document.addEventListener('keydown', uzbroj, true);
  // od 1.12.0: na ekranie głównym (plan) pytanie „Zamknąć aplikację?”; kolejne „wstecz” przy otwartym pytaniu zamyka aplikację
  window.addEventListener('popstate', () => {
    straz = false;
    if ($('#fotoView')) { $('#fotoView').remove(); uzbroj(); return; }
    const okno = !!modal.innerHTML, ekran = !$('#btnBack').hidden;
    if (okno || ekran) { uzbroj(); okno ? UI.close() : $('#btnBack').click(); return; }
    if (!S.user) return;
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog" role="alertdialog" aria-label="Zamknąć aplikację?" style="max-width:480px">
      <div class="shead"><h3>Zamknąć aplikację?</h3></div>
      <div class="sbody"><p style="margin:0">Jesteś na ekranie głównym. Niewysłane dane zostaną na tablecie i wyślą się przy następnym uruchomieniu.</p><p class="mute" style="margin:0">Naciśnij jeszcze raz systemowe „wstecz”, aby zamknąć.</p></div>
      <div class="sfoot"><button class="btn" id="exNo">Nie, zostań</button><button class="btn pri" id="exYes">Tak, zamknij</button></div></div></div>`;
    const zostan = () => { UI.close(); uzbroj(); };
    $('#exNo').onclick = zostan; $('#ov').onclick = e => { if (e.target.id === 'ov') zostan(); };
    $('#exYes').onclick = () => { window.close(); history.back(); setTimeout(() => UI.toast('Naciśnij systemowe „wstecz”, aby zamknąć aplikację.'), 400); };
  });
  setInterval(() => { if (navigator.onLine && S.user) Sync.run(); }, 10 * 60e3);   // automatyczna synchronizacja co 10 min (od 1.31.6; wcześniej co 3 min)
  setInterval(async () => { if (S.user && S.user.exp < Date.now()) { await Session.logout(); UI.close(); UI.toast('Sesja wygasła – zaloguj się ponownie.'); UI.go('login'); } }, 60e3);
  if (!API.ready()) return UI.go('setup');
  await Session.load();
  if (!S.user) { UI.go('login'); if (navigator.onLine) Sync.run(); return; }
  if (!(await przywrocEkran().catch(() => false))) UI.go('plan');
  if (navigator.onLine) Sync.run();
})();


/* plakietka liczby nowych powiadomień na przycisku „Zmiany i ekipy” (od 1.56.0, rola biuro) */
async function powPlakietka() {
  const b = document.getElementById('nPowN'); if (!b) return;
  if (!Session.isBiuro()) { b.hidden = true; return; }
  const ust = (await DB.get('powUst')) || null, widz = (await DB.get('powWidz')) || 0, lista = (await DB.get('powiad')) || [];
  const n = lista.filter(x => x.ts > widz && (!ust || ust.typy.includes(x.t)) && ((ust && ust.moje) || x.kto !== (S.user && S.user.name))).length;
  b.textContent = n > 99 ? '99+' : String(n); b.hidden = !n;
}

/* liczba zgłoszeń czekających na termin – plakietka na „Nowe zadanie” (od 1.56.0) */
async function planNZ() { const b = document.getElementById('pNZn'); if (!b) return; const n = ((await DB.get('zadNoweKolejka')) || []).length; b.textContent = n; b.hidden = !n; }
/* powiadomienia – tylko tablet roli biuro; pobierane przyrostowo, trzymane 60 dni (od 1.56.0) */
async function pullPowiad() {
  if (!Session.isBiuro()) return;
  const stare = (await DB.get('powiad')) || [], since = stare.reduce((m, x) => Math.max(m, x.ts), 0);
  const r = await API.powiad(since); const ids = new Set(stare.map(x => x.id)), gr = Date.now() - 60 * 864e5;
  const lista = stare.concat((r.lista || []).filter(x => !ids.has(x.id))).filter(x => x.ts > gr).sort((a, b) => b.ts - a.ts);
  await DB.set('powiad', lista); powPlakietka();
}

/* licznik nowych na „Zapotrzebowanie” (od 1.56.0): biuro – nowe powiadomienia o zapotrzebowaniach od ostatniego otwarcia ekranu;
   pozostali – zmiany statusów pozycji w ich zgłoszeniach od ostatniego otwarcia */
async function zakPlakietka() {
  const b = document.getElementById('nZakN'); if (!b || !S.user) return;
  const widz = (await DB.get('zakWidz:' + S.user.name)) || null; let n = 0;
  if (!widz && !Session.isBiuro()) return zakWidziane();   // pierwszy raz – punkt odniesienia
  if (Session.isBiuro()) { const t = widz ? widz.ts : Date.now(); n = ((await DB.get('powiad')) || []).filter(x => x.t === 'zap' && x.ts > t && x.kto !== S.user.name).length; }
  else if (widz) { (await Zakupy.lista()).filter(z => z.kto === S.user.name).forEach(z => z.poz.forEach(x => { const k = (z.nr || z.id) + ':' + x.lp; if (widz.st[k] && widz.st[k] !== x.st) n++; })); }
  b.textContent = n > 99 ? '99+' : String(n); b.hidden = !n;
}
async function zakWidziane() {
  if (!S.user) return; const st = {};
  try { (await Zakupy.lista()).forEach(z => z.poz.forEach(x => { st[(z.nr || z.id) + ':' + x.lp] = x.st; })); } catch (e) { }
  await DB.set('zakWidz:' + S.user.name, { ts: Date.now(), st }); zakPlakietka();
}
