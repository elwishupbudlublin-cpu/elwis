/* ELWIS – protokoły (od 1.5.0): formularz budowany z definicji (_Szablony/szablon_konfig), zapis jako zdarzenia „protokol”.
 * Numer protokołu nadaje serwer przy pierwszej synchronizacji po „Prześlij”. Word – na żądanie (rola biuro). */

const Prot = {
  /* Wszystkie aktywne protokoły z Bazy (bootstrap) z poprawną definicją. */
  wszystkie() { return ((S.boot && S.boot.protokoly) || []).filter(x => x.def); },
  /* Powiązanie: lista prefiksów typów urządzeń (od 1.6.0 kilka, np. „SZ; SP”); pusto = każde urządzenie. */
  pow(x) { return x.powiazania || (x.powiazanie ? [x.powiazanie] : []); },
  pasuje(x, id) { const p = this.pow(x); return !p.length || p.indexOf(U.prefix(id)) >= 0; },
  wZakresie(x) {
    const p = curProj(); const zakres = ((p && p.zakres) || []).map(U.norm);
    return !x.rodzaj || zakres.some(z => z.startsWith(U.norm(x.rodzaj)) || U.norm(x.rodzaj).startsWith(z));
  },
  /* Protokoły w zakresie prac budowy (kafelki na karcie budowy). */
  lista() { return this.wszystkie().filter(x => this.wZakresie(x)); },
  /* Dedykowane budowie: w zakresie prac i dla typów urządzeń, które są na budowie (kolejność wierszy w zakładce Protokoły). */
  dedykowaneBudowy() {
    const pref = new Set(((S.proj || {}).urzadzenia || []).map(u => U.prefix(u.id)));
    return this.lista().filter(x => !this.pow(x).length || this.pow(x).some(q => pref.has(q)));
  },
  pozostaleBudowy() { const d = this.dedykowaneBudowy(); return this.wszystkie().filter(x => d.indexOf(x) < 0).sort(poNazwie); },
  /* Dedykowane urządzeniu: w zakresie prac i z prefiksem urządzenia w powiązaniu. */
  dedykowaneUrz(id) { return this.lista().filter(x => this.pow(x).indexOf(U.prefix(id)) >= 0); },
  inneUrz(id) { const d = this.dedykowaneUrz(id); return this.wszystkie().filter(x => d.indexOf(x) < 0).sort(poNazwie); },
  def(id, wersja) { return ((S.boot && S.boot.protokoly) || []).find(x => x.id === id && (!wersja || String(x.wersja) === String(wersja))); },
  /* Stan protokołów budowy ze zdarzeń: ostatni zapis wygrywa. */
  stan(F) { return (F || fold(S.ev)).prot; },
  dlaUrzStan(id, F) { return Object.values(this.stan(F)).filter(p => p.urz === id).sort((a, b) => a.ts < b.ts ? 1 : -1); },
  opisStanu(p) {
    if (!p) return '';
    return p.stan === 'zablokowany' ? 'zablokowany' : p.stan === 'gotowy' ? (p.nr ? 'gotowy · ' + p.nr : 'gotowy · numer po synchronizacji') : 'w trakcie';
  },
  chip(p) { return `<span class="chip ${p.stan === 'roboczy' ? 'warn' : 'ok'}">${U.esc(this.opisStanu(p))}</span>`; }
};

const poNazwie = (a, b) => String(a.nazwa).localeCompare(String(b.nazwa), 'pl');

/* Wzór: {pole} – z danych lub kontekstu; {pole=X:A|B} – A gdy pole = X, inaczej B (ta sama składnia co na serwerze). */
function ocenWzor(w, ctx, dane) {
  const val = k => (dane && dane[k] != null && dane[k] !== '') ? dane[k] : (ctx && ctx[k] != null ? ctx[k] : '');
  return String(w || '').replace(/\{([^{}]+)\}/g, (m, e) => {
    const c = e.match(/^(\w+)=([^:]*):([^|]*)\|(.*)$/);
    if (c) return String(val(c[1])) === c[2] ? c[3] : c[4];
    return String(val(e.trim()));
  });
}
function sekcjaWidoczna(sek, dane) {
  return !sek.pokaz_gdy || Object.keys(sek.pokaz_gdy).every(k => String(dane[k] == null ? '' : dane[k]) === String(sek.pokaz_gdy[k]));
}
function hhmm(v) { const m = String(v || '').match(/^(\d{1,2}):(\d{2})$/); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; }

/* Kontekst do wartości domyślnych i pól automatycznych */
function protCtx(urzId, lp) {
  const p = curProj() || {}; const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === urzId) || {};
  return {
    kod: p.kod || '', nazwa_budowy: p.nazwa || '', adres: p.adres || '', zalogowany: S.user ? S.user.name : '',
    inwestor: p.inwestor || p.zamawiajacy || '', zamawiajacy: p.zamawiajacy || '',   // Baza projektów, kol. N i O (schemat 1.5); brak inwestora → zamawiający
    etap_urzadzenia: u.etap || '', kondygnacja_urzadzenia: u.kond || '', urzadzenie: urzId || '', lp: lp || ''
  };
}
function domyslna(f, ctx) {
  if (f.domyslnie == null) return f.typ === 'znacznik' ? false : '';
  if (f.typ === 'data' && f.domyslnie === 'dzis') return U.day();
  if (f.typ === 'godzina') return hhmm(f.domyslnie);
  return typeof f.domyslnie === 'string' ? ocenWzor(f.domyslnie, ctx, {}) : f.domyslnie;
}
/* Urządzenia budowy do pola typu „urzadzenie”: prefiksy z f.typy (pusto = wszystkie), wybrany etap; bez użytych w innych wierszach. */
function urzDoPola(f, uzyte, biezace) {
  const typy = (f.typy || []).map(x => String(x).toUpperCase());
  return ((S.proj || {}).urzadzenia || []).filter(u => u.id === biezace || ((!typy.length || typy.indexOf(U.prefix(u.id)) >= 0)
    && (!S.etap || !u.etap || u.etap === S.etap) && uzyte.indexOf(u.id) < 0));
}
/* Wartość z karty urządzenia: id, sn (spisany na tablecie lub w liście urządzeń), typ, kond, etap, arkusz, zasilanie, grupa */
function zUrz(id, klucz) {
  const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === id); if (!u) return '';
  if (klucz === 'id') return u.id;
  if (klucz === 'sn') { const st = fold(S.ev).dev[id]; return (st && st.sn) || u.sn || ''; }
  return u[klucz] || '';
}
/* Po wyborze urządzenia: pola z „z_urzadzenia” w tym samym wierszu / sekcji */
function wypelnijZUrz(sek, cel, id) {
  sek.pola.filter(f => f.z_urzadzenia).forEach(f => { const v = zUrz(id, f.z_urzadzenia); if (v !== '' || !id) cel[f.id] = v; });
}
function poleUrz(sek) { return (sek.pola || []).find(f => f.typ === 'urzadzenie'); }
function nowyWiersz(sek, lp, urzId) { const o = {}; const ctx = protCtx(urzId, lp); sek.pola.forEach(f => { o[f.id] = domyslna(f, ctx); }); return o; }

/* Nowy protokół: wartości domyślne + pola „pamiętaj dla budowy” z ostatniego protokołu tej budowy */
function nowyProtokol(pr, urzId) {
  const def = pr.def, ctx = protCtx(urzId), dane = {};
  const poprzednie = Object.values(Prot.stan()).sort((a, b) => a.ts < b.ts ? 1 : -1);
  def.sekcje.forEach(sek => {
    if (sek.typ === 'tabela') { dane[sek.id] = Array.from({ length: sek.domyslnie_wierszy || 0 }, (_, i) => nowyWiersz(sek, i + 1, urzId)); return; }
    sek.pola.forEach(f => {
      if (f.typ === 'auto') return;
      let v = domyslna(f, ctx);
      // dane z Bazy projektów mają pierwszeństwo; puste → wartość z poprzedniego protokołu tej budowy
      if (f.pamietaj_dla_budowy && (v === '' || v == null)) { const z = poprzednie.find(p => p.dane && p.dane[f.id]); if (z) v = z.dane[f.id]; }
      dane[f.id] = v;
    });
  });
  return { pid: U.uid('p'), def: pr.id, wersja: pr.wersja, prefiks: def.prefiks_nr || '', stan: 'roboczy', urz: urzId, dane, nr: '' };
}

/* Pola automatyczne (nr seryjny, uruchamiający) – liczone na tablecie i zapisywane w danych */
function przeliczAuto(def, dane, urzId) {
  const ctx = protCtx(urzId);
  def.sekcje.forEach(sek => { if (sek.typ !== 'tabela') sek.pola.filter(f => f.typ === 'auto' && f.id !== 'nr_protokolu').forEach(f => { dane[f.id] = ocenWzor(f.wzor, ctx, Object.assign({}, dane, { [f.id]: '' })); }); });
}

/* Sprawdzenie pól wymaganych (tylko w widocznych sekcjach) → lista braków [{sek, pole, wiersz}] */
function brakiProtokolu(def, dane) {
  const out = [];
  const pusto = v => v == null || v === '' || v === false;
  def.sekcje.forEach(sek => {
    if (!sekcjaWidoczna(sek, dane)) return;
    if (sek.typ === 'tabela') {
      if (sek.min && (dane[sek.id] || []).length < sek.min) out.push({ sek: sek.id, pole: '', etyk: sek.tytul + ': za mało pozycji' });
      (dane[sek.id] || []).forEach((w, i) => sek.pola.filter(f => f.wymagane && pusto(w[f.id])).forEach(f => out.push({ sek: sek.id, pole: f.id, wiersz: i, etyk: sek.tytul + ' ' + (i + 1) + ': ' + (f.etykieta || f.id) })));
      return;
    }
    sek.pola.filter(f => f.wymagane && f.typ !== 'auto' && pusto(dane[f.id])).forEach(f => out.push({ sek: sek.id, pole: f.id, etyk: f.etykieta || nazwaPola(f.id) }));
  });
  return out;
}
function nazwaPola(id) { return id.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()); }

/* ---------- Karta urządzenia: dedykowane („Do wykonania”), zapisane, inne ---------- */
function protKarta(id, F) {
  if (!Prot.wszystkie().length) return '';
  const ded = Prot.dedykowaneUrz(id), inne = Prot.inneUrz(id), ist = Prot.dlaUrzStan(id, F);
  const doWyk = ded.filter(q => !ist.some(x => x.def === q.id));
  const nazwa = x => (Prot.def(x.def, x.wersja) || {}).nazwa || x.def;
  return `<div class="card stack"><div class="lbl">Protokoły</div>
    ${doWyk.map(q => `<button class="btn pri" data-npr="${U.esc(q.id)}" style="text-align:left">Do wykonania: ${U.esc(q.nazwa)}</button>`).join('')}
    ${ist.map(x => `<button class="btn sm" data-pid="${U.esc(x.pid)}" style="text-align:left"><span class="grow">${U.esc(nazwa(x))}</span>${Prot.chip(x)}</button>`).join('')}
    ${ded.filter(q => doWyk.indexOf(q) < 0).map(q => `<button class="btn sm" data-npr="${U.esc(q.id)}">+ kolejny: ${U.esc(q.nazwa)}</button>`).join('')}
    ${inne.length ? `<details><summary class="mute">Inne protokoły (${inne.length})</summary><div class="stack" style="margin-top:6px">${inne.map(q => `<button class="btn sm" data-npr="${U.esc(q.id)}">+ ${U.esc(q.nazwa)}</button>`).join('')}</div></details>` : ''}
  </div>`;
}

/* ---------- Widok: lista protokołów budowy ---------- */
const ProtViews = {};
ProtViews.protokoly = function () {
  const p = curProj(); if (!p) return UI.go('home');
  UI.header(p.nazwa + ' · protokoły', () => UI.wstecz('budowa'));
  const F = fold(S.ev); const urz = urzE();
  const ded = Prot.dedykowaneBudowy(), poz = Prot.pozostaleBudowy();
  const zapisane = pr => Object.values(F.prot).filter(x => x.def === pr.id).sort((a, b) => a.ts < b.ts ? 1 : -1);
  const blokDed = pr => {
    const urzT = urz.filter(u => Prot.pow(pr).length && Prot.pasuje(pr, u.id));
    const bezUrz = zapisane(pr).filter(x => !x.urz);
    return `<h2>${U.esc(pr.nazwa)} <span class="mute" style="font-size:14px">v${U.esc(pr.wersja)}</span></h2>
      ${pr.blad ? `<div class="badbox">${U.esc(pr.blad)}</div>` : ''}
      <div class="list">${urzT.map(u => {
        const ps = Prot.dlaUrzStan(u.id, F).filter(x => x.def === pr.id);
        return `<div class="li"><b>${U.esc(u.id)}</b><span class="grow">${U.esc(u.typ)}<br><span class="mute">${U.esc(u.kond || '')}${u.etap ? ' · etap ' + U.esc(u.etap) : ''}</span></span>
          ${ps.map(x => `<button class="btn sm" data-pid="${U.esc(x.pid)}">${Prot.chip(x)}</button>`).join('')}
          <button class="btn sm pri" data-new="${U.esc(pr.id)}" data-u="${U.esc(u.id)}">${ps.length ? '+ kolejny' : 'Wypełnij'}</button></div>`;
      }).join('')}
      ${bezUrz.map(x => `<div class="li"><span class="grow">${U.esc(x.nr || 'bez urządzenia')}</span><button class="btn sm" data-pid="${U.esc(x.pid)}">${Prot.chip(x)}</button></div>`).join('')}
      ${!Prot.pow(pr).length ? wybor(pr, urz) : urzT.length ? '' : '<div class="li mute">Brak urządzeń tego typu' + (S.etap ? ' w wybranym etapie' : '') + '.</div>'}</div>`;
  };
  // pozostałe protokoły: zapisane + wybór urządzenia z listy budowy (najpierw pasujące typem)
  const blokPoz = pr => `<div class="card stack"><b>${U.esc(pr.nazwa)} <span class="mute">v${U.esc(pr.wersja)}</span></b>
      ${zapisane(pr).map(x => `<button class="btn sm" data-pid="${U.esc(x.pid)}" style="text-align:left"><span class="grow">${U.esc(x.urz || 'bez urządzenia')}</span>${Prot.chip(x)}</button>`).join('')}
      ${wybor(pr, urz)}</div>`;
  view.innerHTML = etapSwitch()
    + (ded.length ? '<div class="lbl">Dedykowane tej budowie</div>' + ded.map(blokDed).join('') : '<p class="mute">Brak protokołów dedykowanych tej budowie (zakres prac i typy urządzeń).</p>')
    + (poz.length ? `<details class="card" style="margin-top:12px"><summary><b>Pozostałe protokoły (${poz.length})</b></summary><div class="stack" style="margin-top:8px">${poz.map(blokPoz).join('')}</div></details>` : '');
  bindEtap();
  view.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => UI.go('protokol', { pid: b.dataset.pid }));
  view.querySelectorAll('[data-new]').forEach(b => b.onclick = () => {
    const sel = b.dataset.sel ? view.querySelector(`select[data-selfor="${CSS.escape(b.dataset.new)}"]`) : null;
    UI.go('protokol', { nowy: b.dataset.new, urz: sel ? sel.value : b.dataset.u });
  });
};
/* Lista wyboru urządzenia do nowego protokołu: najpierw pasujące typem, potem pozostałe; można bez urządzenia. */
function wybor(pr, urz) {
  const pas = urz.filter(u => Prot.pow(pr).length && Prot.pasuje(pr, u.id)), resz = urz.filter(u => pas.indexOf(u) < 0);
  const opt = u => `<option value="${U.esc(u.id)}">${U.esc(u.id + ' – ' + (u.typ || '') + (u.kond ? ' · ' + u.kond : ''))}</option>`;
  return `<div class="row"><select class="grow" data-selfor="${U.esc(pr.id)}"><option value="">— bez urządzenia —</option>
    ${pas.length ? `<optgroup label="Pasujące typem">${pas.map(opt).join('')}</optgroup>` : ''}${resz.length ? `<optgroup label="Pozostałe urządzenia">${resz.map(opt).join('')}</optgroup>` : ''}</select>
    <button class="btn sm pri" data-new="${U.esc(pr.id)}" data-sel="1">Wypełnij</button></div>`;
}

/* ---------- Widok: formularz protokołu ---------- */
ProtViews.protokol = async function (par) {
  const p = curProj(); if (!p) return UI.go('home');
  const F = fold(S.ev);
  let rec;
  if (par.nowy) {
    const pr = Prot.def(par.nowy); if (!pr || !pr.def) { UI.toast('Brak definicji protokołu – zsynchronizuj tablet.'); return UI.wstecz('budowa'); }
    rec = nowyProtokol(pr, par.urz);
    UI.par = { pid: rec.pid }; await DB.set('draft:' + rec.pid, rec);
  } else {
    const zap = F.prot[par.pid];
    const dr = await DB.get('draft:' + par.pid);
    rec = dr && (!zap || dr.ts0 === zap.ts) ? dr : zap ? JSON.parse(JSON.stringify(zap)) : dr;
    if (!rec) { UI.toast('Nie znaleziono protokołu.'); return UI.wstecz('protokoly'); }
  }
  const pr = Prot.def(rec.def, rec.wersja);
  if (!pr || !pr.def) { UI.toast('Definicja ' + rec.def + ' v' + rec.wersja + ' nie jest dostępna na tablecie.'); return UI.wstecz('protokoly'); }
  const def = pr.def, dane = rec.dane, urzId = rec.urz;
  const zapisany = F.prot[rec.pid];
  const nr = (zapisany && zapisany.nr) || rec.nr || '';
  const tylkoOdczyt = rec.stan === 'zablokowany' && !Session.isBiuro();
  let zmiana = false;   // nowy protokół zapisuje się dopiero po pierwszej zmianie
  UI.header(p.nazwa + ' · ' + (urzId || 'protokół'), async () => { await zapiszPrzyWyjsciu(); UI.wstecz('protokoly'); });

  const pole = (f, w, wi, sek) => {
    const v = w[f.id], key = `data-f="${U.esc(f.id)}"` + (wi != null ? ` data-w="${wi}" data-s="${U.esc(sek.id)}"` : '');
    const et = U.esc(f.etykieta || nazwaPola(f.id)) + (f.wymagane ? ' <span class="req">*</span>' : '') + (f.jednostka ? ` <span class="mute">[${U.esc(f.jednostka)}]</span>` : '');
    const dis = tylkoOdczyt ? 'disabled' : '';
    let inner;
    switch (f.typ) {
      case 'auto': inner = `<div class="auto" data-auto="${U.esc(f.id)}">${U.esc(f.id === 'nr_protokolu' ? (nr ? ocenWzor(f.wzor, Object.assign(protCtx(urzId), { nr, dd: (dane.data || '').slice(8, 10), mm: (dane.data || '').slice(5, 7) }), {}) : 'nadawany po „Prześlij” i synchronizacji') : v || '')}</div>`; break;
      case 'taknie': inner = `<div class="seg">${['tak', 'nie'].map(o => `<button type="button" ${key} data-v="${o}" class="${v === o ? 'on' : ''}" ${dis}>${o.toUpperCase()}</button>`).join('')}</div>`; break;
      case 'wybor': inner = `<div class="seg">${f.opcje.map(o => `<button type="button" ${key} data-v="${U.esc(o)}" class="${v === o ? 'on' : ''}" ${dis}>${U.esc(o)}</button>`).join('')}</div>`; break;
      case 'znacznik': inner = `<div class="seg"><button type="button" ${key} data-tog="1" class="${v ? 'on' : ''}" ${dis}>${v ? '☒ tak' : '☐ nie'}</button></div>`; break;
      case 'urzadzenie': {
        const uz = sek.typ === 'tabela' ? (dane[sek.id] || []).filter((r, j) => j !== wi).map(r => r[f.id]).filter(String) : [];
        const lst = urzDoPola(f, uz, v);
        inner = `<select ${key} ${dis}><option value="">— wybierz z listy budowy —</option>${lst.map(u => `<option value="${U.esc(u.id)}" ${u.id === v ? 'selected' : ''}>${U.esc(u.id + ' – ' + (u.typ || '') + (u.kond ? ' · ' + u.kond : ''))}</option>`).join('')}</select>`;
        break;
      }
      case 'tekst_dlugi': inner = `<textarea ${key} ${dis}>${U.esc(v || '')}</textarea>`; break;
      case 'data': inner = `<input type="date" ${key} value="${U.esc(v || '')}" ${dis}>`; break;
      case 'godzina': inner = `<input type="time" ${key} value="${U.esc(hhmm(v))}" ${dis}>`; break;
      case 'liczba': inner = `<input type="text" inputmode="decimal" ${key} value="${U.esc(v == null ? '' : v)}" ${dis}>`; break;
      case 'kod': inner = `<div class="row"><input type="text" ${key} value="${U.esc(v || '')}" class="grow" style="flex:1" ${dis}>${tylkoOdczyt ? '' : `<button type="button" class="btn sm" data-scan="${U.esc(f.id)}"${wi != null ? ` data-w="${wi}" data-s="${U.esc(sek.id)}"` : ''}>Skanuj</button>`}</div>`; break;
      default: inner = `<input type="text" ${key} value="${U.esc(v || '')}" ${dis}>`;
    }
    return `<label class="pf ${f.typ === 'tekst_dlugi' ? 'wide' : ''}" data-pf="${U.esc((wi != null ? sek.id + ':' + wi + ':' : '') + f.id)}"><span class="f">${et}</span>${inner}</label>`;
  };
  const sekcja = sek => {
    if (sek.typ === 'tabela') {
      const w = dane[sek.id] = dane[sek.id] || [];
      return `<section class="card psek" data-sek="${U.esc(sek.id)}"><div class="row"><h2 class="grow" style="margin:0">${U.esc(sek.tytul)} (${w.length})</h2>${tylkoOdczyt ? '' : (poleUrz(sek) ? `<button type="button" class="btn sm" data-addall="${U.esc(sek.id)}">Dodaj wszystkie</button>` : '') + `<button type="button" class="btn sm pri" data-add="${U.esc(sek.id)}">+ Dodaj</button>`}</div>
        ${w.map((r, i) => `<div class="pwiersz"><div class="row"><b class="grow">${U.esc(r.nr || 'Pozycja ' + (i + 1))}</b>${tylkoOdczyt ? '' : `<button type="button" class="btn sm" data-del="${U.esc(sek.id)}" data-i="${i}">Usuń</button>`}</div>
          <div class="pgrid2">${sek.pola.map(f => pole(f, r, i, sek)).join('')}</div></div>`).join('') || '<p class="mute">Brak pozycji – dodaj przyciskiem „+ Dodaj”.</p>'}</section>`;
    }
    return `<section class="card psek" data-sek="${U.esc(sek.id)}" ${sekcjaWidoczna(sek, dane) ? '' : 'hidden'}><h2 style="margin:0 0 6px">${U.esc(sek.tytul)}</h2><div class="pgrid2">${sek.pola.map(f => pole(f, dane, null, sek)).join('')}</div></section>`;
  };
  przeliczAuto(def, dane, urzId);
  view.innerHTML = `
    <div class="row" style="margin-bottom:8px"><h1 class="grow" style="margin:0">${U.esc(pr.nazwa)}</h1>${Prot.chip(Object.assign({}, rec, { nr }))}</div>
    <p class="mute" style="margin-top:0">Urządzenie <b>${U.esc(urzId || 'bez urządzenia')}</b> · wersja ${U.esc(rec.wersja)}${zapisany ? ' · ostatni zapis: ' + U.esc(zapisany.kto) + ' ' + U.fmt(zapisany.ts) : ''}${tylkoOdczyt ? ' · zablokowany przez biuro (tylko podgląd)' : ''}</p>
    <form class="stack" id="pform" onsubmit="return false">${def.sekcje.map(sekcja).join('')}</form>
    <div class="pfoot">
      ${tylkoOdczyt ? '' : '<button class="btn" id="pSave">Zapisz</button><button class="btn pri" id="pDone">Prześlij</button>'}
      ${Session.isBiuro() || (rec.stan === 'roboczy' && !nr) ? '<button class="btn bad" id="pDel">Usuń protokół</button>' : ''}
      ${Session.isBiuro() && rec.stan !== 'roboczy' ? `<button class="btn" id="pLock">${rec.stan === 'zablokowany' ? 'Odblokuj' : 'Zablokuj'}</button><button class="btn" id="pWord">Generuj Word</button>` : ''}
    </div>
    <p class="mute" id="pInfo"></p>`;

  const draft = () => { zmiana = true; DB.set('draft:' + rec.pid, Object.assign(rec, { ts0: zapisany ? zapisany.ts : '' })); };
  const odswiezAuto = () => {
    przeliczAuto(def, dane, urzId);
    view.querySelectorAll('[data-auto]').forEach(el => { if (el.dataset.auto !== 'nr_protokolu') el.textContent = dane[el.dataset.auto] || ''; });
    view.querySelectorAll('[data-sek]').forEach(el => { const s = def.sekcje.find(x => x.id === el.dataset.sek); if (s && s.typ !== 'tabela') el.hidden = !sekcjaWidoczna(s, dane); });
  };
  const cel = el => el.dataset.w != null ? dane[el.dataset.s][+el.dataset.w] : dane;
  const form = $('#pform');
  form.addEventListener('input', e => {
    const el = e.target; if (!el.dataset || !el.dataset.f) return;
    cel(el)[el.dataset.f] = el.value; el.closest('.pf').classList.remove('err');
    if (el.tagName === 'SELECT') {   // wybór urządzenia → autouzupełnienie pól z karty urządzenia
      const sek = def.sekcje.find(x => x.id === (el.dataset.s || el.closest('[data-sek]').dataset.sek));
      wypelnijZUrz(sek, cel(el), el.value); draft(); return ProtViews.protokol({ pid: rec.pid });
    }
    draft(); odswiezAuto();
  });
  form.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || tylkoOdczyt) return;
    if (b.dataset.add) { const sek = def.sekcje.find(s => s.id === b.dataset.add); const w = dane[sek.id]; w.push(nowyWiersz(sek, w.length + 1, urzId)); draft(); return ProtViews.protokol({ pid: rec.pid }); }
    if (b.dataset.addall) {
      const sek = def.sekcje.find(s => s.id === b.dataset.addall), f = poleUrz(sek);
      let w = dane[sek.id];
      // puste wiersze domyślne (bez urządzenia i bez wpisów) zastępujemy wierszami urządzeń
      w = dane[sek.id] = w.filter((r, i) => r[f.id] || JSON.stringify(r) !== JSON.stringify(nowyWiersz(sek, i + 1, urzId)));
      const nowe = urzDoPola(f, w.map(r => r[f.id]).filter(String));
      if (!nowe.length) return UI.toast('Wszystkie urządzenia tego typu' + (S.etap ? ' w etapie' : '') + ' są już na liście.');
      nowe.forEach(u => { const r = nowyWiersz(sek, w.length + 1, urzId); r[f.id] = u.id; wypelnijZUrz(sek, r, u.id); w.push(r); });
      draft(); UI.toast('Dodano ' + nowe.length + ' poz.'); return ProtViews.protokol({ pid: rec.pid });
    }
    if (b.dataset.del) { if (!confirm('Usunąć pozycję ' + (+b.dataset.i + 1) + '?')) return; dane[b.dataset.del].splice(+b.dataset.i, 1); draft(); return ProtViews.protokol({ pid: rec.pid }); }
    if (b.dataset.scan) { return Dialogs.scan(v => { cel(b)[b.dataset.scan] = v; draft(); ProtViews.protokol({ pid: rec.pid }); }); }
    if (!b.dataset.f) return;
    const t = cel(b);
    if (b.dataset.tog) { t[b.dataset.f] = !t[b.dataset.f]; b.classList.toggle('on', !!t[b.dataset.f]); b.textContent = t[b.dataset.f] ? '☒ tak' : '☐ nie'; }
    else { t[b.dataset.f] = t[b.dataset.f] === b.dataset.v ? '' : b.dataset.v; b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b && t[b.dataset.f] === b.dataset.v)); }
    b.closest('.pf').classList.remove('err'); draft(); odswiezAuto();
  });

  async function zapisz(stan) {
    przeliczAuto(def, dane, urzId);
    const d = { pid: rec.pid, def: rec.def, wersja: rec.wersja, prefiks: rec.prefiks || def.prefiks_nr || '', stan, dane: JSON.parse(JSON.stringify(dane)) };
    if (nr) d.nr = nr;
    await addEvent('protokol', urzId, d);
    // nr seryjny urządzenia z protokołu → karta urządzenia i lista urządzeń
    if (urzId) def.sekcje.filter(sek => sek.typ !== 'tabela').forEach(sek => (sek.pola || []).filter(f => f.zapisz_do_urzadzenia && dane[f.id]).forEach(async f => {
      const st = fold(S.ev).dev[urzId]; const u = ((S.proj || {}).urzadzenia || []).find(x => x.id === urzId) || {};
      if (((st && st.sn) || u.sn) !== dane[f.id]) await addEvent('nr', urzId, { sn: dane[f.id] });
    }));
    // tabele: nr seryjny wpisany przy wybranym urządzeniu → karta urządzenia (gdy urządzenie nie ma jeszcze numeru)
    for (const sek of def.sekcje.filter(x => x.typ === 'tabela' && poleUrz(x))) {
      const fu = poleUrz(sek);
      for (const r of dane[sek.id] || []) for (const f of sek.pola.filter(x => x.zapisz_do_urzadzenia && r[x.id] && r[fu.id])) {
        if (!zUrz(r[fu.id], 'sn')) await addEvent('nr', r[fu.id], { sn: r[f.id] });
      }
    }
    await DB.del('draft:' + rec.pid); zmiana = false;
  }
  async function zapiszPrzyWyjsciu() { if (zmiana && !tylkoOdczyt) { await zapisz(rec.stan || 'roboczy'); UI.toast('Protokół zapisany'); } }
  if ($('#pSave')) $('#pSave').onclick = async () => {
    if (rec.stan !== 'roboczy') { const b = brakiProtokolu(def, dane); if (b.length) return pokazBraki(b); }
    await zapisz(rec.stan || 'roboczy'); UI.toast('Zapisano'); ProtViews.protokol({ pid: rec.pid });
  };
  if ($('#pDone')) $('#pDone').onclick = async () => {
    const b = brakiProtokolu(def, dane); if (b.length) return pokazBraki(b);
    rec.stan = rec.stan === 'zablokowany' ? 'zablokowany' : 'gotowy';
    await zapisz(rec.stan); UI.toast(nr ? 'Protokół zapisany' : 'Protokół przesłany – numer nada serwer przy synchronizacji'); UI.wstecz('protokoly');
  };
  if ($('#pDel')) $('#pDel').onclick = async () => {
    if (!confirm('Usunąć protokół' + (nr ? ' ' + nr : '') + '? Zniknie z list' + (nr ? '; numer nie zostanie użyty ponownie, plik Word trafi do kosza' : '') + '.')) return;
    if (zapisany) await addEvent('protokol', urzId, { pid: rec.pid, def: rec.def, wersja: rec.wersja, prefiks: rec.prefiks || def.prefiks_nr || '', stan: 'usuniety', dane: {} });
    await DB.del('draft:' + rec.pid); zmiana = false;
    UI.toast('Protokół usunięty'); UI.wstecz('protokoly');
  };
  if ($('#pLock')) $('#pLock').onclick = async () => { rec.stan = rec.stan === 'zablokowany' ? 'gotowy' : 'zablokowany'; await zapisz(rec.stan); ProtViews.protokol({ pid: rec.pid }); };
  if ($('#pWord')) $('#pWord').onclick = async () => {
    if (!navigator.onLine) return UI.toast('Generowanie Word wymaga internetu.');
    if (zmiana || S.pending) { await zapiszPrzyWyjsciu(); await Sync.run(); }
    $('#pInfo').textContent = 'Generuję Word…';
    try { const r = await API.docx(S.kod, rec.pid); $('#pInfo').innerHTML = `Zapisano na Dysku (folder budowy → Protokoły): <a href="${U.esc(r.url)}" target="_blank" rel="noopener">${U.esc(r.name)}</a>`; }
    catch (e) { $('#pInfo').textContent = 'Nie udało się: ' + e.message; }
  };
  function pokazBraki(b) {
    view.querySelectorAll('.pf.err').forEach(x => x.classList.remove('err'));
    b.forEach(x => { const el = view.querySelector(`[data-pf="${CSS.escape((x.wiersz != null ? x.sek + ':' + x.wiersz + ':' : '') + x.pole)}"]`); if (el) el.classList.add('err'); });
    const first = view.querySelector('.pf.err'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    UI.toast('Uzupełnij: ' + b.slice(0, 3).map(x => x.etyk).join(', ') + (b.length > 3 ? ' i ' + (b.length - 3) + ' więcej' : ''));
  }
};
