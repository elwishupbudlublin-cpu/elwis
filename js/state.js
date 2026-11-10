/* ELWIS – stan aplikacji: sesja, budowy, zdarzenia, synchronizacja. */
const S = {
  boot: null,        // dane z bootstrap (pracownicy, budowy, słowniki, konfiguracja)
  user: null,        // {name, rola, ekipa, exp}
  kod: null,         // bieżąca budowa
  etap: '',          // wybrany etap budowy ('' = wszystkie)
  proj: null,        // dane budowy (urządzenia, tematy, pliki, rzuty)
  ev: [],            // zdarzenia bieżącej budowy
  syncing: false, lastSync: null, syncErr: null, pending: 0
};

const Session = {
  async load() {
    const s = await DB.get('session');
    if (s && s.exp > Date.now()) { S.user = s; return s; }
    S.user = null; return null;
  },
  async login(u) {
    const h = (S.boot && S.boot.sesjaGodziny) || 12;
    S.user = { name: u.name, rola: u.rola, ekipa: u.ekipa, exp: Date.now() + h * 3600e3 };
    await DB.set('session', S.user);
  },
  async logout() { if (S.user && S.user.rola === 'biuro') await DB.del('plan');   // pełny plan biura nie zostaje na tablecie
    S.user = null; await DB.del('session'); },
  isBiuro: () => S.user && S.user.rola === 'biuro'
};

/* Słowniki */
function typOf(id) {
  const p = U.prefix(id);
  const t = (S.boot && S.boot.slowniki.typy || []).find(x => x.prefix === p);
  return t || { prefix: p, nazwa: 'Typ ' + p, kroki: ['Podłączony'], sn: false };
}

/* Złożenie zdarzeń w stan urządzeń i braków */
function fold(events) {
  const ev = [...events].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : (a.id < b.id ? -1 : 1)));
  const dev = {};      // id -> {kroki:{i:{val,kto,ts}}, sn, foto:[], hist:[]}
  const braki = {};    // bid -> {...}
  const notes = [];
  const prot = {};     // pid -> ostatni zapis protokołu
  const D = id => (dev[id] = dev[id] || { kroki: {}, sn: '', snKto: '', foto: [], hist: [] });
  const fotoInfo = {};   // fid -> {kto, ts, urz, rodzaj} – autor zdjęcia (podgląd i usuwanie, od 1.8.0)
  const usuniete = new Set();
  const fi = (fid, e, rodzaj) => { if (fid && !fotoInfo[fid]) fotoInfo[fid] = { fid, kto: e.kto, ts: e.ts, urz: e.urz || '', rodzaj }; };
  for (const e of ev) {
    const d = e.d || {};
    if (e.urz) D(e.urz).hist.push(e);
    switch (e.typ) {
      case 'krok': D(e.urz).kroki[d.krok] = { val: !!d.wart, kto: e.kto, ts: e.ts, nazwa: d.nazwa }; break;
      case 'nr': D(e.urz).sn = d.sn || ''; D(e.urz).snKto = e.kto; break;
      case 'foto': if (e.urz) D(e.urz).foto.push({ fid: d.fid, rodzaj: d.rodzaj, kto: e.kto, ts: e.ts }); fi(d.fid, e, d.rodzaj); break;
      case 'brak': braki[e.id] = { id: e.id, urz: e.urz || '', kat: d.kat, opis: d.opis, blokuje: !!d.blokuje, foto: d.foto || [], etap: d.etap || '', kto: e.kto, ts: e.ts, zamk: null, kom: [], zm: [] }; (d.foto || []).forEach(f => fi(f, e, 'brak')); break;
      case 'brak_zamk': if (braki[d.bid]) braki[d.bid].zamk = { kto: e.kto, ts: e.ts, opis: d.opis || '' }; break;
      case 'brak_edyc': {   // edycja / usunięcie / ponowne otwarcie braku (od 1.9.0)
        const b = braki[d.bid]; if (!b) break;
        if (d.usun) { delete braki[d.bid]; break; }
        if (d.otworz) b.zamk = null;
        ['kat', 'opis'].forEach(k => { if (d[k] != null && d[k] !== '') b[k] = d[k]; });
        if (d.blokuje != null) b.blokuje = !!d.blokuje;
        (d.foto || []).forEach(f => { if (!b.foto.includes(f)) b.foto.push(f); fi(f, e, 'brak'); });
        b.zm.push({ kto: e.kto, ts: e.ts, co: d.usun ? 'usunięcie' : d.otworz ? 'ponowne otwarcie' : 'edycja' });
        break;
      }
      case 'brak_kom': if (braki[d.bid]) { braki[d.bid].kom.push({ kto: e.kto, ts: e.ts, tekst: d.tekst || '', foto: d.foto || [] }); (d.foto || []).forEach(f => fi(f, e, 'brak')); } break;
      case 'notatka': notes.push(e); (d.foto || []).forEach(f => fi(f, e, 'notatka')); break;
      case 'foto_usun': if (d.fid) usuniete.add(d.fid); break;
      case 'protokol': if (d.pid && d.stan === 'usuniety') { delete prot[d.pid]; break; }   // usunięty (1.6.1) – znika z list
        if (d.pid) prot[d.pid] = { pid: d.pid, def: d.def, wersja: d.wersja, prefiks: d.prefiks, stan: d.stan || 'roboczy', nr: d.nr || (prot[d.pid] && prot[d.pid].nr) || '', dane: d.dane || {}, urz: e.urz, kto: e.kto, ts: e.ts }; break;
    }
  }
  // usunięte zdjęcia znikają z kart urządzeń, braków i notatek (historia zostaje w zdarzeniach)
  if (usuniete.size) {
    Object.values(dev).forEach(x => { x.foto = x.foto.filter(f => !usuniete.has(f.fid)); });
    Object.values(braki).forEach(b => { b.foto = (b.foto || []).filter(f => !usuniete.has(f)); b.kom.forEach(k => { k.foto = k.foto.filter(f => !usuniete.has(f)); }); });
    usuniete.forEach(f => delete fotoInfo[f]);
  }
  return { dev, braki, notes, prot, fotoInfo, usuniete };
}

function devStatus(u, F) {
  const st = F.dev[u.id];
  const open = Object.values(F.braki).some(b => b.urz === u.id && !b.zamk);
  if (open) return 'brak';
  const kroki = typOf(u.id).kroki;
  if (!st) return 'czeka';
  const done = kroki.filter((k, i) => st.kroki[i] && st.kroki[i].val).length;
  if (done === kroki.length && kroki.length) return 'gotowe';
  return done ? 'w toku' : 'czeka';
}

/* Urządzenia dodane z tabletu (od 1.15.0, zdarzenie `urz_nowe`, tylko rola biuro): widoczne od razu – także offline,
   zanim serwer dopisze je do listy urządzeń. Do czasu synchronizacji mają ID tymczasowe `<prefiks>~xxxx`. */
function czyTmp(id) { return /~/.test(String(id || '')); }
function dolaczNowe() {
  if (!S.proj) return;
  const lst = (S.proj.urzadzenia || []).filter(u => !u._nowe);
  const ids = new Set(lst.map(u => u.id));
  (S.ev || []).filter(e => e.typ === 'urz_nowe').forEach(e => {
    const d = e.d || {}, id = e.urz || d.tmp; if (!id || ids.has(id)) return;
    ids.add(id);
    lst.push({ id, grupa: typOf(id).nazwa, typ: '', zasilanie: '', kond: d.kond || '', arkusz: d.arkusz || '', uwagi: d.uwagi || '',
      x: d.x == null ? '' : d.x, y: d.y == null ? '' : d.y, sn: '', status: 'czeka', etap: d.etap || '', oz: d.oz || '', _nowe: true });
  });
  S.proj.urzadzenia = lst;
}
/* ID nadane przez serwer → zamiana ID tymczasowych w zdarzeniach i nazwach zdjęć na tablecie */
async function zamienTmp(kod, mapa, przyjete) {
  const tmp = Object.keys(mapa || {});
  const zam = str => tmp.reduce((a, t) => a.split(t).join(mapa[t]), str);
  const ev = await DB.eventsFor(kod), zm = [];
  for (const e of ev) {
    const js = JSON.stringify({ urz: e.urz, d: e.d });
    const nowy = tmp.length ? zam(js) : js;
    const ok = e.typ === 'urz_nowe' && przyjete.has(e.id) && !e.synced;
    if (nowy !== js || ok) { const o = JSON.parse(nowy); zm.push({ ...e, urz: o.urz, d: o.d, ...(ok ? { synced: 1 } : {}) }); }
  }
  if (zm.length) await DB.putEvents(zm);
  if (tmp.length) for (const ph of await DB.unsentPhotos()) if (ph.kod === kod && tmp.some(t => ph.name.includes(t))) await DB.putPhoto({ ...ph, name: zam(ph.name) });
  if (kod === S.kod) { S.ev = await DB.eventsFor(kod); dolaczNowe(); }
}

/* Dodanie zdarzenia (offline) */
async function addEvent(typ, urz, d) {
  const e = { id: U.uid('e'), ts: U.now(), kto: S.user.name, tablet: (API.cfg() || {}).tablet || '', kod: S.kod, urz: urz || '', typ, d, synced: 0 };
  await DB.putEvent(e);
  S.ev.push(e);
  if (typ === 'urz_nowe') dolaczNowe();
  S.pending++;
  Sync.soon();
  return e;
}

/* liczba rzeczy czekających na wysłanie: zdarzenia, zdjęcia, statusy zadań (od 1.12.0) */
async function liczOczekujace() { S.pending = (await DB.unsynced()).length + (await DB.unsentPhotos()).length + ((await DB.get('zadKolejka')) || []).length; UI.net(); return S.pending; }

/* Synchronizacja */
const Sync = {
  timer: null,
  /* postęp synchronizacji (od 1.7.0): p = 0..1, t = opis etapu */
  prog(p, t) { S.prog = { p: Math.max(0, Math.min(1, p)), t: t || '' }; UI.prog(); },
  soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), 1500); },
  async run(full) {
    if (S.syncing || !API.ready()) return;
    if (!navigator.onLine) { UI.net(); return; }
    S.syncing = true; S.syncErr = null; UI.net();
    try {
      // 1. konfiguracja i słowniki
      this.prog(0.01, 'Konfiguracja');
      const b = await API.bootstrap(await Pamiec.opisStanu());
      if (String(b.schema).split('.')[0] !== '1') throw new Error('Nieznana wersja schematu danych: ' + b.schema + '. Zaktualizuj aplikację.');
      if (verLess(APP_VERSION, b.minApp)) throw new Error('Wymagana nowsza wersja aplikacji (' + b.minApp + '). Odśwież aplikację przy WiFi.');
      S.boot = b; await DB.set('boot', b);
      // pinezki z tabletu, które serwer już wpisał do Bazy, nie są dłużej potrzebne lokalnie (od 1.12.0)
      if (S.pinezki && Object.keys(S.pinezki).length) { for (const k of Object.keys(S.pinezki)) if ((b.projekty || []).some(p => p.kod === k && p.lokalizacja)) delete S.pinezki[k]; await DB.set('pinezki', S.pinezki); }
      // 1b. nowe urządzenia z tabletu – najpierw, żeby zdjęcia i wpisy dostały ID nadane przez serwer (od 1.15.0)
      const noweU = (await DB.unsynced()).filter(e => e.typ === 'urz_nowe');
      for (const kod of [...new Set(noweU.map(e => e.kod))]) {
        this.prog(0.04, 'Nowe urządzenia');
        const r = await API.push(kod, noweU.filter(e => e.kod === kod).map(({ synced, ...e }) => e), []);
        await zamienTmp(kod, r.nowe || {}, new Set(r.accepted || []));
      }
      // 2. zdjęcia (pojedynczo – mniejsze paczki)
      const fotki = await DB.unsentPhotos(); let fi = 0;
      for (const p of fotki) {
        this.prog(0.05 + 0.1 * fi++ / fotki.length, `Wysyłam zdjęcia ${fi}/${fotki.length}`);
        const b64 = await U.blobToB64(p.blob);
        await API.push(p.kod, [], [{ id: p.id, name: p.name, b64 }]);
        p.sent = 1; await DB.putPhoto(p);
      }
      // 3. zdarzenia – paczkami po budowie
      const un = await DB.unsynced();
      const byKod = {};
      un.forEach(e => (byKod[e.kod] = byKod[e.kod] || []).push(e));
      let wyslane = 0;
      for (const kod of Object.keys(byKod)) {
        const all = byKod[kod];
        for (let i = 0; i < all.length; i += 100) {
          this.prog(0.15 + 0.1 * wyslane / un.length, `Wysyłam wpisy ${wyslane}/${un.length}`); wyslane += Math.min(100, all.length - i);
          const part = all.slice(i, i + 100).map(({ synced, ...e }) => e);
          const r = await API.push(kod, part, []);
          const ok = new Set(r.accepted || []);
          const num = r.numery || {};   // numery protokołów nadane przez serwer
          const marked = all.slice(i, i + 100).filter(e => ok.has(e.id)).map(e => (e.typ === 'protokol' && e.d && num[e.d.pid] ? { ...e, d: { ...e.d, nr: num[e.d.pid] }, synced: 1 } : { ...e, synced: 1 }));
          await DB.putEvents(marked);
        }
      }
      // 3b. statusy zadań z kalendarza → ClickUp (od 1.12.0)
      const kol = (await DB.get('zadKolejka')) || [];
      if (kol.length) {
        this.prog(0.25, 'Wysyłam statusy zadań');
        try {
          const r = await API.zadania(kol.map(({ nazwa, ...z }) => z));
          const w = r.wyniki || {}, bledy = kol.filter(z => w[z.id] && !w[z.id].ok);
          const zostaja = ((await DB.get('zadKolejka')) || []).filter(z => !w[z.id]);
          await DB.set('zadKolejka', zostaja);
          if (bledy.length) UI.toast('Nie zmieniono statusu: ' + bledy[0].nazwa + ' – ' + w[bledy[0].id].blad);
        } catch (e) { if (/Nieznana operacja/.test(e.message)) S.planErr = 'Statusy zadań wymagają aktualizacji serwera ELWIS.'; else throw e; }
      }
      // 4. dane budów: bieżąca + ostatnio używane
      // plan dnia z ClickUp (±7 dni) – przed plikami, żeby był od razu po zalogowaniu
      this.prog(0.26, 'Plan dnia');
      await this.pullPlan();
      await this.pullPogoda();
      if (UI.cur === 'plan') UI.refresh();
      // bieżąca + 5 ostatnich (pozostałe z 30 – przy otwarciu albo „Pobierz wszystko ponownie”)
      const recent = (await DB.get('recent')) || [];
      const limit = await Pamiec.limit();
      const ile = Math.min(full ? PAMIEC_BUDOW : 6, Math.max(limit, 1));
      const kody = [...new Set([S.kod, ...recent.slice(0, ile)].filter(Boolean))].filter(k => b.projekty.some(p => p.kod === k));
      for (let j = 0; j < kody.length; j++) await this.pullProject(kody[j], full, (f, t) => this.prog(0.3 + 0.5 * (j + f) / kody.length, `Budowa ${j + 1}/${kody.length}` + (t ? ' · ' + t : '')));
      // 5. DTR wspólne dla wszystkich budów
      await this.pullTech(full, (f, t) => this.prog(0.8 + 0.18 * f, t));
      this.prog(0.99, 'Porządki w pamięci');
      await Pamiec.porzadki();
      await Pamiec.sprawdz();
      S.lastSync = Date.now(); await DB.set('lastSync', S.lastSync);
    } catch (err) {
      S.syncErr = err.message; console.warn('sync', err);
    } finally {
      S.syncing = false; S.prog = null;
      await liczOczekujace();
      UI.net(); if (!['login', 'setup', 'protokol'].includes(UI.cur)) UI.refresh();   // formularza protokołu nie przerysowujemy w trakcie pisania
    }
  },
  async pullProject(kod, full, onProg) {
    const pr = onProg || (() => { });
    pr(0, 'dane');
    const p = await API.project(kod);
    await DB.set('proj:' + kod, p);
    // rzuty i dokumenty do wglądu – do pamięci tabletu (raz, potem z pamięci)
    const ids = [...new Set([...Object.values(p.rzuty || {}), ...(p.pliki || []).filter(f => f.size <= 60e6).map(f => f.id)])];
    const brak = [];
    for (const id of ids) if (full || !(await DB.hasFile(id))) brak.push(id);
    for (let i = 0; i < brak.length; i++) {
      pr(0.05 + 0.85 * i / brak.length, `pliki ${i + 1}/${brak.length}`);
      try { await pobierzPlik(brak[i], (c, n) => pr(0.05 + 0.85 * (i + c / n) / brak.length, `pliki ${i + 1}/${brak.length} · ${Math.round(c / n * 100)}%`)); }
      catch (e) { console.warn('file', brak[i], e); if (/quota|QuotaExceeded/i.test(String(e && (e.name || e.message)))) { S.malo = true; break; } }
    }
    pr(0.92, 'wpisy z innych tabletów');
    // zdarzenia z innych tabletów
    let since = (await DB.get('seq:' + kod)) || 0;
    for (let guard = 0; guard < 50; guard++) {
      const r = await API.events(kod, since);
      if (r.events.length) {
        const local = new Set((await DB.eventsFor(kod)).map(e => e.id));
        // protokoły: wersja z serwera (z numerem nadanym przez serwer) zastępuje kopię z tabletu
        await DB.putEvents(r.events.filter(e => !local.has(e.id) || e.typ === 'protokol').map(e => ({ ...e, kod, synced: 1 })));
      }
      since = r.last; await DB.set('seq:' + kod, since);
      if (!r.more) break;
    }
    if (kod === S.kod) { S.proj = p; S.ev = await DB.eventsFor(kod); dolaczNowe(); }
    await Pamiec.oznacz(kod);
    await Pamiec.zmierz(kod, ids);
  },
  async pullPlan() {
    const od = U.day(new Date(Date.now() - 7 * 864e5)), d = U.day(new Date(Date.now() + 7 * 864e5));
    try { const r = await API.plan(od, d); await DB.set('plan', { od, do: d, zadania: r.zadania || [], brakKlucza: !!r.brakKlucza, pobrano: Date.now() }); S.planErr = ''; }
    catch (e) { S.planErr = /Nieznana operacja/.test(e.message) ? 'Plan dnia wymaga aktualizacji serwera ELWIS.' : 'Nie udało się pobrać planu: ' + e.message; }
  },
  /* Prognoza Open-Meteo (od 1.11.0): godziny 7–16 dla Lublina i budów z lokalizacją z planu; tylko odczyt, bez danych budowy */
  async pullPogoda() {
    try {
      const pl = (await DB.get('plan')) || { zadania: [] }; const proj = (S.boot && S.boot.projekty) || [];
      const miejsca = new Map([[POGODA_DOM.klucz, POGODA_DOM]]);
      pl.zadania.forEach(t => { const b = proj.find(p => p.listaCU && p.listaCU === t.lista); const w = b && wspolrzedne(lokBudowy(b)); if (w && miejsca.size < 8) miejsca.set(w.klucz, w); });
      const wynik = {};
      for (const [klucz, w] of miejsca) {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}&hourly=temperature_2m,precipitation,precipitation_probability,weather_code&timezone=Europe%2FWarsaw&past_days=7&forecast_days=16`);
        if (!r.ok) continue;
        const j = await r.json(), h = j.hourly || {}, dni = {};
        (h.time || []).forEach((t, i) => {
          const g = +t.slice(11, 13); if (g < 7 || g > 16) return;
          const k = t.slice(0, 10), d = dni[k] = dni[k] || { tmin: 99, tmax: -99, opad: 0, szansa: 0, kod: 0 };
          const temp = h.temperature_2m[i]; if (temp != null) { d.tmin = Math.min(d.tmin, temp); d.tmax = Math.max(d.tmax, temp); }
          d.opad += h.precipitation[i] || 0; d.kod = Math.max(d.kod, (h.weather_code || [])[i] || 0); d.szansa = Math.max(d.szansa, h.precipitation_probability[i] || 0);
        });
        Object.keys(dni).forEach(k => { if (dni[k].tmax === -99) delete dni[k]; });
        wynik[klucz] = dni;
      }
      if (Object.keys(wynik).length) { S.pogoda = wynik; await DB.set('pogoda', wynik); }
    } catch (e) { console.warn('pogoda', e); }   // brak prognozy nie blokuje synchronizacji
  },
  async pullTech(full, onProg) {
    const pr = onProg || (() => { });
    pr(0, 'DTR');
    let r;
    try { r = await API.techniczne(); } catch (e) { S.techInfo = 'Pozostałe DTR wymagają aktualizacji serwera ELWIS.'; return; }
    S.techInfo = r.brakFolderu ? 'Folder _Techniczne nie jest ustawiony w Konfiguracji.' : '';
    const old = (await DB.get('tech')) || [];
    await DB.set('tech', r.pliki);
    const now = new Set(r.pliki.map(f => f.id));
    for (const f of old) if (!now.has(f.id) && !(await Pamiec.uzywany(f.id))) await DB.delFile(f.id);   // usunięte z Dysku
    const doPobrania = [];
    for (const f of r.pliki) {
      if (f.size > 60e6) continue;
      const prev = old.find(x => x.id === f.id);
      const changed = prev && prev.zm && f.zm && prev.zm !== f.zm;
      if (!full && !changed && await DB.hasFile(f.id)) continue;
      doPobrania.push(f);
    }
    const razem = doPobrania.reduce((a, f) => a + (f.size || 0), 0) || 1; let gotowe = 0;
    for (let i = 0; i < doPobrania.length; i++) {
      const f = doPobrania[i];
      const opis = (c) => `DTR ${i + 1}/${doPobrania.length} · ${mbTxt(gotowe + c)} / ${mbTxt(razem)}`;
      pr(gotowe / razem, opis(0));
      try { await pobierzPlik(f.id, (c, n) => pr((gotowe + f.size * c / n) / razem, opis(f.size * c / n))); }
      catch (e) { console.warn('dtr', f.id, e); if (/quota|QuotaExceeded/i.test(String(e && (e.name || e.message)))) { S.malo = true; break; } }
      gotowe += f.size || 0;
    }
  }
};

/* Pamięć tabletu: komplet danych do 30 ostatnio otwieranych budów; przy małej ilości miejsca mniej (od 1.7.0) */
const PAMIEC_BUDOW = 30;
const REZERWA = 1024 * 1048576;   // 1 GB na zdjęcia, szkice i aktualizacje
const BUDOWA_DOMYSLNIE = 50 * 1048576;   // gdy nie ma jeszcze pomiaru
function mbTxt(b) { return b >= 1073741824 ? (b / 1073741824).toFixed(1).replace('.', ',') + ' GB' : Math.round(b / 1048576) + ' MB'; }
const Pamiec = {
  /* rozmiar budowy w pamięci (pliki rzutów i dokumentów) – zapamiętany po pobraniu */
  async zmierz(kod, ids) {
    let n = 0; for (const id of ids) { const f = await DB.getFile(id); if (f && f.blob) n += f.blob.size; }
    await DB.set('rozmiar:' + kod, n);
  },
  async stan() {
    let quota = 0, usage = 0;
    try { const e = await navigator.storage.estimate(); quota = e.quota || 0; usage = e.usage || 0; } catch (e) { }
    const l = await this.lista(); let bud = 0, n = 0;
    for (const k of l) { const r = await DB.get('rozmiar:' + k); if (r != null) { bud += r; n++; } }
    const sr = n ? Math.max(bud / n, 5 * 1048576) : BUDOWA_DOMYSLNIE;
    const wolne = Math.max(quota - usage, 0);
    const budzet = bud + wolne - REZERWA;   // miejsce na budowy: zajęte przez budowy + wolne − rezerwa
    const limit = quota ? Math.max(0, Math.min(PAMIEC_BUDOW, Math.floor(budzet / sr))) : PAMIEC_BUDOW;
    return { quota, usage, wolne, budowy: l.length, limit, sr, malo: !!quota && limit < 2 };
  },
  async limit() { const s = await this.stan(); S.malo = s.malo; return s.limit; },
  async sprawdz() { const s = await this.stan(); S.malo = S.malo || s.malo; if (S.malo) UI.toast('Mało miejsca na tablecie – zgłoś to administratorowi (Łukasz P)'); return s; },
  async opisStanu() {
    const s = await this.stan(); if (!s.quota) return '';
    return (s.malo ? 'MAŁO MIEJSCA · ' : '') + `wolne ${mbTxt(s.wolne)} z ${mbTxt(s.quota)} · budowy ${s.budowy} (limit ${s.limit}) · v${APP_VERSION}`;
  },
  async lista() {
    let l = await DB.get('offline');
    if (!l) {   // pierwsze uruchomienie 1.3: budowy pobrane przez starsze wersje
      l = [];
      for (const k of (await DB.get('recent')) || []) if (await DB.get('proj:' + k)) l.push(k);
      await DB.set('offline', l);
    }
    return l;
  },
  async oznacz(kod) { const l = await this.lista(); if (!l.includes(kod)) { l.push(kod); await DB.set('offline', l); } },
  /* plik potrzebny innej budowie z pamięci albo DTR? */
  async uzywany(id, pomin) {
    const tech = (await DB.get('tech')) || [];
    if (tech.some(f => f.id === id)) return true;
    for (const k of await this.lista()) {
      if (k === pomin) continue;
      const p = await DB.get('proj:' + k); if (!p) continue;
      if (Object.values(p.rzuty || {}).includes(id) || (p.pliki || []).some(f => f.id === id)) return true;
    }
    return false;
  },
  async porzadki() {
    const limit = await this.limit();
    const recent = ((await DB.get('recent')) || []).slice(0, Math.min(PAMIEC_BUDOW, limit));
    // bieżąca budowa i budowy z niewysłanymi wpisami / zdjęciami zostają zawsze
    const niewyslane = new Set([...(await DB.unsynced()).map(e => e.kod), ...(await DB.unsentPhotos()).map(p => p.kod)]);
    const keep = new Set([S.kod, ...recent, ...niewyslane].filter(Boolean));
    const l = await this.lista();
    for (const kod of l.filter(k => !keep.has(k))) {
      const p = await DB.get('proj:' + kod);
      if (p) for (const id of [...Object.values(p.rzuty || {}), ...(p.pliki || []).map(f => f.id)]) if (!(await this.uzywany(id, kod))) await DB.delFile(id);
      await DB.del('proj:' + kod); await DB.del('seq:' + kod);
      const Fk = fold(await DB.eventsFor(kod));   // pomniejszone zdjęcia z innych tabletów
      for (const fid of [...Object.keys(Fk.fotoInfo), ...Fk.usuniete]) await DB.delFile('mini:' + fid);
      await DB.delSyncedEvents(kod); await DB.delSentPhotos(kod); await DB.del('rozmiar:' + kod);
    }
    await DB.set('offline', l.filter(k => keep.has(k)));
  },
  async zajete() {
    try { const e = await navigator.storage.estimate(); return e.usage || 0; } catch (e) { return 0; }
  }
};

function verLess(a, b) {
  const pa = String(a || '0').split('.').map(Number), pb = String(b || '0').split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) < (pb[i] || 0)) return true; if ((pa[i] || 0) > (pb[i] || 0)) return false; }
  return false;
}

/* Etapy budowy (schemat 1.3) */
function etapyOf() { const p = ((S.boot && S.boot.projekty) || []).find(x => x.kod === S.kod); return (p && p.etapy) || []; }
function maEtapy() { return etapyOf().length > 1; }
function etapOpis(id) { const e = etapyOf().find(x => x.id === id); return e ? (e.opis ? e.id + ' – ' + e.opis : e.id) : id; }
function wEtapie(u) { return !maEtapy() || !S.etap || u.etap === S.etap; }
function urzE() { return ((S.proj || {}).urzadzenia || []).filter(wEtapie); }
function brakWEtapie(b) {
  if (!maEtapy() || !S.etap) return true;
  if (b.urz) { const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === b.urz); return !u || u.etap === S.etap; }
  return !b.etap || b.etap === S.etap;   // brak całej budowy: widoczny w swoim etapie albo wszędzie
}
async function wczytajEtap(kod) {
  const e = await DB.get('etap:' + kod) || '';
  S.etap = etapyOf().some(x => x.id === e) ? e : '';
}
async function ustawEtap(e) { S.etap = e; await DB.set('etap:' + S.kod, e); }

/* Pobranie pliku z serwera (w częściach) do pamięci tabletu */
async function pobierzPlik(id, onProgress) {
  const f = await API.fileFull(id, onProgress);
  await DB.putFile(id, { blob: f.blob, mime: f.mime, name: f.name });
  return f;
}

/* Uprawnienie M (obiekty wojskowe) – z zakładki Pracownicy (od schematu 1.4) */
function maM() {
  if (Session.isBiuro()) return true;
  const u = ((S.boot && S.boot.pracownicy) || []).find(x => S.user && x.name === S.user.name);
  return !!(u && u.m);
}
function dostepDoBudowy(p) { return !p || p.wojskowy !== 'tak' || maM(); }
