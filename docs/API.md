# ELWIS – API synchronizacji (v1)

Serwer: Google Apps Script (`apps-script/Code.gs`), wdrożony jako aplikacja internetowa na koncie ELWIS.
Każde zapytanie zawiera `key` (klucz tabletu z zakładki **Tablety**) i `v` (wersja aplikacji).
Odpowiedź zawsze JSON: `{ok:true, ...}` albo `{ok:false, error:"opis"}`.

| Operacja | Metoda | Parametry | Zwraca |
|---|---|---|---|
| `foto` | GET | `kod, fid` → `{mime, b64}` – zdjęcie z folderu Zdjęcia aktywnej budowy (od 1.8.0; tablet zapisuje je pomniejszone) |
| `bootstrap` | GET | `pamiec?` (od 1.7.0 – opis stanu pamięci tabletu; serwer zapisuje go w Tablety, kol. F) | `server, schema, minApp, sesjaGodziny, tablet, salt, pracownicy[{name,ekipa,rola,hash,cu,m}], projekty[{kod,nazwa,adres,lokalizacja,kontakt,zakres[],uwagi,wojskowy,etapy[{id,opis}],listaCU,inwestor,zamawiajacy}], slowniki{kategorie[],typy[{prefix,nazwa,kroki[],sn}],rodzaje[{id,opis}]}, protokoly[{id,nazwa,wersja,rodzaj,powiazania[],powiazanie,def,blad}]` (protokoly od 1.5.0; `powiazania` od 1.6.0 – prefiksy z kolumny E, `powiazanie` = pierwszy – tylko „Aktywny = tak”, `def` = treść pliku definicji) |
| `project` | GET | `kod` | `etapy[{id,opis}], urzadzenia[{id,grupa,typ,zasilanie,kond,arkusz,uwagi,x,y,sn,status,etap}], tematy[], pliki[{id,name,mime,size}], rzuty{arkusz:fileId}, ostrzezenia[]` |
| `file` | GET | `id`, `part?` | `name, mime, size, b64` – tylko pliki z „Do wglądu” aktywnej budowy lub z `_Techniczne`. Z `part` (od 1.2.0): część nr `part` po 6 MB + `parts` (liczba części), pliki do 60 MB; bez `part`: cały plik do 20 MB |
| `techniczne` | GET | – | `pliki[{id,name,mime,size,grupa,zm}]` – DTR z `_Techniczne` (grupa = ścieżka podfolderu), `brakFolderu` gdy brak klucza w Konfiguracji (od 1.3.0) |
| `plan` | GET | `od`, `do` (rrrr-mm-dd, do 31 dni) | `zadania[{id,nazwa,status,zamk,lista,listaNazwa,start,koniec,godzStart,godzKoniec,osoby[],url}]` – zadania ClickUp pracowników z „ID ClickUp”, z terminem w zakresie; `brakKlucza` gdy brak CLICKUP_TOKEN (od 1.4.0) | Od 1.10.0 każde zadanie ma też `est` – „Estimated Time” z ClickUp w ms (0 = brak). Od 1.12.0 `opis` – treść opisu zadania (do 1500 znaków). Od 1.11.4 parametr `kto` (zalogowany): dla roli innej niż biuro serwer usuwa zadania i osoby z roli biuro.
| `events` | GET | `kod, since` | `events[], last, more` – maks. 500 na raz |
| `push` | POST (text/plain) | `kod, events[], photos[{id,name,b64}]` | `accepted[]` – ID przyjęte (także duplikaty), `numery{pid:nr}` – numery protokołów (od 1.5.0), `nowe{tmp:id}` – ID nadane nowym urządzeniom (od 1.15.0) |
| `docx` | POST (text/plain) | `kod, pid, kto` | `name, url, nr` – Word protokołu w folderze budowy → Protokoły; tylko gdy `kto` ma rolę biuro (od 1.5.0) |
| `zadania` | POST (text/plain) | `zmiany: [{id, task, status, powod, komentarz, kto, ts}]` | `wyniki: {id: {ok, blad}}` – status zadania ClickUp z tabletu (od 1.12.0); dozwolone tylko `complete`, `update required`, `on hold`; powód i komentarz → komentarz zadania „ELWIS · kto (tablet): …”; po zmianie serwer unieważnia pamięć planu (`PLAN_VER`) |

## Zdarzenia
`{id, ts, kto, urz, typ, d}` – niezmienne, rozpoznawane po `id` (ponowne wysłanie nie dubluje).

| typ | d |
|---|---|
| `krok` | `{krok: nr, nazwa, wart: true/false}` |
| `nr` | `{sn}` |
| `foto` | `{fid, rodzaj: "zdjęcie"/"tabliczka"}` |
| `brak` | `{kat, opis, blokuje, foto[], etap?}` – `etap` tylko dla braku bez urządzenia zgłoszonego w wybranym etapie |
| `brak_zamk` | `{bid, opis}` |
| `notatka` | `{tekst, foto[]}` |
| `brak_edyc` | `{bid, kat?, opis?, blokuje?, foto[]?, usun?, otworz?}` – edycja braku (od 1.9.0); `usun` – autor lub biuro, `otworz` – biuro |
| `brak_kom` | `{bid, tekst, foto[]}` – komentarz do braku (od 1.9.0) |
| `foto_usun` | `{fid}` – usunięcie zdjęcia (od 1.8.0); serwer akceptuje od autora zdjęcia lub roli biuro i przenosi plik do kosza |
| `pinezka` | `{lat, lon, dokl}` – pinezka GPS budowy z tabletu (od 1.12.0); serwer wpisuje `lat,lon` do Projekty, kolumna D „Pinezka GPS (lat,lon)”: pustą – każdy, istniejącą – tylko rola biuro; współrzędne spoza Polski odrzucane |
| `urz_nowe` | `{tmp, prefix, kond, arkusz, x, y, oz, uwagi, etap}` – nowe urządzenie z tabletu (od 1.15.0, tylko rola biuro, także offline). `urz` = ID tymczasowe `<prefiks>~xxxx`. Serwer nadaje ID = prefiks + kolejny numer dla prefiksu, dopisuje wiersz na końcu zakładki Urządzenia (Grupa = nazwa typu ze Słowników, Status = czeka) i zamienia ID tymczasowe w pozostałych zdarzeniach; tablet wysyła te zdarzenia przed zdjęciami i po odpowiedzi zamienia ID u siebie. Zdarzenie od osoby spoza roli biuro albo z prefiksem spoza Słowników – nieprzyjęte |
| `protokol` | `{pid, def, wersja, prefiks, stan: roboczy/gotowy/zablokowany/usuniety, nr?, dane{…}}` – pełny stan formularza, ostatni zapis wygrywa; `nr` nadaje serwer (od 1.5.0); `usuniety` (od 1.6.1) – protokół znika z list, serwer przenosi jego Word do kosza; pracownik może usunąć tylko protokół bez numeru |

Po `push` serwer przelicza kolumny **Nr seryjny** i **Status** w zakładce Urządzenia (czeka / w toku / gotowe / brak).

## Inwestor i zamawiający (od 1.5.1, schemat 1.5)
- Projekty, kol. N „Inwestor”, kol. O „Zamawiający” → `inwestor`, `zamawiajacy` (wartości domyślne w protokołach).

## Etapy budowy (od 1.1.0, schemat 1.3)
- Projekty, kol. M „Etap Budowy”: `A: opis; B: opis` → `etapy`. Puste = bez podziału.
- Urządzenia, kol. L „Etap Budowy”: oznaczenie etapu → `etap`.
- `ostrzezenia`: urządzenia bez etapu lub z etapem spoza listy budowy (gdy budowa ma etapy).

## Protokoły (od 1.5.0)
- Zakładka **Protokoły** w Bazie: link do definicji (`_Szablony/szablon_konfig/definicja_<ID>-v<wersja>.json`) i do szablonu Word (`_Szablony/szablon_<ID>-v<wersja>_<nazwa>.docx`).
- Definicja: `id, wersja, nazwa, szablon, ` `prefiks_nr` (PU/PR/PP…), `nazwa_pliku` (wzór), `znak_tak/znak_nie`, `sekcje[{id, tytul, typ?: "tabela", word_petla?, pokaz_gdy?, pola[]}]`.
- Pole: `{id, etykieta, typ, wymagane?, domyslnie?, jednostka?, opcje?, word?, wzor?, pamietaj_dla_budowy?, zapisz_do_urzadzenia?}`. Typy: `tekst, tekst_dlugi, liczba, data, godzina, taknie, wybor, znacznik, kod, auto, urzadzenie` (od 1.6.0).
- Powiązanie z typami urządzeń – wyłącznie w Bazie (zakładka Protokoły, kolumna E: `SZ; SP`), nie w definicji.
- `urzadzenie` (od 1.6.0): `typy[]` – prefiksy urządzeń do wyboru (pusto = wszystkie); wartość = ID urządzenia. W tabeli – przycisk „Dodaj wszystkie”.
- `z_urzadzenia` (od 1.6.0): po wyborze urządzenia w tej samej sekcji / wierszu pole przyjmuje wartość z karty: `id, sn, typ, kond, etap, arkusz, zasilanie, grupa` (`sn` – spisany na tablecie lub w liście urządzeń). Można poprawić ręcznie.
- `zapisz_do_urzadzenia`: pole poza tabelą → numer do urządzenia protokołu; w wierszu tabeli → do wybranego urządzenia, gdy nie ma ono jeszcze numeru.
- Wzory: `{pole}` – wartość z danych lub kontekstu (`kod, nazwa_budowy, adres, inwestor, zamawiajacy, nr, dd, mm, etap_urzadzenia, kondygnacja_urzadzenia, zalogowany, lp`); `{pole=X:A|B}` – A gdy pole = X, inaczej B.
- Szablon Word: `{{pole}}` – wartość; pola `taknie/wybor` z mapą `word` → znaczniki opcji (☒/☐); `znacznik` → ☒/☐; wiersz tabeli z `{{#petla}} … {{/petla}}` powielany dla każdej pozycji. Daty w Word: dd/mm/rrrr.
- Numer: przy pierwszym zapisie ze stanem `gotowy` lub `zablokowany` serwer nadaje `<prefiks><nr 2 cyfry>` (kolejny w budowie dla prefiksu); kolejne zapisy tego `pid` dostają ten sam numer.

## Zasady
- PIN nigdy nie trafia do tabletu – tylko `SHA-256(salt + ":" + PIN)`.
- Budowa widoczna tylko gdy `Aktywna = tak`, ma kod i wypełnione pole „Obiekt wojskowy”.
- Zmiana niezgodna wstecz = nowa wersja główna schematu (2.x); aplikacja 1.x odmówi pracy.
