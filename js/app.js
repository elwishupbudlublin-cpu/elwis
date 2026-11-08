/* ELWIS – widoki aplikacji. */
const $ = (s, r = document) => r.querySelector(s);
const view = $('#view'), modal = $('#modal');
const ST = { 'czeka': 'czeka', 'w toku': 'wtoku', 'gotowe': 'gotowe', 'brak': 'brak' };

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
  go(v, par = {}) { this.cur = v; this.par = par; this.pv = null; this.refresh(); window.scrollTo(0, 0); },
  refresh() {
    if (this.cur === 'rzut' && this.pv && document.contains(this.pv.box)) {   // bez przeładowania rzutu (zachowuje powiększenie)
      const F = fold(S.ev); const urz = urzE();
      this.pv.recolor(id => { const u = urz.find(x => x.id === id); const st = u ? devStatus(u, F) : 'czeka'; return { cls: ST[st], label: id + ' – ' + st }; });
      const side = $('.planbox .side'); const ark = this.pv.ark;
      if (side) { const a = urz.filter(u => u.arkusz === ark); side.innerHTML = legend(a, F) + attention(a, F); side.querySelectorAll('[data-u]').forEach(b => b.onclick = () => Dialogs.device(b.dataset.u)); }
      this.net(); return;
    }
    const f = Views[this.cur]; if (f) f(this.par); this.net();
  },
  close() { modal.innerHTML = ''; }
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
    const prac = ((S.boot && S.boot.pracownicy) || []).filter(x => x.cu);
    const ja = prac.find(x => S.user && x.name === S.user.name);
    // wszyscy: zalogowany pierwszy, potem pozostali (biuro też – jego zadania były poza ekranem)
    const kolejnosc = [...(ja ? [ja] : []), ...prac.filter(x => x !== ja)];
    const wszystkieZad = (pl && pl.zadania) || [];
    // domyślnie w „Wszyscy” kolumny tylko osób, które mają zadania tego dnia (pozostałe – jednym dotknięciem w pasku osób)
    const ileOs = o => wszystkieZad.filter(t => naDzien(t, dzien) && t.osoby.includes(String(o.cu))).length;
    const ukryci = new Set(par.ukryj || kolejnosc.filter(o => o !== ja && !ileOs(o)).map(o => o.name));
    const osoby = wszyscy ? kolejnosc.filter(o => !ukryci.has(o.name)) : (ja ? [ja] : []);
    const mojeZad = t => !wszyscy ? (ja && t.osoby.includes(String(ja.cu))) : osoby.some(o => t.osoby.includes(String(o.cu)));
    const zad = wszystkieZad.filter(t => naDzien(t, dzien));
    const proj = (S.boot && S.boot.projekty) || [];
    const budowaZ = t => proj.find(p => p.listaCU && p.listaCU === t.lista);
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
    const tydzien = Array.from({ length: 7 }, (_, i) => { const k = dzienPlus(od, i); const d = new Date(k + 'T12:00'); return { k, d, n: wszystkieZad.filter(t => naDzien(t, k) && mojeZad(t)).length }; });
    const dzienTxt = d0.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
    const mojeDzis = zad.filter(mojeZad);
    const budowy = new Set(mojeDzis.map(t => t.lista).filter(Boolean));
    const godz = new Date().getHours();
    const powitanie = (godz < 12 ? 'Dzień dobry' : godz < 18 ? 'Cześć' : 'Dobry wieczór') + (S.user ? ', ' + S.user.name.split(' ')[0] : '');
    const blok = t => {
      const a = new Date(t.start), b2 = new Date(t.koniec);
      const top = ((a.getHours() - h0) * 60 + a.getMinutes()) / 60 * PX, hgt = Math.max(30, (b2 - a) / 36e5 * PX - 3);
      const bud = budowaZ(t);
      return `<button class="pblk ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="top:${top}px;height:${hgt}px;--c:${kol(t)}">
        <span class="pt">${hm(a)}–${hm(b2)}${t.zamk ? ' · ✓' : ''}</span><b>${U.esc(t.nazwa)}</b>${bud ? `<span class="pbadge">${U.esc(bud.kod)}${bud.wojskowy === 'tak' ? ' · W' : ''}</span>` : `<span class="pl">${U.esc(t.listaNazwa || '')}</span>`}</button>`;
    };
    const hmMin = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const blokAuto = ({ t, od, dl, bezEst }) => {
      const top = (od - h0 * 60) / 60 * PX, hgt = Math.max(30, dl / 60 * PX - 3), bud = budowaZ(t);
      return `<button class="pblk pauto ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="top:${top}px;height:${hgt}px;--c:${kol(t)}">
        <span class="pt">~${hmMin(od)}–${hmMin(od + dl)} · ${bezEst ? 'czas nieokreślony' : String(Math.round(dl / 6) / 10).replace('.', ',') + ' h'}${t.zamk ? ' · ✓' : ''}</span><b>${U.esc(t.nazwa)}</b>${bud ? `<span class="pbadge">${U.esc(bud.kod)}${bud.wojskowy === 'tak' ? ' · W' : ''}</span>` : ''}<span class="pauton">Kierownik nie określił pory dnia</span></button>`;
    };
    const karta = t => { const bud = budowaZ(t); return `<button class="pcard ${t.zamk ? 'done' : ''}" data-t="${U.esc(t.id)}" style="--c:${kol(t)}"><b>${U.esc(t.nazwa)}</b>
      <span class="mute">${U.esc(bud ? bud.nazwa : t.listaNazwa || 'zadanie spoza budów ELWIS')}${t.status ? ' · ' + U.esc(t.status) : ''}</span>${wszyscy ? `<span class="pwho">${U.esc(osobyTxt(t, prac))}</span>` : ''}</button>`; };
    const bezGodz = [...new Set(kolumny.flatMap(k => k.z.filter(t => !maGodziny(t) && !wpasowane.has(t.id))))];
    const terazTop = dzien === dzis ? ((new Date().getHours() - h0) * 60 + new Date().getMinutes()) / 60 * PX : -1;
    const inicjaly = n => n.split(' ').map(w => w[0]).join('');
    view.innerHTML = `
      <section class="phero">
        <div class="phtop">
          <div class="grow"><div class="phhi">${U.esc(powitanie)}</div><h1>${wszyscy ? 'Plan wszystkich' : 'Twój plan'}</h1></div>
          <div class="seg pseg"><button id="pMy" class="${wszyscy ? '' : 'on'}">Mój plan</button><button id="pAll" class="${wszyscy ? 'on' : ''}">Wszyscy</button></div>
          <button class="btn pbudbtn" id="pBud">🏗 Wszystkie budowy</button>
        </div>
        <div class="pweek" id="pWeek" title="Przeciągnij w lewo / prawo, aby zmienić tydzień">
          ${tydzien.map(x => `<button class="pday ${x.k === dzien ? 'on' : ''} ${x.k === dzis ? 'today' : ''}" data-day="${x.k}"><span>${x.d.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '')}</span><b>${x.d.getDate()}</b><i>${x.n ? '•'.repeat(Math.min(x.n, 4)) : '&nbsp;'}</i></button>`).join('')}
        </div>
        <div class="phsum"><span class="pchip">${U.esc(dzienTxt)}${dzien === dzis ? ' · dziś' : ''}</span><span class="pchip">${mojeDzis.length} ${odm(mojeDzis.length, 'zadanie', 'zadania', 'zadań')}</span><span class="pchip">${budowy.size} ${odm(budowy.size, 'budowa', 'budowy', 'budów')}</span>${dzien !== dzis ? '<button class="pchip pnow" data-day="' + dzis + '">↺ dziś</button>' : ''}</div>
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
          ${kolumny.map(k => `<div class="pcol" aria-label="Plan: ${U.esc(k.o.name)}">${k.z.filter(maGodziny).map(blok).join('')}${k.auto.map(blokAuto).join('')}</div>`).join('') || '<div class="pcol"></div>'}
        </div>
      </div>
      ${bezGodz.length ? `<h2>Bez godziny <span class="mute">(${bezGodz.length})</span></h2><div class="pcards">${bezGodz.map(karta).join('')}</div>` : ''}`;
    const idz = o => UI.go('plan', { ...par, ...o });
    view.querySelectorAll('[data-day]').forEach(b => b.onclick = () => idz({ d: b.dataset.day, od: b.classList.contains('pnow') ? undefined : od, ukryj: undefined }));
    // przeciąganie paska tygodnia w lewo / prawo = następny / poprzedni tydzień
    (() => {
      const w = $('#pWeek'); let x0 = null, dx = 0, przeciagniete = false;
      // przesunięcie o tyle dni, ile kafelków przeciągnięto (min. 1 dzień przy ruchu > 1/3 kafelka)
      const szer = () => { const k = w.querySelector('.pday'); return k ? k.getBoundingClientRect().width + 6 : 100; };
      const ruch = e => { if (x0 === null) return; dx = e.clientX - x0; if (Math.abs(dx) > 10) przeciagniete = true; if (przeciagniete) w.style.transform = `translateX(${dx}px)`; };
      const koniec = () => {
        if (x0 === null) return; x0 = null; window.removeEventListener('pointermove', ruch);
        w.style.transition = 'transform .2s'; w.style.transform = '';
        const sz = szer(); const n = Math.abs(dx) < sz / 3 ? 0 : Math.max(1, Math.round(Math.abs(dx) / sz)) * (dx < 0 ? 1 : -1);
        if (n) idz({ od: dzienPlus(od, n) });
      };
      w.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; przeciagniete = false; w.style.transition = 'none'; window.addEventListener('pointermove', ruch); window.addEventListener('pointerup', koniec, { once: true }); window.addEventListener('pointercancel', koniec, { once: true }); });
      w.addEventListener('click', e => { if (przeciagniete) { e.stopPropagation(); e.preventDefault(); przeciagniete = false; } }, true);
    })();
    $('#pAll').onclick = () => idz({ all: true, ukryj: undefined });
    $('#pMy').onclick = () => idz({ all: false });
    $('#pBud').onclick = () => UI.go('home');
    view.querySelectorAll('[data-who]').forEach(b => b.onclick = () => { const u = new Set(ukryci); u.has(b.dataset.who) ? u.delete(b.dataset.who) : u.add(b.dataset.who); idz({ ukryj: [...u] }); });
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      const t = zad.find(x => x.id === b.dataset.t); const bud = t && budowaZ(t);
      if (!bud) return UI.toast('To zadanie nie jest przypisane do budowy w ELWIS.');
      openProject(bud.kod);
    });
    // przewiń oś do „teraz” (albo do pierwszego zadania)
    const pt = view.querySelector('.pnowline') || view.querySelector('.pblk');
    if (pt) pt.scrollIntoView({ block: 'center', behavior: 'instant' });
    window.scrollTo(0, 0);
  },

  /* Lista budów */
  async home() {
    UI.header('wybór budowy', () => UI.go('plan'));
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

  /* Karta budowy */
  async budowa() {
    const p = curProj(); if (!p) return UI.go('home');
    if (!dostepDoBudowy(p)) { S.kod = null; UI.go('home'); return brakDostepu(p); }
    UI.header(p.nazwa, () => UI.go('home'));
    const pd = S.proj || {};
    const F = fold(S.ev);
    const urz = urzE();
    const cnt = liczStatusy(urz, F);
    const openB = Object.values(F.braki).filter(b => !b.zamk && brakWEtapie(b)).length;
    const openT = (pd.tematy || []).filter(t => t.status !== 'zamknięty').length;
    const zakres = (p.zakres || []);
    const has = k => zakres.some(z => U.norm(z).startsWith(U.norm(k)));
    const maps = p.lokalizacja ? (/^https?:/.test(p.lokalizacja) ? p.lokalizacja : 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(p.lokalizacja)) : (p.adres ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(p.adres) : '');
    const pct = urz.length ? Math.round(cnt.gotowe / urz.length * 100) : 0;
    const sheetsN = new Set(urz.map(u => u.arkusz).filter(a => a && (pd.rzuty || {})[a])).size;
    view.innerHTML = etapSwitch() + `
      <div class="grid2" style="grid-template-columns:minmax(280px,380px) 1fr">
        <div class="stack">
          ${p.wojskowy === 'tak' ? '<div class="badbox"><b>Obiekt wojskowy</b> – praca tylko dla osób z uprawnieniem M.</div>' : ''}
          <div class="card stack">
            <div><div class="mute">Adres</div>${U.esc(p.adres || '—')}</div>
            <div><div class="mute">Kontakt na budowie</div>${U.esc(p.kontakt || '—')}</div>
            <div><div class="mute">Uwagi dla ekip</div>${U.esc(p.uwagi || '—')}</div>
            ${maps ? `<a class="btn pri" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="${U.esc(maps)}" target="_blank" rel="noopener">Nawiguj</a>` : ''}
          </div>
          ${Session.isBiuro() && (pd.ostrzezenia || []).length ? `<div class="badbox"><b>Dane do poprawy (widzi tylko biuro)</b><br>${pd.ostrzezenia.map(U.esc).join('<br>')}</div>` : ''}
          <div class="card"><div class="lbl">Dokumenty pomocnicze</div>
            <div class="stack" style="margin-top:8px" id="docs">${(pd.pliki || []).map(f => `<button class="btn sm doc" data-f="${U.esc(f.id)}" style="text-align:left"><span class="grow">${U.esc(f.name)}</span><span class="mute" data-fs="${U.esc(f.id)}">${mb(f.size)}</span></button>`).join('') || '<span class="mute">Brak plików.</span>'}</div></div>
          ${dtrHtml(await DB.get('tech') || [])}
        </div>
        <div class="stack">
          <h1 style="margin:0">Co dziś robisz?</h1>
          <div class="grid2">
            <button class="tile main" id="tPodl" ${has('podłącz') || !zakres.length ? '' : 'disabled'}><b>Podłączenia wg listy</b>
              <span class="mute">${urz.length} urządzeń · ${sheetsN} rzutów${S.etap ? ' · etap ' + U.esc(S.etap) : ''}</span>
              <div class="bar"><i style="width:${pct}%;background:var(--ok)"></i></div>
              <span class="mute">${cnt.gotowe} gotowe · ${cnt['w toku']} w toku · ${cnt.brak} z brakiem</span></button>
            <button class="tile" id="tBraki"><b>${Session.isBiuro() ? 'Braki i tematy' : 'Braki'}</b><span class="mute">${openB} otwartych braków${Session.isBiuro() ? ' · ' + openT + ' tematów' : ''}</span></button>
            <button class="tile" id="tPostep"><b>Postęp budowy</b><span class="mute">${pct}% urządzeń gotowe</span></button>
            ${zakres.filter(z => !U.norm(z).startsWith('podlacz')).map(z => { const pr = Prot.lista().filter(x => U.norm(z).startsWith(U.norm(x.rodzaj)) || U.norm(x.rodzaj).startsWith(U.norm(z)));
              if (!pr.length) return `<button class="tile" disabled><b>${U.esc(z)}</b><span class="mute">w kolejnej wersji aplikacji</span></button>`;
              const ps = Object.values(F.prot).filter(x => pr.some(q => q.id === x.def));
              return `<button class="tile" data-prot="1"><b>${U.esc(z)} – protokoły</b><span class="mute">${pr.map(q => U.esc(q.nazwa)).join(', ')}</span><span class="mute">${ps.filter(x => x.stan !== 'roboczy').length} przesłanych · ${ps.filter(x => x.stan === 'roboczy').length} w trakcie</span></button>`; }).join('')}
            ${!zakres.some(z => Prot.lista().some(x => U.norm(z).startsWith(U.norm(x.rodzaj)) || U.norm(x.rodzaj).startsWith(U.norm(z)))) && Prot.wszystkie().length ? `<button class="tile" data-prot="1"><b>Protokoły</b><span class="mute">brak dedykowanych tej budowie · ${Prot.wszystkie().length} dostępnych</span></button>` : ''}
          </div>
          ${maEtapy() ? `<h2 style="margin:6px 0 0">Postęp etapów</h2><div class="grid2">${etapyOf().map(e => etapTile(e, F)).join('')}</div>` : ''}
          <div class="row"><button class="btn bad grow" id="bBrak">Zgłoś brak</button><button class="btn grow" id="bNote">Notatka z budowy</button></div>
        </div>
      </div>`;
    bindEtap();
    $('#tPodl').onclick = () => UI.go('rzut', {});
    $('#tBraki').onclick = () => UI.go('braki');
    $('#tPostep').onclick = () => UI.go('postep');
    view.querySelectorAll('[data-prot]').forEach(b => b.onclick = () => UI.go('protokoly'));
    $('#bBrak').onclick = () => Dialogs.brak('');
    $('#bNote').onclick = () => Dialogs.notatka('');
    view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => openFile(b.dataset.f));
    [...(pd.pliki || []), ...((await DB.get('tech')) || [])].forEach(async f => { const el = view.querySelector(`[data-fs="${CSS.escape(f.id)}"]`); if (el && await DB.hasFile(f.id)) el.textContent = mb(f.size) + ' ✓'; });
  },

  /* Rzuty + lista urządzeń */
  async rzut(par) {
    const p = curProj(); if (!p) return UI.go('home');
    UI.header(p.nazwa + ' · podłączenia', () => UI.go('budowa'));
    const pd = S.proj || {}; const F = fold(S.ev);
    const urz = urzE();
    const sheets = [...new Set(urz.map(u => u.arkusz).filter(Boolean))];
    const mode = par.mode || 'rzut';
    const ark = sheets.includes(par.ark) ? par.ark : sheets[0] || '';
    const filt = par.f || 'all';
    const sOf = u => devStatus(u, F);
    const vis = urz.filter(u => filt === 'all' || (filt === 'todo' ? sOf(u) !== 'gotowe' : filt === 'brak' ? sOf(u) === 'brak' : U.prefix(u.id) === filt));
    const prefixes = [...new Set(urz.map(u => U.prefix(u.id)))];
    view.innerHTML = etapSwitch() + `
      <div class="row" style="margin-bottom:10px">
        <div class="tabs grow" style="margin:0">${['rzut', 'lista'].map(m => `<button class="tab ${m === mode ? 'on' : ''}" data-m="${m}">${m === 'rzut' ? 'Rzut' : 'Lista'}</button>`).join('')}
        <span style="width:12px"></span>${[['all', 'Wszystkie'], ['todo', 'Do zrobienia'], ['brak', 'Z brakiem'], ...prefixes.map(x => [x, typOf(x + '1').nazwa])].map(([k, l]) => `<button class="tab ${k === filt ? 'on' : ''}" data-fl="${U.esc(k)}">${U.esc(l)}</button>`).join('')}</div>
      </div>
      ${mode === 'rzut' ? `
        <div class="tabs">${sheets.map(s => `<button class="tab ${s === ark ? 'on' : ''}" data-a="${U.esc(s)}">${U.esc(s)} · ${U.esc((urz.find(u => u.arkusz === s) || {}).kond || '')}</button>`).join('')}</div>
        <div class="planbox"><div class="plan" id="plan"><div class="noplan" id="noplan">Ładuję rzut…</div>
          <div class="planctl"><button id="zin" aria-label="Powiększ">+</button><button id="zout" aria-label="Pomniejsz">−</button><button id="zfit" aria-label="Cały rzut">⤢</button></div></div>
          <div class="side">${legend(urz.filter(u => u.arkusz === ark), F)}${attention(urz.filter(u => u.arkusz === ark), F)}</div></div>`
        : `<div class="list">${groupBy(vis, u => u.kond + ' · ' + u.arkusz).map(([g, arr]) => `<div class="li" style="background:#eef1f5;font-weight:600">${U.esc(g)}</div>` + arr.map(u => `
            <button class="li" data-u="${U.esc(u.id)}"><span class="st ${ST[sOf(u)]}"></span><b>${U.esc(u.id)}</b><span class="grow">${U.esc(u.typ)}<br><span class="mute">${U.esc(u.grupa)}${u.uwagi ? ' · ' + U.esc(u.uwagi) : ''}</span></span><span class="mute">${progress(u, F)}</span></button>`).join('')).join('') || '<div class="li mute">Brak urządzeń dla filtra.</div>'}</div>`}
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
    UI.header(p.nazwa + ' · braki', () => UI.go('budowa'));
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
    UI.header(p.nazwa + ' · postęp', () => UI.go('budowa'));
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
    modal.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => { UI.close(); UI.go('protokol', { pid: b.dataset.pid }); });
    modal.querySelectorAll('[data-npr]').forEach(b => b.onclick = () => { UI.close(); UI.go('protokol', { nowy: b.dataset.npr, urz: id }); });
    $('#dPlan').onclick = async () => { if (!wEtapie(u)) await ustawEtap(u.etap || ''); UI.close(); UI.go('rzut', { mode: 'rzut', ark: u.arkusz, focus: id }); };
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
const PLAN_KOLORY = ['#0b4f8a', '#1f7a4d', '#a3561b', '#6b3fa0', '#b02e4c', '#0e7c86', '#5a6b1e', '#8a5a0b'];
function planWiek(t) {
  const d = new Date(t);
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ', ' + hm(d);
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
    S.pending = (await DB.unsynced()).length + (await DB.unsentPhotos()).length; UI.net();
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
async function storePhoto(file, urz, rodzaj) {
  const blob = await U.compress(file);
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
  S.pending = (await DB.unsynced()).length + (await DB.unsentPhotos()).length;
  try { await Pamiec.limit(); } catch (e) { }
  $('#topVer').textContent = 'v' + APP_VERSION;
  $('#btnSync').onclick = () => Sync.run();
  $('#btnUser').onclick = settings;
  window.addEventListener('online', () => { UI.net(); Sync.run(); });
  window.addEventListener('offline', () => UI.net());
  setInterval(() => { if (navigator.onLine && S.user) Sync.run(); }, 3 * 60e3);
  setInterval(async () => { if (S.user && S.user.exp < Date.now()) { await Session.logout(); UI.close(); UI.toast('Sesja wygasła – zaloguj się ponownie.'); UI.go('login'); } }, 60e3);
  if (!API.ready()) return UI.go('setup');
  await Session.load();
  if (!S.user) { UI.go('login'); if (navigator.onLine) Sync.run(); return; }
  UI.go('plan');
  if (navigator.onLine) Sync.run();
})();
