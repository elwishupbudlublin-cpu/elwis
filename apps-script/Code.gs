/**
 * ELWIS – serwer synchronizacji (Google Apps Script, konto ELWIS).
 * Zamknięta lista operacji: bootstrap, project, file, techniczne, plan, events, push, docx. Wszystko inne → odmowa.
 * Bez danych budów i kluczy w kodzie – konfiguracja w Bazie projektów i we właściwościach skryptu.
 * Schemat danych 1.x. Opis API: docs/API.md.
 */

const SCRIPT_VERSION = '1.56.2';
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
  try { migracjaWyzwalaczy_(); } catch (e) { }   // od 1.55.0: jednorazowo – zamiana godzinowego przeliczania priorytetów na zadanie dzienne
  try {
    const tablet = auth_(p.key);
    if (!tablet) return out_({ ok: false, error: 'Nieznany lub wyłączony klucz tabletu' });
    const dost = dostep_(p.key);   // od 1.43.0: klucz podwykonawcy – tylko wybrane budowy, z datą ważności
    if (dost.wygasl) return out_({ ok: false, error: 'Dostęp wygasł ' + dost.wazny + ' – skontaktuj się z HUP-BUD' });
    const akcja = body ? body.action : p.action;
    if (dost.budowy) {
      if (['plan', 'zadania', 'docx', 'priorytety', 'zakupy', 'zadNowe', 'powiad'].indexOf(akcja) >= 0) return out_({ ok: false, error: 'Operacja niedostępna dla dostępu podwykonawcy' });
      const kod = String((body && body.kod) || p.kod || '');
      if (['project', 'events', 'foto', 'push'].indexOf(akcja) >= 0 && dost.budowy.indexOf(kod) < 0) return out_({ ok: false, error: 'Brak dostępu do tej budowy' });
    }
    switch (akcja) {
      case 'bootstrap': if (p.pamiec) stanPamieci_(p.key, p.pamiec); return out_(bootstrap_(tablet, dost));
      case 'project': return out_(project_(String(p.kod || '')));
      case 'file': return out_(file_(String(p.id || ''), p.part, dost));
      case 'techniczne': return out_(techniczne_());
      case 'plan': return out_(planDla_(plan_(String(p.od || ''), String(p.do || '')), String(p.kto || '')));
      case 'events': return out_(events_(String(p.kod || ''), Number(p.since || 0)));
      case 'foto': return out_(foto_(String(p.kod || ''), String(p.fid || '')));
      case 'push': return out_(push_(body, tablet, dost));
      case 'zadania': return out_(zadania_(body || {}, tablet));
      case 'zakupy': return out_(zakupy_(body || {}, tablet));   // od 1.48.0: zapotrzebowania (folder Zakupy)
      case 'docx': return out_(docx_(body || {}));
      case 'priorytety': return out_(priorytety_(String(p.kto || ''), p.odswiez === '1'));
      case 'zadNowe': return out_(zadNowe_(body || {}));   // od 1.56.0: warianty terminu, zaplanowanie, nowy projekt
      case 'powiad': return out_(powiad_(String(p.kto || ''), p.since));   // od 1.56.0: powiadomienia (rola biuro)
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

/* Pamięć podręczna serwera (od 1.16.0): lista tabletów 60 s, aktywne budowy 5 min – każde zapytanie nie musi czytać Bazy.
   Wyłączenie tabletu / budowy działa najpóźniej po tym czasie; zapis pinezki czyści pamięć budów od razu. */
const CACHE = CacheService.getScriptCache();
function zCache_(klucz, sek, fn) {
  const c = CACHE.get(klucz); if (c) return JSON.parse(c);
  const v = fn(); try { CACHE.put(klucz, JSON.stringify(v), sek); } catch (e) { } return v;
}
function auth_(key) {
  if (!key) return null;
  const t = zCache_('tablety', 60, () => rowsT_(baza_().getSheetByName('Tablety')).filter(x => tak_(x[3])).map(x => [txt_(x[1]), txt_(x[0])]));
  const r = t.find(x => x[0] === String(key));
  return r ? r[1] : null;
}

/* Dostęp podwykonawcy (od 1.43.0, schemat 1.12): Tablety → G „Budowy (dostęp)” (kody przez średnik; puste = wszystkie aktywne,
   zwykły tablet HUP-BUD), H „Ważny do” (rrrr-mm-dd; puste = bez daty). Klucz z budowami: tylko te budowy, bez planu dnia,
   Priorytetów, Word i statusów ClickUp; logują się tylko konta Pracownicy z rolą „podwykonawca” i Ekipą = „Przypisany do” (C). */
function dostep_(key) {
  const t = zCache_('dostep', 60, () => rowsT_(baza_().getSheetByName('Tablety')).filter(x => tak_(x[3]))
    .map(x => [txt_(x[1]), txt_(x[2]), txt_(x[6]), txt_(x[7])]));
  const r = t.find(x => x[0] === String(key)) || ['', '', '', ''];
  const budowy = r[2] ? r[2].split(/[;,]/).map(s => s.trim()).filter(String) : null;
  const dzis = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd');
  return { budowy: budowy && budowy.length ? budowy : null, ekipa: r[1], wazny: r[3], wygasl: !!(r[3] && /^\d{4}-\d{2}-\d{2}$/.test(r[3]) && r[3] < dzis) };
}
/** Link dla podwykonawcy (od 1.43.0) – uruchom w edytorze Apps Script: dodaje klucz w Tablety i zapisuje link w Logach.
 *  Przykład: linkPodwykonawcy('Firma X', 'RR_NNN', '2026-12-31')  – kilka budów: 'RR_NNN; RR_MMM'.
 *  Konto logowania: Pracownicy → wiersz z rolą „podwykonawca”, Ekipa = nazwa firmy (jak tu), PIN, Aktywny = tak. */
function linkPodwykonawcy(firma, budowy, waznyDo) {
  if (!firma || !budowy) throw new Error('Podaj firmę i kody budów, np. linkPodwykonawcy("Firma X", "RR_NNN", "2026-12-31")');
  const sh = baza_().getSheetByName('Tablety');
  if (!txt_(sh.getRange(1, 7).getValue())) sh.getRange(1, 7, 1, 2).setValues([['Budowy (dostęp)', 'Ważny do']]);
  const key = 'P-' + Utilities.getUuid().replace(/-/g, '').slice(0, 24);
  const n = sh.getLastRow() + 1;
  sh.getRange(n, 1, 1, 8).setNumberFormat('@').setValues([['Podwykonawca – ' + firma, key, firma, 'tak', 'link ' + Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd'), '', budowy, waznyDo || '']]);
  CACHE.remove('tablety'); CACHE.remove('dostep');
  const cfg = Utilities.base64EncodeWebSafe(JSON.stringify({ s: ScriptApp.getService().getUrl(), k: key }));
  const link = APP_URL + '#cfg=' + cfg;
  Logger.log('Link dla ' + firma + ' (budowy: ' + budowy + (waznyDo ? ', ważny do ' + waznyDo : '') + '):\n' + link);
  return link;
}
const APP_URL = 'https://elwishupbudlublin-cpu.github.io/elwis/';

/** Stan pamięci zgłoszony przez tablet (od 1.7.0) → Tablety, kolumna F „Stan pamięci” (schemat 1.6). */
function stanPamieci_(key, v) {
  try {
    const sh = baza_().getSheetByName('Tablety');
    if (!txt_(sh.getRange(1, 6).getValue())) sh.getRange(1, 6).setValue('Stan pamięci');
    const keys = sh.getRange(2, 2, Math.max(sh.getLastRow() - 1, 1), 1).getDisplayValues();
    const i = keys.findIndex(r => txt_(r[0]) === String(key)); if (i < 0) return;
    const czas = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm');
    sh.getRange(i + 2, 6).setNumberFormat(TEXT).setValue((czas + ' · ' + String(v)).replace(/[=+@]/g, ' ').slice(0, 300));
  } catch (e) { /* zgłoszenie stanu nie może blokować synchronizacji */ }
}
function sha_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function aktywne_() {
  return zCache_('aktywne', 300, aktywneBaza_);
}
function aktywneBaza_() {
  return rowsT_(baza_().getSheetByName('Projekty'))
    .filter(r => tak_(r[5]) && txt_(r[0]) && ['tak', 'nie'].indexOf(txt_(r[11]).toLowerCase()) >= 0)
    .map(r => ({
      kod: txt_(r[0]), nazwa: txt_(r[1]), adres: txt_(r[2]), lokalizacja: txt_(r[3]), kontakt: txt_(r[4]),
      zakres: txt_(r[6]).split(/[;,]/).map(s => s.trim()).filter(String), uwagi: txt_(r[7]),
      folder: idFromUrl_(r[8]), lista: idFromUrl_(r[10]), wojskowy: txt_(r[11]).toLowerCase(),
      etapy: etapy_(r[12]), listaCU: txt_(r[9]),
      inwestor: txt_(r[13]), zamawiajacy: txt_(r[14]),   // schemat 1.5 – do protokołów
      kierownik: txt_(r[15]),                              // schemat 1.10 – kierownik HUP-BUD opiekujący się budową
      telKier: txt_(r[16]),                                // schemat 1.13 – telefon kierownika (skill kopiuje z ekipy-i-pracownicy.md)
      kontakty: kontaktyZ_(r[17])                          // schemat 1.14 – Inne kontakty: „Rola: Nazwa, telefon”, jeden w wierszu
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
    odpowiedzialni: v.map(r => txt_(r[1])).filter(String),   // kolumna B (schemat 1.17): odpowiedzialny za brak
    typy: v.filter(r => txt_(r[2])).map(r => ({ prefix: txt_(r[2]).toUpperCase(), nazwa: txt_(r[3]), kroki: txt_(r[4]).split(';').map(s => s.trim()).filter(String), sn: tak_(r[5]), opis: txt_(r[9]) })),   // opis – kolumna J (schemat 1.16): kiedy stosować prefiks
    rodzaje: v.filter(r => txt_(r[7])).map(r => ({ id: txt_(r[7]), opis: txt_(r[8]) }))
  };
}

/* ===================== Operacje ===================== */

function bootstrap_(tablet, dost) {
  const k = konfig_();
  const salt = P.getProperty('SALT');
  const pod = !!(dost && dost.budowy);   // dostęp podwykonawcy: tylko jego konta; tablety HUP-BUD: bez kont podwykonawców
  const pr = rowsT_(baza_().getSheetByName('Pracownicy'))
    .filter(r => txt_(r[0]) && tak_(r[4]) && txt_(r[3]))
    .filter(r => pod ? (txt_(r[2]) === 'podwykonawca' && txt_(r[1]) === dost.ekipa) : txt_(r[2]) !== 'podwykonawca')
    .map(r => ({ name: txt_(r[0]), ekipa: txt_(r[1]), rola: txt_(r[2]) || 'pracownik', hash: sha_(salt + ':' + txt_(r[3])),
      cu: txt_(r[5]), m: tak_(r[7]) || txt_(r[2]) === 'biuro' }));
  const postep = safeJson_(P.getProperty('POSTEP') || '{}');
  const licz = safeJson_(P.getProperty('LICZ') || '{}');   // od 1.23.0
  const liczniki = safeJson_(P.getProperty('ZDARZENIA') || '{}');   // liczba zdarzeń budowy (od 1.16.0) – tablet pomija pytanie o nowe wpisy, gdy nic nie przybyło
  const projekty = aktywne_().filter(p => !pod || dost.budowy.indexOf(p.kod) >= 0).map(p => { const o = Object.assign({}, p); delete o.folder; delete o.lista; if (postep[p.kod]) o.postep = postep[p.kod]; if (licz[p.kod]) o.licz = licz[p.kod]; if (liczniki[p.kod] != null) o.zd = liczniki[p.kod]; return o; });
  return {
    ok: true, server: SCRIPT_VERSION, schema: k.wersja_schematu, minApp: k.min_wersja_aplikacji || '1.0.0',
    sesjaGodziny: Number(k.sesja_godziny || 12), tablet: tablet, salt: salt,
    pracownicy: pr, projekty: projekty, slowniki: slowniki_(), protokoly: protokolyAktywne_(),
    dostep: pod ? { budowy: dost.budowy, wazny: dost.wazny || '' } : null,
    kierownikAkpia: (m => m ? { nazwa: txt_(m[1]), tel: txt_(m[2]) } : null)(String(k.kierownik_akpia || '').match(/^([^:]+):?(.*)$/))   // od 1.44.0, Konfiguracja
  };
}

function project_(kod) {
  const p = projekt_(kod);
  const ss = SpreadsheetApp.openById(p.lista);
  const urz = rows_(ss.getSheetByName('Urządzenia')).filter(r => txt_(r[0])).map(r => ({
    id: txt_(r[0]), grupa: txt_(r[1]), typ: txt_(r[2]), zasilanie: txt_(r[3]), kond: txt_(r[4]), arkusz: txt_(r[5]),
    uwagi: txt_(r[6]), x: num_(r[7]), y: num_(r[8]), sn: txt_(r[9]), status: txt_(r[10]), etap: txt_(r[11]),
    oz: txt_(r[12]),  // „Oznaczenie proj.” – oznaczenie z projektu (schemat 1.7)
    sys: txt_(r[13])  // „System” – ID urządzenia sterującego, kilka przez średnik (schemat 1.9)
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

function file_(id, part, dost) {
  if (!id) throw new Error('Brak pliku');
  const f = DriveApp.getFileById(id);
  // tylko pliki z folderu „Do wglądu” aktywnej budowy (dostęp podwykonawcy – tylko jego budów)
  const allowed = {};
  aktywne_().forEach(p => { if (p.folder && (!dost || !dost.budowy || dost.budowy.indexOf(p.kod) >= 0)) allowed[p.folder] = true; });
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
    // od 1.56.1: także zadania wielodniowe, które trwają w zakresie, a termin mają później (start ≤ koniec zakresu) – do 90 dni po zakresie
    const q = ['page=' + page, 'include_closed=true', 'subtasks=true', 'due_date_gt=' + (t0 - 1), 'due_date_lt=' + (t1 + 90 * 864e5)]
      .concat(ids.map(i => 'assignees[]=' + encodeURIComponent(i))).join('&');
    const r = UrlFetchApp.fetch('https://api.clickup.com/api/v2/team/' + team + '/task?' + q, H);
    if (r.getResponseCode() !== 200) throw new Error('ClickUp: błąd ' + r.getResponseCode());
    const d = JSON.parse(r.getContentText());
    (d.tasks || []).forEach(t => {
      if (seen[t.id]) return; seen[t.id] = true;
      if (Number(t.due_date) > t1 && !(t.start_date && Number(t.start_date) <= t1)) return;   // termin po zakresie i start też po – nie dotyczy tych dni
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
  zapiszLicznik_(kod, last);
  if (since >= last) return { ok: true, events: [], last: last, more: false };
  const n = Math.min(500, last - since);
  const v = sh.getRange(since + 2, 1, n, 7).getDisplayValues();
  const ev = v.map(r => ({ id: txt_(r[0]), ts: txt_(r[1]), kto: txt_(r[2]), tablet: txt_(r[3]), urz: txt_(r[4]), typ: txt_(r[5]), d: safeJson_(r[6]) }));
  return { ok: true, events: ev, last: since + n, more: since + n < last };
}
function safeJson_(s) { try { return JSON.parse(s); } catch (e) { return {}; } }

const TYPY_ZDARZEN = ['krok', 'nr', 'foto', 'brak', 'brak_zamk', 'notatka', 'protokol', 'foto_usun', 'brak_edyc', 'brak_kom', 'pinezka', 'urz_nowe', 'urz_poz', 'urz_sys', 'urz_usun', 'notatka_edyc', 'urz_edyc', 'projekt_edyc'];

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
    CACHE.remove('aktywne');
    return true;
  }
  return false;
}

/* Inne kontakty (od 1.45.0, kolumna R Projekty): wiersz „Rola: Imię Nazwisko / firma, telefon” – czytelny i edytowalny w arkuszu */
function kontaktyZ_(v) {
  return txt_(v).split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 30).map(l => {
    const m = l.match(/^([^:]{1,60}):\s*(.*)$/), rola = m ? m[1].trim() : '', reszta = m ? m[2] : l;
    const t = reszta.match(/,\s*([+\d][\d\s\-()]{5,})\s*$/);
    return { rola, nazwa: (t ? reszta.slice(0, t.index) : reszta).trim(), tel: t ? t[1].trim() : '' };
  });
}
function kontaktyDo_(lista) {
  return lista.slice(0, 30).map(k => {
    const c = x => txt_(x).replace(/[\r\n:]/g, ' ').trim();
    const rola = c(k.rola).slice(0, 60), nazwa = c(k.nazwa).replace(/,/g, ' ').slice(0, 120), tel = c(k.tel).slice(0, 40);
    return (rola ? rola + ': ' : '') + nazwa + (tel ? ', ' + tel : '');
  }).filter(Boolean).join('\n').slice(0, 5000);
}

/* ===== Zapotrzebowania (od 1.48.0, schemat 1.15) =====
   Folder „Zakupy” (górny poziom Dysku ELWIS): arkusz „Zapotrzebowania” (Konfiguracja → zakupy_arkusz_id) z zakładkami
   Pozycje (jeden wiersz na pozycję) i Zdarzenia (historia, nie edytować) oraz folder Zdjęcia (zakupy_zdjecia_id) → rok → nr zgłoszenia.
   Nr zgłoszenia: Z-00012-<kod budowy albo AKPiA>-<rrmm>, kolejny numer wspólny dla wszystkich (bez zerowania).
   Statusy pozycji: nowe → w realizacji → dostarczone; odrzucone. Status zmienia tylko rola biuro. Operacja `zakupy`:
   body.zdarzenia (zap / zap_stat), body.zdjecie {fid, zid, b64} (pojedynczo), body.foto {fid, zid} (podgląd) – zawsze zwraca listę. */
const ZAK_ST = { nowe: 'nowe', realizacja: 'w realizacji', dostarczone: 'dostarczone', odrzucone: 'odrzucone', usuniete: 'usunięta' };   // usunięta – tylko z edycji (od 1.49.0)
function zakArk_() { const id = konfig_().zakupy_arkusz_id; if (!id) throw new Error('Brak arkusza zakupów (Konfiguracja → zakupy_arkusz_id)'); return SpreadsheetApp.openById(id); }
function zakupy_(b, tablet) {
  const ss = zakArk_(), poz = ss.getSheetByName('Pozycje'), zd = ss.getSheetByName('Zdarzenia');
  if (b.foto) return zakFoto_(b.foto);
  const odp = { ok: true, accepted: [], nr: {} };
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const evs = (b.zdarzenia || []).filter(e => e && e.id && ['zap', 'zap_stat', 'zap_edyc', 'zap_przen'].indexOf(e.typ) >= 0).slice(0, 100);
    const konta = {}; rowsT_(baza_().getSheetByName('Pracownicy')).forEach(r => { if (tak_(r[4]) && txt_(r[2]) !== 'podwykonawca') konta[txt_(r[0])] = txt_(r[2]) || 'pracownik'; });
    const zv = zd.getLastRow() > 1 ? zd.getRange(2, 1, zd.getLastRow() - 1, 6).getDisplayValues() : [];
    const have = {}, mapa = {};   // id zdarzenia → true; id zgłoszenia (tymczasowe) → nr
    zv.forEach(r => { have[txt_(r[0])] = true; if (txt_(r[5]) === 'zap') mapa[txt_(r[0])] = txt_(r[4]); });
    const now = Utilities.formatDate(new Date(), 'Europe/Warsaw', "yyyy-MM-dd'T'HH:mm:ss"), c = x => txt_(x).replace(/^[=+@-]/, "'$&");
    let nast = null;
    evs.sort((x, y) => (txt_(x.ts) < txt_(y.ts) ? -1 : 1)).forEach(e => {
      if (have[e.id]) { odp.accepted.push(e.id); if (e.typ === 'zap') odp.nr[e.id] = mapa[e.id]; return; }
      const rola = konta[txt_(e.kto)]; if (!rola) { odp.accepted.push(e.id); return; }   // nieznane / nieaktywne konto – pomijamy
      const d = e.d || {};
      if (e.typ === 'zap') {
        const pozycje = (d.poz || []).filter(x => x && txt_(x.n)).slice(0, 50); if (!pozycje.length) { odp.accepted.push(e.id); return; }
        const kod = txt_(d.kod) && aktywne_().some(p => p.kod === txt_(d.kod)) ? txt_(d.kod) : '';
        if (nast === null) nast = zakNastepny_(poz);
        const rrmm = Utilities.formatDate(new Date(txt_(e.ts) || Date.now()), 'Europe/Warsaw', 'yyMM');
        const nr = 'Z-' + ('0000' + nast++).slice(-5) + '-' + (kod || 'AKPiA') + '-' + rrmm;
        const kiedy = Utilities.formatDate(new Date(txt_(e.ts) || Date.now()), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm');
        const rows = pozycje.map((x, i) => [nr, i + 1, kod || 'AKPiA', kiedy, c(e.kto), c(x.n).slice(0, 200), c(x.il).slice(0, 20), c(x.j).slice(0, 10), [c(x.uw), i === 0 && txt_(d.uwagi) ? 'całe zgłoszenie: ' + c(d.uwagi) : ''].filter(String).join(' · ').slice(0, 1000), ZAK_ST.nowe, '']);
        poz.getRange(poz.getLastRow() + 1, 1, rows.length, 11).setNumberFormat(TEXT).setValues(rows);
        mapa[e.id] = nr; odp.nr[e.id] = nr;
        powDodaj_([{ t: 'zap', kod: kod || 'AKPiA', tyt: 'Nowe zapotrzebowanie ' + nr + ' (' + pozycje.length + ' poz.)', opis: pozycje.map(x => txt_(x.n)).join(' · ').slice(0, 300), kto: txt_(e.kto) }]);
      } else if (e.typ === 'zap_przen') {   // zmiana budowy (od 1.50.0, tylko biuro): stare zgłoszenie → odrzucone, nowe z tymi samymi pozycjami i zgłaszającym
        if (rola !== 'biuro') { odp.accepted.push(e.id); return; }
        const stary = mapa[txt_(d.zid)] || txt_(d.zid); if (!/^Z-\d{5}-/.test(stary)) return;
        const kod = txt_(d.kod) && aktywne_().some(p => p.kod === txt_(d.kod)) ? txt_(d.kod) : '';
        const pozycje = (d.poz || []).filter(x => x && txt_(x.n)).slice(0, 50); if (!pozycje.length) { odp.accepted.push(e.id); return; }
        const v = poz.getLastRow() > 1 ? poz.getRange(2, 1, poz.getLastRow() - 1, 11).getDisplayValues() : [];
        const r0 = v.find(r => txt_(r[0]) === stary); if (!r0) { odp.accepted.push(e.id); return; }
        if (nast === null) nast = zakNastepny_(poz);
        const nowy = 'Z-' + ('0000' + nast++).slice(-5) + '-' + (kod || 'AKPiA') + '-' + Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyMM');
        const kiedy = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm'), zm = txt_(e.kto) + ' ' + Utilities.formatDate(new Date(), 'Europe/Warsaw', 'dd.MM HH:mm');
        const rows = pozycje.map((x, i) => [nowy, i + 1, kod || 'AKPiA', kiedy, txt_(r0[4]), c(x.n).slice(0, 200), c(x.il).slice(0, 20), c(x.j).slice(0, 10), [c(x.uw), i === 0 && txt_(d.uwagi) ? 'całe zgłoszenie: ' + c(d.uwagi) : '', i === 0 ? 'przeniesione z ' + stary : ''].filter(String).join(' · ').slice(0, 1000), ZAK_ST.nowe, zm]);
        poz.getRange(poz.getLastRow() + 1, 1, rows.length, 11).setNumberFormat(TEXT).setValues(rows);
        v.forEach((r, i) => { if (txt_(r[0]) === stary && txt_(r[9]) !== ZAK_ST.usuniete) poz.getRange(i + 2, 9, 1, 3).setNumberFormat(TEXT).setValues([[(txt_(r[8]) ? txt_(r[8]) + ' · ' : '') + 'przeniesione do ' + nowy, ZAK_ST.odrzucone, zm]]); });
        try { const fs = zakFolder_(stary, false); if (fs) { const fn = zakFolder_(nowy, true), it = fs.getFiles(); while (it.hasNext()) it.next().makeCopy(fn); } } catch (err) { Logger.log('zdjęcia przeniesienia: ' + err); }
        d.nowy = nowy; mapa[e.id] = nowy; odp.nr[e.id] = nowy;
        const zap = { kod, poz: pozycje, uwagi: txt_(d.uwagi), foto: (d.foto || []).slice(0, 30), z: stary, przez: txt_(e.kto) };
        zd.getRange(zd.getLastRow() + 1, 1, 1, 8).setNumberFormat(TEXT).setValues([[e.id + '-n', txt_(e.ts), txt_(r0[4]), tablet, nowy, 'zap', JSON.stringify(zap).slice(0, 45000), now]]);
      } else if (e.typ === 'zap_edyc') {   // edycja zgłoszenia – tylko rola biuro (od 1.49.0)
        if (rola !== 'biuro') { odp.accepted.push(e.id); return; }
        const nr = mapa[txt_(d.zid)] || txt_(d.zid); if (!/^Z-\d{5}-/.test(nr)) return;
        const kod = txt_(d.kod) && aktywne_().some(p => p.kod === txt_(d.kod)) ? txt_(d.kod) : '';
        zakEdyc_(poz, nr, d, kod, txt_(e.kto));
      } else {
        if (rola !== 'biuro' || !ZAK_ST[txt_(d.st)] || d.st === 'usuniete') { odp.accepted.push(e.id); return; }
        const nr = mapa[txt_(d.zid)] || txt_(d.zid); if (!/^Z-\d{5}-/.test(nr)) return;   // zgłoszenie jeszcze bez numeru – tablet ponowi
        zakStatus_(poz, nr, d, txt_(e.kto));
        if (d.st === 'dostarczone' || d.st === 'odrzucone') powDodaj_([{ t: 'zap', kod: (nr.match(/^Z-\d{5}-(.+)-\d{4}$/) || ['', ''])[1], tyt: 'Zapotrzebowanie ' + nr + ': ' + ZAK_ST[d.st] + (Array.isArray(d.lp) && d.lp.length ? ' (poz. ' + d.lp.join(', ') + ')' : ''), opis: d.st === 'odrzucone' ? txt_(d.powod).slice(0, 200) : '', kto: txt_(e.kto) }]);
      }
      zd.getRange(zd.getLastRow() + 1, 1, 1, 8).setNumberFormat(TEXT).setValues([[e.id, txt_(e.ts), c(e.kto).slice(0, 80), tablet, e.typ === 'zap' ? mapa[e.id] : e.typ === 'zap_przen' ? (mapa[txt_(d.zid)] || txt_(d.zid)) : (mapa[txt_(d.zid)] || txt_(d.zid)), e.typ, JSON.stringify(d).slice(0, 45000), now]]);
      have[e.id] = true; odp.accepted.push(e.id);
    });
    if (b.zdjecie && b.zdjecie.b64) odp.zdjecie = zakZdjecie_(b.zdjecie, mapa);
  } finally { lock.releaseLock(); }
  odp.lista = zakLista_(poz, zd);
  return odp;
}
function zakNastepny_(poz) {
  let m = 0; if (poz.getLastRow() > 1) poz.getRange(2, 1, poz.getLastRow() - 1, 1).getDisplayValues().forEach(r => { const x = txt_(r[0]).match(/^Z-(\d{5})-/); if (x) m = Math.max(m, Number(x[1])); });
  return m + 1;
}
function zakStatus_(poz, nr, d, kto) {
  if (poz.getLastRow() < 2) return;
  const v = poz.getRange(2, 1, poz.getLastRow() - 1, 11).getDisplayValues(), lp = Array.isArray(d.lp) && d.lp.length ? d.lp.map(Number) : null;
  const kiedy = kto + ' ' + Utilities.formatDate(new Date(), 'Europe/Warsaw', 'dd.MM HH:mm');
  v.forEach((r, i) => {
    if (txt_(r[0]) !== nr || (lp && lp.indexOf(Number(r[1])) < 0)) return;
    poz.getRange(i + 2, 10, 1, 2).setNumberFormat(TEXT).setValues([[ZAK_ST[d.st], kiedy]]);
    if (d.st === 'odrzucone' && txt_(d.powod)) poz.getRange(i + 2, 9).setNumberFormat(TEXT).setValue((txt_(r[8]) ? txt_(r[8]) + ' · ' : '') + 'odrzucono: ' + txt_(d.powod).replace(/^[=+@-]/, "'$&").slice(0, 300));
  });
}
function zakEdyc_(poz, nr, d, kod, kto) {
  if (poz.getLastRow() < 2) return;
  const v = poz.getRange(2, 1, poz.getLastRow() - 1, 11).getDisplayValues(), c = x => txt_(x).replace(/^[=+@-]/, "'$&");
  const kiedy = kto + ' ' + Utilities.formatDate(new Date(), 'Europe/Warsaw', 'dd.MM HH:mm'), wiersze = {};
  let maxLp = 0, r0 = null;
  v.forEach((r, i) => { if (txt_(r[0]) !== nr) return; wiersze[Number(r[1])] = { i, r }; maxLp = Math.max(maxLp, Number(r[1])); if (!r0) r0 = r; });
  if (!r0) return;
  const uwW = (x, lp) => [c(x.uw), lp === 1 && txt_(d.uwagi) ? 'całe zgłoszenie: ' + c(d.uwagi) : ''].filter(String).join(' · ').slice(0, 1000);
  (d.poz || []).slice(0, 50).forEach(x => {
    if (!x || !txt_(x.n)) return;
    const w = wiersze[Number(x.lp)];
    if (w) poz.getRange(w.i + 2, 6, 1, 4).setNumberFormat(TEXT).setValues([[c(x.n).slice(0, 200), c(x.il).slice(0, 20), c(x.j).slice(0, 10), uwW(x, Number(x.lp))]]);
    else { maxLp++; poz.getRange(poz.getLastRow() + 1, 1, 1, 11).setNumberFormat(TEXT).setValues([[nr, maxLp, kod || 'AKPiA', txt_(r0[3]), txt_(r0[4]), c(x.n).slice(0, 200), c(x.il).slice(0, 20), c(x.j).slice(0, 10), uwW(x, maxLp), ZAK_ST.nowe, kiedy]]); }
  });
  (d.usun || []).forEach(lp => { const w = wiersze[Number(lp)]; if (w) poz.getRange(w.i + 2, 10, 1, 2).setNumberFormat(TEXT).setValues([[ZAK_ST.usuniete, kiedy]]); });
  if (wiersze[1] && !(d.poz || []).some(x => Number(x.lp) === 1) && (d.usun || []).indexOf(1) < 0) poz.getRange(wiersze[1].i + 2, 9).setNumberFormat(TEXT).setValue(uwW({ uw: txt_(wiersze[1].r[8]).replace(/(^| · )całe zgłoszenie: .*$/, '') }, 1));
  Object.keys(wiersze).forEach(lp => poz.getRange(wiersze[lp].i + 2, 3).setNumberFormat(TEXT).setValue(kod || 'AKPiA'));
}
function zakFolder_(nr, utworz) {
  const k = konfig_(); if (!k.zakupy_zdjecia_id) throw new Error('Brak folderu zdjęć zakupów (Konfiguracja → zakupy_zdjecia_id)');
  const m = nr.match(/-(\d{2})\d{2}$/), rok = m ? '20' + m[1] : String(new Date().getFullYear());
  const r = sub_(DriveApp.getFolderById(k.zakupy_zdjecia_id), rok, utworz); return r ? sub_(r, nr, utworz) : null;
}
function zakZdjecie_(z, mapa) {
  const nr = mapa[txt_(z.zid)] || txt_(z.zid); if (!/^Z-\d{5}-/.test(nr)) return { ok: false };
  const name = txt_(z.fid).replace(/[^\w-]/g, '_').slice(0, 60) + '.jpg', f = zakFolder_(nr, true);
  if (!f.getFilesByName(name).hasNext()) f.createFile(Utilities.newBlob(Utilities.base64Decode(z.b64), 'image/jpeg', name));
  return { ok: true, fid: txt_(z.fid) };
}
function zakFoto_(o) {
  const f = zakFolder_(txt_(o.zid), false), it = f && f.getFilesByName(txt_(o.fid).replace(/[^\w-]/g, '_').slice(0, 60) + '.jpg');
  if (!it || !it.hasNext()) throw new Error('Zdjęcie nie jest jeszcze na Dysku.');
  const bl = it.next().getBlob(); return { ok: true, mime: 'image/jpeg', b64: Utilities.base64Encode(bl.getBytes()) };
}
/* lista dla tabletów: wszystkie trwające + 20 ostatnich zakończonych (wszystkie pozycje dostarczone / odrzucone) */
function zakLista_(poz, zd) {
  const m = {}, kl = {}; Object.keys(ZAK_ST).forEach(k => { kl[ZAK_ST[k]] = k; });
  if (poz.getLastRow() > 1) poz.getRange(2, 1, poz.getLastRow() - 1, 11).getDisplayValues().forEach(r => {
    const nr = txt_(r[0]); if (!nr) return;
    const z = m[nr] = m[nr] || { nr, kod: txt_(r[2]) === 'AKPiA' ? '' : txt_(r[2]), ts: txt_(r[3]).replace(' ', 'T'), kto: txt_(r[4]), uwagi: '', poz: [], foto: [] };
    z.poz.push({ lp: Number(r[1]), n: txt_(r[5]), il: txt_(r[6]), j: txt_(r[7]), st: kl[txt_(r[9])] || 'nowe', zm: txt_(r[10]), uw: txt_(r[8]).replace(/(^| · )całe zgłoszenie: .*$/, '') });
  });
  const STN = { nowe: 'Nowe', realizacja: 'W realizacji', dostarczone: 'Dostarczone', odrzucone: 'Odrzucone' };
  if (zd.getLastRow() > 1) zd.getRange(2, 1, zd.getLastRow() - 1, 7).getDisplayValues().forEach(r => {
    const z = m[txt_(r[4])]; if (!z) return;
    const d = safeJson_(r[6]), typ = txt_(r[5]), kto = txt_(r[2]), ts = txt_(r[1]);
    z.log = z.log || [];
    if (typ === 'zap') { z.foto = (d.foto || []).slice(0, 30); z.id = txt_(r[0]); z.uwagi = txt_(d.uwagi); (d.poz || []).forEach((x, i) => { const q = z.poz.find(y => y.lp === i + 1); if (q) q.foto = (x && x.foto) || []; }); z.log.push({ ts, kto: d.przez || kto, opis: d.z ? 'Utworzone z ' + d.z + ' – zmiana budowy (zgłaszający: ' + kto + ')' : 'Zgłoszenie: ' + (d.poz || []).length + ' poz.' }); }
    else if (typ === 'zap_przen') z.log.push({ ts, kto, opis: 'Zmiana budowy → ' + txt_(d.nowy) + ' – to zgłoszenie odrzucone' });
    else if (typ === 'zap_stat') z.log.push({ ts, kto, opis: 'Status: ' + (STN[d.st] || d.st) + (Array.isArray(d.lp) && d.lp.length ? ' (poz. ' + d.lp.join(', ') + ')' : ' (wszystkie)') + (txt_(d.powod) ? ' – ' + txt_(d.powod) : '') });
    else if (typ === 'zap_edyc') { z.uwagi = txt_(d.uwagi); (d.poz || []).forEach(x => { if (x && (x.foto || []).length) z.foto = z.foto.concat(x.foto).slice(0, 30); }); z.log.push({ ts, kto, opis: 'Edycja: ' + txt_(d.opis) }); }
  });
  Object.keys(m).forEach(k => { m[k].poz = m[k].poz.filter(x => x.st !== 'usuniete'); m[k].log = (m[k].log || []).slice(-30); });
  const all = Object.keys(m).map(k => m[k]).sort((a, b) => (a.nr < b.nr ? 1 : -1));
  const zamk = z => z.poz.every(x => x.st === 'dostarczone' || x.st === 'odrzucone');
  return all.filter(z => !zamk(z)).concat(all.filter(zamk).slice(0, 20));
}

/* Informacja o budowie z tabletu (od 1.44.0, rola biuro): Uwagi dla ekip (H), Kierownik (P), Telefon kierownika (Q) w Projekty */
function projektEdyc_(kod, e) {
  const d = e.d || {}, sh = baza_().getSheetByName('Projekty'), v = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues();
  for (let i = 1; i < v.length; i++) if (txt_(v[i][0]) === kod) {
    if (d.uwagi != null) sh.getRange(i + 1, 8).setNumberFormat(TEXT).setValue(txt_(d.uwagi).slice(0, 5000));
    if (d.kierownik != null) sh.getRange(i + 1, 16).setNumberFormat(TEXT).setValue(txt_(d.kierownik).slice(0, 80));
    if (d.telKier != null) sh.getRange(i + 1, 17).setNumberFormat(TEXT).setValue(txt_(d.telKier).slice(0, 40));
    if (Array.isArray(d.kontakty)) sh.getRange(i + 1, 18).setNumberFormat(TEXT).setValue(kontaktyDo_(d.kontakty));
    CACHE.remove('aktywne');
    return true;
  }
  return false;
}

/* Nowe urządzenie z tabletu (od 1.15.0) – tylko rola biuro. Serwer nadaje ID = prefiks + kolejny numer dla prefiksu
   i dopisuje wiersz na końcu zakładki Urządzenia (schemat bez zmian). Zwraca nadane ID albo '' (odrzucone). */
function urzNowe_(p, e, biuro) {
  const d = e.d || {};
  if (!biuro[txt_(e.kto)]) return '';
  const pre = txt_(d.prefix).toUpperCase();
  const typ = slowniki_().typy.find(t => t.prefix === pre);
  if (!/^[A-Z]{1,6}$/.test(pre) || !typ) return '';
  const sh = SpreadsheetApp.openById(p.lista).getSheetByName('Urządzenia');
  const ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().map(r => txt_(r[0])) : [];
  const us = SpreadsheetApp.openById(p.lista).getSheetByName('Usunięte');   // od 1.30.0: ID usuniętych nie wracają do puli
  if (us && us.getLastRow() > 1) us.getRange(2, 1, us.getLastRow() - 1, 1).getDisplayValues().forEach(r => ids.push(txt_(r[0])));
  const re = new RegExp('^' + pre + '(\\d+)$', 'i');
  let max = 0; ids.forEach(x => { const m = x.match(re); if (m) max = Math.max(max, Number(m[1])); });
  const id = pre + (max + 1);
  const xy = v => (v === '' || v == null || isNaN(Number(v))) ? '' : String(Math.min(1, Math.max(0, Number(v))));
  const etap = txt_(d.etap), etapy = p.etapy.map(x => x.id);
  sh.getRange(sh.getLastRow() + 1, 1, 1, 13).setNumberFormat(TEXT).setValues([[id, typ.nazwa, '', '', txt_(d.kond).slice(0, 40), txt_(d.arkusz).slice(0, 40),
    txt_(d.uwagi).slice(0, 500), xy(d.x), xy(d.y), '', 'czeka', etapy.indexOf(etap) >= 0 ? etap : '', txt_(d.oz).slice(0, 40)]]);
  return id;
}
/* Zmiany urządzeń z tabletu (od 1.30.0) w zakładce Urządzenia listy budowy:
   urz_poz – pozycja na rzucie (każdy): H, I (x, y) i F (arkusz); urz_sys – kolumna N „System” (rola biuro);
   urz_usun – wiersz przeniesiony do zakładki „Usunięte” z datą, autorem i powodem (rola biuro). Zwraca false = odrzucone. */
function zmianaUrz_(p, e, biuro) {
  const d = e.d || {}, id = txt_(e.urz); if (!id) return false;
  if (e.typ !== 'urz_poz' && !biuro[txt_(e.kto)]) return false;
  const ss = SpreadsheetApp.openById(p.lista), sh = ss.getSheetByName('Urządzenia');
  if (!sh || sh.getLastRow() < 2) return false;
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().map(r => txt_(r[0]));
  const i = ids.indexOf(id); if (i < 0) return false;
  const row = i + 2;
  if (e.typ === 'urz_poz') {
    const xy = v => (v === '' || v == null || isNaN(Number(v))) ? '' : String(Math.min(1, Math.max(0, Number(v))));
    if (xy(d.x) === '' || xy(d.y) === '') return false;
    sh.getRange(row, 8, 1, 2).setNumberFormat(TEXT).setValues([[xy(d.x), xy(d.y)]]);
    if (txt_(d.ark)) sh.getRange(row, 6).setNumberFormat(TEXT).setValue(txt_(d.ark).slice(0, 40));
    return true;
  }
  if (e.typ === 'urz_sys') { sh.getRange(row, 14).setNumberFormat(TEXT).setValue(txt_(d.sys).slice(0, 200)); return true; }
  if (e.typ === 'urz_edyc') {   // od 1.37.0 (rola biuro): Typ (C), Zasilanie (D), Uwagi (G), Oznaczenie proj. (M)
    const kol = { typ: [3, 120], zasilanie: [4, 60], uwagi: [7, 500], oz: [13, 40] }; let n = 0;
    Object.keys(kol).forEach(k => { if (d[k] == null) return; sh.getRange(row, kol[k][0]).setNumberFormat(TEXT).setValue(txt_(d[k]).slice(0, kol[k][1])); n++; });
    return n > 0;
  }
  if (e.typ === 'urz_usun') {
    const nc = Math.max(14, sh.getLastColumn());
    let us = ss.getSheetByName('Usunięte');
    if (!us) {
      us = ss.insertSheet('Usunięte');
      const nag = sh.getRange(1, 1, 1, nc).getDisplayValues()[0].concat(['Usunięto', 'Kto', 'Powód']);
      us.getRange(1, 1, 1, nag.length).setValues([nag]).setFontWeight('bold'); us.setFrozenRows(1);
    }
    const w = sh.getRange(row, 1, 1, nc).getDisplayValues()[0].concat([txt_(e.ts), txt_(e.kto), txt_(d.powod).slice(0, 300)]);
    us.getRange(us.getLastRow() + 1, 1, 1, w.length).setNumberFormat(TEXT).setValues([w]);
    sh.deleteRow(row);
    return true;
  }
  return false;
}
/* ID tymczasowe z tabletu → ID nadane przez serwer (ze zdarzeń urz_nowe w zakładce Zdarzenia) */
function mapaTmp_(sh) {
  const m = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 7).getDisplayValues().forEach(r => {
    if (txt_(r[5]) !== 'urz_nowe') return; const d = safeJson_(r[6]); if (d.tmp && txt_(r[4])) m[d.tmp] = txt_(r[4]);
  });
  return m;
}

function push_(b, tablet, dost) {
  const p = projekt_(String(b.kod || ''));
  if (dost && dost.budowy) {   // podwykonawca: wpisy tylko jako konto podwykonawcy tej firmy, bez zmian biura
    const konta = {}; rowsT_(baza_().getSheetByName('Pracownicy')).forEach(r => { if (txt_(r[2]) === 'podwykonawca' && txt_(r[1]) === dost.ekipa && tak_(r[4])) konta[txt_(r[0])] = true; });
    (b.events || []).forEach(e => { if (e && (!konta[txt_(e.kto)] || ['urz_nowe', 'urz_poz', 'urz_sys', 'urz_usun', 'urz_edyc', 'pinezka', 'projekt_edyc'].indexOf(e.typ) >= 0)) { e.pomin = true; } });
  }
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  let numery = {}, nowe = {};
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
      const usuniete = [], zdjeciaDoKosza = [], zapisane = [];
      let biuro = null, autorzy = null, autorzyBrakow = null;
      // nowe urządzenia (od 1.15.0): najpierw nadanie ID, potem zamiana ID tymczasowych w pozostałych zdarzeniach
      let mapa = null;
      const maTmp = evs.some(e => /~/.test(txt_(e.urz)) || e.typ === 'urz_nowe');
      if (maTmp) {
        mapa = mapaTmp_(sh);
        evs.filter(e => e.typ === 'urz_nowe' && !have[e.id] && !e.pomin).forEach(e => {
          if (biuro === null) biuro = rolaBiuro_();
          const tmp = txt_(e.d && e.d.tmp), id = urzNowe_(p, e, biuro);
          if (id) { mapa[tmp] = id; e.urz = id; } else e.odrzuc = true;
        });
        const tmpy = Object.keys(mapa);
        evs.forEach(e => {
          if (e.typ === 'urz_nowe') return;
          if (mapa[txt_(e.urz)]) e.urz = mapa[txt_(e.urz)];
          if (tmpy.length && e.d) { let js = JSON.stringify(e.d); tmpy.forEach(t => { js = js.split(t).join(mapa[t]); }); e.d = JSON.parse(js); }
        });
        nowe = {}; evs.forEach(e => { const t = txt_(e.d && e.d.tmp); if (e.typ === 'urz_nowe' && mapa[t]) nowe[t] = mapa[t]; });
        Object.keys(mapa).forEach(t => { if (evs.some(e => JSON.stringify(e).indexOf(t) >= 0)) nowe[t] = mapa[t]; });
      }
      evs.forEach(e => {
        if (e.odrzuc) return;   // nowe urządzenie od osoby spoza roli biuro / z nieznanym typem
        accepted.push(e.id);
        if (have[e.id] || e.pomin) return;   // pomin: wpis spoza uprawnień podwykonawcy – przyjęty (tablet go nie ponawia), niezapisany
        if (e.typ === 'protokol' && e.d && e.d.stan === 'usuniety') {
          // pracownik usuwa tylko szkic bez numeru; protokół z numerem – tylko rola biuro (od 1.6.1)
          if (biuro === null) biuro = rolaBiuro_();
          if (numery[e.d.pid] && !biuro[txt_(e.kto)]) return;
          usuniete.push(e.d.pid);
        }
        if (e.typ === 'notatka_edyc' && e.d && (e.d.usun || e.d.przywroc)) {   // kosz / przywrócenie notatki – tylko rola biuro (od 1.34.0); edycja tekstu – każdy (od 1.42.0)
          if (biuro === null) biuro = rolaBiuro_();
          if (!biuro[txt_(e.kto)]) return;
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
        if (e.typ === 'projekt_edyc') {   // od 1.44.0: notatka o budowie i kierownik – tylko rola biuro
          if (biuro === null) biuro = rolaBiuro_();
          if (!biuro[txt_(e.kto)] || !projektEdyc_(p.kod, e)) return;
        }
        if (e.typ === 'urz_poz' || e.typ === 'urz_sys' || e.typ === 'urz_usun' || e.typ === 'urz_edyc') {
          if (biuro === null) biuro = rolaBiuro_();
          if (!zmianaUrz_(p, e, biuro)) return;
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
        zapisane.push(e);
        rows.push([e.id, txt_(e.ts), txt_(e.kto).slice(0, 80), tablet, txt_(e.urz).slice(0, 20), e.typ, JSON.stringify(e.d || {}).slice(0, 45000), now]);
        if (e.urz) touched[e.urz] = true;
      });
      if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 8).setNumberFormat(TEXT).setValues(rows);
      zapiszLicznik_(p.kod, sh.getLastRow() - 1);
      przelicz_(p, Object.keys(touched), rows.length);
      if (usuniete.length) koszWord_(p, usuniete);
      if (zdjeciaDoKosza.length) zdjeciaDoKosza.forEach(fid => { const f = plikZdjecia_(p, fid); if (f) f.setTrashed(true); });
      if (zapisane.length) powZPush_(p, zapisane, numery);   // od 1.56.0: powiadomienia dla biura
    }
    return { ok: true, accepted: accepted, numery: numery, nowe: nowe };
  } finally { lock.releaseLock(); }
}

/* Status i nr seryjny w zakładce Urządzenia – liczone ze Zdarzeń (fundamenty 2.3). */
function przelicz_(p, ids, zmiany) {
  if (!ids.length && !zmiany) return;
  const ss = SpreadsheetApp.openById(p.lista);
  const ev = rowsT_(zdarzeniaSheet_(p)).map(r => ({ id: txt_(r[0]), ts: txt_(r[1]), kto: txt_(r[2]), urz: txt_(r[4]), typ: txt_(r[5]), d: safeJson_(r[6]) }))
    .sort((a, b) => a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0);
  zapiszLicznik_(p.kod, ev.length);   // od 1.43.0: liczba zdarzeń także z przeliczania – wpisy dopisane poza tabletem (np. naprawy) trafiają na tablety
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
    const status = open ? 'brak' : (done === kroki.length && kroki.length ? 'gotowe' : done || sn ? 'w toku' : 'czeka');   // od 1.30.0: nr seryjny = w toku
    sh.getRange(i + 2, 10, 1, 2).setNumberFormat(TEXT).setValues([[sn, status]]);
    v[i][9] = sn; v[i][10] = status;
  });
  zapiszPostep_(p.kod, v.filter(r => txt_(r[0])).map(r => txt_(r[10])));
  // liczniki budowy do listy budów (od 1.23.0): uruchomione (wszystkie kroki) / podłączone (kroki „podłącz…”) / rozpoczęte (≥1 krok) / wszystkie + otwarte braki
  const stAll = {};
  ev.forEach(e => { if (e.typ === 'krok' && e.urz) { if (!stAll[e.urz]) stAll[e.urz] = {}; stAll[e.urz][e.d.krok] = !!e.d.wart; } });
  const L = { u: 0, p: 0, d: 0, w: 0, f: 0, r: 0, b: Object.keys(braki).filter(b => braki[b].open).length,
    nt: 0 };   // od 1.33.0: notatki (od 1.34.0 bez notatek w koszu)
  const wKoszu = {}; ev.forEach(e => { if (e.typ === 'notatka_edyc' && e.d.nid) { if (e.d.usun) wKoszu[e.d.nid] = true; else if (e.d.przywroc) delete wKoszu[e.d.nid]; } });
  L.nt = ev.filter(e => e.typ === 'notatka' && !wKoszu[e.id]).length;
  // „Otworzył się front” (od 1.33.0): brak usunięty → TAK; czynność na urządzeniu (krok, nr seryjny) albo nowy brak → kasuje;
  // urządzenie z innym otwartym brakiem – bez flagi
  const front = {}, bUrz = {};
  ev.forEach(e => {
    if (e.typ === 'brak' && e.urz) { bUrz[e.id] = e.urz; front[e.urz] = false; }
    else if ((e.typ === 'krok' || e.typ === 'nr') && e.urz) front[e.urz] = false;
    else if (e.typ === 'brak_zamk' && bUrz[e.d.bid]) front[bUrz[e.d.bid]] = true;
  });
  Object.keys(braki).forEach(b => { if (braki[b].open && braki[b].urz) front[braki[b].urz] = false; });
  const kolF = 15;   // kolumna O w zakładce Urządzenia
  if (txt_(sh.getRange(1, kolF).getValue()) !== 'Otworzył się front') sh.getRange(1, kolF).setValue('Otworzył się front');
  // „do rozpoczęcia” (od 1.38.0): urządzenia, na których nic nie wpisano – bez kroku, nr seryjnego, zdjęcia, braku, notatki, protokołu
  const wpis = {}, fotoU = {}, fotoDel = {}, protU = {}, protDel = {};
  ev.forEach(e => {
    if (e.typ === 'foto_usun' && e.d.fid) fotoDel[e.d.fid] = true;
    if (e.typ === 'foto' && e.urz && e.d.fid) fotoU[e.d.fid] = e.urz;
    if (e.typ === 'protokol' && e.d.pid) { if (e.d.stan === 'usuniety') protDel[e.d.pid] = true; else if (e.urz) protU[e.d.pid] = e.urz; }
    if (e.typ === 'brak' && e.urz) wpis[e.urz] = true;
    if (e.typ === 'notatka' && e.urz && !wKoszu[e.id]) wpis[e.urz] = true;
  });
  Object.keys(fotoU).forEach(f => { if (!fotoDel[f]) wpis[fotoU[f]] = true; });
  Object.keys(protU).forEach(x => { if (!protDel[x]) wpis[protU[x]] = true; });
  const fv = v.map(r => [txt_(r[0]) && front[txt_(r[0])] ? 'TAK' : '']);
  if (fv.length) sh.getRange(2, kolF, fv.length, 1).setValues(fv);
  v.forEach(r => {
    const id = txt_(r[0]); if (!id) return;
    const kroki = (typy[(id.match(/^[A-Za-z]+/) || [''])[0].toUpperCase()] || { kroki: ['Podłączony'] }).kroki;
    const st = stAll[id] || {};
    const zrob = kroki.map((k, j) => !!st[j]);
    const pk = kroki.map((k, j) => /podłącz/i.test(k) ? j : -1).filter(j => j >= 0);
    L.w++;
    if (front[id]) L.f++;
    if (!wpis[id] && !txt_(r[9]) && !zrob.some(Boolean)) L.r++;
    if (zrob.some(Boolean) || txt_(r[9])) L.d++;   // od 1.30.0: nr seryjny = rozpoczęte
    if (pk.length ? pk.every(j => zrob[j]) : zrob[0]) L.p++;
    if (kroki.length && zrob.every(Boolean)) L.u++;
  });
  // ostatnia zmiana (od 1.24.0): czas i autor ostatniego wpisu + liczba wpisów tego dnia – ekran „Ostatnie zmiany”
  if (ev.length) {
    const last = ev[ev.length - 1], dz = ts => { try { return Utilities.formatDate(new Date(ts), 'Europe/Warsaw', 'yyyy-MM-dd'); } catch (e) { return ''; } };
    const d0 = dz(last.ts); L.t = last.ts; L.k = last.kto; L.n = 0;
    for (let i = ev.length - 1; i >= 0 && dz(ev[i].ts) === d0; i--) L.n++;   // od końca – tylko wpisy z dnia ostatniej zmiany
  }
  zapiszLicz_(p.kod, L);
}

/* Uzupełnienie liczników (od 1.25.1): budowy, które nie mają jeszcze licz (brak wpisów od wdrożenia 1.23.0).
   Uruchamiane raz dziennie z `codziennie` (od 1.55.0, max 50 budów) albo ręcznie: przeliczLiczniki() – wszystkie aktywne od nowa. */
function uzupelnijLicz_(max) {
  const m = safeJson_(P.getProperty('LICZ') || '{}'); let n = 0;
  aktywne_().forEach(p => {
    if (n >= max || !p.lista || (m[p.kod] && m[p.kod].w != null)) return;
    try { przelicz_(p, [], true); } catch (e) { }
    n++;
  });
  return n;
}
function przeliczLiczniki() {
  P.deleteProperty('LICZ');
  const n = uzupelnijLicz_(1000);
  Logger.log('Przeliczono liczniki: ' + n + ' budów');
}

function zapiszLicz_(kod, L) {
  try { const m = safeJson_(P.getProperty('LICZ') || '{}'); m[kod] = L; P.setProperty('LICZ', JSON.stringify(m)); } catch (e) { }
  zapiszLiczBaza_(kod, L);
}
/* Zakładka „Liczniki” w Bazie (od 1.36.0, schemat 1.11): kopia liczników budowy do odczytu (poranne zadanie Claude → ClickUp, etap „Status”).
   Jeden wiersz na budowę; zakładkę i nagłówek zakłada skrypt. Nie edytować ręcznie. */
const LICZ_NAGL = ['Kod', 'Wszystkie', 'Rozpoczęte', 'Podłączone', 'Uruchomione', 'Do rozpoczęcia', 'Otworzył się front', 'Otwarte braki', 'Notatki', 'Ostatni wpis', 'Autor ostatniego wpisu', 'Aktualizacja'];
function zapiszLiczBaza_(kod, L) {
  try {
    const b = baza_(); let sh = b.getSheetByName('Liczniki');
    if (!sh) { sh = b.insertSheet('Liczniki'); sh.getRange(1, 1, 1, LICZ_NAGL.length).setValues([LICZ_NAGL]).setFontWeight('bold'); sh.setFrozenRows(1); }
    const fmt = ts => { try { return ts ? Utilities.formatDate(new Date(ts), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm') : ''; } catch (e) { return ''; } };
    const w = [kod, L.w || 0, L.d || 0, L.p || 0, L.u || 0, L.r != null ? L.r : (L.w || 0) - (L.d || 0), L.f || 0, L.b || 0, L.nt || 0, fmt(L.t), L.k || '', fmt(new Date().toISOString())];
    const n = sh.getLastRow(), kody = n > 1 ? sh.getRange(2, 1, n - 1, 1).getDisplayValues().map(r => r[0]) : [];
    const i = kody.indexOf(kod), r = i >= 0 ? i + 2 : n + 1;
    sh.getRange(r, 1, 1, 1).setNumberFormat('@'); sh.getRange(r, 1, 1, w.length).setValues([w]);
  } catch (e) { }
}

function zapiszLicznik_(kod, n) {
  try { const m = safeJson_(P.getProperty('ZDARZENIA') || '{}'); if (m[kod] === n) return; m[kod] = n; P.setProperty('ZDARZENIA', JSON.stringify(m)); } catch (e) { }
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

/* ===================== Kopie zapasowe (_Archiwum) =====================
 * Poniedziałek ok. 5:00 (wyzwalacz z „instalacja”):
 * 1) kopia Bazy projektów i list urządzeń wszystkich budów: `rrrr-mm-dd <nazwa>` w _Archiwum;
 * 2) od 1.39.0 porządki: kopie starsze niż ARCH_TYGODNIE do kosza, ale z każdego pliku zawsze zostaje najnowsza kopia;
 * 3) od 1.39.0 kopia różnicowa folderów aktywnych budów (Zdjęcia, Protokoły, Notatki budowy i inne pliki poza „Do wglądu”
 *    i arkuszami) do _Archiwum/Foldery budów/<folder budowy>/… – kopiowane tylko pliki nowe lub zmienione od ostatniej kopii;
 *    pliku usuniętego na Dysku kopia nie kasuje. Gdy nie zdąży w limicie czasu skryptu – dokańcza sama kilka minut później. */
const ARCH_TYGODNIE = 12;
const ARCH_PROG_WOLNE = 0.20;   // od 1.40.0: przy wolnym miejscu na Dysku poniżej 20% – porządki bez czekania na 12 tygodni
/* Wolne miejsce na Dysku konta ELWIS (część 0–1) – null, gdy konto bez limitu */
function wolneMiejsce_() {
  try { const lim = DriveApp.getStorageLimit(), uz = DriveApp.getStorageUsed(); return lim > 0 ? Math.max(0, 1 - uz / lim) : null; } catch (e) { return null; }
}
/* Codzienna kontrola miejsca (od 1.40.0) – od 1.55.0 wywoływana z zadania dziennego `codziennie`, działa raz na dzień.
   Mało miejsca → porządki archiwum w trybie pilnym: stare kopie usuwane trwale (kosz też zajmuje miejsce). */
function kontrolaMiejsca_() {
  const dzis = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd');
  if (P.getProperty('MIEJSCE_DZIEN') === dzis) return;
  P.setProperty('MIEJSCE_DZIEN', dzis);
  const w = wolneMiejsce_(); if (w == null) return;
  P.setProperty('MIEJSCE_WOLNE', String(Math.round(w * 100)));
  if (w < ARCH_PROG_WOLNE) try { porzadkiArchiwum_(DriveApp.getFolderById(konfig_().folder_archiwum_id), true); } catch (e) { Logger.log('kontrola miejsca: ' + e); }
}
/* Trwałe usunięcie pliku (z pominięciem kosza) – Drive API, uprawnienia jak DriveApp */
function usunTrwale_(f) {
  const r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + f.getId(), { method: 'delete', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (r.getResponseCode() >= 300) f.setTrashed(true);
}
function archiwizuj() {
  const k = konfig_();
  const arch = DriveApp.getFolderById(k.folder_archiwum_id);
  const day = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd');
  const kopia = id => { const f = DriveApp.getFileById(id); f.makeCopy(day + ' ' + f.getName(), arch); };
  kopia(P.getProperty('BAZA_ID'));
  rowsT_(baza_().getSheetByName('Projekty')).forEach(r => { const id = idFromUrl_(r[10]); if (id) try { kopia(id); } catch (e) { Logger.log(e); } });
  if (k.zakupy_arkusz_id) try { kopia(k.zakupy_arkusz_id); } catch (e) { Logger.log(e); }   // od 1.48.0: arkusz zapotrzebowań
  try { const w = wolneMiejsce_(); porzadkiArchiwum_(arch, w != null && w < ARCH_PROG_WOLNE); } catch (e) { Logger.log('porządki: ' + e); }
  P.setProperty('ARCH_FOLD_START', String(Date.now()));   // początek nowej kopii folderów
  archiwizujFoldery();
}
/* Kopie `rrrr-mm-dd nazwa` starsze niż ARCH_TYGODNIE → kosz Dysku; najnowsza kopia każdej nazwy zostaje zawsze.
   Tryb pilny (mało miejsca): wszystkie kopie poza najnowszą usuwane trwale, bez względu na wiek. */
function porzadkiArchiwum_(arch, pilnie) {
  const granica = pilnie ? Infinity : Date.now() - ARCH_TYGODNIE * 7 * 864e5, grupy = {};
  const it = arch.getFiles();
  while (it.hasNext()) {
    const f = it.next(), m = f.getName().match(/^(\d{4}-\d{2}-\d{2}) (.+)$/); if (!m) continue;
    (grupy[m[2]] = grupy[m[2]] || []).push({ f, d: m[1] });
  }
  let n = 0;
  Object.keys(grupy).forEach(nm => {
    const g = grupy[nm].sort((a, b) => a.d < b.d ? 1 : -1);
    g.slice(1).forEach(x => { if (new Date(x.d + 'T12:00:00').getTime() < granica) { if (pilnie) usunTrwale_(x.f); else x.f.setTrashed(true); n++; } });
  });
  Logger.log('Porządki archiwum' + (pilnie ? ' (mało miejsca – usunięte trwale)' : ' – do kosza') + ': ' + n + ' starych kopii (najnowsza każdej zostaje).');
}
/* Kopia różnicowa folderów aktywnych budów. Wznawiana wyzwalaczem jednorazowym, gdy nie zmieści się w czasie. */
function archiwizujFoldery() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'archiwizujFoldery').forEach(t => ScriptApp.deleteTrigger(t));
  const w0 = wolneMiejsce_();
  if (w0 != null && w0 < 0.05) { Logger.log('Kopia folderów pominięta: na Dysku zostało ' + Math.round(w0 * 100) + '% miejsca.'); return; }
  const t0 = Date.now(), LIMIT = 4.5 * 60 * 1000;
  const od = Number(P.getProperty('ARCH_FOLD_OD') || 0);          // pliki zmienione po tym czasie (koniec poprzedniej pełnej kopii)
  const start = Number(P.getProperty('ARCH_FOLD_START') || Date.now());
  const k = konfig_(), arch = DriveApp.getFolderById(k.folder_archiwum_id);
  const pod = (par, nm) => { const it = par.getFoldersByName(nm); return it.hasNext() ? it.next() : par.createFolder(nm); };
  const korzen = pod(arch, 'Foldery budów');
  let skop = 0, brakCzasu = false;
  const kopiujFolder = (src, dst) => {
    const fs = src.getFiles();
    while (fs.hasNext()) {
      if (Date.now() - t0 > LIMIT) { brakCzasu = true; return; }
      const f = fs.next();
      if (f.getMimeType() === MimeType.GOOGLE_SHEETS) continue;          // listy urządzeń – kopia tygodniowa wyżej
      const zm = f.getLastUpdated().getTime(); if (zm <= od) continue;
      const ist = dst.getFilesByName(f.getName()); let swieza = false;
      while (ist.hasNext()) { const a = ist.next(); if (a.getLastUpdated().getTime() >= zm) swieza = true; else a.setTrashed(true); }
      if (swieza) continue;
      try { f.makeCopy(f.getName(), dst); skop++; } catch (e) { Logger.log(f.getName() + ': ' + e); }
    }
    const ds = src.getFolders();
    while (ds.hasNext() && !brakCzasu) { const d = ds.next(); if (d.getName() === 'Do wglądu') continue; kopiujFolder(d, pod(dst, d.getName())); }
  };
  rowsT_(baza_().getSheetByName('Projekty')).forEach(r => {
    if (brakCzasu || txt_(r[5]).toLowerCase() !== 'tak') return;
    const id = idFromUrl_(r[8]); if (!id) return;
    try { const src = DriveApp.getFolderById(id); kopiujFolder(src, pod(korzen, src.getName())); } catch (e) { Logger.log(r[0] + ': ' + e); }
  });
  if (brakCzasu) {
    ScriptApp.newTrigger('archiwizujFoldery').timeBased().after(5 * 60 * 1000).create();
    Logger.log('Kopia folderów: skopiowano ' + skop + ', dokończenie za 5 min.');
  } else {
    P.setProperty('ARCH_FOLD_OD', String(start));
    Logger.log('Kopia folderów zakończona: skopiowano ' + skop + ' plików.');
  }
}

/* ===================== Priorytety budów i wydajność ekip (od 1.17.0) =====================
 * Silnik reguł – tylko odczyt: zadania list ClickUp aktywnych budów + zakładki Urządzenia / Zdarzenia.
 * Wynik w pamięci skryptu (właściwości PRIO_n), liczony wyzwalaczem co godzinę (instalacjaPriorytetow) albo na żądanie roli biuro.
 * Ustawienia w Bazie → Konfiguracja (schemat 1.8): `normy_min` („H:30; SZ:480”), `progi` („koniec_pilne:14; …”), `analiza_claude`. */
const NORMY_DOM = { H: 30, R: 45, P: 20, S: 60, W: 60, O: 90, N: 90, SZN: 360, SZ: 480, SP: 240, CO: 360, C: 480, K: 30, Z: 45, DC: 20, DL: 20, DT: 30, I: 30 };
const PROGI_DOM = { koniec_pilne: 14, koniec_uwaga: 30, start: 7, dostawa: 14, uruch_dni: 2, zamkn_dni: 1, czas_wydluzenie: 20, terminowosc: 80 };
function pary_(s, dom) {
  const o = Object.assign({}, dom);
  txt_(s).split(';').forEach(x => { const i = x.indexOf(':'); if (i < 0) return; const k = x.slice(0, i).trim(), v = Number(x.slice(i + 1).trim().replace(',', '.')); if (k && !isNaN(v)) o[k] = v; });
  return o;
}
/* Od 1.55.0 ekran „Priorytety” wycofany (decyzja 20.11.2026): bez przeliczania co godzinę – oszczędność dziennego limitu czasu wyzwalaczy.
   Wydajność ekip liczona tylko na żądanie (przycisk „Przelicz” w aplikacji). Czynności, które szły przy okazji przeliczania
   (brakujące liczniki budów, kontrola miejsca na Dysku), robi zadanie dzienne `codziennie` (ok. 4:00). */
function instalacjaPriorytetow() { migracjaWyzwalaczy_(true); Logger.log('OK. Przeliczanie co godzinę wyłączone, zadanie dzienne `codziennie` włączone.'); }
function migracjaWyzwalaczy_(wymus) {
  if (!wymus && P.getProperty('WYZW_155') === '1') return;
  const tr = ScriptApp.getProjectTriggers();
  tr.filter(t => t.getHandlerFunction() === 'przeliczPriorytety').forEach(t => ScriptApp.deleteTrigger(t));
  if (!tr.some(t => t.getHandlerFunction() === 'codziennie')) ScriptApp.newTrigger('codziennie').timeBased().everyDays(1).atHour(4).create();
  P.setProperty('WYZW_155', '1');
}
function codziennie() {
  try { uzupelnijLicz_(50); } catch (e) { Logger.log('liczniki: ' + e); }
  try { kontrolaMiejsca_(); } catch (e) { Logger.log('miejsce: ' + e); }
  try { obciazenieZapisz_(); } catch (e) { Logger.log('obciążenie: ' + e); }   // od 1.56.0
  try { powPorzadki_(); } catch (e) { Logger.log('powiadomienia: ' + e); }
}
const DZIEN = 864e5;
function dzien_(t) { return Utilities.formatDate(new Date(t), 'Europe/Warsaw', 'yyyy-MM-dd'); }
function rob_(d) { const w = new Date(d).getUTCDay(); return w !== 0 && w !== 6; }
/** dni robocze od a do b (b > a → dodatnie) */
function dniRob_(a, b) {
  const s = a < b ? 1 : -1; let n = 0;
  for (let t = Math.min(a, b) + DZIEN; t <= Math.max(a, b); t += DZIEN) if (rob_(t)) n++;
  return s * n;
}
function minusRob_(t, n) { while (n > 0) { t -= DZIEN; if (rob_(t)) n--; } return t; }
function poniedzialek_(ts) { const d = new Date(String(ts).slice(0, 10) + 'T12:00:00Z'); const w = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - w * DZIEN).toISOString().slice(0, 10); }
function pref_(id) { return (String(id).match(/^[A-Za-z]+/) || [''])[0].toUpperCase(); }

/* Zadania wszystkich przestrzeni projektowych ClickUp (nazwa zaczyna się od „PROJ”), od 1.19.0 – tylko odczyt:
   otwarte zadania + zamknięte w ostatnich 12 tygodniach (terminowość). Lista bez otwartych zadań nie trafia do wyniku. */
function zadaniaWszystkie_() {
  const token = P.getProperty('CLICKUP_TOKEN'); if (!token) return { ok: false, listy: {} };
  const H = { headers: { Authorization: token }, muteHttpExceptions: true };
  const get = u => { const r = UrlFetchApp.fetch('https://api.clickup.com/api/v2/' + u, H); if (r.getResponseCode() === 429) { Utilities.sleep(20000); return get(u); } if (r.getResponseCode() !== 200) throw new Error('ClickUp ' + r.getResponseCode()); return JSON.parse(r.getContentText()); };
  try {
    let team = P.getProperty('CLICKUP_TEAM');
    if (!team) { team = String(get('team').teams[0].id); P.setProperty('CLICKUP_TEAM', team); }
    const prz = (get('team/' + team + '/space?archived=false').spaces || []).filter(x => /^\s*PROJ/i.test(x.name)).map(x => x.id);
    if (!prz.length) return { ok: true, listy: {}, team: team };
    const sp = prz.map(i => 'space_ids[]=' + encodeURIComponent(i)).join('&'), listy = {}, seen = {};
    const zbierz = extra => {
      for (let pg = 0; pg < 60; pg++) {
        const d = get('team/' + team + '/task?subtasks=true&page=' + pg + '&' + sp + extra);
        (d.tasks || []).forEach(t => { if (seen[t.id] || !t.list) return; seen[t.id] = 1; const l = listy[t.list.id] = listy[t.list.id] || { nazwa: t.list.name, zad: [], otw: 0 }; l.zad.push(t); if (!(t.status && /closed|done/.test(t.status.type))) l.otw++; });
        if (d.last_page || !(d.tasks || []).length) break;
      }
    };
    zbierz('&include_closed=false');
    zbierz('&include_closed=true&date_done_gt=' + (Date.now() - 12 * 7 * DZIEN));
    return { ok: true, listy: listy, team: team };
  } catch (e) { return { ok: false, listy: {}, blad: String(e.message || e) }; }
}

function przeliczPriorytety() {
  const start = Date.now(), k = konfig_();
  const normy = pary_(k.normy_min, NORMY_DOM), progi = pary_(k.progi, PROGI_DOM);
  const cu = zadaniaWszystkie_();
  // budowy z Bazy: aktywne (pełne dane z ELWIS) oraz nieaktywne z ID listy ClickUp (od 1.20.0 – wpisane do Bazy przed uruchomieniem skilla „nowa budowa”; oceniane z zadań)
  const akt = {}; aktywne_().forEach(p => { akt[p.kod] = p; });
  const projekty = [], wBazie = {};
  rowsT_(baza_().getSheetByName('Projekty')).forEach(r => {
    const kod = txt_(r[0]), cuId = txt_(r[9]); if (!kod && !cuId) return;
    const a = tak_(r[5]) && akt[kod];
    if (!a && !cuId) return;
    if (cuId) wBazie[cuId] = 1;
    projekty.push(a ? Object.assign({}, a) : { kod: kod, nazwa: txt_(r[1]), listaCU: cuId, lista: idFromUrl_(r[10]), zakres: [], tylkoCU: true });
  });
  // budowy tylko z ClickUp (od 1.19.0): listy przestrzeni PROJ spoza Bazy, które mają choć jedno otwarte zadanie
  Object.keys(cu.listy).forEach(id => {
    const l = cu.listy[id]; if (wBazie[id] || !l.otw) return;
    const m = txt_(l.nazwa).match(/^(\d{2}[_p]\d{3})\s*(.*)$/i);
    projekty.push({ kod: m ? m[1] : '', nazwa: m ? m[2] : txt_(l.nazwa), listaCU: id, zakres: [], tylkoCU: true });
  });
  const typy = {}; slowniki_().typy.forEach(t => { typy[t.prefix] = t; });
  const prac = rowsT_(baza_().getSheetByName('Pracownicy')).filter(r => txt_(r[0]));
  const ekipaOs = {}, ekipaCu = {};
  const nazwaEk = v => txt_(v).replace(/\s*\(.*\)\s*/g, '').replace(/^ekipa\s*/i, '').trim();   // „Ekipa 1 (lider)” → „1”
  prac.forEach(r => { const ek = nazwaEk(r[1]); if (txt_(r[2]) === 'biuro' || !ek || /biuro/i.test(ek)) return; ekipaOs[txt_(r[0])] = ek; if (txt_(r[5])) ekipaCu[txt_(r[5])] = ek; });
  const dzis = Date.now(), dzisD = dzien_(dzis);
  const W = { tyg: {}, typ: {} };   // wydajność: tydzień → ekipa → liczniki; ekipa → typ → [norma, czas, n]
  const w_ = (tydz, ek) => { const t = W.tyg[tydz] = W.tyg[tydz] || {}; return t[ek] = t[ek] || { nm: 0, dni: {}, k: [0, 0], prz: 0, t: [0, 0] }; };
  const granica = poniedzialek_(new Date(dzis - 12 * 7 * DZIEN).toISOString());
  const wynik = []; let pominiete = 0;
  const data_ = t => { const d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2); };

  projekty.forEach(p => {
    if (Date.now() - start > 4.5 * 60000) { pominiete++; return; }
    if (p.tylkoCU && cu.ok && !(cu.listy[p.listaCU] || {}).otw) return;   // poza ELWIS i wszystkie zadania zakończone – pomijamy
    const pow = []; const dodaj = (poz, txt, url, kiedy) => pow.push({ poz: poz, txt: String(txt).slice(0, 160), url: url || '', kiedy: kiedy || 0 });
    /* --- Baza: urządzenia i zdarzenia --- */
    let wszystkie = 0, gotowe = 0, zostaloMin = 0, zostaloSzt = 0, tempo = 0, protGot = 0, maZdarzenia = false;
    if (p.lista) try {
      const ss = SpreadsheetApp.openById(p.lista), shU = ss.getSheetByName('Urządzenia');
      const urz = shU && shU.getLastRow() > 1 ? shU.getRange(2, 1, shU.getLastRow() - 1, 11).getDisplayValues().filter(r => txt_(r[0])) : [];
      const stat = {}; urz.forEach(r => {
        const id = txt_(r[0]), s = txt_(r[10]); stat[id] = s; wszystkie++;
        if (s === 'gotowe') { gotowe++; return; }
        zostaloSzt++; zostaloMin += (normy[pref_(id)] || 30) * (s === 'w toku' ? 0.5 : 1);
      });
      const shZ = ss.getSheetByName('Zdarzenia');
      const ev = shZ && shZ.getLastRow() > 1 ? shZ.getRange(2, 1, shZ.getLastRow() - 1, 7).getDisplayValues()
        .map(r => ({ id: txt_(r[0]), ts: txt_(r[1]), kto: txt_(r[2]), urz: txt_(r[4]), typ: txt_(r[5]), d: safeJson_(r[6]) })).sort((a, b) => a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0) : [];
      maZdarzenia = ev.length > 0;
      const braki = {}, ost = {}, sn = {}, prot = {};
      ev.forEach(e => {
        const ek = ekipaOs[e.kto], d = e.ts.slice(0, 10), tydz = d >= granica ? poniedzialek_(e.ts) : '';
        if (ek && tydz) w_(tydz, ek).dni[d] = 1;
        if (e.typ === 'brak') { braki[e.id] = { open: true, blok: !!e.d.blokuje, ts: e.ts }; if (ek && tydz && e.d.blokuje) w_(tydz, ek).prz++; }
        if (e.typ === 'brak_zamk' && braki[e.d.bid]) braki[e.d.bid].open = false;
        if (e.typ === 'brak_edyc' && braki[e.d.bid]) { if (e.d.usun) delete braki[e.d.bid]; else if (e.d.otworz) braki[e.d.bid].open = true; }
        if (e.typ === 'krok' && e.d.wart) ost[e.urz] = e;
        if (e.typ === 'nr' && e.d.sn) sn[e.urz] = true;
        if (e.typ === 'protokol' && e.d.pid) prot[e.d.pid] = e.d.stan;
      });
      protGot = Object.keys(prot).filter(x => prot[x] === 'gotowy' || prot[x] === 'zablokowany').length;
      const okno = new Date(dzis - 14 * DZIEN).toISOString(); let wOknie = 0;
      const dzienEkipy = {};   // ekipa|dzień → [prefiksy ukończonych urządzeń]
      Object.keys(ost).forEach(id => {
        if (stat[id] !== 'gotowe') return;
        const e = ost[id]; if (e.ts >= okno) wOknie++;
        const ek = ekipaOs[e.kto], d = e.ts.slice(0, 10); if (!ek || d < granica) return;
        const pr = pref_(id), o = w_(poniedzialek_(e.ts), ek);
        o.nm += normy[pr] || 30;
        const wym = (typy[pr] || {}).sn; o.k[1]++; if (!wym || sn[id]) o.k[0]++;
        (dzienEkipy[ek + '|' + d] = dzienEkipy[ek + '|' + d] || []).push(pr);
      });
      Object.keys(dzienEkipy).forEach(kl => {   // rzeczywisty czas na urządzenie: 480 min dnia dzielone proporcjonalnie do norm
        const ek = kl.split('|')[0], lista = dzienEkipy[kl], suma = lista.reduce((a, pr) => a + (normy[pr] || 30), 0);
        lista.forEach(pr => { const n = normy[pr] || 30; const t = (W.typ[ek] = W.typ[ek] || {}); const x = t[pr] = t[pr] || [n, 0, 0]; x[1] += 480 * n / suma; x[2]++; });
      });
      tempo = Math.round(wOknie / 10 * 10) / 10;
      const blok = Object.keys(braki).filter(b => braki[b].open && braki[b].blok).length;
      const stare = Object.keys(braki).filter(b => braki[b].open && !braki[b].blok && braki[b].ts < new Date(dzis - 7 * DZIEN).toISOString()).length;
      if (blok) dodaj(2, blok + (blok === 1 ? ' brak blokujący pracę' : ' braki blokujące pracę'));
      if (stare) dodaj(1, 'Otwarte braki starsze niż 7 dni: ' + stare);
    } catch (e) { dodaj(1, 'Lista urządzeń niedostępna'); }

    /* --- ClickUp: terminy, zamówienia, zależności --- */
    const zad0 = p.listaCU && cu.ok ? ((cu.listy[p.listaCU] || {}).zad || []) : null; let koniec = 0, nast = null, koniecZamk = false;
    // od 1.36.0: etap „Status” (liczniki ELWIS wpisywane rano przez Claude) nie jest pracą – pomijany w ocenie
    const stId = (zad0 || []).filter(t => /^status$/i.test(txt_(t.name).trim())).map(t => t.id);
    const zad = zad0 ? zad0.filter(t => stId.indexOf(t.id) < 0 && stId.indexOf(t.parent) < 0) : null;
    if (!p.listaCU) dodaj(1, 'Brak listy ClickUp w Bazie');
    else if (!zad) dodaj(1, 'Lista ClickUp niedostępna');
    else {
      const poId = {}; zad.forEach(t => { poId[t.id] = t; });
      const rodzic = {}; zad.forEach(t => { if (t.parent && poId[t.parent]) rodzic[t.parent] = true; });
      const zamk = t => !!(t.status && /closed|done/.test(t.status.type));
      const faza = t => { let x = t, n = 0; while (x.parent && poId[x.parent] && n++ < 6) x = poId[x.parent]; return txt_(x.name).toLowerCase(); };
      const km = zad.find(t => /koniec umown/i.test(t.name));
      if (km && km.due_date) { koniec = Number(km.due_date); koniecZamk = zamk(km); }
      const otw = zad.filter(t => !zamk(t) && !rodzic[t.id] && t !== km);
      const uruchOtw = otw.some(t => /uruchom|pomiar/.test(faza(t)));
      const potrzeba = Math.ceil(zostaloMin / 480) + (uruchOtw || zostaloSzt ? progi.uruch_dni : 0) + (otw.length ? progi.zamkn_dni : 0);
      const dniK = koniec ? dniRob_(dzis, koniec) : null, dKal = koniec ? Math.ceil((koniec - dzis) / DZIEN) : null;
      const zapas = koniec ? dniK - potrzeba : null;
      p._ = { dKal: dKal, zapas: zapas, potrzeba: potrzeba };
      if (!koniec) dodaj(1, 'Brak otwartego zadania „Koniec umowny projektu” z terminem');
      else if (!koniecZamk && (otw.length || zostaloSzt)) {
        if (dKal < 0) dodaj(2, 'Termin umowny minął ' + (-dKal) + ' dni temu, praca nieskończona', km.url, koniec);
        else if (zapas < 0) dodaj(2, 'Za mało czasu: potrzeba ok. ' + potrzeba + ' dni rob., zostało ' + dniK, km.url, koniec);
        else if (dKal <= progi.koniec_pilne) dodaj(2, 'Koniec umowny za ' + dKal + ' dni, praca nieskończona', km.url, koniec);
        else if (dKal <= progi.koniec_uwaga) dodaj(1, 'Koniec umowny za ' + dKal + ' dni', km.url, koniec);
        const dniMont = Math.max(1, dniK - progi.uruch_dni - progi.zamkn_dni), trzeba = Math.round(zostaloSzt / dniMont * 10) / 10;
        p._.trzeba = trzeba;
        if (zostaloSzt && maZdarzenia && tempo > 0 && trzeba > tempo) dodaj(dKal <= progi.koniec_pilne ? 2 : 1, 'Tempo podłączeń ' + String(tempo).replace('.', ',') + '/dzień, potrzeba ' + String(trzeba).replace('.', ',') + '/dzień – przyspieszyć lub dołożyć ekipę');
      }
      otw.forEach(t => {
        const f = faza(t), due = t.due_date ? Number(t.due_date) : 0, st = t.start_date ? Number(t.start_date) : 0, s = txt_(t.status && t.status.status).toLowerCase();
        const zamow = /zam[oó]w|logisty/.test(f) || /^zam[oó]wi/i.test(t.name);
        if (zamow) {
          const najp = koniec && !koniecZamk ? minusRob_(koniec, p._.potrzeba) - progi.dostawa * DZIEN : 0;
          if (due && due < dzis) dodaj(2, 'Zamówienie po terminie (' + data_(due) + '): ' + t.name, t.url, due);
          else if (najp && najp <= dzis) dodaj(2, 'Zamówić natychmiast (dostawa ok. ' + progi.dostawa + ' dni): ' + t.name, t.url, najp);
          else if (najp && najp <= dzis + progi.start * DZIEN) dodaj(1, 'Zamówić najpóźniej ' + data_(najp) + ': ' + t.name, t.url, najp);
          else if (due && due <= dzis + progi.start * DZIEN) dodaj(1, 'Zamówienie do ' + data_(due) + ': ' + t.name, t.url, due);
        } else if (due && due < dzis - DZIEN / 2) {
          dodaj(/monta|wykonaw|uruchom|pomiar/.test(f) ? 2 : 1, 'Po terminie ' + Math.ceil((dzis - due) / DZIEN) + ' dni: ' + t.name, t.url, due);
        }
        if (s === 'update required') { const od = Math.floor((dzis - Number(t.date_updated || dzis)) / DZIEN); dodaj(od >= 3 ? 2 : 1, 'Przerwane (Do kontynuacji) od ' + od + ' dni: ' + t.name, t.url, due); }
        if (s === 'on hold') dodaj(1, 'Zadanie niepodjęte: ' + t.name, t.url, due);
        const kiedy = st || due;
        if (!zamow && kiedy && kiedy >= dzis && kiedy <= dzis + progi.start * DZIEN && !(t.assignees || []).length && /monta|wykonaw|uruchom|pomiar/.test(f)) dodaj(1, data_(kiedy) + ' bez ekipy: ' + t.name, t.url, kiedy);
        if (due && due >= dzis && (!nast || due < nast.due)) nast = { due: due, txt: t.name };
      });
      const zal = {}; zad.forEach(t => (t.dependencies || []).forEach(d => { zal[d.task_id + '>' + d.depends_on] = d; }));   // zadanie blokujące inne z bliskim terminem
      Object.keys(zal).forEach(kl => {
        const d = zal[kl], t = poId[d.depends_on], cz = poId[d.task_id]; if (!t || !cz || zamk(t) || zamk(cz)) return;
        const kc = Number(cz.start_date || cz.due_date || 0); if (!kc || kc > dzis + progi.start * DZIEN) return;
        dodaj(kc < dzis ? 2 : 1, 'Blokuje „' + cz.name + '” (' + data_(kc) + '): ' + t.name, t.url, kc);
      });
      const wer = zad.find(t => /do weryfikacji po rozpoznaniu/i.test(t.name) && !zamk(t));
      if (wer) { let n = 0; (wer.checklists || []).forEach(c => (c.items || []).forEach(i => { if (!i.resolved) n++; })); if (n) dodaj(1, 'Do weryfikacji po rozpoznaniu: ' + n + ' pkt', wer.url); }
      zad.forEach(t => {   // terminowość ekip: zadania zamknięte w ostatnich 12 tygodniach
        if (!zamk(t) || rodzic[t.id] || !t.date_closed || !t.due_date) return;
        const dc = Number(t.date_closed), tydz = poniedzialek_(new Date(dc).toISOString()); if (tydz < granica) return;
        const eks = {}; (t.assignees || []).forEach(a => { const ek = ekipaCu[String(a.id)]; if (ek) eks[ek] = 1; });
        Object.keys(eks).forEach(ek => { const o = w_(tydz, ek); o.t[1]++; if (dc <= Number(t.due_date) + DZIEN) o.t[0]++; });
      });
    }
    if (wszystkie && gotowe === wszystkie && !protGot && p.zakres.length && !koniecZamk) dodaj(p._ && p._.dKal != null && p._.dKal <= progi.koniec_pilne ? 2 : 1, 'Podłączone 100%, brak protokołów');
    pow.sort((a, b) => b.poz - a.poz || (a.kiedy || 9e15) - (b.kiedy || 9e15));
    const x = p._ || {};
    wynik.push({ kod: p.kod, nazwa: p.kod && p.nazwa.indexOf(p.kod) === 0 ? p.nazwa.slice(p.kod.length).trim() : p.nazwa, poz: pow.length ? pow[0].poz : 0, koniec: koniec && !koniecZamk ? dzien_(koniec) : '', dni: koniecZamk ? null : x.dKal, zapas: koniecZamk ? null : x.zapas,
      tylkoCU: !!p.tylkoCU, url: p.listaCU && cu.team ? 'https://app.clickup.com/' + cu.team + '/v/li/' + p.listaCU : '',
      postep: [gotowe, wszystkie], tempo: tempo, trzeba: x.trzeba || 0, powody: pow.slice(0, 8).map(q => ({ poz: q.poz, txt: q.txt, url: q.url })), ile: pow.length,
      nast: nast ? data_(nast.due) + ' ' + String(nast.txt).slice(0, 60) : '' });
    delete p._;
  });
  wynik.sort((a, b) => b.poz - a.poz || (a.dni == null ? 9e9 : a.dni) - (b.dni == null ? 9e9 : b.dni) || (a.kod < b.kod ? -1 : 1));

  /* --- wydajność ekip: serie tygodniowe + alarmy --- */
  const tyg = Object.keys(W.tyg).sort().slice(-12), ekipy = {};
  tyg.forEach(t => Object.keys(W.tyg[t]).forEach(e => { ekipy[e] = 1; }));
  const proc = (a, b) => b ? Math.round(a / b * 100) : null;
  const serie = Object.keys(ekipy).sort().map(ek => ({
    ekipa: ek, dane: tyg.map(t => {
      const o = W.tyg[t][ek]; if (!o) return null; const dni = Object.keys(o.dni).length;
      return { dni: dni, podl: dni ? Math.round(o.nm / (dni * 480) * 100) : null, term: proc(o.t[0], o.t[1]), ileT: o.t[1], kompl: proc(o.k[0], o.k[1]), prz: o.prz };
    }),
    typy: Object.keys(W.typ[ek] || {}).map(pr => { const x = W.typ[ek][pr]; return { typ: pr, norma: x[0], czas: Math.round(x[1] / x[2]), n: x[2] }; })
  }));
  const alarmy = [];
  serie.forEach(s => {
    const zD = s.dane.filter(d => d && d.podl != null && d.dni >= 2);
    if (zD.length >= 4) {
      const ost2 = zD.slice(-2), wcz = zD.slice(-6, -2), sr = wcz.reduce((a, d) => a + d.podl, 0) / wcz.length, prog = sr * (1 - progi.czas_wydluzenie / 100);
      if (sr > 0 && ost2.every(d => d.podl < prog)) alarmy.push({ ekipa: s.ekipa, txt: ekN_(s.ekipa) + ': wydajność podłączeń 2 tygodnie z rzędu niższa o ponad ' + progi.czas_wydluzenie + '% od własnej średniej (' + ost2.map(d => d.podl + '%').join(', ') + ' wobec ' + Math.round(sr) + '%)' });
    }
    const ost = s.dane.filter(d => d && d.term != null && d.ileT >= 3).slice(-1)[0];
    if (ost && ost.term < progi.terminowosc) alarmy.push({ ekipa: s.ekipa, txt: ekN_(s.ekipa) + ': terminowość ' + ost.term + '% (próg ' + progi.terminowosc + '%)' });
  });
  const res = { czas: Date.now(), projekty: wynik, pominiete: pominiete, alarmy: alarmy, wyd: { tyg: tyg, serie: serie }, progi: progi, brakKlucza: !P.getProperty('CLICKUP_TOKEN') };
  zapiszDuze_('PRIO', JSON.stringify(res));
  return res;
}
function ekN_(e) { return /^\d+$/.test(e) ? 'Ekipa ' + e : e; }
function zapiszDuze_(nazwa, json) {
  const stare = Number(P.getProperty(nazwa + '_N') || 0), n = Math.ceil(json.length / 8000), o = {};
  for (let i = 0; i < n; i++) o[nazwa + '_' + i] = json.slice(i * 8000, (i + 1) * 8000);
  o[nazwa + '_N'] = String(n); P.setProperties(o);
  for (let i = n; i < stare; i++) P.deleteProperty(nazwa + '_' + i);
}
function czytajDuze_(nazwa) {
  const n = Number(P.getProperty(nazwa + '_N') || 0); if (!n) return null;
  const all = P.getProperties(); let s = ''; for (let i = 0; i < n; i++) s += all[nazwa + '_' + i] || '';
  try { return JSON.parse(s); } catch (e) { return null; }
}
/** Operacja `priorytety` – tylko rola biuro. `odswiez=1` przelicza od razu (do kilku minut). */
function priorytety_(kto, odswiez) {
  if (!rolaBiuro_()[txt_(kto)]) throw new Error('Priorytety – tylko rola biuro');
  let r = odswiez ? przeliczPriorytety() : czytajDuze_('PRIO');
  if (!r) r = { czas: 0, projekty: [], alarmy: [], wyd: { tyg: [], serie: [] }, progi: {} };   // od 1.55.0: bez przeliczania przy synchronizacji
  const kom = {}; txt_(konfig_().analiza_claude).split(/\n+/).forEach(l => { const m = l.match(/^\s*([0-9]{2}[_p][0-9]{3})\s*[:–-]\s*(.+)$/); if (m) kom[m[1]] = m[2].slice(0, 300); else if (l.trim() && !kom._) kom._ = l.trim().slice(0, 400); });
  r.projekty.forEach(p => { if (kom[p.kod]) p.kom = kom[p.kod]; });
  r.komentarz = kom._ || '';
  return Object.assign({ ok: true }, r);
}

/* ===================== Zadania z harmonogramu, Obciążenie, Powiadomienia (od 1.56.0) =====================
   Zasady: fundamenty pkt 2.8–2.9 i 6. Zapis w ClickUp tylko po „Zaplanuj” w aplikacji (rola biuro) – akceptacja zasady 1. */
const FAZY_PROJ = ['Przygotowanie i Rozpoznanie', 'Logistyka i Zamówienia', 'Montaż i Wykonawstwo', 'Uruchomienia i Pomiary', 'Zamknięcie i Serwis'];
const ZASIEG_DOM = { 1: 2000, 2: 200, 3: 120 };   // km od Lublina w linii prostej – zasięg jednodniowy (Konfiguracja → zasieg_km)
const LUBLIN = { lat: 51.2465, lon: 22.5684 };
const TZ = 'Europe/Warsaw';
function cuH_() { const token = P.getProperty('CLICKUP_TOKEN'); if (!token) throw new Error('Brak klucza ClickUp na serwerze'); return { headers: { Authorization: token, 'Content-Type': 'application/json' }, muteHttpExceptions: true }; }
function cu_(metoda, sciezka, dane) {
  const o = Object.assign({ method: metoda }, cuH_()); if (dane) o.payload = JSON.stringify(dane);
  for (let i = 0; i < 3; i++) {
    const r = UrlFetchApp.fetch('https://api.clickup.com/api/v2/' + sciezka, o), k = r.getResponseCode();
    if (k === 429) { Utilities.sleep(15000); continue; }
    if (k >= 300) throw new Error('ClickUp ' + k + ': ' + r.getContentText().slice(0, 200));
    return JSON.parse(r.getContentText() || '{}');
  }
  throw new Error('ClickUp: limit zapytań – spróbuj za chwilę');
}
function cuTeam_() { let t = P.getProperty('CLICKUP_TEAM'); if (!t) { t = String(cu_('get', 'team').teams[0].id); P.setProperty('CLICKUP_TEAM', t); } return t; }
function msDnia_(dzien, hm) { const [h, m] = String(hm).split(':'); return Utilities.parseDate(dzien + ' ' + ('0' + h).slice(-2) + ':' + ('0' + (m || '0')).slice(-2), TZ, 'yyyy-MM-dd HH:mm').getTime(); }
function dzienTz_(ms) { return Utilities.formatDate(new Date(ms), TZ, 'yyyy-MM-dd'); }
function minTz_(ms) { const s = Utilities.formatDate(new Date(ms), TZ, 'HH:mm'); return Number(s.slice(0, 2)) * 60 + Number(s.slice(3)); }
function hhmm_(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
function robTz_(dzien) { const w = new Date(dzien + 'T12:00:00Z').getUTCDay(); return w !== 0 && w !== 6 && !swieto_(dzien); }   // od 1.56.2 bez świąt ustawowych
/* Święto ustawowe w Polsce: nazwa albo '' (ta sama funkcja co U.swieto w aplikacji) */
function swieto_(k) {
  const y = +k.slice(0, 4), md = k.slice(5);
  const st = { '01-01': 'Nowy Rok', '01-06': 'Trzech Króli', '05-01': 'Święto Pracy', '05-03': 'Święto Konstytucji 3 Maja', '08-15': 'Wniebowzięcie NMP', '11-01': 'Wszystkich Świętych', '11-11': 'Święto Niepodległości', '12-24': 'Wigilia', '12-25': 'Boże Narodzenie', '12-26': 'Boże Narodzenie (2. dzień)' };
  if (md === '12-24' && y < 2025) return '';
  if (st[md]) return st[md];
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), kk = c % 4, l = (32 + 2 * e + 2 * i - h - kk) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mies = Math.floor((h + l - 7 * m + 114) / 31), dz = ((h + l - 7 * m + 114) % 31) + 1, wlk = Date.UTC(y, mies - 1, dz);
  const r = Math.round((Date.UTC(y, +md.slice(0, 2) - 1, +md.slice(3)) - wlk) / 864e5);
  return { 0: 'Wielkanoc', 1: 'Poniedziałek Wielkanocny', 49: 'Zielone Świątki', 60: 'Boże Ciało' }[r] || '';
}

function dodajDni_(dzien, n) { return new Date(new Date(dzien + 'T12:00:00Z').getTime() + n * DZIEN).toISOString().slice(0, 10); }
function dniRobocze_(od, ile) { const o = []; let d = od; while (o.length < ile) { if (robTz_(d)) o.push(d); d = dodajDni_(d, 1); } return o; }
const DNI_TYG = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
function dzTxt_(dzien) { const d = new Date(dzien + 'T12:00:00Z'); return DNI_TYG[d.getUTCDay()] + ' ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1); }

/** Ludzie z Pracowników z ID ClickUp: ekipa ('1','2','3','Pomocnik','Biuro'), M, okno pracy (min od północy). */
function ludzie_() {
  return rowsT_(baza_().getSheetByName('Pracownicy')).filter(r => tak_(r[4]) && txt_(r[5]) && txt_(r[2]) !== 'podwykonawca').map(r => {
    const m = txt_(r[1]).match(/ekipa\s*(\d+)/i), ek = m ? m[1] : txt_(r[1]).split(' ')[0] || '';
    return { name: txt_(r[0]), id: txt_(r[5]), ek: ek, lider: /lider/i.test(txt_(r[1])), rola: txt_(r[2]), m: tak_(r[7]), okno: ek === '1' ? [480, 960] : [420, 900] };
  });
}
/** Zadania osób: otwarte z terminem od dziś do końca horyzontu + zaległe (termin przed dziś). */
function zadaniaOsob_(ids, doMs) {
  const team = cuTeam_(), dzis0 = msDnia_(dzienTz_(Date.now()), '00:00'), out = {}, zbierz = extra => {
    for (let pg = 0; pg < 30; pg++) {
      const q = ['page=' + pg, 'include_closed=false', 'subtasks=true', extra].concat(ids.map(i => 'assignees[]=' + encodeURIComponent(i))).join('&');
      const d = cu_('get', 'team/' + team + '/task?' + q);
      (d.tasks || []).forEach(t => { out[t.id] = t; });
      if (d.last_page || !(d.tasks || []).length) break;
    }
  };
  zbierz('due_date_gt=' + (dzis0 - 1) + '&due_date_lt=' + (doMs + 1));
  zbierz('due_date_lt=' + dzis0);
  return Object.keys(out).map(k => out[k]);
}
function pomijaj_(t) { const n = txt_(t.name); return /^status$/i.test(n) || /^ELWIS –/.test(n) || FAZY_PROJ.some(f => f.toLowerCase() === n.toLowerCase()); }
function nieob_(t) { return /urlop|nieobecn|zwolnienie|\bL4\b/i.test(txt_(t.name)); }
function kodZListy_(n) { const m = txt_(n).match(/^(\d{2}[_p]\d{3})/); return m ? m[1] : ''; }

/** Obciążenie: dla każdej osoby i dnia roboczego – przedziały zajęte (min), godziny „pływające”, nieobecność, „?”. */
function obciazenie_() {
  const k = konfig_(), dni = Number(k.obciazenie_dni) || 15, tyg = Number(k.obciazenie_tygodnie) || 10;
  const dzis = dzienTz_(Date.now()), koniec = dodajDni_(dzis, tyg * 7), doMs = msDnia_(koniec, '23:59');
  const L = ludzie_(), poId = {}; L.forEach(o => { poId[o.id] = o; });
  const zad = zadaniaOsob_(L.map(o => o.id), doMs).filter(t => !pomijaj_(t));
  const dzienne = {}; L.forEach(o => { dzienne[o.id] = {}; });
  const kom = (id, dz) => (dzienne[id][dz] = dzienne[id][dz] || { prz: [], plyw: 0, nieob: '', pyt: false });
  const zaleg = {}, lista = [];
  zad.forEach(t => {
    const osoby = (t.assignees || []).map(a => String(a.id)).filter(i => poId[i]); if (!osoby.length) return;
    const due = t.due_date ? Number(t.due_date) : null, st = t.start_date ? Number(t.start_date) : null, est = Number(t.time_estimate || 0) / 6e4;
    const dz0 = dzienTz_(st || due), dz1 = dzienTz_(due);
    if (dz1 < dzis) { osoby.forEach(i => { zaleg[i] = (zaleg[i] || 0) + (est ? est / 60 : 8); }); lista.push({ t, osoby, zal: true }); return; }
    lista.push({ t, osoby });
    const robocze = []; let d = dz0 < dzis ? dzis : dz0; while (d <= dz1) { if (robTz_(d)) robocze.push(d); d = dodajDni_(d, 1); }
    if (!robocze.length) return;
    const czasy = !!(t.start_date_time && t.due_date_time && st);
    osoby.forEach(i => {
      const o = poId[i];
      robocze.forEach((dz, j) => {
        const c = kom(i, dz);
        if (nieob_(t)) { c.nieob = /zwolnienie|L4/i.test(t.name) ? 'L4' : 'U'; return; }
        if (czasy) { const a = dz === dzienTz_(st) ? minTz_(st) : o.okno[0], b = dz === dz1 ? minTz_(due) : o.okno[1]; if (b > a) c.prz.push([a, b]); }
        else if (t.due_date_time && !st && est) { const b = minTz_(due); c.prz.push([Math.max(o.okno[0], b - est), b]); }
        else if (est) c.plyw += est / robocze.length;
        else { c.plyw += o.okno[1] - o.okno[0]; c.pyt = true; }
      });
    });
  });
  return { stan: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'), dzis, dni, tyg, koniec, ludzie: L, dzienne, zaleg, lista, kom };
}
/** Wolne przedziały osoby w dniu (min), po odjęciu zajętych i godzin pływających (od początku dnia). */
function wolne_(O, o, dz) {
  const c = O.dzienne[o.id][dz]; let wol = [[o.okno[0], o.okno[1]]];
  if (!c) return wol;
  if (c.nieob) return [];
  c.prz.slice().sort((a, b) => a[0] - b[0]).forEach(([a, b]) => { const n = []; wol.forEach(([x, y]) => { if (b <= x || a >= y) n.push([x, y]); else { if (a > x) n.push([x, a]); if (b < y) n.push([b, y]); } }); wol = n; });
  let p = c.plyw; const n = []; wol.forEach(([x, y]) => { if (p >= y - x) { p -= y - x; return; } n.push([x + p, y]); p = 0; }); return n;
}
function zajete_(O, o, dz) { const c = O.dzienne[o.id][dz]; if (c && c.nieob) return c.nieob; const w = wolne_(O, o, dz).reduce((s, [a, b]) => s + b - a, 0); const h = Math.round(((o.okno[1] - o.okno[0]) - w) / 30) / 2; return String(h).replace('.', ',') + (c && c.pyt ? '?' : ''); }
function przetnij_(A, B) { const o = []; A.forEach(([a, b]) => B.forEach(([c, d]) => { const x = Math.max(a, c), y = Math.min(b, d); if (y > x) o.push([x, y]); })); return o.sort((p, q) => p[0] - q[0]); }

/** Zakładka „Obciążenie” w Bazie – mapa godzin (dni + tygodnie) i lista zadań; nadpisywana w całości. */
function obciazenieZapisz_(O) {
  O = O || obciazenie_();
  const ss = baza_(); let sh = ss.getSheetByName('Obciążenie'); if (!sh) sh = ss.insertSheet('Obciążenie');
  const dniR = dniRobocze_(O.dzis, O.dni), pozaDni = [], start = dodajDni_(dniR[dniR.length - 1], 1);
  // od 1.56.2: święta ustawowe w dni powszednie – osobna kolumna „Ś” (dzień niedostępny do pracy), nie wliczane do dni roboczych
  const dniL = []; for (let d = O.dzis; d <= dniR[dniR.length - 1]; d = dodajDni_(d, 1)) { const w = new Date(d + 'T12:00:00Z').getUTCDay(); if (w !== 0 && w !== 6) dniL.push(d); }
  const swW = {}; for (let d = start; d <= O.koniec; d = dodajDni_(d, 1)) { const w = new Date(d + 'T12:00:00Z').getUTCDay(); if (w !== 0 && w !== 6 && swieto_(d)) (swW[poniedzialek_(d)] = swW[poniedzialek_(d)] || []).push(dzTxt_(d).split(' ')[1]); }
  for (let d = start; d <= O.koniec; d = dodajDni_(d, 1)) if (robTz_(d)) pozaDni.push(d);
  const tygodnie = {}; pozaDni.forEach(d => { const k = poniedzialek_(d); (tygodnie[k] = tygodnie[k] || []).push(d); });
  const tk = Object.keys(tygodnie).sort();
  const nagl = ['Osoba', 'Ekipa', 'Godz. pracy'].concat(dniL.map(d => dzTxt_(d) + (swieto_(d) ? ' Ś ' + swieto_(d) : '')), tk.map(k => 'tydz. ' + dzTxt_(k).split(' ')[1] + (swW[k] ? ' (Ś ' + swW[k].join(', ') + ')' : '')), ['Zaległe (h)']);
  const ws = O.ludzie.slice().sort((a, b) => (a.ek + a.name < b.ek + b.name ? -1 : 1)).map(o => [o.name, o.ek, hhmm_(o.okno[0]) + '–' + hhmm_(o.okno[1])]
    .concat(dniL.map(d => swieto_(d) ? 'Ś' : zajete_(O, o, d)), tk.map(k => { let h = 0, u = 0; tygodnie[k].forEach(d => { const z = zajete_(O, o, d); if (/^[A-Z]/.test(z)) u++; else h += Number(String(z).replace('?', '').replace(',', '.')); }); return h + '/' + tygodnie[k].length * 8 + (u ? ' · U:' + u : ''); }),
      [O.zaleg[o.id] ? String(Math.round(O.zaleg[o.id] * 2) / 2).replace('.', ',') : '']));
  const imie = {}; O.ludzie.forEach(o => { imie[o.id] = o.name; });
  const zl = O.lista.sort((a, b) => Number(a.t.due_date) - Number(b.t.due_date)).map(x => [kodZListy_(x.t.list && x.t.list.name), txt_(x.t.name).slice(0, 60), x.osoby.map(i => imie[i]).join(', '),
    x.t.start_date ? Utilities.formatDate(new Date(Number(x.t.start_date)), TZ, x.t.start_date_time ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : '', Utilities.formatDate(new Date(Number(x.t.due_date)), TZ, x.t.due_date_time ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'),
    x.t.time_estimate ? String(Math.round(Number(x.t.time_estimate) / 18e5) / 2).replace('.', ',') : '', (x.zal ? 'ZALEGŁE · ' : '') + txt_(x.t.status && x.t.status.status), txt_(x.t.url)]);
  const szer = Math.max(nagl.length, 8), pad = r => r.concat(Array(szer - r.length).fill(''));
  const wiersze = [pad(['Stan na', O.stan, 'Zajęte godziny z dnia pracy (8 h); U – urlop / nieobecność, L4 – zwolnienie, Ś – święto ustawowe (dzień niedostępny do pracy; w tygodniach: godziny / dni robocze bez świąt), ? – zadanie bez szacowanego czasu (liczone jako cały dzień). Arkusz liczy serwer ELWIS – nie edytować.']), pad([]), pad(nagl)]
    .concat(ws.map(pad), [pad([]), pad(['Kod', 'Zadanie', 'Osoby', 'Start', 'Termin', 'Szac. h', 'Status', 'Link'])], zl.map(pad));
  sh.clear(); sh.getRange(1, 1, wiersze.length, szer).setNumberFormat(TEXT).setValues(wiersze.map(r => r.map(v => String(v).replace(/^[=+@-]/, "'$&"))));
  sh.setFrozenRows(3); sh.getRange(3, 1, 1, szer).setFontWeight('bold'); sh.getRange(4 + ws.length + 1, 1, 1, 8).setFontWeight('bold');
  return O;
}

/* --- projekt: dane z Bazy, odległość od Lublina --- */
function projektyBaza_() {
  return rowsT_(baza_().getSheetByName('Projekty')).filter(r => txt_(r[0])).map(r => ({ kod: txt_(r[0]), nazwa: txt_(r[1]), adres: txt_(r[2]), pin: txt_(r[3]), aktywna: tak_(r[5]), cu: txt_(r[9]), wojsk: tak_(r[11]) }));
}
function km_(a, b) { const R = 6371, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dn = r(b.lon - a.lon); const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(h))); }
function wsp_(pin, adres) {
  const m = txt_(pin).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/); if (m) return { lat: Number(m[1]), lon: Number(m[2]) };
  if (!txt_(adres)) return null;
  const kl = 'geo:' + txt_(adres).toLowerCase().slice(0, 200), c = CACHE.get(kl); if (c) return c === '-' ? null : JSON.parse(c);
  try { const g = Maps.newGeocoder().setRegion('pl').setLanguage('pl').geocode(txt_(adres) + ', Polska'); const l = g.results && g.results[0] && g.results[0].geometry.location; const w = l ? { lat: l.lat, lon: l.lng } : null; CACHE.put(kl, w ? JSON.stringify(w) : '-', 21600); return w; } catch (e) { return null; }
}

/** Warianty terminu: pierwszy wolny termin każdej pasującej ekipy (pary), z podziałem na części. */
function warianty_(z, O) {
  O = O || obciazenie_();
  const k = konfig_(), zas = pary_(k.zasieg_km, ZASIEG_DOM), pr = z.nowy ? { kod: txt_(z.nowy.kod), adres: txt_(z.nowy.miejsc), wojsk: false } : projektyBaza_().find(p => p.kod === txt_(z.kod));
  if (!pr) throw new Error('Nie ma projektu ' + z.kod + ' w Bazie');
  const gdzie = wsp_(pr.pin, pr.adres), odl = gdzie ? km_(LUBLIN, gdzie) : null;
  const ekipy = {}; O.ludzie.forEach(o => { if (/^\d+$/.test(o.ek)) (ekipy[o.ek] = ekipy[o.ek] || []).push(o); });
  if (txt_(z.ekipa) === 'osoby') {   // od 1.56.1: wybrane osoby – wspólny wolny czas
    const os = (z.osoby || []).map(n => O.ludzie.find(o => o.name === txt_(n))).filter(Boolean);
    if (!os.length) throw new Error('Wybrane osoby nie mają ID ClickUp w zakładce Pracownicy');
    ekipy.osoby = os;
  }
  const dar = O.ludzie.find(o => /pomocnik/i.test(o.ek));
  const wybrane = /^\d+$/.test(txt_(z.ekipa)) || txt_(z.ekipa) === 'osoby' ? [txt_(z.ekipa)] : Object.keys(ekipy).filter(e => e !== 'osoby').sort();
  let prow = {}; if (pr.cu) { try { (cu_('get', 'list/' + pr.cu + '/task?include_closed=true&subtasks=true').tasks || []).forEach(t => (t.assignees || []).forEach(a => { const o = O.ludzie.find(x => x.id === String(a.id)); if (o && /^\d+$/.test(o.ek)) prow[o.ek] = (prow[o.ek] || 0) + 1; })); } catch (e) { } }
  const prowEk = Object.keys(prow).sort((a, b) => prow[b] - prow[a])[0];
  const potrzeba = Math.round(Number(z.h) * 60), teraz = Date.now(), dzis = O.dzis;
  const startD = txt_(z.od) && txt_(z.od) > dzis ? txt_(z.od) : dzis;
  const dniH = []; for (let d = startD; d <= O.koniec; d = dodajDni_(d, 1)) if (robTz_(d)) dniH.push(d);
  return Object.keys(ekipy).filter(e => wybrane.indexOf(e) >= 0).map(e => {
    const os = ekipy[e], czesci = []; let reszta = potrzeba;
    for (const d of dniH) {
      if (reszta <= 0) break;
      let wol = wolne_(O, os[0], d); os.slice(1).forEach(o => { wol = przetnij_(wol, wolne_(O, o, d)); });
      if (d === dzis) { const m = Math.ceil((minTz_(teraz) + 60) / 30) * 30; wol = wol.map(([a, b]) => [Math.max(a, m), b]).filter(([a, b]) => b > a); }
      wol.forEach(([a, b]) => { a = Math.ceil(a / 30) * 30; if (reszta <= 0 || b - a < 30) return; const kon = Math.min(b, a + reszta); czesci.push({ dzien: d, dz: dzTxt_(d), od: hhmm_(a), do: hhmm_(kon), h: Math.round((kon - a) / 30) / 2 }); reszta -= kon - a; });
    }
    const uwagi = []; let ok = reszta <= 0, blad = ok ? '' : 'brak wolnych godzin do ' + dzTxt_(O.koniec);
    if (ok && txt_(z.do) && czesci[czesci.length - 1].dzien > txt_(z.do)) { ok = false; blad = 'po terminie'; }
    if (pr.wojsk && os.some(o => !o.m)) { ok = false; blad = 'obiekt wojskowy – brak uprawnienia M'; }
    if (odl == null) uwagi.push('Zasięg nieznany – brak pinezki / adresu budowy');
    else if (e === 'osoby') { const ek = [...new Set(os.map(o => o.ek).filter(x => /^\d+$/.test(x)))]; ek.forEach(x => { if (odl > (zas[x] || 9999)) uwagi.push('Budowa ok. ' + odl + ' km od Lublina – poza zasięgiem jednodniowym ekipy ' + x + ' (' + zas[x] + ' km) – wymaga uzgodnienia'); }); }
    else if (odl > (zas[e] || 9999)) uwagi.push('Budowa ok. ' + odl + ' km od Lublina – poza zasięgiem jednodniowym ekipy ' + e + ' (' + zas[e] + ' km) – wymaga uzgodnienia');
    os.forEach(o => { if (O.zaleg[o.id]) uwagi.push(o.name + ': zaległe zadania ok. ' + Math.round(O.zaleg[o.id]) + ' h'); });
    if (z.dariusz && dar) czesci.forEach(c => { const w = przetnij_(wolne_(O, dar, c.dzien), [[minOf_(c.od), minOf_(c.do)]]).reduce((s, [a, b]) => s + b - a, 0); if (w < (minOf_(c.do) - minOf_(c.od)) && uwagi.indexOf('Dariusz zajęty w części terminu') < 0) uwagi.push('Dariusz zajęty w części terminu'); });
    return { ek: e, ekipa: e === 'osoby' ? os.map(o => o.name).join(', ') : 'Ekipa ' + e + ' (' + os.map(o => o.name).join(', ') + ')', osoby: os.map(o => o.id), ok, blad, prow: e === prowEk, czesci, uwagi };
  }).sort((a, b) => (b.ok - a.ok) || ((a.czesci[a.czesci.length - 1] || { dzien: 'z' }).dzien < (b.czesci[b.czesci.length - 1] || { dzien: 'z' }).dzien ? -1 : 1));
}
function minOf_(s) { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); }

/** Nowy projekt z formularza: lista w ClickUp (szablon z Konfiguracji → clickup_szablon_listy) + wiersz w Bazie (Aktywna = nie). */
function nowyProjekt_(n, kto) {
  const kod = txt_(n.kod), nazwa = txt_(n.nazwa).replace(/^[=+@-]/, '');
  if (!/^\d{2}[_p]\d{3}$/.test(kod)) throw new Error('Kod projektu w formacie RR_NNN lub RRpNNN');
  if (!nazwa) throw new Error('Podaj nazwę projektu');
  if (projektyBaza_().some(p => p.kod === kod)) throw new Error('Projekt ' + kod + ' jest już w Bazie – wybierz go z listy');
  const team = cuTeam_(), sp = (cu_('get', 'team/' + team + '/space?archived=false').spaces || []);
  const rok = '20' + kod.slice(0, 2), s = sp.find(x => new RegExp('^\\s*PROJ\\s*' + rok).test(x.name));
  if (!s) throw new Error('Brak przestrzeni „PROJ ' + rok + '” w ClickUp');
  const istnieje = [];
  sp.filter(x => /^\s*PROJ/i.test(x.name)).forEach(x => {
    (cu_('get', 'space/' + x.id + '/list?archived=false').lists || []).forEach(l => { if (kodZListy_(l.name) === kod) istnieje.push(l.name); });
    (cu_('get', 'space/' + x.id + '/folder?archived=false').folders || []).forEach(f => (f.lists || []).forEach(l => { if (kodZListy_(l.name) === kod) istnieje.push(l.name); }));
  });
  if (istnieje.length) throw new Error('W ClickUp jest już lista „' + istnieje[0] + '” – dopisz ją do Bazy albo wybierz inny kod');
  const pelna = kod + ' ' + nazwa, szablon = txt_(konfig_().clickup_szablon_listy);
  let lid = '';
  if (szablon) { const r = cu_('post', 'space/' + s.id + '/list_template/' + encodeURIComponent(szablon), { name: pelna, options: { return_immediately: false } }); lid = String(r.id || (r.list && r.list.id) || ''); }
  if (!lid) { lid = String(cu_('post', 'space/' + s.id + '/list', { name: pelna }).id); FAZY_PROJ.forEach(f => cu_('post', 'list/' + lid + '/task', { name: f })); }
  const sh = baza_().getSheetByName('Projekty');
  sh.getRange(sh.getLastRow() + 1, 1, 1, 12).setNumberFormat(TEXT).setValues([[kod, pelna, txt_(n.miejsc).replace(/^[=+@-]/, ''), '', '', 'nie', '', 'Założone z ELWIS ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') + ' (' + kto + ') – do uzupełnienia skillem nowa-budowa', '', lid, '', '']]);
  CACHE.remove('aktywne');
  return { kod, cu: lid, nazwa: pelna };
}
function faza_(lid, nazwa) {
  for (let i = 0; i < 6; i++) {
    const t = (cu_('get', 'list/' + lid + '/task?include_closed=true').tasks || []).find(x => !x.parent && txt_(x.name).toLowerCase() === nazwa.toLowerCase());
    if (t) return t.id;
    if (i < 5) Utilities.sleep(3000);   // lista z szablonu może się jeszcze tworzyć
  }
  return cu_('post', 'list/' + lid + '/task', { name: nazwa }).id;
}

/** Operacja `zadNowe` (od 1.56.0) – tylko rola biuro: projekty | warianty | zaplanuj */
/* Obciążenie w pamięci skryptu (od 1.56.1) – bez listy zadań (tylko do wariantów terminu) */
function obcZapamietaj_(O) {
  try { const j = JSON.stringify({ ts: Date.now(), stan: O.stan, dzis: O.dzis, dni: O.dni, tyg: O.tyg, koniec: O.koniec, ludzie: O.ludzie, dzienne: O.dzienne, zaleg: O.zaleg });
    if (j.length < 95000) CACHE.put('obc', j, 900); } catch (e) { Logger.log('obc pamięć: ' + e); }
}
function obcPamiec_(maxMin) {
  const c = CACHE.get('obc');
  if (c) { const o = JSON.parse(c); if (Date.now() - o.ts <= maxMin * 6e4) return o; }
  const O = obciazenie_(); obcZapamietaj_(O); try { obciazenieZapisz_(O); } catch (e) { Logger.log(e); } return O;
}
function zadNowe_(b) {
  const kto = txt_(b.kto); if (!rolaBiuro_()[kto]) throw new Error('Nowe zadania – tylko rola biuro');
  if (b.op === 'odswiez') {   // od 1.56.1: przy otwarciu okna „Nowe zadanie” – obciążenie ekip liczone w tle, zanim użytkownik wypełni pola
    const lk = LockService.getScriptLock(); lk.waitLock(25000);
    try { const O = obciazenie_(); obcZapamietaj_(O); obciazenieZapisz_(O); return { ok: true, stan: O.stan }; } finally { lk.releaseLock(); }
  }
  if (b.op === 'projekty') return { ok: true, projekty: projektyBaza_().filter(p => p.cu || p.aktywna).map(p => ({ kod: p.kod, nazwa: p.nazwa, aktywna: p.aktywna })) };
  const z = b.zgl || {}; if (!(Number(z.h) > 0)) throw new Error('Brak czasu pracy');
  z.kto = kto;   // od 1.56.1: ekipa „biuro” = zadanie dla zgłaszającego
  if (!FAZY_PROJ.includes(txt_(z.faza))) z.faza = 'Montaż i Wykonawstwo';
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    // od 1.56.1: warianty liczone na obciążeniu odświeżonym przy otwarciu okna (pamięć do 10 min); „Zaplanuj” zawsze na bieżącym
    if (b.op === 'warianty') { const O = obcPamiec_(10); return { ok: true, stan: O.stan, warianty: warianty_(z, O) }; }
    if (b.op !== 'zaplanuj') throw new Error('Nieznana operacja');
    const juz = CACHE.get('zn:' + txt_(z.id));   // od 1.56.1: powtórzenie po przekroczonym czasie oczekiwania nie tworzy zadań drugi raz
    if (juz) return Object.assign(JSON.parse(juz), { powtorka: true });
    const O = obciazenie_();
    const w = b.wyb || {}, L = O.ludzie.filter(o => (w.osoby || []).indexOf(o.id) >= 0);
    if (!L.length || !(w.czesci || []).length) throw new Error('Brak wybranego wariantu');
    // kontrola kolizji na aktualnym obciążeniu
    const kol = [];
    w.czesci.forEach(c => L.forEach(o => { const a = minOf_(c.od), bb = minOf_(c.do), wol = przetnij_(wolne_(O, o, c.dzien), [[a, bb]]).reduce((s, [x, y]) => s + y - x, 0); if (wol < bb - a) kol.push(o.name + ' – ' + dzTxt_(c.dzien) + ' ' + c.od + '–' + c.do + ' (zajęte ' + zajete_(O, o, c.dzien) + ' h z 8)'); }));
    if (kol.length) {
      powDodaj_([{ t: 'kol', kod: txt_(z.nowy ? z.nowy.kod : z.kod), tyt: 'Kolizja: ' + kol[0], opis: '„' + txt_(z.nazwa).slice(0, 80) + '” – termin zajęty od czasu wyszukania; wybierz nowy wariant', kto: 'serwer' }]);
      obciazenieZapisz_(O);
      return { ok: true, kolizja: kol, stan: O.stan, warianty: warianty_(z, O) };
    }
    let pr = z.nowy ? nowyProjekt_(z.nowy, kto) : projektyBaza_().find(p => p.kod === txt_(z.kod));
    if (!pr || !pr.cu) throw new Error('Projekt bez listy ClickUp w Bazie (kolumna „ID listy ClickUp”)');
    const lid = pr.cu, fid = faza_(lid, z.faza), dar = z.dariusz ? O.ludzie.find(o => /pomocnik/i.test(o.ek)) : null;
    const osoby = L.map(o => Number(o.id)).concat(dar ? [Number(dar.id)] : []), n = w.czesci.length, urls = [];
    const opis = ['Zaplanowane w ELWIS: ' + kto + ', ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm') + ' – ' + txt_(w.ekipa) + (w.nr ? ', wariant ' + w.nr : '') + ' (obciążenie: stan na ' + O.stan + ').',
      txt_(z.od) ? 'Nie wcześniej niż: ' + z.od : '', txt_(z.do) ? 'Najpóźniej do: ' + z.do : '', txt_(z.uw) ? 'Uwagi: ' + txt_(z.uw).slice(0, 1000) : ''].filter(String).join('\n');
    w.czesci.forEach((c, i) => {
      const t = cu_('post', 'list/' + lid + '/task', { name: txt_(z.nazwa).slice(0, 180) + (n > 1 ? ' – część ' + (i + 1) + '/' + n : ''), parent: fid, assignees: osoby, description: opis,
        start_date: msDnia_(c.dzien, c.od), start_date_time: true, due_date: msDnia_(c.dzien, c.do), due_date_time: true, time_estimate: Math.round((minOf_(c.do) - minOf_(c.od)) * 6e4), notify_all: false });
      urls.push(t.url);
    });
    P.setProperty('PLAN_VER', String(Date.now()));
    powDodaj_([{ t: 'zad', kod: pr.kod, tyt: 'Zaplanowano: ' + txt_(z.nazwa).slice(0, 80) + ' – ' + txt_(w.ekipa).replace(/\s*\(.*/, '') + ', ' + w.czesci.map(c => dzTxt_(c.dzien) + ' ' + c.od + '–' + c.do).join(' + '), opis: (z.nowy ? 'Nowy projekt założony w ClickUp i Bazie · ' : '') + z.faza, kto }]);
    const wyn = { ok: true, urls, kod: pr.kod, nowy: z.nowy ? pr : null };
    CACHE.put('zn:' + txt_(z.id), JSON.stringify(wyn), 21600); CACHE.remove('obc');
    try { obciazenieZapisz_(); } catch (e) { Logger.log('obciążenie po zaplanowaniu: ' + e); }
    return wyn;
  } finally { lock.releaseLock(); }
}

/* --- Powiadomienia (zakładka w Bazie, tylko dla roli biuro) --- */
const POW_NAGL = ['ID', 'Czas (ms)', 'Typ', 'Kod', 'Tytuł', 'Opis', 'Kto'];
const POW_DNI = 60;
function powSheet_() { const ss = baza_(); let sh = ss.getSheetByName('Powiadomienia'); if (!sh) { sh = ss.insertSheet('Powiadomienia'); sh.getRange(1, 1, 1, 7).setValues([POW_NAGL]); sh.setFrozenRows(1); } return sh; }
function powDodaj_(lista) {
  if (!lista || !lista.length) return;
  try {
    const sh = powSheet_(), t0 = Date.now(), c = v => String(v == null ? '' : v).replace(/^[=+@-]/, "'$&");
    const rows = lista.map((x, i) => ['p' + t0 + '-' + i, String(x.ts || t0), x.t, c(x.kod).slice(0, 20), c(x.tyt).slice(0, 250), c(x.opis).slice(0, 500), c(x.kto).slice(0, 80)]);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setNumberFormat(TEXT).setValues(rows);
  } catch (e) { Logger.log('powiadomienia: ' + e); }
}
function powZPush_(p, evs, numery) {
  const L = [], gdzie = e => (e.urz && e.urz !== 'BUDOWA' ? ' · ' + e.urz : '');
  evs.forEach(e => {
    const d = e.d || {}, b = { kod: p.kod, kto: txt_(e.kto), ts: Date.parse(txt_(e.ts)) || Date.now() };
    if (e.typ === 'brak') L.push(Object.assign({ t: 'brak', tyt: 'Nowy brak: ' + txt_(d.kat) + gdzie(e), opis: [d.odp ? 'Odpowiedzialny: ' + d.odp : '', d.blokuje ? 'blokuje pracę' : '', txt_(d.opis).slice(0, 200)].filter(String).join(' · ') }, b));
    else if (e.typ === 'brak_zamk') L.push(Object.assign({ t: 'bzam', tyt: 'Zamknięty brak' + gdzie(e), opis: txt_(d.opis).slice(0, 200) }, b));
    else if (e.typ === 'protokol' && d.stan === 'gotowy') L.push(Object.assign({ t: 'prot', tyt: 'Protokół przesłany' + (numery && numery[d.pid] ? ' – ' + numery[d.pid] : d.nr ? ' – ' + d.nr : ''), opis: txt_(d.def || d.nazwa) }, b));
    else if (e.typ === 'notatka') L.push(Object.assign({ t: 'nota', tyt: 'Notatka' + gdzie(e), opis: txt_(d.tekst).slice(0, 200) }, b));
    else if (e.typ === 'urz_nowe' || e.typ === 'urz_edyc') L.push(Object.assign({ t: 'urz', tyt: (e.typ === 'urz_nowe' ? 'Nowe urządzenie ' : 'Zmiana danych urządzenia ') + txt_(e.urz), opis: '' }, b));
    else if (e.typ === 'foto' && d.rodzaj === 'tabliczka' && d.odp && String(d.odp).split(' > ').length > 1) L.push(Object.assign({ t: 'tab', tyt: 'Tabliczka ' + txt_(e.urz) + ': zachowana po ' + String(d.odp).split(' > ').length + ' podejściach', opis: txt_(d.odp) + (d.obrot ? ' · obrót ' + d.obrot + '°' : '') }, b));
  });
  powDodaj_(L);
}
/** Operacja `powiad` – tylko rola biuro: wpisy nowsze niż `since` (ms). */
function powiad_(kto, since) {
  if (!rolaBiuro_()[txt_(kto)]) throw new Error('Powiadomienia – tylko rola biuro');
  const sh = powSheet_(); if (sh.getLastRow() < 2) return { ok: true, lista: [] };
  const s = Number(since) || 0;
  const lista = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getDisplayValues().filter(r => Number(r[1]) > s).slice(-500).map(r => ({ id: r[0], ts: Number(r[1]), t: r[2], kod: r[3], tyt: r[4], opis: r[5], kto: r[6] }));
  return { ok: true, lista };
}
function powPorzadki_() {
  const sh = powSheet_(); if (sh.getLastRow() < 2) return;
  const gr = Date.now() - POW_DNI * DZIEN, v = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
  let n = 0; while (n < v.length && Number(v[n][0]) < gr) n++;
  if (n) sh.deleteRows(2, n);
}
