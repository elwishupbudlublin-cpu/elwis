/* ELWIS – czas pracy (od 1.58.0)
   Każda osoba potwierdza własne godziny; wpis za kogoś = propozycja; biuro zatwierdza (panel PC); po zatwierdzeniu wpis zablokowany.
   Zdarzenia (wpis / potw / odrz) czekają w kolejce „czasKolejka” i idą na serwer przy synchronizacji (operacja `czas`). */
const CZ = {
  min: s => { const [h, m] = String(s || '0:0').split(':'); return (+h) * 60 + (+(m || 0)); },
  hm: m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'),
  h: (od, d) => (CZ.min(d) - CZ.min(od)) / 60,
  hTxt: x => String(Math.round(x * 2) / 2).replace('.', ',') + ' h',
  mnD: d => d.getHours() * 60 + d.getMinutes(),
  NB: { urlop: 'Urlop', zwolnienie: 'Zwolnienie lekarskie', nieobecnosc: 'Nieobecność', inne: 'Inne' },
  NBKL: { urlop: 'on ok', zwolnienie: 'on bad', nieobecnosc: 'on wip', inne: 'on wip' },
  /* liczba dni nieobecności: wpis ręczny co 0,5 (min 0,5, max 60); przyciski ±1 */
  dniFix(v) { const n = Math.round(parseFloat(String(v).replace(',', '.')) * 2) / 2; return isFinite(n) ? Math.max(0.5, Math.min(60, n)) : 1; },
  dniTxt(n) { n = n || 1; return String(n).replace('.', ',') + ' ' + (n === 1 ? 'dzień' : n < 1 || n % 1 ? 'dnia' : 'dni'); },
  dniPole(id, n) { return `<div class="tp tpn"><button type="button" data-dn="-1">−</button><input type="text" inputmode="decimal" id="${id}" value="${String(n).replace('.', ',')}"><button type="button" data-dn="1">+</button></div>`; },
  FAZY: ['Przygotowanie i Rozpoznanie', 'Logistyka i Zamówienia', 'Montaż i Wykonawstwo', 'Uruchomienia i Pomiary', 'Zamknięcie i Serwis'],
  prac: n => ((S.boot && S.boot.pracownicy) || []).find(p => p.name === n),
  okno(n) { const p = CZ.prac(n); return p && String(p.ekipa) === '1' ? [480, 960] : [420, 900]; },
  dni(t) { const a = t.start ? new Date(t.start) : null, b = t.koniec ? new Date(t.koniec) : null; const dB = b ? U.day(b) : U.day(a); return { dA: a ? U.day(a) : dB, dB }; },
  wielo(t) { const { dA, dB } = CZ.dni(t); return dA !== dB; },
  /* godziny zadania w danym dniu dla osoby (jak oś planu): z godzinami – wg godzin, środkowe dni i całodniowe – okno ekipy */
  planOkno(t, dzien, osoba) {
    const [o0, o1] = CZ.okno(osoba), { dA, dB } = CZ.dni(t);
    if (t.godzStart && t.godzKoniec && t.start && t.koniec) {
      const a = new Date(t.start), b = new Date(t.koniec);
      return [dzien === dA ? CZ.mnD(a) : o0, dzien === dB ? CZ.mnD(b) : o1];
    }
    if (dA === dB && t.est > 0) return [o0, Math.min(o1 + 120, o0 + Math.round(t.est / 18e5) * 30)];
    return [o0, o1];
  },
  roboczy: k => !U.wolny(k),
  plus: (k, n) => U.day(new Date(new Date(k + 'T12:00').getTime() + n * 864e5)),
  nastRob(k) { let d = CZ.plus(k, 1); while (U.wolny(d)) d = CZ.plus(d, 1); return d; },
  nazwyOsob: t => ((S.boot && S.boot.pracownicy) || []).filter(p => p.cu && t.osoby.includes(String(p.cu))).map(p => p.name),
  /* wybór godziny −/+ co 30 min */
  tp: (k, m, dis) => `<span class="tp${dis ? ' dis' : ''}" data-tpk="${k}"><button type="button" data-tpd="-30" aria-label="−30 min">−</button><b>${CZ.hm(m)}</b><button type="button" data-tpd="30" aria-label="+30 min">+</button></span>`,
  tpBind(root, fn) { root.querySelectorAll('[data-tpk]').forEach(el => el.querySelectorAll('[data-tpd]').forEach(b => b.onclick = e => { e.preventDefault(); fn(el.dataset.tpk, +b.dataset.tpd); })); }
};

const Czas = {
  async kolejka() { return (await DB.get('czasKolejka')) || []; },
  async dodaj(evs) {
    const q = await this.kolejka(); q.push(...evs); await DB.set('czasKolejka', q);
    await liczOczekujace(); if (navigator.onLine) Sync.soon();
  },
  async sync() {
    if (!S.user || !API.ready()) return;
    const q = await this.kolejka();
    const r = await API.czas({ op: 'push', zd: q });
    const ids = new Set(q.map(e => e.id));
    await DB.set('czasKolejka', (await this.kolejka()).filter(e => !ids.has(e.id)));
    await DB.set('czasStan', { wpisy: r.wpisy || [], auto: !!r.auto, czas: r.czas, kto: S.user.name });
    S.czasErr = '';
    if (r.bledy && r.bledy.length && Session.isBiuro()) UI.toast('ClickUp: ' + r.bledy[0]);
  },
  /* wpisy z serwera + niewysłane z tabletu, złożone jak na serwerze (własny wpis ma pierwszeństwo) */
  async lista() {
    const st = (await DB.get('czasStan')) || { wpisy: [] }, q = await this.kolejka();
    const W = (st.wpisy || []).map(w => Object.assign({}, w));
    const key = w => w.osoba + '|' + (w.zad ? w.zad + '|' + w.data : 'spoza|' + w.wid);
    const akt = k => W.filter(x => key(x) === k && ['wlasne', 'prop', 'zatw'].includes(x.stan));
    q.slice().sort((a, b) => (a.ts < b.ts ? -1 : 1)).forEach(e => {
      const d = e.d || {};
      if (e.typ === 'wpis') {
        if (W.some(x => x.wid === d.wid)) return;
        const w = Object.assign({}, d, { kto: e.kto, ts: e.ts, stan: e.kto === d.osoba ? 'wlasne' : 'prop', lok: true });
        const inne = akt(key(w));
        if (inne.some(x => x.stan === 'zatw')) w.stan = 'po_zatw';
        else if (w.stan === 'prop' && inne.some(x => x.stan === 'wlasne')) w.stan = 'zignorowany';
        else inne.forEach(x => { x.stan = 'zastapiony'; });
        W.push(w);
      } else if (e.typ === 'potw' || e.typ === 'odrz') {
        const w = W.find(x => x.wid === d.ref);
        if (w && w.stan === 'prop') { w.stan = e.typ === 'potw' ? 'wlasne' : 'odrzucone'; w.lok = true; if (e.typ === 'potw') w.potw = e.ts; }
      }
    });
    return W;
  },
  akt: w => ['wlasne', 'prop', 'zatw'].includes(w.stan),
  async dla(osoba, dzien) { return (await this.lista()).filter(w => w.osoba === osoba && w.data === dzien && this.akt(w) && !w.nieob); },
  /* urlop / nieobecność obejmujące dzień (także odrzucone – do pokazania w planie) */
  async nieob(osoba, dzien) { return (await this.lista()).filter(w => w.nieob && (!osoba || w.osoba === osoba) && w.data <= dzien && (w.dataDo || w.data) >= dzien && ['wlasne', 'prop', 'zatw', 'odrzB'].includes(w.stan)); },
  /* wpis wysłany za osobę: wlasne (osoba sama), prop (ktoś inny), zatw */
  async godzinyDnia(osoba, dzien, pomin) {
    return (await this.dla(osoba, dzien)).filter(w => !(pomin && pomin(w)) && w.stan !== 'prop').reduce((s, w) => s + CZ.h(w.od, w.do), 0);
  },
  async auto() { const st = (await DB.get('czasStan')) || {}; return !!st.auto; },
  async propozycje(osoba) { return (await this.lista()).filter(w => w.osoba === osoba && w.stan === 'prop' && w.kto !== osoba); },
  /* niezamknięte dni: zadania z planu (ostatnie 14 dni, bez dziś, dni robocze) bez wpisu tej osoby */
  async braki(osoba) {
    const pl = await DB.get('plan'), p = CZ.prac(osoba); if (!pl || !p || !p.cu) return [];
    const dzis = U.day(new Date()), W = await this.lista(), kolej = (await DB.get('zadKolejka')) || [];
    const ma = new Set(W.filter(w => w.osoba === osoba && (this.akt(w) || w.stan === 'odrzucone')).map(w => w.zad + '|' + w.data));
    const wolne = d => W.some(w => w.nieob && w.osoba === osoba && this.akt(w) && w.data <= d && (w.dataDo || w.data) >= d);
    const out = [];
    for (let i = 14; i >= 1; i--) {
      const d = CZ.plus(dzis, -i); if (U.wolny(d) || wolne(d)) continue;
      (pl.zadania || []).filter(t => t.osoby.includes(String(p.cu)) && naDzien(t, d)).forEach(t => {
        if (t.zamk || ma.has(t.id + '|' + d)) return;
        if (kolej.some(z => z.task === t.id) || ['on hold', 'complete', 'cancelled'].includes(String(t.status || '').toLowerCase())) return;
        out.push({ t, d });
      });
    }
    return out;
  },
  /* budowy, na których osoba wpisywała dziś zmiany (z zapisanych na tablecie) */
  async budowyDnia(osoba, dzien) {
    const out = [];
    for (const p of (S.boot && S.boot.projekty) || []) {
      const ev = (await DB.eventsFor(p.kod)).filter(e => e.kto === osoba && e.ts && U.day(e.ts) === dzien);
      if (ev.length) out.push({ kod: p.kod, nazwa: p.nazwa, n: ev.length });
    }
    return out.sort((a, b) => b.n - a.n);
  },
  /* notatka automatyczna: co osoba zrobiła dziś w budowie (z wpisów ELWIS) */
  async notatka(kod, osoba, dzien) {
    if (!kod) return '';
    const ev = (await DB.eventsFor(kod)).filter(e => e.kto === osoba && e.ts && U.day(e.ts) === dzien);
    if (!ev.length) return '';
    const kroki = {}, sn = [], br = [], cz = [];
    let foto = 0, nt = 0;
    ev.forEach(e => { const d = e.d || {};
      if (e.typ === 'krok' && d.wart) { const k = d.nazwa || ('krok ' + (d.krok + 1)); (kroki[k] = kroki[k] || []).push(e.urz); }
      else if (e.typ === 'nr' && d.sn) sn.push(e.urz);
      else if (e.typ === 'brak') br.push((e.urz ? e.urz + ' – ' : '') + (d.kat || 'brak'));
      else if (e.typ === 'brak_zamk') cz.push('zamknięty brak');
      else if (e.typ === 'foto') foto++;
      else if (e.typ === 'notatka') nt++;
      else if (e.typ === 'protokol' && d.stan === 'gotowy') cz.push('protokół ' + (d.nr || d.def || '') + ' przesłany'); });
    const lista = a => { const u = [...new Set(a.filter(Boolean))]; return u.length > 6 ? u.slice(0, 6).join(', ') + ' i ' + (u.length - 6) + ' innych' : u.join(', '); };
    return [...Object.entries(kroki).map(([k, a]) => `${k}: ${lista(a)} (${a.length})`), sn.length ? `nr seryjny: ${lista(sn)}` : '',
      br.length ? `braki: ${br.slice(0, 4).join('; ')}${br.length > 4 ? '…' : ''}` : '', ...cz, foto ? `${foto} zdjęć` : '', nt ? `${nt} notatek` : ''].filter(String).join('; ');
  },
  /* pierwsze wolne terminy dla osób (plan z ClickUp + wpisy czasu), co najmniej `min` minut, od dnia `od` */
  async terminy(osoby, min, od) {
    const pl = await DB.get('plan'), W = await this.lista(), out = [];
    let d = od;
    for (let i = 0; i < 20 && out.length < 2; i++, d = CZ.nastRob(d)) {
      if (U.wolny(d)) continue;
      const okna = osoby.map(n => CZ.okno(n)), o0 = Math.max(...okna.map(o => o[0])), o1 = Math.min(...okna.map(o => o[1]));
      const zaj = [];
      osoby.forEach(n => { const p = CZ.prac(n);
        ((pl && pl.zadania) || []).filter(t => p && t.osoby.includes(String(p.cu)) && naDzien(t, d) && !t.zamk).forEach(t => zaj.push(CZ.planOkno(t, d, n)));
        W.filter(w => w.osoba === n && w.data === d && this.akt(w) && !w.nieob).forEach(w => zaj.push([CZ.min(w.od), CZ.min(w.do)]));
        W.filter(w => w.nieob && w.osoba === n && this.akt(w) && w.data <= d && (w.dataDo || w.data) >= d).forEach(() => zaj.push([0, 1440])); });
      zaj.sort((a, b) => a[0] - b[0]);
      let s = o0;
      for (const [a, b] of zaj) { if (a - s >= Math.min(min, o1 - o0)) break; s = Math.max(s, b); }
      const dl = Math.min(min, o1 - s);
      if (dl >= 30 && (dl >= Math.min(min, o1 - o0) || i > 10)) out.push({ data: d, od: CZ.hm(s), do: CZ.hm(s + Math.floor(dl / 30) * 30) });
    }
    return out;
  },
  zdarzenie(typ, d) { return { id: U.uid('cz'), ts: U.now(), kto: S.user.name, typ, d }; }
};

const CZ_STAN = { odrzB: ['odrzucone przez biuro', 'c-bad'], zatw: ['🔒 zatwierdzone', 'c-lock'], wlasne: ['czeka na biuro', 'c-gr'], prop: ['propozycja', 'c-pro'], odrzucone: ['nie pracował', 'c-gr'] };
function czChip(w) { const s = CZ_STAN[w.stan]; return s ? `<span class="czchip ${s[1]}">${s[0]}${w.lok ? ' · niewysłane' : ''}</span>` : ''; }

Object.assign(Dialogs, {
  /* Wykonane / Do kontynuacji / Dzień pracy – godziny osób (−/+ co 30 min) i propozycja terminu dokończenia */
  async czasPracy(t, dzien, st, opc = {}) {
    const ja = S.user.name, bud = opc.bud || null, W = await Czas.lista();
    const plan = CZ.nazwyOsob(t);
    const osoby = [ja, ...plan.filter(n => n !== ja)];
    const rows = osoby.map(n => {
      const istn = W.find(w => w.osoba === n && w.zad === t.id && w.data === dzien && Czas.akt(w));
      const [a, b] = istn ? [CZ.min(istn.od), CZ.min(istn.do)] : CZ.planOkno(t, dzien, n);
      const wlasny = istn && istn.stan !== 'prop' && n !== ja && istn.kto === n;
      return { n, on: n === ja || (!wlasny && plan.includes(n)), od: a, do: b, istn, wlasny, zatw: istn && istn.stan === 'zatw' };
    });
    if (rows[0].zatw) return this.czasInfo(rows[0].istn);
    const wielo = CZ.wielo(t), ostatni = CZ.dni(t).dB;
    let termin = null, terminy = [], powod = opc.powod || '', notatka = await Czas.notatka(bud && bud.kod, ja, dzien), notEd = false;
    const inne = {};   // inne wpisy osób w tym dniu (kontrola nakładania, licznik)
    for (const r of rows) inne[r.n] = W.filter(w => w.osoba === r.n && w.data === dzien && Czas.akt(w) && w.zad !== t.id && w.stan !== 'prop' && !w.nieob);
    const planH = r => { const [a, b] = CZ.planOkno(t, dzien, r.n); return (b - a) / 60; };
    const reszta = () => { const r = rows[0]; let h = Math.max(0.5, planH(r) - (r.do - r.od) / 60);
      if (wielo) { for (let d = CZ.plus(dzien, 1); d <= ostatni; d = CZ.plus(d, 1)) if (!U.wolny(d)) { const [a, b] = CZ.planOkno(t, d, r.n); h += (b - a) / 60; } }
      return Math.round(h * 2) / 2; };
    const liczTerminy = async () => {
      if (st !== 'update required') return;
      const kto = rows.filter(r => r.on && !r.wlasny).map(r => r.n);
      const start = wielo ? CZ.nastRob(CZ.nastRob(dzien)) : CZ.nastRob(dzien);
      terminy = await Czas.terminy(kto.length ? kto : [ja], Math.min(reszta(), 8) * 60, start < U.day(new Date()) ? CZ.nastRob(U.day(new Date())) : start);
      if (!termin && terminy[0]) termin = terminy[0];
    };
    await liczTerminy();
    const kolizja = r => r.on && !r.wlasny && (r.do - r.od < 30 || inne[r.n].some(w => CZ.min(w.od) < r.do && CZ.min(w.do) > r.od));
    const STN = { complete: ['✓ Wykonane', 'ok'], 'update required': ['⏸ Do kontynuacji', 'wip'], dzien: ['▶ Dzień pracy (dalej wg planu)', 'ok'] };
    const draw = () => {
      const r0 = rows[0], dzisH = inne[ja].reduce((s, w) => s + CZ.h(w.od, w.do), 0) + (r0.do - r0.od) / 60;
      modal.innerHTML = `<div class="ov" id="ov"><div class="sheet czs"><div class="shead"><div class="grow"><div class="mute">${bud ? U.esc(bud.kod) + ' · ' : ''}${U.esc(dzien)}${wielo ? ' · zadanie kilkudniowe do ' + U.esc(ostatni) : ''}</div><h3>${U.esc(t.nazwa)}</h3></div><span class="czsum">Twoje godziny tego dnia: <b>${CZ.hTxt(dzisH)}</b></span></div>
        <div class="sbody">
          <div class="czst">${Object.entries(STN).filter(([k]) => k !== 'dzien' || (wielo && dzien < ostatni)).map(([k, [tx, kl]]) => `<button class="${k === st ? 'on ' + kl : ''}" data-st="${k}">${tx}</button>`).join('')}</div>
          <div class="card"><div class="row"><span class="lbl grow">Czas pracy${st === 'update required' ? ' – wymagany' : ''}</span><span class="mute">krok 30 min · liczone dokładnie od–do</span></div>
            ${rows.map((r, i) => `<div class="czrow${kolizja(r) ? ' bad' : ''}"><button class="chk${r.on ? ' on' : ''}" data-on="${i}" ${i === 0 ? 'disabled' : ''}>${r.on ? '✓' : ''}</button>
              <span class="czn">${U.esc(r.n)}${i === 0 ? ' <span class="mute">(ja)</span>' : r.wlasny ? ' <span class="czchip c-gr">wpisał(a) sam(a)</span>' : r.on ? ' <span class="czchip c-pro">propozycja</span>' : ''}</span>
              ${r.wlasny ? `<span class="mute">${U.esc(r.istn.od)}–${U.esc(r.istn.do)}</span>` : `${CZ.tp('od' + i, r.od, !r.on)}<span>–</span>${CZ.tp('do' + i, r.do, !r.on)}`}<b class="czh">${r.on && !r.wlasny ? CZ.hTxt((r.do - r.od) / 60) : ''}</b></div>`).join('')}
            <div class="row" style="gap:12px;margin-top:6px"><button class="btn sm" id="czDod">＋ dodaj osobę</button><button class="btn sm" id="czNot">Notatka${notatka ? ' ✎' : ''}</button><span class="grow"></span>${rows.some(kolizja) ? '<span class="bad">Godziny nachodzą na inne wpisy albo są krótsze niż 30 min</span>' : ''}</div></div>
          ${st === 'update required' ? `<div class="card"><div class="lbl">Dokończenie – propozycja terminu dla biura</div>
            <p class="mute" style="margin:4px 0 8px">Zostało ok. <b>${CZ.hTxt(reszta())}</b>${wielo ? ' (z pozostałymi dniami zadania)' : ''}. Pierwsze wolne terminy:</p>
            <div class="czterm">${terminy.map((x, i) => `<button class="${termin && termin.data === x.data && termin.od === x.od ? 'on' : ''}" data-tr="${i}"><b>${U.esc(PC_dzien(x.data))}</b><span>${x.od}–${x.do}</span></button>`).join('')}
              <button class="${termin && !terminy.some(x => x.data === termin.data && x.od === termin.od) ? 'on' : ''}" id="czInny"><b>inny…</b><span>${termin && !terminy.some(x => x.data === termin.data && x.od === termin.od) ? U.esc(PC_dzien(termin.data) + ' ' + termin.od + '–' + termin.do) : 'wybierz'}</span></button></div>
            <div class="row" style="margin-top:8px"><span class="mute grow">Powód przerwania</span><select id="czPw">${['', ...POWODY_ZAD].map(x => `<option ${x === powod ? 'selected' : ''}>${U.esc(x)}</option>`).join('')}</select></div></div>` : ''}
        </div>
        <div class="sfoot"><button class="btn" id="czX">Anuluj</button><span class="grow"></span><button class="btn pri" id="czOk">${st === 'update required' ? 'Zapisz i wyślij do biura' : 'Zapisz'}</button></div></div></div>`;
      $('#czX').onclick = UI.close;
      modal.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => { st = b.dataset.st; await liczTerminy(); draw(); });
      modal.querySelectorAll('[data-on]').forEach(b => b.onclick = async () => { const r = rows[+b.dataset.on]; if (r.wlasny) return; r.on = !r.on; await liczTerminy(); draw(); });
      CZ.tpBind(modal, (k, dlt) => { const i = +k.slice(2), r = rows[i]; if (!r.on) return;
        if (k.startsWith('od')) r.od = Math.max(0, Math.min(r.do - 30, r.od + dlt)); else r.do = Math.min(24 * 60, Math.max(r.od + 30, r.do + dlt)); draw(); });
      modal.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => { termin = terminy[+b.dataset.tr]; draw(); });
      if ($('#czPw')) $('#czPw').onchange = e => { powod = e.target.value; };
      if ($('#czInny')) $('#czInny').onclick = () => { const d = prompt('Dzień dokończenia (rrrr-mm-dd):', termin ? termin.data : CZ.nastRob(dzien)); if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
        const g = prompt('Godzina rozpoczęcia (gg:mm):', '07:00'); if (!g || !/^\d{1,2}:\d{2}$/.test(g)) return;
        termin = { data: d, od: CZ.hm(CZ.min(g)), do: CZ.hm(Math.min(24 * 60, CZ.min(g) + Math.min(reszta(), 8) * 60)) }; draw(); };
      $('#czDod').onclick = () => {
        const wolni = ((S.boot && S.boot.pracownicy) || []).filter(p => p.cu && !rows.some(r => r.n === p.name) && p.rola !== 'podwykonawca').map(p => p.name);
        if (!wolni.length) return UI.toast('Brak innych osób do dodania');
        const n = prompt('Dodaj osobę – wpisz imię:\n' + wolni.join(', ')); const f = n && wolni.find(x => U.norm(x).startsWith(U.norm(n)));
        if (!f) return; const [a, b] = CZ.planOkno(t, dzien, f); rows.push({ n: f, on: true, od: r0.od || a, do: r0.do || b }); inne[f] = W.filter(w => w.osoba === f && w.data === dzien && Czas.akt(w) && w.stan !== 'prop'); draw(); };
      $('#czNot').onclick = () => this.czasNotatka(notatka, v => { notatka = v; notEd = true; draw(); });
      $('#czOk').onclick = async () => {
        if (rows.some(kolizja)) return UI.toast('Popraw godziny zaznaczone na czerwono');
        if (st === 'update required' && !termin) return UI.toast('Wybierz termin dokończenia');
        const evs = rows.filter(r => r.on && !r.wlasny).map((r, i) => { const [pa, pb] = CZ.planOkno(t, dzien, r.n);
          return Czas.zdarzenie('wpis', { wid: U.uid('w'), data: dzien, osoba: r.n, zad: t.id, nazwa: t.nazwa, kod: bud ? bud.kod : '', lista: t.lista || '', faza: '', od: CZ.hm(r.od), do: CZ.hm(r.do), st,
            powod: st === 'update required' ? powod : '', termin: st === 'update required' ? termin : null, notatka: r.n === ja ? notatka : '', kom: r.n === ja ? (opc.kom || '') : '',
            plan: { od: CZ.hm(pa), do: CZ.hm(pb), osoby: plan, wielodniowy: wielo, bezGodz: !(t.godzStart && t.godzKoniec) } }); });
        await Czas.dodaj(evs);
        UI.close(); UI.toast(evs.length > 1 ? `Zapisano – ${evs.length - 1} ${odm(evs.length - 1, 'osoba dostanie', 'osoby dostaną', 'osób dostanie')} propozycję godzin` : 'Zapisano – godziny czekają na zatwierdzenie biura');
        UI.refresh();
      };
    };
    draw();
  },

  czasNotatka(tekst, zapisz) {
    const d = document.createElement('div');
    d.innerHTML = `<div class="ov center" id="ovn" style="z-index:70"><div class="dialog"><div class="shead"><h3>Notatka – co zostało zrobione</h3></div>
      <div class="sbody"><p class="mute">Uzupełniona automatycznie z Twoich dzisiejszych wpisów na budowie. Możesz ją zmienić.</p><textarea id="czNt" rows="6">${U.esc(tekst || '')}</textarea></div>
      <div class="sfoot"><button class="btn" id="czNx">Anuluj</button><span class="grow"></span><button class="btn pri" id="czNo">Zapisz notatkę</button></div></div></div>`;
    document.body.appendChild(d);
    $('#czNx').onclick = () => d.remove();
    $('#czNo').onclick = () => { const v = $('#czNt').value.trim(); d.remove(); zapisz(v); };
  },

  /* „Co robiłem?” – po „Zadanie niepodjęte” albo dotknięciu pustego miejsca w planie: budowy z dzisiejszych wpisów, podział czasu, min. 30 min */
  async coRobilem(dzien, opc = {}) {
    const ja = S.user.name, W = await Czas.lista(), [o0, o1] = CZ.okno(ja);
    const dzisBud = await Czas.budowyDnia(ja, dzien);
    const B = dzisBud.map(b => ({ kod: b.kod, nazwa: b.nazwa, n: b.n, on: true, faza: 'Montaż i Wykonawstwo', opis: '', osoby: [], notatka: '' }));
    for (const b of B) b.notatka = await Czas.notatka(b.kod, ja, dzien);
    if (opc.kod && !B.some(b => b.kod === opc.kod)) { const p = ((S.boot && S.boot.projekty) || []).find(x => x.kod === opc.kod); if (p) B.unshift({ kod: p.kod, nazwa: p.nazwa, n: 0, on: true, faza: 'Montaż i Wykonawstwo', opis: '', osoby: [], notatka: '' }); }
    const inne = W.filter(w => w.osoba === ja && w.data === dzien && Czas.akt(w) && w.stan !== 'prop' && !w.nieob);
    let pts = [], st = 'spoza';
    const wyb = () => B.filter(b => b.on);
    const dziel = () => {
      const n = wyb().length; if (!n) { pts = []; return; }
      // domyślnie od końca innych wpisów tego dnia (żeby nie nachodzić), dzień pracy ekipy
      const kon = inne.map(w => CZ.min(w.do)).filter(m => m <= o1 - 30 * n), od0 = opc.start != null ? opc.start : Math.max(o0, ...kon, o0);
      const a = Math.max(0, Math.min(od0, 1440 - 30 * n)), b = Math.max(a + 30 * n, o1);
      pts = Array.from({ length: n + 1 }, (_, i) => i === 0 ? a : i === n ? b : a + Math.round((b - a) * i / n / 30) * 30);
      for (let i = 1; i <= n; i++) pts[i] = Math.max(pts[i], pts[i - 1] + 30);
    };
    dziel();
    const kol = i => inne.some(w => CZ.min(w.od) < pts[i + 1] && CZ.min(w.do) > pts[i]);
    const draw = () => {
      const L = wyb(), sumaInne = inne.reduce((s, w) => s + CZ.h(w.od, w.do), 0), suma = L.length ? (pts[L.length] - pts[0]) / 60 : 0;
      let i = -1;
      modal.innerHTML = `<div class="ov" id="ov"><div class="sheet czs wide"><div class="shead"><div class="grow"><div class="mute">${U.esc(opc.tytul || dzien)}</div><h3>Co robiłem${dzien === U.day(new Date()) ? ' dziś' : ' ' + U.esc(PC_dzien(dzien))}?</h3></div>
          <span class="czsum">Godziny dnia: <b>${CZ.hTxt(sumaInne + suma)}</b>${sumaInne ? `<small>w tym ${CZ.hTxt(sumaInne)} z innych wpisów</small>` : ''}</span></div>
        <div class="sbody">
          <p class="mute">${B.length ? 'Zaznaczone są budowy, na których wpisywałeś zmiany tego dnia.' : 'Wybierz budowę.'} Czas dzieli się po równo – przesuwasz go −/+ co 30 min (każda budowa co najmniej 30 min).</p>
          ${L.length ? `<div class="row czstart"><span class="mute">Start</span>${CZ.tp('p0', pts[0])}</div>` : ''}
          ${B.map((b, bi) => { if (b.on) i++; const j = i;
            return `<div class="czbud${b.on ? ' on' : ''}${b.on && kol(j) ? ' kol' : ''}"><div class="row"><button class="chk${b.on ? ' on' : ''}" data-bo="${bi}">${b.on ? '✓' : ''}</button><b class="grow">${U.esc(b.nazwa || b.kod)}</b>${b.n ? `<span class="czchip c-pro">wpisy: ${b.n}</span>` : '<span class="czchip c-gr">wybrana ręcznie</span>'}</div>
              ${b.on ? `<div class="row czpola"><select data-bf="${bi}">${CZ.FAZY.map(f => `<option ${f === b.faza ? 'selected' : ''}>${f}</option>`).join('')}</select><input type="text" data-bp="${bi}" placeholder="opis prac (wymagany)" value="${U.esc(b.opis)}"></div>
              <div class="row czos"><span class="mute">Osoby:</span><span class="czchip c-gr">${U.esc(ja)} (ja)</span>${b.osoby.map((o, k) => `<button class="czchip c-pro" data-bx="${bi}:${k}">${U.esc(o)} ✕</button>`).join('')}<button class="btn sm" data-bd="${bi}">＋ osoba</button><button class="btn sm" data-bn="${bi}">Notatka${b.notatka ? ' ✎' : ''}</button><span class="grow"></span><b>${CZ.hTxt((pts[j + 1] - pts[j]) / 60)}</b></div>
              ${j < L.length - 1 ? '' : ''}` : ''}</div>${b.on && j < L.length - 1 ? `<div class="row czmid"><span class="mute">koniec / start następnej</span>${CZ.tp('p' + (j + 1), pts[j + 1])}</div>` : ''}`; }).join('')}
          ${L.length ? `<div class="row czstart"><span class="mute">Koniec</span>${CZ.tp('p' + L.length, pts[L.length])}</div>` : ''}
          <div class="row"><button class="btn sm" id="crInna">＋ inna budowa</button><span class="grow"></span>${L.some((_, k) => kol(k)) ? '<span class="bad">Czas nachodzi na inne Twoje wpisy</span>' : L.length ? '<span class="mute">czasy nie nachodzą na inne wpisy ✓</span>' : ''}</div>
          <div class="czst" style="grid-template-columns:1fr 1fr"><button class="${st === 'spoza' ? 'on ok' : ''}" data-s="spoza">✓ Wykonano</button><button class="${st === 'update required' ? 'on wip' : ''}" data-s="update required">⏸ Do kontynuacji</button></div>
        </div>
        <div class="sfoot"><button class="btn" id="crX">Anuluj</button><span class="grow"></span><button class="btn pri" id="crOk" ${L.length ? '' : 'disabled'}>Zapisz i wyślij do biura</button></div></div></div>`;
      $('#crX').onclick = UI.close;
      modal.querySelectorAll('[data-bo]').forEach(b => b.onclick = () => { const x = B[+b.dataset.bo]; x.on = !x.on; dziel(); draw(); });
      modal.querySelectorAll('[data-bf]').forEach(s => s.onchange = e => { B[+s.dataset.bf].faza = e.target.value; });
      modal.querySelectorAll('[data-bp]').forEach(s => s.oninput = e => { B[+s.dataset.bp].opis = e.target.value; });
      modal.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { st = b.dataset.s; draw(); });
      modal.querySelectorAll('[data-bx]').forEach(b => b.onclick = () => { const [x, k] = b.dataset.bx.split(':').map(Number); B[x].osoby.splice(k, 1); draw(); });
      modal.querySelectorAll('[data-bd]').forEach(b => b.onclick = () => { const x = B[+b.dataset.bd];
        const wolni = ((S.boot && S.boot.pracownicy) || []).filter(p => p.cu && p.name !== ja && !x.osoby.includes(p.name) && p.rola !== 'podwykonawca').map(p => p.name);
        const n = prompt('Dodaj osobę – wpisz imię:\n' + wolni.join(', ')); const f = n && wolni.find(y => U.norm(y).startsWith(U.norm(n))); if (f) { x.osoby.push(f); draw(); } });
      modal.querySelectorAll('[data-bn]').forEach(b => b.onclick = () => { const x = B[+b.dataset.bn]; this.czasNotatka(x.notatka, v => { x.notatka = v; draw(); }); });
      CZ.tpBind(modal, (k, d) => { const i = +k.slice(1), n = pts.length - 1;
        const lo = i === 0 ? 0 : pts[i - 1] + 30, hi = i === n ? 24 * 60 : pts[i + 1] - 30;
        pts[i] = Math.max(lo, Math.min(hi, pts[i] + d)); draw(); });
      $('#crInna').onclick = () => {
        const all = ((S.boot && S.boot.projekty) || []).filter(p => !B.some(b => b.kod === p.kod));
        const q = prompt('Budowa – wpisz kod lub początek nazwy:'); if (!q) return; const nq = U.norm(q);
        const f = all.find(p => U.norm(p.kod).startsWith(nq)) || all.find(p => U.norm(p.nazwa).includes(nq));
        if (!f) return UI.toast('Nie znaleziono budowy „' + q + '”');
        B.push({ kod: f.kod, nazwa: f.nazwa, n: 0, on: true, faza: 'Montaż i Wykonawstwo', opis: '', osoby: [], notatka: '' }); dziel(); draw(); };
      $('#crOk').onclick = async () => {
        const L2 = wyb();
        if (L2.some(b => !b.opis.trim())) return UI.toast('Wpisz opis prac przy każdej budowie');
        if (L2.some((_, k) => kol(k))) return UI.toast('Czas nachodzi na inne Twoje wpisy – popraw godziny');
        const evs = [];
        L2.forEach((b, k) => [ja, ...b.osoby].forEach(o => evs.push(Czas.zdarzenie('wpis', { wid: U.uid('w'), data: dzien, osoba: o, zad: '', nazwa: b.opis.trim(), opis: b.opis.trim(), kod: b.kod, faza: b.faza,
          od: CZ.hm(pts[k]), do: CZ.hm(pts[k + 1]), st, spoza: true, notatka: o === ja ? b.notatka : '', grupa: opc.grupa || '' }))));
        await Czas.dodaj(evs);
        UI.close(); UI.toast('Zapisano – godziny czekają na zatwierdzenie biura'); UI.refresh();
      };
    };
    draw();
  },

  /* Po zalogowaniu: propozycje godzin od innych i niezamknięte dni (do 14 dni wstecz) */
  async doUzupelnienia(wymus) {
    if (!S.user || Session.isBiuro() && !wymus) return;
    const ja = S.user.name, P = await Czas.propozycje(ja), Bk = await Czas.braki(ja);
    if (!P.length && !Bk.length) { if (wymus) UI.toast('Nic do uzupełnienia'); return; }
    const pl = await DB.get('plan'), zadania = (pl && pl.zadania) || [], proj = (S.boot && S.boot.projekty) || [];
    const budZ = t => proj.find(p => p.listaCU && p.listaCU === t.lista);
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog czdlg"><div class="shead"><h3 class="grow">Do uzupełnienia</h3>${P.length ? `<span class="czchip c-pro">${P.length} ${odm(P.length, 'propozycja', 'propozycje', 'propozycji')}</span>` : ''}${Bk.length ? `<span class="czchip c-wip">${Bk.length} bez godzin</span>` : ''}</div>
      <div class="sbody">
        ${P.length ? `<div class="lbl">Godziny wpisane za Ciebie</div>${P.map((w, i) => `<div class="card czp"><div class="row"><div class="grow"><b>${U.esc(PC_dzien(w.data))} · ${U.esc(w.nazwa || w.opis || '')}</b><div class="mute">${U.esc(w.kod || '')} · wpisał(a) ${U.esc(w.kto)} · ${U.esc((CZ_ST_TXT[w.st] || w.st))}</div></div><b class="czbig">${U.esc(w.od)}–${U.esc(w.do)} · ${CZ.hTxt(CZ.h(w.od, w.do))}</b></div>
          <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm ok" data-pp="${i}">Potwierdzam</button><button class="btn sm" data-pz="${i}">Zmień godziny</button><button class="btn sm" data-pn="${i}">Nie pracowałem</button></div></div>`).join('')}` : ''}
        ${Bk.length ? `<div class="lbl" style="margin-top:8px">Niezamknięte dni – zadania bez statusu i godzin</div>${Bk.map((x, i) => `<div class="card czp"><div class="row"><div class="grow"><b>${U.esc(PC_dzien(x.d))} · ${U.esc(x.t.nazwa)}</b><div class="mute">${U.esc((budZ(x.t) || {}).kod || x.t.listaNazwa || '')}</div></div></div>
          <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm ok" data-bk="${i}:complete">Wykonane</button><button class="btn sm" data-bk="${i}:update required">Do kontynuacji</button>${CZ.wielo(x.t) && x.d < CZ.dni(x.t).dB ? `<button class="btn sm" data-bk="${i}:dzien">Dzień pracy</button>` : ''}<button class="btn sm" data-bk="${i}:on hold">Niepodjęte</button></div></div>`).join('')}` : ''}
        <p class="mute">Bez odpowiedzi godziny zatwierdzi biuro. Po Twoim potwierdzeniu nie dostaniesz już propozycji do tego zadania.</p>
      </div>
      <div class="sfoot"><button class="btn" id="duX">Później</button><span class="grow"></span>${P.length ? '<button class="btn ok" id="duAll">Potwierdź wszystkie propozycje</button>' : ''}</div></div></div>`;
    const po = async () => { UI.close(); await this.doUzupelnienia(true).catch(() => { }); };
    $('#duX').onclick = UI.close;
    if ($('#duAll')) $('#duAll').onclick = async () => { await Czas.dodaj(P.map(w => Czas.zdarzenie('potw', { ref: w.wid, osoba: ja }))); UI.close(); UI.toast('Potwierdzono'); UI.refresh(); };
    modal.querySelectorAll('[data-pp]').forEach(b => b.onclick = async () => { await Czas.dodaj([Czas.zdarzenie('potw', { ref: P[+b.dataset.pp].wid, osoba: ja })]); po(); });
    modal.querySelectorAll('[data-pn]').forEach(b => b.onclick = async () => { if (!confirm('Na pewno nie pracowałeś przy tym zadaniu?')) return; await Czas.dodaj([Czas.zdarzenie('odrz', { ref: P[+b.dataset.pn].wid, osoba: ja })]); po(); });
    modal.querySelectorAll('[data-pz]').forEach(b => b.onclick = () => this.czasJeden(P[+b.dataset.pz]));
    modal.querySelectorAll('[data-bk]').forEach(b => b.onclick = async () => {
      const [i, st] = b.dataset.bk.split(':'), x = Bk[+i];
      if (st === 'on hold') return this.zadanie(x.t, budZ(x.t), osobyTxt(x.t, (S.boot && S.boot.pracownicy) || []), x.d, 'on hold');
      this.czasPracy(x.t, x.d, st, { bud: budZ(x.t) });
    });
  },

  /* zmiana godzin z propozycji – własny wpis (zastępuje propozycję) */
  czasJeden(w) {
    let od = CZ.min(w.od), dd = CZ.min(w.do);
    const draw = () => {
      modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog"><div class="shead"><h3>Moje godziny – ${U.esc(PC_dzien(w.data))}</h3></div>
        <div class="sbody"><p><b>${U.esc(w.nazwa || w.opis || '')}</b><br><span class="mute">${U.esc(w.kod || '')} · propozycja: ${U.esc(w.kto)} ${U.esc(w.od)}–${U.esc(w.do)}</span></p>
          <div class="row" style="gap:10px">${CZ.tp('od', od)}<span>–</span>${CZ.tp('do', dd)}<b>${CZ.hTxt((dd - od) / 60)}</b></div></div>
        <div class="sfoot"><button class="btn" id="cjX">Anuluj</button><span class="grow"></span><button class="btn pri" id="cjOk">Zapisz moje godziny</button></div></div></div>`;
      $('#cjX').onclick = () => this.doUzupelnienia(true);
      CZ.tpBind(modal, (k, d) => { if (k === 'od') od = Math.max(0, Math.min(dd - 30, od + d)); else dd = Math.min(1440, Math.max(od + 30, dd + d)); draw(); });
      $('#cjOk').onclick = async () => {
        const { wid, stan, kto, ts, lok, potw, ...reszta } = w;
        await Czas.dodaj([Czas.zdarzenie('wpis', Object.assign({}, reszta, { wid: U.uid('w'), osoba: S.user.name, od: CZ.hm(od), do: CZ.hm(dd), notatka: '' }))]);
        UI.close(); UI.toast('Zapisano Twoje godziny'); this.doUzupelnienia(true);
      };
    };
    draw();
  },

  /* menu po przytrzymaniu pustego miejsca w planie (kółko z zielonym postępem) */
  planMenu(dzien, start) {
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog czmenu"><div class="shead"><h3 class="grow">Dodaj – ${U.esc(PC_dzien(dzien))}${start != null ? ', ' + CZ.hm(start) : ''}</h3></div>
      <div class="sbody"><button class="czmi" data-m="co"><b>Praca spoza planu</b><span>Co robiłem – budowy, godziny, opis</span></button>
        <button class="czmi" data-m="urlop"><b>Urlop</b><span>od ${U.esc(PC_dzien(dzien))}, liczba dni – do zatwierdzenia przez biuro</span></button>
        <button class="czmi" data-m="zwolnienie"><b>Zwolnienie lekarskie</b><span>od ${U.esc(PC_dzien(dzien))}, liczba dni – do zatwierdzenia przez biuro</span></button>
        <button class="czmi" data-m="nieobecnosc"><b>Nieobecność</b><span>od ${U.esc(PC_dzien(dzien))}, liczba dni – do zatwierdzenia przez biuro</span></button>
        <button class="czmi" data-m="inne"><b>Inne</b><span>np. szkolenie, badania, sprawy urzędowe – opis wymagany, do zatwierdzenia przez biuro</span></button></div>
      <div class="sfoot"><span class="grow"></span><button class="btn" id="pmX">Anuluj</button></div></div></div>`;
    $('#pmX').onclick = UI.close; $('#ov').onclick = e => { if (e.target.id === 'ov') UI.close(); };
    modal.querySelectorAll('[data-m]').forEach(b => b.onclick = () => b.dataset.m === 'co' ? this.coRobilem(dzien, { start }) : this.nieobecnosc(dzien, b.dataset.m));
  },

  /* Urlop / nieobecność: data od i liczba dni roboczych (weekendy i święta pomijane) → do zatwierdzenia przez biuro */
  nieobecnosc(dzien, rodzaj) {
    let od = U.wolny(dzien) ? CZ.nastRob(dzien) : dzien, dni = 1, uw = '';
    const doDnia = () => { let d = od, n = 1; while (n < Math.ceil(dni)) { d = CZ.nastRob(d); n++; } return d; };
    const draw = () => {
      modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog czdlg"><div class="shead"><h3 class="grow">${CZ.NB[rodzaj]} – ${U.esc(S.user.name)}</h3></div>
        <div class="sbody">
          <div class="czst" style="grid-template-columns:repeat(4,1fr)">${Object.keys(CZ.NB).map(k => `<button class="${rodzaj === k ? CZ.NBKL[k] : ''}" data-r="${k}">${CZ.NB[k]}</button>`).join('')}</div>
          <div class="row" style="gap:12px;flex-wrap:wrap"><label class="grow"><span class="lbl">Od dnia</span><input type="date" id="nbOd" value="${od}"></label>
            <div><span class="lbl" style="display:block">Liczba dni roboczych</span>${CZ.dniPole('nbDni', dni)}</div></div>
          <p>Do dnia: <b>${U.esc(PC_dzien(doDnia()))}</b>${dni % 1 ? ' (ostatni dzień – pół dnia)' : ''} <span class="mute">(weekendy i święta pomijane; ręcznie można wpisać co 0,5 dnia)</span></p>
          <label><span class="lbl">${rodzaj === 'inne' ? 'Czego dotyczy (wymagane)' : 'Uwagi (opcjonalnie)'}</span><input type="text" id="nbUw" value="${U.esc(uw)}"></label>
          <p class="mute">Trafi do biura do zatwierdzenia. W planie zobaczysz je jako „czeka na biuro”, a potem zatwierdzone (kłódka) albo odrzucone.</p></div>
        <div class="sfoot"><button class="btn" id="nbX">Anuluj</button><span class="grow"></span><button class="btn pri" id="nbOk">Wyślij do biura</button></div></div></div>`;
      $('#nbX').onclick = UI.close;
      modal.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rodzaj = b.dataset.r; draw(); });
      $('#nbOd').onchange = e => { if (e.target.value) { od = U.wolny(e.target.value) ? CZ.nastRob(e.target.value) : e.target.value; draw(); } };
      $('#nbUw').oninput = e => { uw = e.target.value; };
      modal.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { dni = CZ.dniFix(dni + +b.dataset.dn); draw(); });
      $('#nbDni').onchange = e => { dni = CZ.dniFix(e.target.value); draw(); };
      $('#nbOk').onclick = async () => {
        if (rodzaj === 'inne' && !uw.trim()) return UI.toast('Wpisz, czego dotyczy nieobecność');
        const [o0, o1] = CZ.okno(S.user.name);
        await Czas.dodaj([Czas.zdarzenie('wpis', { wid: U.uid('w'), data: od, dataDo: doDnia(), dni, osoba: S.user.name, zad: '', nieob: true, rodzaj, st: rodzaj, nazwa: rodzaj === 'inne' ? 'Inne: ' + uw.trim() : CZ.NB[rodzaj], od: CZ.hm(o0), do: CZ.hm(o1), uwagi: uw.trim() })]);
        UI.close(); UI.toast(CZ.NB[rodzaj] + ' – wysłane do biura'); UI.refresh();
      };
    };
    draw();
  },

  czasInfo(w) {
    modal.innerHTML = `<div class="ov center" id="ov"><div class="dialog"><div class="shead"><h3 class="grow">${w.stan === 'zatw' ? '🔒 ' : ''}${U.esc(w.nazwa || w.opis || 'Czas pracy')}</h3>${czChip(w)}</div>
      <div class="sbody"><p><b>${U.esc(w.osoba)}</b> · ${U.esc(PC_dzien(w.data))} · <b>${U.esc(w.od)}–${U.esc(w.do)}</b> (${CZ.hTxt(CZ.h(w.od, w.do))}) · ${U.esc(CZ_ST_TXT[w.st] || w.st)}</p>
        <p class="mute">${U.esc(w.kod || '')}${w.faza ? ' · ' + U.esc(w.faza) : ''}<br>Wpisał(a): ${U.esc(w.kto)}${w.zatw ? `<br>Zatwierdził: ${w.zatw.auto ? 'automatycznie (zgodne z planem)' : U.esc(w.zatw.kto)} ${U.esc(String(w.zatw.ts || '').replace('T', ' ').slice(0, 16))}${w.zatw.korekta ? '<br>Korekta biura: ' + U.esc(w.zatw.korekta) : ''}` : ''}</p>
        ${w.notatka ? `<div class="card"><div class="lbl">Notatka</div><p style="margin:4px 0 0">${U.esc(w.notatka)}</p></div>` : ''}
        ${w.stan === 'zatw' ? '<p class="mute">Zatwierdzone przez biuro – zmienić może tylko biuro.</p>' : ''}</div>
      <div class="sfoot"><span class="grow"></span><button class="btn" id="ciX">Zamknij</button></div></div></div>`;
    $('#ciX').onclick = UI.close;
  }
});
const CZ_ST_TXT = { inne: 'inna nieobecność', urlop: 'urlop', zwolnienie: 'zwolnienie lekarskie', nieobecnosc: 'nieobecność', complete: 'wykonane', 'update required': 'do kontynuacji', 'on hold': 'niepodjęte', dzien: 'dzień pracy (w toku)', spoza: 'praca spoza planu' };
function PC_dzien(k) { const d = new Date(k + 'T12:00'); return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'numeric' }).replace('.', ''); }
