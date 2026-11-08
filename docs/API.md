# ELWIS – API synchronizacji (v1)

Serwer: Google Apps Script (`apps-script/Code.gs`), wdrożony jako aplikacja internetowa na koncie ELWIS.
Każde zapytanie zawiera `key` (klucz tabletu z zakładki **Tablety**) i `v` (wersja aplikacji).
Odpowiedź zawsze JSON: `{ok:true, ...}` albo `{ok:false, error:"opis"}`.

| Operacja | Metoda | Parametry | Zwraca |
|---|---|---|---|
| `bootstrap` | GET | – | `server, schema, minApp, sesjaGodziny, tablet, salt, pracownicy[{name,ekipa,rola,hash,cu,m}], projekty[{kod,nazwa,adres,lokalizacja,kontakt,zakres[],uwagi,wojskowy,etapy[{id,opis}],listaCU}], slowniki{kategorie[],typy[{prefix,nazwa,kroki[],sn}],rodzaje[{id,opis}]}, protokoly[{id,nazwa,wersja,rodzaj,powiazanie,def,blad}]` (protokoly od 1.5.0 – tylko „Aktywny = tak”, `def` = treść pliku definicji) |
| `project` | GET | `kod` | `etapy[{id,opis}], urzadzenia[{id,grupa,typ,zasilanie,kond,arkusz,uwagi,x,y,sn,status,etap}], tematy[], pliki[{id,name,mime,size}], rzuty{arkusz:fileId}, ostrzezenia[]` |
| `file` | GET | `id`, `part?` | `name, mime, size, b64` – tylko pliki z „Do wglądu” aktywnej budowy lub z `_Techniczne`. Z `part` (od 1.2.0): część nr `part` po 6 MB + `parts` (liczba części), pliki do 60 MB; bez `part`: cały plik do 20 MB |
| `techniczne` | GET | – | `pliki[{id,name,mime,size,grupa,zm}]` – DTR z `_Techniczne` (grupa = ścieżka podfolderu), `brakFolderu` gdy brak klucza w Konfiguracji (od 1.3.0) |
| `plan` | GET | `od`, `do` (rrrr-mm-dd, do 31 dni) | `zadania[{id,nazwa,status,zamk,lista,listaNazwa,start,koniec,godzStart,godzKoniec,osoby[],url}]` – zadania ClickUp pracowników z „ID ClickUp”, z terminem w zakresie; `brakKlucza` gdy brak CLICKUP_TOKEN (od 1.4.0) |
| `events` | GET | `kod, since` | `events[], last, more` – maks. 500 na raz |
| `push` | POST (text/plain) | `kod, events[], photos[{id,name,b64}]` | `accepted[]` – ID przyjęte (także duplikaty), `numery{pid:nr}` – numery protokołów (od 1.5.0) |
| `docx` | POST (text/plain) | `kod, pid, kto` | `name, url, nr` – Word protokołu w folderze budowy → Protokoły; tylko gdy `kto` ma rolę biuro (od 1.5.0) |

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
| `protokol` | `{pid, def, wersja, prefiks, stan: roboczy/gotowy/zablokowany, nr?, dane{…}}` – pełny stan formularza, ostatni zapis wygrywa; `nr` nadaje serwer (od 1.5.0) |

Po `push` serwer przelicza kolumny **Nr seryjny** i **Status** w zakładce Urządzenia (czeka / w toku / gotowe / brak).

## Etapy budowy (od 1.1.0, schemat 1.3)
- Projekty, kol. M „Etap Budowy”: `A: opis; B: opis` → `etapy`. Puste = bez podziału.
- Urządzenia, kol. L „Etap Budowy”: oznaczenie etapu → `etap`.
- `ostrzezenia`: urządzenia bez etapu lub z etapem spoza listy budowy (gdy budowa ma etapy).

## Protokoły (od 1.5.0)
- Zakładka **Protokoły** w Bazie: link do definicji (`_Szablony/szablon_konfig/definicja_<ID>-v<wersja>.json`) i do szablonu Word (`_Szablony/szablon_<ID>-v<wersja>_<nazwa>.docx`).
- Definicja: `id, wersja, nazwa, szablon, powiazanie` (prefiks typu urządzenia), `prefiks_nr` (PU/PR/PP…), `nazwa_pliku` (wzór), `znak_tak/znak_nie`, `sekcje[{id, tytul, typ?: "tabela", word_petla?, pokaz_gdy?, pola[]}]`.
- Pole: `{id, etykieta, typ, wymagane?, domyslnie?, jednostka?, opcje?, word?, wzor?, pamietaj_dla_budowy?, zapisz_do_urzadzenia?}`. Typy: `tekst, tekst_dlugi, liczba, data, godzina, taknie, wybor, znacznik, kod, auto`.
- Wzory: `{pole}` – wartość z danych lub kontekstu (`kod, nazwa_budowy, adres, nr, dd, mm, etap_urzadzenia, kondygnacja_urzadzenia, zalogowany, lp`); `{pole=X:A|B}` – A gdy pole = X, inaczej B.
- Szablon Word: `{{pole}}` – wartość; pola `taknie/wybor` z mapą `word` → znaczniki opcji (☒/☐); `znacznik` → ☒/☐; wiersz tabeli z `{{#petla}} … {{/petla}}` powielany dla każdej pozycji. Daty w Word: dd/mm/rrrr.
- Numer: przy pierwszym zapisie ze stanem innym niż `roboczy` serwer nadaje `<prefiks><nr 2 cyfry>` (kolejny w budowie dla prefiksu); kolejne zapisy tego `pid` dostają ten sam numer.

## Zasady
- PIN nigdy nie trafia do tabletu – tylko `SHA-256(salt + ":" + PIN)`.
- Budowa widoczna tylko gdy `Aktywna = tak`, ma kod i wypełnione pole „Obiekt wojskowy”.
- Zmiana niezgodna wstecz = nowa wersja główna schematu (2.x); aplikacja 1.x odmówi pracy.
