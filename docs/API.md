# ELWIS – API synchronizacji (v1)

Serwer: Google Apps Script (`apps-script/Code.gs`), wdrożony jako aplikacja internetowa na koncie ELWIS.
Każde zapytanie zawiera `key` (klucz tabletu z zakładki **Tablety**) i `v` (wersja aplikacji).
Odpowiedź zawsze JSON: `{ok:true, ...}` albo `{ok:false, error:"opis"}`.

| Operacja | Metoda | Parametry | Zwraca |
|---|---|---|---|
| `bootstrap` | GET | – | `server, schema, minApp, sesjaGodziny, tablet, salt, pracownicy[{name,ekipa,rola,hash}], projekty[{kod,nazwa,adres,lokalizacja,kontakt,zakres[],uwagi,wojskowy}], slowniki{kategorie[],typy[{prefix,nazwa,kroki[],sn}],rodzaje[{id,opis}]}` |
| `project` | GET | `kod` | `urzadzenia[{id,grupa,typ,zasilanie,kond,arkusz,uwagi,x,y,sn,status}], tematy[], pliki[{id,name,mime,size}], rzuty{arkusz:fileId}` |
| `file` | GET | `id` | `name, mime, b64` – tylko pliki z „Do wglądu” aktywnej budowy |
| `events` | GET | `kod, since` | `events[], last, more` – maks. 500 na raz |
| `push` | POST (text/plain) | `kod, events[], photos[{id,name,b64}]` | `accepted[]` – ID przyjęte (także duplikaty) |

## Zdarzenia
`{id, ts, kto, urz, typ, d}` – niezmienne, rozpoznawane po `id` (ponowne wysłanie nie dubluje).

| typ | d |
|---|---|
| `krok` | `{krok: nr, nazwa, wart: true/false}` |
| `nr` | `{sn}` |
| `foto` | `{fid, rodzaj: "zdjęcie"/"tabliczka"}` |
| `brak` | `{kat, opis, blokuje, foto[]}` |
| `brak_zamk` | `{bid, opis}` |
| `notatka` | `{tekst, foto[]}` |

Po `push` serwer przelicza kolumny **Nr seryjny** i **Status** w zakładce Urządzenia (czeka / w toku / gotowe / brak).

## Zasady
- PIN nigdy nie trafia do tabletu – tylko `SHA-256(salt + ":" + PIN)`.
- Budowa widoczna tylko gdy `Aktywna = tak`, ma kod i wypełnione pole „Obiekt wojskowy”.
- Zmiana niezgodna wstecz = nowa wersja główna schematu (2.x); aplikacja 1.x odmówi pracy.
