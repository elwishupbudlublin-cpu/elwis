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
    S._czasPokaz = false;   // od 1.58.0: po zalogowaniu pokaż „Do uzupełnienia”
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
      case 'krok': D(e.urz).front = false; D(e.urz).kroki[d.krok] = { val: !!d.wart, war: typeof d.wart === 'string' ? d.wart : '', kto: e.kto, ts: e.ts, nazwa: d.nazwa }; break;
      case 'nr': D(e.urz).front = false; D(e.urz).sn = d.sn || ''; D(e.urz).snKto = e.kto; break;
      case 'foto': if (e.urz) D(e.urz).foto.push({ fid: d.fid, rodzaj: d.rodzaj, kto: e.kto, ts: e.ts }); fi(d.fid, e, d.rodzaj); break;
      case 'brak': if (e.urz) D(e.urz).front = false; braki[e.id] = { id: e.id, urz: e.urz || '', kat: d.kat, odp: d.odp || '', opis: d.opis, blokuje: !!d.blokuje, foto: [...(d.foto || [])], etap: d.etap || '', kto: e.kto, ts: e.ts, zamk: null, kom: [], zm: [] }; (d.foto || []).forEach(f => fi(f, e, 'brak')); break;
      // otworzył się front (od 1.33.0): zamknięty brak urządzenia → flaga; kasuje ją każda czynność (krok, nr seryjny) i nowy brak
      case 'brak_zamk': if (braki[d.bid]) { braki[d.bid].zamk = { kto: e.kto, ts: e.ts, opis: d.opis || '' }; if (braki[d.bid].urz) { D(braki[d.bid].urz).front = true; D(braki[d.bid].urz).frontTs = e.ts; } } break;
      case 'brak_edyc': {   // edycja / usunięcie / ponowne otwarcie braku (od 1.9.0)
        const b = braki[d.bid]; if (!b) break;
        if (d.usun) { delete braki[d.bid]; break; }
        if (d.otworz) b.zamk = null;
        ['kat', 'odp', 'opis'].forEach(k => { if (d[k] != null && d[k] !== '') b[k] = d[k]; });
        if (d.blokuje != null) b.blokuje = !!d.blokuje;
        (d.foto || []).forEach(f => { if (!b.foto.includes(f)) b.foto.push(f); fi(f, e, 'brak'); });
        b.zm.push({ kto: e.kto, ts: e.ts, co: d.usun ? 'usunięcie' : d.otworz ? 'ponowne otwarcie' : 'edycja' });
        break;
      }
      case 'brak_kom': if (braki[d.bid]) { braki[d.bid].kom.push({ kto: e.kto, ts: e.ts, tekst: d.tekst || '', foto: d.foto || [] }); (d.foto || []).forEach(f => fi(f, e, 'brak')); } break;
      case 'notatka': notes.push(Object.assign({}, e, { d: Object.assign({}, d), zm: [], usun: null })); (d.foto || []).forEach(f => fi(f, e, 'notatka')); break;
      case 'notatka_edyc': {   // od 1.34.0 (tylko rola biuro): edycja tekstu, przeniesienie do kosza, przywrócenie
        const n = notes.find(x => x.id === d.nid); if (!n) break;
        if (d.usun) n.usun = { kto: e.kto, ts: e.ts };
        else if (d.przywroc) n.usun = null;
        else if (d.tekst != null) n.d.tekst = d.tekst;
        n.zm.push({ kto: e.kto, ts: e.ts, co: d.usun ? 'do kosza' : d.przywroc ? 'przywrócenie' : 'edycja' });
        break;
      }
      case 'foto_usun': if (d.fid) usuniete.add(d.fid); break;
      case 'protokol': if (d.pid && d.stan === 'usuniety') { delete prot[d.pid]; break; }   // usunięty (1.6.1) – znika z list
        if (d.pid) prot[d.pid] = { pid: d.pid, def: d.def, wersja: d.wersja, prefiks: d.prefiks, stan: d.stan || 'roboczy', nr: d.nr || (prot[d.pid] && prot[d.pid].nr) || '', dane: d.dane || {}, urz: e.urz, kto: e.kto, ts: e.ts }; break;
    }
  }
  // front otwarty tylko, gdy urządzenie nie ma już żadnego otwartego braku
  Object.values(braki).forEach(b => { if (!b.zamk && b.urz && dev[b.urz]) dev[b.urz].front = false; });
  // usunięte zdjęcia znikają z kart urządzeń, braków i notatek (historia zostaje w zdarzeniach)
  if (usuniete.size) {
    Object.values(dev).forEach(x => { x.foto = x.foto.filter(f => !usuniete.has(f.fid)); });
    Object.values(braki).forEach(b => { b.foto = (b.foto || []).filter(f => !usuniete.has(f)); b.kom.forEach(k => { k.foto = k.foto.filter(f => !usuniete.has(f)); }); });
    usuniete.forEach(f => delete fotoInfo[f]);
  }
  // notatki w koszu (od 1.34.0): poza listą i licznikami; ich zdjęcia znikają z widoku Zdjęcia
  const notesKosz = notes.filter(n => n.usun);
  notesKosz.forEach(n => (n.d.foto || []).forEach(f => { if (fotoInfo[f] && fotoInfo[f].rodzaj === 'notatka') delete fotoInfo[f]; }));
  return { dev, braki, notes: notes.filter(n => !n.usun), notesKosz, prot, fotoInfo, usuniete };
}

function devStatus(u, F) {
  const st = F.dev[u.id];
  const open = Object.values(F.braki).some(b => b.urz === u.id && !b.zamk);
  if (open) return 'brak';
  const kroki = typOf(u.id).kroki;
  if (!st) return u.sn ? 'w toku' : 'czeka';
  const done = kroki.filter((k, i) => st.kroki[i] && st.kroki[i].val).length;
  if (done === kroki.length && kroki.length) return 'gotowe';
  return done || st.sn || u.sn ? 'w toku' : 'czeka';   // od 1.30.0: wpisany nr seryjny = prace rozpoczęte
}

/* od 1.61.0: kroki typu urządzenia jako tablica zrobione (true) / do zrobienia (false) – kwadraciki pod kropką na rzucie */
function krokiDev(u, F) {
  const kr = (F.dev[u.id] || {}).kroki || {};
  return typOf(u.id).kroki.map((k, i) => !!(kr[i] && kr[i].val));
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
  // zmiany urządzeń z tabletu (od 1.30.0): pozycja na rzucie (urz_poz), system (urz_sys, biuro), usunięcie (urz_usun, biuro) –
  // widoczne od razu; serwer zapisuje je w liście urządzeń, więc po pobraniu budowy dają ten sam wynik
  const usun = new Set();
  (S.ev || []).filter(e => ZM_URZ.includes(e.typ)).sort((a, b) => a.ts < b.ts ? -1 : 1).forEach(e => {
    const d = e.d || {}, u = lst.find(x => x.id === e.urz); if (!u) return;
    if (e.typ === 'urz_poz') { u.x = d.x; u.y = d.y; if (d.ark) u.arkusz = d.ark; }
    if (e.typ === 'urz_sys') u.sys = d.sys || '';
    if (e.typ === 'urz_edyc') ['typ', 'zasilanie', 'oz', 'uwagi'].forEach(k => { if (d[k] != null) u[k] = d[k]; });   // od 1.37.0
    if (e.typ === 'urz_usun') usun.add(u.id);
  });
  S.proj.urzadzenia = usun.size ? lst.filter(u => !usun.has(u.id)) : lst;
}
const ZM_URZ = ['urz_poz', 'urz_sys', 'urz_usun', 'urz_edyc'];
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
  if (typ === 'urz_nowe' || ZM_URZ.includes(typ)) dolaczNowe();
  S.pending++;
  Sync.soon();
  return e;
}

/* liczba rzeczy czekających na wysłanie: zdarzenia, zdjęcia, statusy zadań (od 1.12.0) */
async function liczOczekujace() { S.pending = (await DB.unsynced()).length + (await DB.unsentPhotos()).length + ((await DB.get('zadKolejka')) || []).length + ((await DB.get('zakKolejka')) || []).length + ((await DB.get('zakFotoKolejka')) || []).length + ((await DB.get('czasKolejka')) || []).length; UI.net(); return S.pending; }

/* Zapotrzebowania (od 1.48.0): lista z serwera w DB 'zakupy', kolejka wpisów 'zakKolejka', zdjęcia 'zakFoto:<fid>' + 'zakFotoKolejka' */
const ZAK_ST = { nowe: 'Nowe', realizacja: 'W realizacji', dostarczone: 'Dostarczone', odrzucone: 'Odrzucone' };
const Zakupy = {
  async dodaj(typ, d) {
    const e = { id: U.uid('z'), ts: U.now(), kto: S.user.name, typ, d };
    const k = (await DB.get('zakKolejka')) || []; k.push(e); await DB.set('zakKolejka', k);
    await liczOczekujace(); Sync.soon(); return e;
  },
  async sync() {
    const kol = (await DB.get('zakKolejka')) || [];
    let r = await API.zakupy({ zdarzenia: kol.slice(0, 100) });
    if (r.ok === false) throw new Error(r.error || 'zakupy');
    const ok = new Set(r.accepted || []), nr = Object.assign({}, (await DB.get('zakNr')) || {}, r.nr || {});
    await DB.set('zakNr', nr);
    await DB.set('zakKolejka', ((await DB.get('zakKolejka')) || []).filter(e => !ok.has(e.id)));
    // zdjęcia – tylko do zgłoszeń, które mają już numer
    for (const fid of ((await DB.get('zakFotoKolejka')) || []).slice()) {
      const f = await DB.get('zakFoto:' + fid); if (!f) { await this.zdejmij(fid); continue; }
      const zid = nr[f.zid] || f.zid; if (!/^Z-\d{5}-/.test(zid)) continue;
      r = await API.zakupy({ zdjecie: { fid, zid, b64: await U.blobToB64(f.blob) } });
      if (r.zdjecie && r.zdjecie.ok) await this.zdejmij(fid);
    }
    await DB.set('zakupy', { lista: r.lista || [], ts: Date.now() });
    // porządki: zdjęcia lokalne zgłoszeń, których nie ma już na liście ani w kolejce
    const zost = new Set([...(r.lista || []).flatMap(z => z.foto || []), ...((await DB.get('zakFotoKolejka')) || [])]);
    for (const k of await DB.keys().catch(() => [])) if (String(k).startsWith('zakFoto:') && !zost.has(String(k).slice(8))) await DB.del(k);
    await liczOczekujace();
  },
  async zdejmij(fid) { await DB.set('zakFotoKolejka', ((await DB.get('zakFotoKolejka')) || []).filter(x => x !== fid)); },
  /* lista do widoku: serwer + niewysłane zgłoszenia + niewysłane zmiany statusów */
  async lista() {
    const srv = ((await DB.get('zakupy')) || {}).lista || [], kol = (await DB.get('zakKolejka')) || [], nr = (await DB.get('zakNr')) || {};
    const L = srv.map(z => Object.assign({}, z, { poz: z.poz.map(x => Object.assign({}, x)) }));
    kol.filter(e => e.typ === 'zap').forEach(e => { if (!L.some(z => z.id === e.id)) L.unshift({ id: e.id, nr: nr[e.id] || '', kod: e.d.kod || '', ts: e.ts, kto: e.kto, uwagi: e.d.uwagi || '', foto: e.d.foto || [], czeka: 1, poz: (e.d.poz || []).map((x, i) => Object.assign({ lp: i + 1, st: 'nowe', zm: '' }, x)) }); });
    const znajdz = zid => L.find(x => x.nr === zid || x.id === zid || (nr[zid] && x.nr === nr[zid]));
    kol.filter(e => e.typ === 'zap_przen').forEach(e => {   // zmiana budowy (od 1.50.0): stare → odrzucone, nowe czeka na numer
      const z = znajdz(e.d.zid); if (z) { z.poz.forEach(x => { x.st = 'odrzucone'; x.zm = e.kto + ' · czeka na wysłanie'; }); z.log = [...(z.log || []), { ts: e.ts, kto: e.kto, opis: 'Zmiana budowy – zgłoszenie zostanie odrzucone, powstanie nowe (czeka na wysłanie)' }]; }
      if (!nr[e.id]) L.unshift({ id: e.id, nr: '', kod: e.d.kod || '', ts: e.ts, kto: e.d.kto || e.kto, uwagi: e.d.uwagi || '', foto: e.d.foto || [], czeka: 1, log: [{ ts: e.ts, kto: e.kto, opis: 'Utworzone z ' + (z && z.nr || 'zgłoszenia') + ' – zmiana budowy (czeka na wysłanie)' }], poz: (e.d.poz || []).map((x, i) => ({ lp: i + 1, n: x.n, il: x.il, j: x.j, uw: x.uw, st: 'nowe', zm: '' })) });
    });
    kol.filter(e => e.typ === 'zap_stat' || e.typ === 'zap_edyc').forEach(e => {
      const z = znajdz(e.d.zid); if (!z) return; z.log = (z.log || []).slice();
      if (e.typ === 'zap_stat') { z.poz.forEach(x => { if (!e.d.lp || e.d.lp.includes(x.lp)) { x.st = e.d.st; x.zm = e.kto + ' · czeka na wysłanie'; } }); z.log.push({ ts: e.ts, kto: e.kto, opis: 'Status: ' + ZAK_ST[e.d.st] + ' (czeka na wysłanie)' }); return; }
      // edycja (od 1.49.0): nowa lista pozycji, usunięte Lp, uwagi, budowa
      let max = Math.max(0, ...z.poz.map(x => x.lp));
      const nowe = []; (e.d.poz || []).forEach(x => { const o = x.lp && z.poz.find(y => y.lp === x.lp); nowe.push(o ? Object.assign({}, o, { n: x.n, il: x.il, j: x.j, uw: x.uw }) : { lp: ++max, n: x.n, il: x.il, j: x.j, uw: x.uw, st: 'nowe', zm: e.kto + ' · czeka na wysłanie' }); });
      z.poz = nowe.filter(x => !(e.d.usun || []).includes(x.lp)); z.kod = e.d.kod || ''; z.uwagi = e.d.uwagi || '';
      z.foto = [...(z.foto || []), ...(e.d.poz || []).flatMap(x => x.foto || [])];
      z.log.push({ ts: e.ts, kto: e.kto, opis: 'Edycja: ' + e.d.opis + ' (czeka na wysłanie)' });
    });
    return L;
  }
};

/* Synchronizacja */
const Sync = {
  timer: null,
  /* postęp synchronizacji (od 1.7.0): p = 0..1, t = opis etapu */
  prog(p, t) { S.prog = { p: Math.max(0, Math.min(1, p)), t: t || '' }; UI.prog(); },
  soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), 1500); },
  run(full) { if (S.syncing || !API.ready()) return this.biezaca || Promise.resolve(); this.biezaca = this._run(full).finally(() => { this.biezaca = null; }); return this.biezaca; },
  async _run(full) {
    if (S.syncing || !API.ready()) return;
    if (!navigator.onLine) { UI.net(); return; }
    S.syncing = true; S.syncErr = null; UI.net();
    S.pomiar = { start: Date.now(), bajty: 0, budowy: 0 };   // czas synchronizacji → Tablety, kolumna Stan pamięci (od 1.16.0)
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
      await this.wyslijZmiany();
      // 3a. zapotrzebowania (od 1.48.0): kolejka zgłoszeń i statusów, potem zdjęcia pojedynczo; zawsze pobranie listy
      if (!(S.boot && S.boot.dostep)) { this.prog(0.25, 'Zapotrzebowania'); try { await Zakupy.sync(); } catch (e) { console.warn('zakupy', e); } }
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
      // 3c. czas pracy (od 1.58.0): wpisy, propozycje, potwierdzenia → serwer; stan wpisów z serwera
      if (!(S.boot && S.boot.dostep)) { this.prog(0.255, 'Czas pracy'); try { await Czas.sync(); } catch (e) { if (/Nieznana operacja/.test(e.message)) S.czasErr = 'Czas pracy wymaga aktualizacji serwera ELWIS.'; else console.warn('czas', e); } }
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
      S.pomiar.budowy = kody.length;
      for (let j = 0; j < kody.length; j++) await this.pullProject(kody[j], full, (f, t) => this.prog(0.3 + 0.5 * (j + f) / kody.length, `Budowa ${j + 1}/${kody.length}` + (t ? ' · ' + t : '')));
      // 4b. panel biura na komputerze (od 1.57.0): dane wszystkich aktywnych budów, bez plików; świeże pomijane
      if (typeof PC !== 'undefined' && PC.on()) await PC.pobierz(PC.kodyAktywne().filter(k => !kody.includes(k)), false, (i, n) => this.prog(0.8, `Budowy panelu PC ${i}/${n}`));
      // 5. DTR wspólne dla wszystkich budów
      await this.pullTech(full, (f, t) => this.prog(0.8 + 0.18 * f, t));
      this.prog(0.99, 'Porządki w pamięci');
      await Pamiec.porzadki();
      await Pamiec.sprawdz();
      S.lastSync = Date.now(); await DB.set('lastSync', S.lastSync);
      await DB.set('ostatniPomiar', { s: Math.round((Date.now() - S.pomiar.start) / 1000), budowy: S.pomiar.budowy, mb: Math.round(S.pomiar.bajty / 1048576 * 10) / 10, pelna: !!full, ts: Date.now() });
    } catch (err) {
      S.syncErr = err.message; console.warn('sync', err);
    } finally {
      S.syncing = false; S.prog = null;
      await liczOczekujace();
      UI.net(); if (!['login', 'setup', 'protokol', 'pcCzas'].includes(UI.cur)) UI.refresh();   // od 1.59.0: zatwierdzanie odświeża się samo (bez gubienia zaznaczeń i przewinięcia)   // formularza protokołu nie przerysowujemy w trakcie pisania
    }
  },
  /* Wysłanie zmian z tabletu (od 1.56.1 osobno): kod = tylko jedna budowa (np. przed „Word” w protokole) */
  async wyslijZmiany(kod) {
    const noweU = (await DB.unsynced()).filter(e => e.typ === 'urz_nowe' && (!kod || e.kod === kod));
    for (const k of [...new Set(noweU.map(e => e.kod))]) {
      this.prog(0.04, 'Nowe urządzenia');
      const r = await API.push(k, noweU.filter(e => e.kod === k).map(({ synced, ...e }) => e), []);
      await zamienTmp(k, r.nowe || {}, new Set(r.accepted || []));
    }
    // 2. zdjęcia (pojedynczo – mniejsze paczki)
    const fotki = (await DB.unsentPhotos()).filter(p => !kod || p.kod === kod); let fi = 0;
    for (const p of fotki) {
      this.prog(0.05 + 0.1 * fi++ / fotki.length, `Wysyłam zdjęcia ${fi}/${fotki.length}`);
      const b64 = await U.blobToB64(p.blob);
      await API.push(p.kod, [], [{ id: p.id, name: p.name, b64 }]);
      p.sent = 1; await DB.putPhoto(p);
    }
    // 3. zdarzenia – paczkami po budowie
    const un = (await DB.unsynced()).filter(e => !kod || e.kod === kod);
    const byKod = {};
    un.forEach(e => (byKod[e.kod] = byKod[e.kod] || []).push(e));
    let wyslane = 0;
    for (const k of Object.keys(byKod)) {
      const all = byKod[k];
      for (let i = 0; i < all.length; i += 100) {
        this.prog(0.15 + 0.1 * wyslane / un.length, `Wysyłam wpisy ${wyslane}/${un.length}`); wyslane += Math.min(100, all.length - i);
        const part = all.slice(i, i + 100).map(({ synced, ...e }) => e);
        const r = await API.push(k, part, []);
        const ok = new Set(r.accepted || []);
        const num = r.numery || {};   // numery protokołów nadane przez serwer
        const marked = all.slice(i, i + 100).filter(e => ok.has(e.id)).map(e => (e.typ === 'protokol' && e.d && num[e.d.pid] ? { ...e, d: { ...e.d, nr: num[e.d.pid] }, synced: 1 } : { ...e, synced: 1 }));
        await DB.putEvents(marked);
      }
    }
  },
  /* Szybkie wysłanie zmian jednej budowy, bez pobierania danych (od 1.56.1) */
  async wyslijBudowe(kod) {
    while (S.syncing && this.biezaca) await this.biezaca.catch(() => { });
    S.syncing = true; UI.net();
    try { await this.wyslijZmiany(kod); } finally { S.syncing = false; S.prog = null; await liczOczekujace(); UI.net(); }
  },
  async pullProject(kod, full, onProg, opc = {}) {
    const pr = onProg || (() => { });
    pr(0, 'dane');
    const p = await API.project(kod);
    await DB.set('proj:' + kod, p); await DB.set('projTs:' + kod, Date.now());
    // rzuty i dokumenty do wglądu – do pamięci tabletu (raz, potem z pamięci)
    const ids = [...new Set([...Object.values(p.rzuty || {}), ...(p.pliki || []).filter(f => f.size <= 60e6).map(f => f.id)])];
    const brak = [];
    if (!opc.bezPlikow) for (const id of ids) if (full || !(await DB.hasFile(id))) brak.push(id);   // od 1.57.0: panel PC – bez plików (przy otwarciu budowy)
    const stan = brak.map(() => 0); let stop = false;
    const odswiez = () => { const g = stan.reduce((a, b) => a + b, 0); pr(0.05 + 0.85 * g / Math.max(1, brak.length), `pliki ${Math.floor(g)}/${brak.length}`); };
    await pula(brak.map((id, i) => async () => {
      if (stop) return;
      try { await pobierzPlik(id, (c, n) => { stan[i] = c / n; odswiez(); }); stan[i] = 1; odswiez(); }
      catch (e) { console.warn('file', id, e); if (/quota|QuotaExceeded/i.test(String(e && (e.name || e.message)))) { S.malo = true; stop = true; } }
    }), POBIERANIE_NARAZ);
    pr(0.92, 'wpisy z innych tabletów');
    // zdarzenia z innych tabletów
    let since = (await DB.get('seq:' + kod)) || 0;
    // serwer podaje liczbę zdarzeń budowy (od 1.16.0) – gdy nic nie przybyło, nie pytamy
    const zd = ((S.boot && S.boot.projekty) || []).find(x => x.kod === kod) || {};
    for (let guard = 0; guard < 50 && !(zd.zd != null && since >= zd.zd); guard++) {
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
    if (S.boot && S.boot.dostep) return;   // dostęp podwykonawcy – bez planu dnia (od 1.43.0)
    const od = U.day(new Date(Date.now() - 14 * 864e5)), d = U.day(new Date(Date.now() + 7 * 864e5));   // od 1.58.0: 14 dni wstecz – niezamknięte dni
    try { const r = await API.plan(od, d); await DB.set('plan', { od, do: d, zadania: r.zadania || [], brakKlucza: !!r.brakKlucza, pobrano: Date.now(), sync: r.sync || '' }); S.planErr = ''; }
    catch (e) { S.planErr = /Nieznana operacja/.test(e.message) ? 'Plan dnia wymaga aktualizacji serwera ELWIS.' : 'Nie udało się pobrać planu: ' + e.message; }
    // priorytety budów i wydajność ekip – tylko rola biuro (od 1.17.0); wynik gotowy z serwera, bez przeliczania
    if (Session.isBiuro()) { try { const r = await API.priorytety(false); if (r && r.czas) await DB.set('prio', r); } catch (e) { console.warn('priorytety', e); } }
    if (Session.isBiuro()) { try { await pullPowiad(); } catch (e) { console.warn('powiadomienia', e); } }   // od 1.56.0
    if (Session.isBiuro()) { try { const q = (await DB.get('zadNoweKolejka')) || []; if (q.length) UI.toast(q.length + ' ' + odm(q.length, 'zgłoszenie czeka', 'zgłoszenia czekają', 'zgłoszeń czeka') + ' na wybór terminu – Plan → Nowe zadanie'); } catch (e) { } }
  },
  /* Prognoza Open-Meteo (od 1.11.0): godziny 7–16 dla Lublina i budów z lokalizacją z planu; tylko odczyt, bez danych budowy */
  async pullPogoda() {
    try {
      const pl = (await DB.get('plan')) || { zadania: [] }; const proj = (S.boot && S.boot.projekty) || [];
      const miejsca = new Map([[POGODA_DOM.klucz, POGODA_DOM]]);
      pl.zadania.forEach(t => { const b = proj.find(p => (p.listaCU && p.listaCU === t.lista) || (t.kod && p.kod === t.kod)); const w = b && wspolrzedne(lokBudowy(b)); if (w && miejsca.size < 8) miejsca.set(w.klucz, w); });
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
    const razem = doPobrania.reduce((a, f) => a + (f.size || 0), 0) || 1;
    const stan = doPobrania.map(() => 0); let stop = false, ile = 0;
    const odswiez = () => { const g = stan.reduce((a, b) => a + b, 0); pr(g / razem, `DTR ${ile}/${doPobrania.length} · ${mbTxt(g)} / ${mbTxt(razem)}`); };
    await pula(doPobrania.map((f, i) => async () => {
      if (stop) return;
      try { await pobierzPlik(f.id, (c, n) => { stan[i] = (f.size || 0) * c / n; odswiez(); }); stan[i] = f.size || 0; ile++; odswiez(); }
      catch (e) { console.warn('dtr', f.id, e); if (/quota|QuotaExceeded/i.test(String(e && (e.name || e.message)))) { S.malo = true; stop = true; } }
    }), POBIERANIE_NARAZ);
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
    const p = await DB.get('ostatniPomiar');
    const sync = p ? ` · ost. synchr. ${p.s} s${p.pelna ? ' (pełna)' : ''}, ${p.budowy} bud., ${String(p.mb).replace('.', ',')} MB` : '';
    return (s.malo ? 'MAŁO MIEJSCA · ' : '') + `wolne ${mbTxt(s.wolne)} z ${mbTxt(s.quota)} · budowy ${s.budowy} (limit ${s.limit}) · v${APP_VERSION}` + sync;
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
    const keep = new Set([S.kod, ...recent, ...niewyslane, ...(typeof PC !== 'undefined' && PC.on() ? PC.kodyAktywne() : [])].filter(Boolean));   // panel PC trzyma wszystkie aktywne
    const l = await this.lista();
    for (const kod of l.filter(k => !keep.has(k))) await this.usunDane(kod);
    await DB.set('offline', l.filter(k => keep.has(k)));
  },
  /* usunięcie danych jednej budowy z tabletu (rzuty, dokumenty, wysłane zdarzenia i zdjęcia, miniatury) */
  async usunDane(kod) {
    const p = await DB.get('proj:' + kod);
    if (p) for (const id of [...Object.values(p.rzuty || {}), ...(p.pliki || []).map(f => f.id)]) if (!(await this.uzywany(id, kod))) await DB.delFile(id);
    await DB.del('proj:' + kod); await DB.del('seq:' + kod);
    const Fk = fold(await DB.eventsFor(kod));   // pomniejszone zdjęcia z innych tabletów
    for (const fid of [...Object.keys(Fk.fotoInfo), ...Fk.usuniete]) await DB.delFile('mini:' + fid);
    await DB.delSyncedEvents(kod); await DB.delSentPhotos(kod); await DB.del('rozmiar:' + kod);
  },
  /* „Zwolnij” z listy budów (od 1.46.0): budowa znika z pamięci i z synchronizacji do czasu ponownego otwarcia.
     Nie zwalnia budowy z niewysłanymi wpisami lub zdjęciami. Liczniki na liście zostają – liczy je serwer. */
  async zwolnij(kod) {
    const niewyslane = (await DB.unsynced()).some(e => e.kod === kod) || (await DB.unsentPhotos()).some(f => f.kod === kod);
    if (niewyslane) return 'niewyslane';
    await this.usunDane(kod);
    await DB.set('offline', (await this.lista()).filter(k => k !== kod));
    await DB.set('recent', ((await DB.get('recent')) || []).filter(k => k !== kod));
    if (S.kod === kod) { S.kod = null; S.proj = null; S.ev = []; }
    return 'ok';
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
/* Kilka plików naraz (od 1.16.0) – narzut serwera na każde zapytanie (ok. 2–3 s) nakłada się zamiast sumować */
const POBIERANIE_NARAZ = 3;
async function pula(zadania, n) {
  let i = 0; const wynik = [];
  const praca = async () => { while (i < zadania.length) { const k = i++; wynik[k] = await zadania[k](); } };
  await Promise.all(Array.from({ length: Math.min(n, zadania.length) }, praca));
  return wynik;
}
async function pobierzPlik(id, onProgress) {
  const f = await API.fileFull(id, onProgress);
  await DB.putFile(id, { blob: f.blob, mime: f.mime, name: f.name });
  if (S.pomiar) S.pomiar.bajty += (f.blob && f.blob.size) || 0;
  return f;
}

/* Uprawnienie M (obiekty wojskowe) – z zakładki Pracownicy (od schematu 1.4) */
function maM() {
  if (Session.isBiuro()) return true;
  const u = ((S.boot && S.boot.pracownicy) || []).find(x => S.user && x.name === S.user.name);
  return !!(u && u.m);
}
function dostepDoBudowy(p) { return !p || p.wojskowy !== 'tak' || maM(); }
