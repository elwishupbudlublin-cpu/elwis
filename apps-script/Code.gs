/**
 * ELWIS – serwer synchronizacji (Google Apps Script, konto ELWIS).
 * Zamknięta lista operacji: bootstrap, project, file, techniczne, plan, events, push, docx. Wszystko inne → odmowa.
 * Bez danych budów i kluczy w kodzie – konfiguracja w Bazie projektów i we właściwościach skryptu.
 * Schemat danych 1.x. Opis API: docs/API.md.
 */

const SCRIPT_VERSION = '1.13.0';
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
      case 'bootstrap': if (p.pamiec) stanPamieci_(p.key, p.pamiec); return out_(bootstrap_(tablet));
      case 'project': return out_(project_(String(p.kod || '')));
      case 'file': return out_(file_(String(p.id || ''), p.part));
      case 'techniczne': return out_(techniczne_());
      case 'plan': return out_(planDla_(plan_(String(p.od || ''), String(p.do || '')), String(p.kto || '')));
      case 'events': return out_(events_(String(p.kod || ''), Number(p.since || 0)));
      case 'foto': return out_(foto_(String(p.kod || ''), String(p.fid || '')));
      case 'push': return out_(push_(body, tablet));
      case 'zadania': return out_(zadania_(body || {}, tablet));
      case 'docx': return out_(docx_(body || {}));
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

/** Stan pamięci zgłoszony przez tablet (od 1.7.0) → Tablety, kolumna F „Stan pamięci” (schemat 1.6). */
function stanPamieci_(key, v) {
  try {
    const sh = baza_().getSheetByName('Tablety');
    if (!txt_(sh.getRange(1, 6).getValue())) sh.getRange(1, 6).setValue('Stan pamięci');
    const keys = sh.getRange(2, 2, Math.max(sh.getLastRow() - 1, 1), 1).getDisplayValues();
    const i = keys.findIndex(r => txt_(r[0]) === String(key)); if (i < 0) return;
    const czas = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm');
    sh.getRange(i + 2, 6).setNumberFormat(TEXT).setValue((czas + ' · ' + String(v)).replace(/[=+@]/g, ' ').slice(0, 200));
  } catch (e) { /* zgłoszenie stanu nie może blokować synchronizacji */ }
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
      folder: idFromUrl_(r[8]), lista: idFromUrl_(r[10]), wojskowy: txt_(r[11]).toLowerCase(),
      etapy: etapy_(r[12]), listaCU: txt_(r[9]),
      inwestor: txt_(r[13]), zamawiajacy: txt_(r[14])   // schemat 1.5 – do protokołów
    }));
}
/** „A: Budynek A; B: Budynek B” → [{id:'A', opis:'Budynek A'}, …]; puste → [] (budowa bez podziału). */
function etapy_(v) {
  return txt_(v).split(';').map(x => x.trim()).filter(String).map(x => {
    const i = x.indexOf(':');
    return i < 0 ? { id: x, opis: '' } : { id: x.slice(0, i).trim(), opis: x.slice(i + 1).trim() };
  }).filter(e => e.id);
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
    .map(r => ({ name: txt_(r[0]), ekipa: txt_(r[1]), rola: txt_(r[2]) || 'pracownik', hash: sha_(salt + ':' + txt_(r[3])),
      cu: txt_(r[5]), m: tak_(r[7]) || txt_(r[2]) === 'biuro' }));
  const postep = safeJson_(P.getProperty('POSTEP') || '{}');
  const projekty = aktywne_().map(p => { const o = Object.assign({}, p); delete o.folder; delete o.lista; if (postep[p.kod]) o.postep = postep[p.kod]; return o; });
  return {
    ok: true, server: SCRIPT_VERSION, schema: k.wersja_schematu, minApp: k.min_wersja_aplikacji || '1.0.0',
    sesjaGodziny: Number(k.sesja_godziny || 12), tablet: tablet, salt: salt,
    pracownicy: pr, projekty: projekty, slowniki: slowniki_(), protokoly: protokolyAktywne_()
  };
}

function project_(kod) {
  const p = projekt_(kod);
  const ss = SpreadsheetApp.openById(p.lista);
  const urz = rows_(ss.getSheetByName('Urządzenia')).filter(r => txt_(r[0])).map(r => ({
    id: txt_(r[0]), grupa: txt_(r[1]), typ: txt_(r[2]), zasilanie: txt_(r[3]), kond: txt_(r[4]), arkusz: txt_(r[5]),
    uwagi: txt_(r[6]), x: num_(r[7]), y: num_(r[8]), sn: txt_(r[9]), status: txt_(r[10]), etap: txt_(r[11])
  }));
  zapiszPostep_(kod, urz.map(u => u.status));
  // zgodność etapów urządzeń z listą etapów budowy (fundamenty 2.4)
  const ostrzezenia = [];
  if (p.etapy.length) {
    const ids = p.etapy.map(e => e.id);
    const bez = urz.filter(u => !u.etap).map(u => u.id);
    const obce = urz.filter(u => u.etap && ids.indexOf(u.etap) < 0).map(u => u.id + ' (' + u.etap + ')');
    if (bez.length) ostrzezenia.push('Urządzenia bez etapu: ' + bez.slice(0, 20).join(', ') + (bez.length > 20 ? ' …' : ''));
    if (obce.length) ostrzezenia.push('Etap spoza listy budowy: ' + obce.slice(0, 20).join(', ') + (obce.length > 20 ? ' …' : ''));
  }
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
  return { ok: true, kod: kod, etapy: p.etapy, urzadzenia: urz, tematy: tem, pliki: pliki, rzuty: rzuty, ostrzezenia: ostrzezenia };
}

const PART_BYTES = 6 * 1024 * 1024;   // część pliku w jednej odpowiedzi
const MAX_FILE = 60e6;                // największy plik dla tabletu

function file_(id, part) {
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
  if (!ok) ok = wTechnicznych_(f);
  if (!ok) throw new Error('Brak dostępu do pliku');
  if (f.getSize() > MAX_FILE) throw new Error('Plik zbyt duży dla tabletu (ponad 60 MB)');
  let blob = f.getBlob();
  if (f.getMimeType().indexOf('application/vnd.google-apps') === 0) blob = f.getAs('application/pdf');
  const bytes = blob.getBytes();
  const head = { ok: true, id: id, name: f.getName(), mime: blob.getContentType(), size: bytes.length };
  // bez numeru części – cały plik (aplikacje 1.0–1.1, pliki do 20 MB)
  if (part === undefined || part === null || part === '') {
    if (bytes.length > 20e6) throw new Error('Plik zbyt duży – zaktualizuj aplikację');
    head.b64 = Utilities.base64Encode(bytes); return head;
  }
  const n = Math.max(1, Math.ceil(bytes.length / PART_BYTES)), i = Number(part);
  if (!(i >= 0 && i < n)) throw new Error('Zły numer części pliku');
  head.parts = n; head.part = i;
  head.b64 = Utilities.base64Encode(bytes.slice(i * PART_BYTES, (i + 1) * PART_BYTES));
  return head;
}

/* ===== Plan dnia z ClickUp (od 1.4.0) =====
 * Klucz API ClickUp: właściwość skryptu CLICKUP_TOKEN (wpisuje Łukasz – nigdy w kodzie).
 * Zwraca zadania przypisane do pracowników z kolumną „ID ClickUp”, z terminem w zakresie dni [od, do]. */
/** Plan widziany przez zalogowaną osobę (od 1.11.4): pracownik nie dostaje zadań osób z rolą biuro
 *  (wspólne zadania zostają, ale bez osób z biura). Rola biuro – pełny plan. */
function planDla_(res, kto) {
  if (!res || !res.zadania) return res;
  const pr = rowsT_(baza_().getSheetByName('Pracownicy')).filter(r => tak_(r[4]));
  const ja = pr.find(r => txt_(r[0]) === kto);
  if (ja && txt_(ja[2]) === 'biuro') return res;
  const biuroIds = pr.filter(r => txt_(r[2]) === 'biuro' && txt_(r[0]) !== kto).map(r => txt_(r[5])).filter(String);
  if (!biuroIds.length) return res;
  const zad = res.zadania.map(t => Object.assign({}, t, { osoby: (t.osoby || []).filter(i => biuroIds.indexOf(i) < 0) })).filter(t => t.osoby.length);
  return Object.assign({}, res, { zadania: zad });
}
function plan_(od, doDnia) {
  const token = P.getProperty('CLICKUP_TOKEN');
  if (!token) return { ok: true, zadania: [], brakKlucza: true };
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(od) || !re.test(doDnia)) throw new Error('Zły zakres dat');
  const t0 = new Date(od + 'T00:00:00').getTime(), t1 = new Date(doDnia + 'T23:59:59').getTime();
  if (t1 < t0 || t1 - t0 > 31 * 864e5) throw new Error('Zakres dat do 31 dni');
  const cacheKey = 'plan:' + (P.getProperty('PLAN_VER') || '0') + ':' + od + ':' + doDnia;   // PLAN_VER rośnie po zmianie statusu z tabletu (1.12.0)
  const cache = CacheService.getScriptCache();
  const hit = cache.get(cacheKey);
  if (hit) return JSON.parse(hit);
  const ids = rowsT_(baza_().getSheetByName('Pracownicy')).filter(r => tak_(r[4]) && txt_(r[5])).map(r => txt_(r[5]));
  if (!ids.length) return { ok: true, zadania: [] };
  const H = { headers: { Authorization: token }, muteHttpExceptions: true };
  let team = P.getProperty('CLICKUP_TEAM');
  if (!team) {
    const r = UrlFetchApp.fetch('https://api.clickup.com/api/v2/team', H);
    if (r.getResponseCode() !== 200) throw new Error('ClickUp: zły klucz API (' + r.getResponseCode() + ')');
    team = String(JSON.parse(r.getContentText()).teams[0].id); P.setProperty('CLICKUP_TEAM', team);
  }
  const out = [], seen = {};
  for (let page = 0; page < 20; page++) {
    const q = ['page=' + page, 'include_closed=true', 'subtasks=true', 'due_date_gt=' + (t0 - 1), 'due_date_lt=' + (t1 + 1)]
      .concat(ids.map(i => 'assignees[]=' + encodeURIComponent(i))).join('&');
    const r = UrlFetchApp.fetch('https://api.clickup.com/api/v2/team/' + team + '/task?' + q, H);
    if (r.getResponseCode() !== 200) throw new Error('ClickUp: błąd ' + r.getResponseCode());
    const d = JSON.parse(r.getContentText());
    (d.tasks || []).forEach(t => {
      if (seen[t.id]) return; seen[t.id] = true;
      out.push({
        id: t.id, nazwa: t.name, status: t.status && t.status.status, zamk: !!(t.status && /closed|done/.test(t.status.type)),
        lista: t.list && t.list.id, listaNazwa: t.list && t.list.name,
        start: t.start_date ? Number(t.start_date) : null, koniec: t.due_date ? Number(t.due_date) : null,
        godzStart: !!t.start_date_time, godzKoniec: !!t.due_date_time,
        osoby: (t.assignees || []).map(a => String(a.id)).filter(i => ids.indexOf(i) >= 0), url: t.url,
        est: t.time_estimate ? Number(t.time_estimate) : 0,   // „Estimated Time” w ms (od 1.10.0)
        opis: txt_(t.text_content).slice(0, 1500)   // opis zadania do okienka na tablecie (od 1.12.0)
      });
    });
    if (d.last_page || !(d.tasks || []).length) break;
  }
  const res = { ok: true, zadania: out, pobrano: Date.now() };
  const json = JSON.stringify(res);
  if (json.length < 90000) cache.put(cacheKey, json, 300);   // 5 min – nie odpytujemy ClickUp przy każdym tablecie
  return res;
}

/* ===== _Techniczne: DTR wszystkich urządzeń (wspólne dla wszystkich budów) ===== */
function techRoot_() {
  const id = konfig_().folder_techniczne_id;
  return id ? DriveApp.getFolderById(id) : null;
}
function techniczne_() {
  const root = techRoot_();
  if (!root) return { ok: true, pliki: [], brakFolderu: true };
  const out = [];
  (function walk(folder, grupa, depth) {
    const it = folder.getFiles();
    while (it.hasNext()) {
      const f = it.next();
      out.push({ id: f.getId(), name: f.getName(), mime: f.getMimeType(), size: f.getSize(), grupa: grupa, zm: f.getLastUpdated().getTime() });
    }
    if (depth >= 3) return;
    const sub = folder.getFolders();
    while (sub.hasNext()) { const d = sub.next(); walk(d, grupa ? grupa + ' / ' + d.getName() : d.getName(), depth + 1); }
  })(root, '', 0);
  out.sort((a, b) => (a.grupa + '\u0000' + a.name).localeCompare(b.grupa + '\u0000' + b.name, 'pl'));
  return { ok: true, pliki: out };
}
/** Czy plik leży w _Techniczne (do 3 poziomów podfolderów). */
function wTechnicznych_(f) {
  const root = techRoot_(); if (!root) return false;
  const rid = root.getId();
  let level = [];
  const p0 = f.getParents(); while (p0.hasNext()) level.push(p0.next());
  for (let d = 0; d <= 3 && level.length; d++) {
    const next = [];
    for (const fo of level) {
      if (fo.getId() === rid) return true;
      const pp = fo.getParents(); while (pp.hasNext()) next.push(pp.next());
    }
    level = next;
  }
  return false;
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

const TYPY_ZDARZEN = ['krok', 'nr', 'foto', 'brak', 'brak_zamk', 'notatka', 'protokol', 'foto_usun', 'brak_edyc', 'brak_kom', 'pinezka'];

/* Status zadania z tabletu (od 1.12.0): Wykonane → complete, Do kontynuacji → update required, Zadanie niepodjęte → on hold.
   Powód / komentarz trafia do zadania jako komentarz. Tylko te trzy statusy – nic innego tablet w ClickUp nie zmienia. */
const STATUSY_TABLETU = { 'complete': 'Wykonane', 'update required': 'Do kontynuacji', 'on hold': 'Zadanie niepodjęte' };
function zadania_(b, tablet) {
  const token = P.getProperty('CLICKUP_TOKEN');
  if (!token) throw new Error('Brak klucza ClickUp na serwerze');
  const wyniki = {};
  (b.zmiany || []).slice(0, 50).forEach(z => {
    const id = txt_(z && z.id); if (!id) return;
    const task = txt_(z.task), st = txt_(z.status).toLowerCase();
    if (!/^[\w-]{4,20}$/.test(task) || !STATUSY_TABLETU[st]) { wyniki[id] = { ok: false, blad: 'Nieprawidłowe dane' }; return; }
    const H = { headers: { Authorization: token, 'Content-Type': 'application/json' }, muteHttpExceptions: true };
    const r = UrlFetchApp.fetch('https://api.clickup.com/api/v2/task/' + task, Object.assign({ method: 'put', payload: JSON.stringify({ status: st }) }, H));
    if (r.getResponseCode() !== 200) {
      const m = r.getContentText();
      wyniki[id] = { ok: false, blad: /status/i.test(m) ? 'Lista w ClickUp nie ma statusu „' + st + '”' : 'ClickUp: błąd ' + r.getResponseCode() };
      return;
    }
    const linie = ['ELWIS · ' + txt_(z.kto).slice(0, 60) + ' (' + tablet + '): ' + STATUSY_TABLETU[st]];
    if (txt_(z.powod)) linie.push('Powód: ' + txt_(z.powod).slice(0, 200));
    if (txt_(z.komentarz)) linie.push(txt_(z.komentarz).slice(0, 2000));
    if (linie.length > 1 || st !== 'complete')
      UrlFetchApp.fetch('https://api.clickup.com/api/v2/task/' + task + '/comment', Object.assign({ method: 'post', payload: JSON.stringify({ comment_text: linie.join('\n'), notify_all: false }) }, H));
    wyniki[id] = { ok: true };
  });
  P.setProperty('PLAN_VER', String(Date.now()));   // tablety pobiorą świeży plan
  return { ok: true, wyniki: wyniki };
}

/* Pinezka GPS budowy z tabletu (od 1.12.0) → Projekty, kolumna D „Pinezka GPS (lat,lon)”.
   Pustą uzupełnia każdy; istniejącą zmienia tylko rola biuro. */
function pinezka_(kod, e, biuro) {
  const d = e.d || {}, lat = Number(d.lat), lon = Number(d.lon);
  if (!(lat >= 49 && lat <= 55 && lon >= 14 && lon <= 25)) return false;   // poza Polską – odrzucamy
  const sh = baza_().getSheetByName('Projekty'); const v = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < v.length; i++) if (txt_(v[i][0]) === kod) {
    if (txt_(v[i][3]) && !biuro[txt_(e.kto)]) return false;
    sh.getRange(i + 1, 4).setNumberFormat(TEXT).setValue(lat.toFixed(5) + ',' + lon.toFixed(5));
    return true;
  }
  return false;
}

function push_(b, tablet) {
  const p = projekt_(String(b.kod || ''));
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  let numery = {};
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
      numery = numeruj_(sh, evs.filter(e => e.typ === 'protokol' && !have[e.id]));
      const usuniete = [], zdjeciaDoKosza = [];
      let biuro = null, autorzy = null, autorzyBrakow = null;
      evs.forEach(e => {
        accepted.push(e.id);
        if (have[e.id]) return;
        if (e.typ === 'protokol' && e.d && e.d.stan === 'usuniety') {
          // pracownik usuwa tylko szkic bez numeru; protokół z numerem – tylko rola biuro (od 1.6.1)
          if (biuro === null) biuro = rolaBiuro_();
          if (numery[e.d.pid] && !biuro[txt_(e.kto)]) return;
          usuniete.push(e.d.pid);
        }
        if (e.typ === 'brak_edyc' && e.d && (e.d.usun || e.d.otworz)) {
          // usunięcie braku – autor lub biuro; ponowne otwarcie – biuro (od 1.9.0)
          if (biuro === null) biuro = rolaBiuro_();
          if (!biuro[txt_(e.kto)]) {
            if (e.d.otworz) return;
            if (autorzyBrakow === null) autorzyBrakow = autorzyBrakow_(sh);
            if (autorzyBrakow[txt_(e.d.bid)] && autorzyBrakow[txt_(e.d.bid)] !== txt_(e.kto)) return;
          }
        }
        if (e.typ === 'pinezka') {
          if (biuro === null) biuro = rolaBiuro_();
          if (!pinezka_(p.kod, e, biuro)) return;
        }
        if (e.typ === 'foto_usun') {
          // zdjęcie usuwa autor albo rola biuro (od 1.8.0)
          const fid = txt_(e.d && e.d.fid); if (!fid) return;
          if (biuro === null) biuro = rolaBiuro_();
          if (autorzy === null) autorzy = autorzyZdjec_(sh);
          if (!biuro[txt_(e.kto)] && autorzy[fid] && autorzy[fid] !== txt_(e.kto)) return;
          zdjeciaDoKosza.push(fid);
        }
        have[e.id] = true;
        rows.push([e.id, txt_(e.ts), txt_(e.kto).slice(0, 80), tablet, txt_(e.urz).slice(0, 20), e.typ, JSON.stringify(e.d || {}).slice(0, 45000), now]);
        if (e.urz) touched[e.urz] = true;
      });
      if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 8).setNumberFormat(TEXT).setValues(rows);
      przelicz_(p, Object.keys(touched));
      if (usuniete.length) koszWord_(p, usuniete);
      if (zdjeciaDoKosza.length) zdjeciaDoKosza.forEach(fid => { const f = plikZdjecia_(p, fid); if (f) f.setTrashed(true); });
    }
    return { ok: true, accepted: accepted, numery: numery };
  } finally { lock.releaseLock(); }
}

/* Status i nr seryjny w zakładce Urządzenia – liczone ze Zdarzeń (fundamenty 2.3). */
function przelicz_(p, ids) {
  if (!ids.length) return;
  const ss = SpreadsheetApp.openById(p.lista);
  const ev = rowsT_(zdarzeniaSheet_(p)).map(r => ({ id: txt_(r[0]), ts: txt_(r[1]), urz: txt_(r[4]), typ: txt_(r[5]), d: safeJson_(r[6]) }))
    .sort((a, b) => a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0);
  const typy = {}; slowniki_().typy.forEach(t => { typy[t.prefix] = t; });
  const braki = {}; ev.forEach(e => {
    if (e.typ === 'brak') braki[e.id] = { urz: e.urz, open: true };
    if (e.typ === 'brak_zamk' && braki[e.d.bid]) braki[e.d.bid].open = false;
    if (e.typ === 'brak_edyc' && braki[e.d.bid]) { if (e.d.usun) delete braki[e.d.bid]; else if (e.d.otworz) braki[e.d.bid].open = true; }   // od 1.9.0
  });
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
    v[i][10] = status;
  });
  zapiszPostep_(p.kod, v.filter(r => txt_(r[0])).map(r => txt_(r[10])));
}

/* Postęp budów do listy budów na tablecie (od 1.13.0): [gotowe, wszystkie] w pamięci skryptu, liczone przy pobraniu budowy i przy zmianie statusów */
function zapiszPostep_(kod, statusy) {
  try {
    const m = safeJson_(P.getProperty('POSTEP') || '{}');
    m[kod] = [statusy.filter(x => x === 'gotowe').length, statusy.length];
    P.setProperty('POSTEP', JSON.stringify(m));
  } catch (e) { }
}

/* ===================== Protokoły (od 1.5.0) =====================
 * Zakładka Protokoły: ID | Nazwa | Wersja | Rodzaj pracy | Powiązanie | Definicja (link) | Szablon Word (link) | Aktywny.
 * Skrypt czyta wyłącznie pliki wskazane w tej zakładce; Word zapisuje tylko do folderu budowy → Protokoły. */
function protokolyBaza_() {
  const sh = baza_().getSheetByName('Protokoły'); if (!sh) return [];
  return rowsT_(sh).filter(r => txt_(r[0])).map(r => ({
    id: txt_(r[0]), nazwa: txt_(r[1]), wersja: txt_(r[2]).replace(/^v/i, ''), rodzaj: txt_(r[3]),
    powiazania: prefiksy_(r[4]),
    defId: idFromUrl_(r[5]), szablonId: idFromUrl_(r[6]), aktywny: tak_(r[7])
  }));
}
/** Powiązanie: jeden lub kilka prefiksów typu urządzenia, np. „SZ; SP (szafy)”; tekst w nawiasie = opis; pusto = wszystkie urządzenia. */
function prefiksy_(v) {
  return txt_(v).replace(/\([^)]*\)/g, ' ').split(/[;,\s]+/).map(x => x.replace(/[^A-Za-z]/g, '').toUpperCase()).filter(String)
    .filter((x, i, a) => a.indexOf(x) === i);
}
function definicja_(fileId) {
  const c = CacheService.getScriptCache(), k = 'def:' + fileId, hit = c.get(k);
  if (hit) return JSON.parse(hit);
  const s = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
  const d = JSON.parse(s);
  if (s.length < 90000) c.put(k, s, 600);
  return d;
}
function protokolyAktywne_() {
  return protokolyBaza_().filter(p => p.aktywny && p.defId && p.szablonId).map(p => {
    let def = null, blad = '';
    try { def = definicja_(p.defId); } catch (e) { blad = 'Błąd pliku definicji: ' + (e.message || e); }
    return { id: p.id, nazwa: p.nazwa, wersja: p.wersja, rodzaj: p.rodzaj, powiazania: p.powiazania, powiazanie: p.powiazania[0] || '', def: def, blad: blad };
  });
}
/** Numer protokołu nadaje serwer (bez kolizji między tabletami): <prefiks><nr 2 cyfry>, kolejno w budowie dla prefiksu.
 *  Nadawany przy pierwszym zapisie ze stanem innym niż „roboczy”; kolejne zapisy tego protokołu dostają ten sam numer. */
function numeruj_(sh, nowe) {
  const numery = {};
  if (!nowe.length) return {};
  const max = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 6, sh.getLastRow() - 1, 2).getDisplayValues().forEach(r => {
    if (txt_(r[0]) !== 'protokol') return;
    const d = safeJson_(r[1]); if (!d.pid || !d.nr) return;
    numery[d.pid] = d.nr;
    const m = String(d.nr).match(/^([A-Z]+)(\d+)$/); if (m) max[m[1]] = Math.max(max[m[1]] || 0, Number(m[2]));
  });
  nowe.slice().sort((a, b) => txt_(a.ts) < txt_(b.ts) ? -1 : 1).forEach(e => {
    const d = e.d = e.d || {}; if (!d.pid) return;
    if (numery[d.pid]) { d.nr = numery[d.pid]; return; }
    if (!d.stan || d.stan === 'roboczy' || d.stan === 'usuniety') { delete d.nr; return; }   // usunięty bez numeru – numer nie jest nadawany
    const pf = String(d.prefiks || 'P').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'P';
    const n = (max[pf] || 0) + 1; max[pf] = n;
    d.nr = pf + (n < 10 ? '0' : '') + n; numery[d.pid] = d.nr;
  });
  const wynik = {};
  nowe.forEach(e => { if (e.d && e.d.pid && numery[e.d.pid]) wynik[e.d.pid] = numery[e.d.pid]; });
  return wynik;
}
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
/** Word protokołu na żądanie (tylko rola biuro) → folder budowy / Protokoły. */
/** Autorzy zdjęć budowy: fid → pracownik (zdarzenia foto, brak, notatka). */
function autorzyZdjec_(sh) {
  const a = {}; if (sh.getLastRow() < 2) return a;
  sh.getRange(2, 3, sh.getLastRow() - 1, 5).getDisplayValues().forEach(r => {
    const typ = txt_(r[3]); if (typ !== 'foto' && typ !== 'brak' && typ !== 'notatka') return;
    const d = safeJson_(r[4]); [d.fid, ...(d.foto || [])].filter(Boolean).forEach(f => { if (!a[f]) a[f] = txt_(r[0]); });
  });
  return a;
}
/** Autorzy braków: id zdarzenia „brak” → pracownik. */
function autorzyBrakow_(sh) {
  const a = {}; if (sh.getLastRow() < 2) return a;
  sh.getRange(2, 1, sh.getLastRow() - 1, 6).getDisplayValues().forEach(r => { if (txt_(r[5]) === 'brak') a[txt_(r[0])] = txt_(r[2]); });
  return a;
}
/** Plik zdjęcia (opis „ELWIS <fid> …”) – wyłącznie z folderu Zdjęcia tej budowy. */
function plikZdjecia_(p, fid) {
  if (!/^[\w-]{4,60}$/.test(fid)) return null;
  const zd = sub_(DriveApp.getFolderById(p.folder), 'Zdjęcia', false); if (!zd) return null;
  const it = DriveApp.searchFiles("fullText contains '" + fid + "' and trashed = false");
  while (it.hasNext()) {
    const f = it.next();
    if ((f.getDescription() || '').indexOf('ELWIS ' + fid) !== 0) continue;
    const par = f.getParents(); if (!par.hasNext()) continue;
    const dzien = par.next(), nad = dzien.getParents();
    if (nad.hasNext() && nad.next().getId() === zd.getId()) return f;
  }
  // zapasowo (indeks wyszukiwania Dysku bywa opóźniony): przejrzenie folderów dni
  const dni = zd.getFolders();
  while (dni.hasNext()) { const fs = dni.next().getFiles(); while (fs.hasNext()) { const f = fs.next(); if ((f.getDescription() || '').indexOf('ELWIS ' + fid) === 0) return f; } }
  return null;
}
/** Podgląd zdjęcia z innego tabletu (od 1.8.0) – tablet zapisuje je pomniejszone. */
function foto_(kod, fid) {
  const p = projekt_(kod);
  const f = plikZdjecia_(p, fid); if (!f) throw new Error('Zdjęcie nie jest jeszcze na Dysku (zsynchronizuj tablet, który je zrobił).');
  const b = f.getBlob(); if (b.getBytes().length > 8e6) throw new Error('Zdjęcie za duże do podglądu');
  return { ok: true, mime: b.getContentType() || 'image/jpeg', b64: Utilities.base64Encode(b.getBytes()) };
}
/** Osoby z rolą biuro (aktywne) – { nazwa: true } */
function rolaBiuro_() {
  const o = {}; rowsT_(baza_().getSheetByName('Pracownicy')).forEach(r => { if (txt_(r[2]) === 'biuro' && tak_(r[4])) o[txt_(r[0])] = true; }); return o;
}
/** Usunięty protokół: wygenerowany Word (opis „ELWIS <pid> …”) z folderu budowy → Protokoły do kosza. */
function koszWord_(p, pids) {
  const folder = sub_(DriveApp.getFolderById(p.folder), 'Protokoły', false); if (!folder) return;
  const it = folder.getFiles();
  while (it.hasNext()) { const f = it.next(); const opis = f.getDescription() || ''; if (pids.some(pid => opis.indexOf('ELWIS ' + pid + ' ') === 0)) f.setTrashed(true); }
}
function docx_(b) {
  const kto = txt_(b.kto);
  const prac = rowsT_(baza_().getSheetByName('Pracownicy')).find(r => txt_(r[0]) === kto && tak_(r[4]));
  if (!prac || txt_(prac[2]) !== 'biuro') throw new Error('Generowanie Word – tylko rola biuro');
  const p = projekt_(String(b.kod || ''));
  const ev = rowsT_(zdarzeniaSheet_(p)).filter(r => txt_(r[5]) === 'protokol')
    .map(r => ({ ts: txt_(r[1]), urz: txt_(r[4]), d: safeJson_(r[6]) })).filter(e => e.d.pid === b.pid)
    .sort((x, y) => x.ts < y.ts ? -1 : x.ts > y.ts ? 1 : 0);
  if (!ev.length) throw new Error('Protokół nie dotarł jeszcze na serwer – zsynchronizuj tablet');
  const e = ev[ev.length - 1], d = e.d;
  if (d.stan === 'usuniety') throw new Error('Protokół został usunięty');
  if (!d.nr) throw new Error('Protokół nie ma numeru – najpierw „Zakończ” i synchronizacja');
  const pr = protokolyBaza_().find(x => x.id === d.def && x.wersja === String(d.wersja));
  if (!pr || !pr.szablonId || !pr.defId) throw new Error('Brak szablonu lub definicji: ' + d.def + ' v' + d.wersja);
  const def = definicja_(pr.defId);
  const ctx = kontekst_(p, d);
  const parts = Utilities.unzip(DriveApp.getFileById(pr.szablonId).getBlob().setContentType('application/zip'));
  const out = parts.map(f => f.getName() === 'word/document.xml'
    ? Utilities.newBlob(wypelnijXml_(f.getDataAsString('UTF-8'), def, d.dane || {}, ctx), 'application/xml', f.getName()) : f);
  const name = ocen_(def.nazwa_pliku || '{nazwa_budowy} - protokół {nr}', ctx, d.dane || {}).replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 150) + '.docx';
  const zip = Utilities.zip(out, name).setContentType(DOCX_MIME);
  const folder = sub_(DriveApp.getFolderById(p.folder), 'Protokoły', true);
  const old = folder.getFilesByName(name); while (old.hasNext()) old.next().setTrashed(true);   // ponowne wygenerowanie zastępuje plik
  const f = folder.createFile(zip);
  f.setDescription('ELWIS ' + d.pid + ' · ' + d.def + ' v' + d.wersja + ' · ' + d.nr);
  return { ok: true, name: name, url: f.getUrl(), nr: ctx.nr_protokolu };
}
function kontekst_(p, d) {
  const dane = d.dane || {}, dt = String(dane.data || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  const ctx = {
    kod: p.kod, nazwa_budowy: p.nazwa.indexOf(p.kod) === 0 ? p.nazwa : p.kod + ' ' + p.nazwa, adres: p.adres,
    inwestor: p.inwestor || p.zamawiajacy || '', zamawiajacy: p.zamawiajacy || '',   // brak inwestora → zamawiający
    nr: d.nr || '', prefiks_nr: d.prefiks || '', dd: dt ? dt[3] : '', mm: dt ? dt[2] : '', rrrr: dt ? dt[1] : ''
  };
  return ctx;
}

/* ----- Wypełnianie szablonu Word (czysty tekst XML – bez usług Google, testowalne poza Apps Script) ----- */
/** Wzór: {pole} – wartość z danych lub kontekstu; {pole=X:A|B} – A gdy pole = X, inaczej B. */
function ocen_(w, ctx, dane) {
  const val = k => (dane && dane[k] != null && dane[k] !== '') ? dane[k] : (ctx && ctx[k] != null ? ctx[k] : '');
  return String(w || '').replace(/\{([^{}]+)\}/g, (m, e) => {
    const c = e.match(/^(\w+)=([^:]*):([^|]*)\|(.*)$/);
    if (c) return String(val(c[1])) === c[2] ? c[3] : c[4];
    return String(val(e.trim()));
  });
}
function xmlEsc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\r?\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
}
function widoczna_(sek, dane) {
  if (!sek.pokaz_gdy) return true;
  return Object.keys(sek.pokaz_gdy).every(k => String(dane[k] == null ? '' : dane[k]) === String(sek.pokaz_gdy[k]));
}
function mapaPol_(pola, dane, ctx, def, widoczne) {
  const T = def.znak_tak || '☒', N = def.znak_nie || '☐', m = {};
  pola.forEach(f => {
    let v = widoczne ? dane[f.id] : '';
    if (f.typ === 'auto' && (v == null || v === '')) v = ocen_(f.wzor, Object.assign({}, ctx, dane), {});
    if (f.word) { Object.keys(f.word).forEach(opt => { m[f.word[opt]] = String(v) === opt ? T : N; }); return; }
    if (f.typ === 'znacznik') { m[f.id] = v === true || v === 'tak' ? T : N; return; }
    if (f.typ === 'data' && /^\d{4}-\d{2}-\d{2}/.test(String(v || ''))) { const x = String(v); v = x.slice(8, 10) + '/' + x.slice(5, 7) + '/' + x.slice(0, 4); }
    m[f.id] = v == null ? '' : String(v);
  });
  return m;
}
function wstaw_(xml, m) {
  return xml.replace(/\{\{([^{}#\/]+)\}\}/g, (a, k) => xmlEsc_(m[k.trim()] != null ? m[k.trim()] : ''));
}
function wypelnijXml_(xml, def, dane, ctx) {
  const scal = {};
  const kontekstPol = {};
  (def.sekcje || []).forEach(sek => {
    if (sek.typ === 'tabela') return;
    Object.assign(scal, mapaPol_(sek.pola || [], dane, Object.assign({}, ctx), def, widoczna_(sek, dane)));
  });
  Object.assign(kontekstPol, ctx, dane);
  scal.nr_protokolu = ocen_(((def.sekcje || []).reduce((w, s) => w || (s.pola || []).find(f => f.id === 'nr_protokolu'), null) || {}).wzor || '{kod}-{dd}/{mm}-{nr}', kontekstPol, {});
  // tabele powtarzalne: wiersz z {{#nazwa}} … {{/nazwa}} powielany dla każdej pozycji
  (def.sekcje || []).filter(s => s.typ === 'tabela').forEach(sek => {
    const nazwa = sek.word_petla || sek.id, otw = '{{#' + nazwa + '}}', zam = '{{/' + nazwa + '}}';
    let guard = 0;
    while (xml.indexOf(otw) >= 0 && guard++ < 20) {
      const i = xml.indexOf(otw);
      const a = Math.max(xml.lastIndexOf('<w:tr ', i), xml.lastIndexOf('<w:tr>', i));
      const j = xml.indexOf(zam, i), b = xml.indexOf('</w:tr>', j) + 7;
      if (a < 0 || j < 0 || b < 7) break;
      const wiersz = xml.slice(a, b).replace(otw, '').replace(zam, '');
      const pozycje = widoczna_(sek, dane) && Array.isArray(dane[sek.id]) ? dane[sek.id] : [];
      const txt = pozycje.map((poz, lp) => wstaw_(wiersz, mapaPol_(sek.pola || [], poz || {}, Object.assign({ lp: lp + 1 }, ctx), def, true))).join('');
      xml = xml.slice(0, a) + txt + xml.slice(b);
    }
  });
  return wstaw_(xml, scal);
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
