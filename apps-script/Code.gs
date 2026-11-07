/**
 * ELWIS – serwer synchronizacji (Google Apps Script, konto ELWIS).
 * Zamknięta lista operacji: bootstrap, project, file, events, push. Wszystko inne → odmowa.
 * Bez danych budów i kluczy w kodzie – konfiguracja w Bazie projektów i we właściwościach skryptu.
 * Wersja: 1.0.0 (schemat danych 1.x). Opis API: docs/API.md.
 */

const SCRIPT_VERSION = '1.0.1';
const P = PropertiesService.getScriptProperties();

/* ===================== Instalacja (uruchamia Łukasz raz, z edytora) ===================== */

function instalacja() {
  const files = DriveApp.getFilesByName('Baza projektów');
  let baza = null;
  while (files.hasNext()) {
    const f = files.next();
    const par = f.getParents();
    while (par.hasNext()) if (par.next().getName() === '_Budowy') baza = f;
  }
  if (!baza) throw new Error('Nie znaleziono pliku „Baza projektów” w folderze _Budowy.');
  P.setProperty('BAZA_ID', baza.getId());
  if (!P.getProperty('SALT')) P.setProperty('SALT', Utilities.getUuid());
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'archiwizuj')) {
    ScriptApp.newTrigger('archiwizuj').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(5).create();
  }
  const k = konfig_();
  Logger.log('OK. Baza: ' + baza.getName() + ', schemat: ' + k.wersja_schematu + '. Wyzwalacz kopii: poniedziałek ok. 5:00.');
}

/** Dodaje wiersz tabletu z nowym kluczem w zakładce Tablety (nazwę można potem zmienić w arkuszu). */
function dodajTablet() {
  const sh = baza_().getSheetByName('Tablety');
  const n = Math.max(1, sh.getLastRow());
  const key = 'T' + n + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  sh.appendRow(['Tablet ' + n, key, '', 'tak', 'dodany ' + Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd')]);
  Logger.log('Dodano: Tablet ' + n + ' – klucz: ' + key);
}

/* ===================== Wejście HTTP ===================== */

function doGet(e) { return handle_(e.parameter || {}, null); }
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Zły format zapytania' }); }
  return handle_(body, body);
}

function handle_(p, body) {
  try {
    const tablet = auth_(p.key);
    if (!tablet) return out_({ ok: false, error: 'Nieznany lub wyłączony klucz tabletu' });
    switch (body ? body.action : p.action) {
      case 'bootstrap': return out_(bootstrap_(tablet));
      case 'project': return out_(project_(String(p.kod || '')));
      case 'file': return out_(file_(String(p.id || '')));
      case 'events': return out_(events_(String(p.kod || ''), Number(p.since || 0)));
      case 'push': return out_(push_(body, tablet));
      default: return out_({ ok: false, error: 'Nieznana operacja' });
    }
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ===================== Dostęp do bazy ===================== */

function baza_() {
  const id = P.getProperty('BAZA_ID');
  if (!id) throw new Error('Skrypt nie jest zainstalowany (uruchom funkcję instalacja).');
  return SpreadsheetApp.openById(id);
}
function rows_(sh) { const v = sh.getDataRange().getValues(); v.shift(); return v; }
/** Wartości tak, jak widać je w arkuszu (tekst) – arkusz potrafi zamienić „1.2” na datę, a PIN „0123” na liczbę. */
function rowsT_(sh) { const v = sh.getDataRange().getDisplayValues(); v.shift(); return v; }
const TEXT = '@';
function txt_(v) { return v == null ? '' : String(v).trim(); }
function tak_(v) { return txt_(v).toLowerCase() === 'tak'; }
function num_(v) { const s = txt_(v).replace(',', '.'); return s === '' ? '' : Number(s); }
function idFromUrl_(u) { const m = txt_(u).match(/[-\w]{25,}/); return m ? m[0] : ''; }

function konfig_() {
  const c = {};
  rowsT_(baza_().getSheetByName('Konfiguracja')).forEach(r => { if (txt_(r[0])) c[txt_(r[0])] = txt_(r[1]); });
  if (String(c.wersja_schematu || '').split('.')[0] !== '1') throw new Error('Nieobsługiwana wersja schematu: ' + c.wersja_schematu);
  return c;
}

function auth_(key) {
  if (!key) return null;
  const r = rowsT_(baza_().getSheetByName('Tablety')).find(x => txt_(x[1]) === String(key) && tak_(x[3]));
  return r ? txt_(r[0]) : null;
}

function sha_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function aktywne_() {
  return rowsT_(baza_().getSheetByName('Projekty'))
    .filter(r => tak_(r[5]) && txt_(r[0]) && ['tak', 'nie'].indexOf(txt_(r[11]).toLowerCase()) >= 0)
    .map(r => ({
      kod: txt_(r[0]), nazwa: txt_(r[1]), adres: txt_(r[2]), lokalizacja: txt_(r[3]), kontakt: txt_(r[4]),
      zakres: txt_(r[6]).split(/[;,]/).map(s => s.trim()).filter(String), uwagi: txt_(r[7]),
      folder: idFromUrl_(r[8]), lista: idFromUrl_(r[10]), wojskowy: txt_(r[11]).toLowerCase()
    }));
}
function projekt_(kod) {
  const p = aktywne_().find(x => x.kod === kod);
  if (!p) throw new Error('Budowa nieaktywna lub nieznana');
  if (!p.lista || !p.folder) throw new Error('Budowa bez folderu lub listy urządzeń');
  return p;
}

function slowniki_() {
  const v = rowsT_(baza_().getSheetByName('Słowniki'));
  return {
    kategorie: v.map(r => txt_(r[0])).filter(String),
    typy: v.filter(r => txt_(r[2])).map(r => ({ prefix: txt_(r[2]).toUpperCase(), nazwa: txt_(r[3]), kroki: txt_(r[4]).split(';').map(s => s.trim()).filter(String), sn: tak_(r[5]) })),
    rodzaje: v.filter(r => txt_(r[7])).map(r => ({ id: txt_(r[7]), opis: txt_(r[8]) }))
  };
}

/* ===================== Operacje ===================== */

function bootstrap_(tablet) {
  const k = konfig_();
  const salt = P.getProperty('SALT');
  const pr = rowsT_(baza_().getSheetByName('Pracownicy'))
    .filter(r => txt_(r[0]) && tak_(r[4]) && txt_(r[3]))
    .map(r => ({ name: txt_(r[0]), ekipa: txt_(r[1]), rola: txt_(r[2]) || 'pracownik', hash: sha_(salt + ':' + txt_(r[3])) }));
  const projekty = aktywne_().map(p => { const o = Object.assign({}, p); delete o.folder; delete o.lista; return o; });
  return {
    ok: true, server: SCRIPT_VERSION, schema: k.wersja_schematu, minApp: k.min_wersja_aplikacji || '1.0.0',
    sesjaGodziny: Number(k.sesja_godziny || 12), tablet: tablet, salt: salt,
    pracownicy: pr, projekty: projekty, slowniki: slowniki_()
  };
}

function project_(kod) {
  const p = projekt_(kod);
  const ss = SpreadsheetApp.openById(p.lista);
  const urz = rows_(ss.getSheetByName('Urządzenia')).filter(r => txt_(r[0])).map(r => ({
    id: txt_(r[0]), grupa: txt_(r[1]), typ: txt_(r[2]), zasilanie: txt_(r[3]), kond: txt_(r[4]), arkusz: txt_(r[5]),
    uwagi: txt_(r[6]), x: num_(r[7]), y: num_(r[8]), sn: txt_(r[9]), status: txt_(r[10])
  }));
  const tsh = ss.getSheetByName('Tematy');
  const tem = tsh ? rows_(tsh).filter(r => txt_(r[0])).map(r => ({ id: txt_(r[0]), urz: txt_(r[1]), kat: txt_(r[2]), opis: txt_(r[3]), status: txt_(r[4]) })) : [];
  const pliki = [], rzuty = {};
  const dw = sub_(DriveApp.getFolderById(p.folder), 'Do wglądu');
  if (dw) {
    const arkusze = {}; urz.forEach(u => { if (u.arkusz) arkusze[u.arkusz.toLowerCase()] = u.arkusz; });
    const it = dw.getFiles();
    while (it.hasNext()) {
      const f = it.next();
      const name = f.getName(), base = name.replace(/\.(jpe?g|png)$/i, '').toLowerCase();
      if (/\.(jpe?g|png)$/i.test(name) && arkusze[base]) rzuty[arkusze[base]] = f.getId();
      else pliki.push({ id: f.getId(), name: name, mime: f.getMimeType(), size: f.getSize() });
    }
  }
  return { ok: true, kod: kod, urzadzenia: urz, tematy: tem, pliki: pliki, rzuty: rzuty };
}

function file_(id) {
  if (!id) throw new Error('Brak pliku');
  const f = DriveApp.getFileById(id);
  // tylko pliki z folderu „Do wglądu” aktywnej budowy
  const allowed = {};
  aktywne_().forEach(p => { if (p.folder) allowed[p.folder] = true; });
  let ok = false;
  const par = f.getParents();
  while (par.hasNext()) {
    const d = par.next();
    if (d.getName() !== 'Do wglądu') continue;
    const gp = d.getParents();
    while (gp.hasNext()) if (allowed[gp.next().getId()]) ok = true;
  }
  if (!ok) throw new Error('Brak dostępu do pliku');
  if (f.getSize() > 20e6) throw new Error('Plik zbyt duży dla tabletu');
  let blob = f.getBlob();
  if (f.getMimeType().indexOf('application/vnd.google-apps') === 0) blob = f.getAs('application/pdf');
  return { ok: true, id: id, name: f.getName(), mime: blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()) };
}

function zdarzeniaSheet_(p) {
  const ss = SpreadsheetApp.openById(p.lista);
  let sh = ss.getSheetByName('Zdarzenia');
  if (!sh) {
    sh = ss.insertSheet('Zdarzenia');
    sh.appendRow(['ID', 'Czas', 'Pracownik', 'Tablet', 'Urządzenie', 'Typ', 'Dane', 'Odebrano']);
    sh.setFrozenRows(1); sh.getRange(1, 1, 1, 8).setFontWeight('bold');
    sh.getRange('A:H').setNumberFormat(TEXT);
  }
  return sh;
}

function events_(kod, since) {
  const p = projekt_(kod);
  const sh = zdarzeniaSheet_(p);
  const last = sh.getLastRow() - 1; // liczba zdarzeń
  if (since >= last) return { ok: true, events: [], last: last, more: false };
  const n = Math.min(500, last - since);
  const v = sh.getRange(since + 2, 1, n, 7).getDisplayValues();
  const ev = v.map(r => ({ id: txt_(r[0]), ts: txt_(r[1]), kto: txt_(r[2]), tablet: txt_(r[3]), urz: txt_(r[4]), typ: txt_(r[5]), d: safeJson_(r[6]) }));
  return { ok: true, events: ev, last: since + n, more: since + n < last };
}
function safeJson_(s) { try { return JSON.parse(s); } catch (e) { return {}; } }

const TYPY_ZDARZEN = ['krok', 'nr', 'foto', 'brak', 'brak_zamk', 'notatka'];

function push_(b, tablet) {
  const p = projekt_(String(b.kod || ''));
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    // zdjęcia → Zdjęcia/rrrr-mm-dd/
    (b.photos || []).forEach(ph => {
      if (!ph || !ph.b64 || !ph.name) return;
      const name = String(ph.name).replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
      const zd = sub_(DriveApp.getFolderById(p.folder), 'Zdjęcia', true);
      const day = sub_(zd, Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd'), true);
      if (day.getFilesByName(name).hasNext()) return; // już zapisane
      const f = day.createFile(Utilities.newBlob(Utilities.base64Decode(ph.b64), 'image/jpeg', name));
      f.setDescription('ELWIS ' + String(ph.id || '') + ' · ' + tablet);
    });
    // zdarzenia
    const evs = (b.events || []).filter(e => e && e.id && TYPY_ZDARZEN.indexOf(e.typ) >= 0);
    const accepted = [];
    if (evs.length) {
      const sh = zdarzeniaSheet_(p);
      const have = {};
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(r => { have[txt_(r[0])] = true; });
      const now = Utilities.formatDate(new Date(), 'Europe/Warsaw', "yyyy-MM-dd'T'HH:mm:ss");
      const rows = [], touched = {};
      evs.forEach(e => {
        accepted.push(e.id);
        if (have[e.id]) return;
        have[e.id] = true;
        rows.push([e.id, txt_(e.ts), txt_(e.kto).slice(0, 80), tablet, txt_(e.urz).slice(0, 20), e.typ, JSON.stringify(e.d || {}).slice(0, 45000), now]);
        if (e.urz) touched[e.urz] = true;
      });
      if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 8).setNumberFormat(TEXT).setValues(rows);
      przelicz_(p, Object.keys(touched));
    }
    return { ok: true, accepted: accepted };
  } finally { lock.releaseLock(); }
}

/* Status i nr seryjny w zakładce Urządzenia – liczone ze Zdarzeń (fundamenty 2.3). */
function przelicz_(p, ids) {
  if (!ids.length) return;
  const ss = SpreadsheetApp.openById(p.lista);
  const ev = rowsT_(zdarzeniaSheet_(p)).map(r => ({ id: txt_(r[0]), ts: txt_(r[1]), urz: txt_(r[4]), typ: txt_(r[5]), d: safeJson_(r[6]) }))
    .sort((a, b) => a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0);
  const typy = {}; slowniki_().typy.forEach(t => { typy[t.prefix] = t; });
  const braki = {}; ev.forEach(e => { if (e.typ === 'brak') braki[e.id] = { urz: e.urz, open: true }; if (e.typ === 'brak_zamk' && braki[e.d.bid]) braki[e.d.bid].open = false; });
  const sh = ss.getSheetByName('Urządzenia');
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues();
  ids.forEach(id => {
    const i = v.findIndex(r => txt_(r[0]) === id); if (i < 0) return;
    const kroki = (typy[(id.match(/^[A-Za-z]+/) || [''])[0].toUpperCase()] || { kroki: ['Podłączony'] }).kroki;
    const st = {}; let sn = txt_(v[i][9]);
    ev.filter(e => e.urz === id).forEach(e => { if (e.typ === 'krok') st[e.d.krok] = !!e.d.wart; if (e.typ === 'nr' && e.d.sn) sn = String(e.d.sn); });
    const done = kroki.filter((k, j) => st[j]).length;
    const open = Object.keys(braki).some(b => braki[b].urz === id && braki[b].open);
    const status = open ? 'brak' : (done === kroki.length && kroki.length ? 'gotowe' : done ? 'w toku' : 'czeka');
    sh.getRange(i + 2, 10, 1, 2).setNumberFormat(TEXT).setValues([[sn, status]]);
  });
}

function sub_(folder, name, create) {
  const it = folder.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return create ? folder.createFolder(name) : null;
}

/* ===================== Kopie tygodniowe (wyzwalacz czasowy) ===================== */

function archiwizuj() {
  const k = konfig_();
  const arch = DriveApp.getFolderById(k.folder_archiwum_id);
  const day = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd');
  const kopia = id => { const f = DriveApp.getFileById(id); f.makeCopy(day + ' ' + f.getName(), arch); };
  kopia(P.getProperty('BAZA_ID'));
  rowsT_(baza_().getSheetByName('Projekty')).forEach(r => { const id = idFromUrl_(r[10]); if (id) try { kopia(id); } catch (e) { Logger.log(e); } });
}
