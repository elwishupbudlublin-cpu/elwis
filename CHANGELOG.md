# Zmiany

## 1.1.1 – 2026-11-07
- Karta budowy: sekcja „Do wglądu (offline)” nazywa się „Dokumenty pomocnicze” (folder na Dysku bez zmian: „Do wglądu”).

## 1.1.0 – 2026-11-07 (aplikacja i serwer, schemat 1.3)
- Etapy budowy: przełącznik „Wszystkie / A / B…” z opisem etapu na karcie budowy, w podłączeniach, brakach i postępie – tylko przy budowach z co najmniej dwoma etapami.
- Wybrany etap filtruje listę urządzeń, zakładki rzutów, znaczniki, legendę, braki i tematy; wybór zapamiętany na tablecie osobno dla każdej budowy.
- Postęp: kafelki etapów na karcie budowy; w widoku Postęp – podział na etapy i łącznie.
- Karta urządzenia pokazuje etap. Brak zgłoszony bez urządzenia w wybranym etapie zapisuje etap (pole `etap` w danych zdarzenia).
- Serwer: etapy budowy z kolumny „Etap Budowy” (Projekty, kol. M), etap urządzenia z kolumny „Etap Budowy” (Urządzenia, kol. L); ostrzeżenia o niezgodnych etapach (widoczne dla roli biuro).
- Zgodność: aplikacja 1.0.x działa z serwerem 1.1.0 (ignoruje etapy); aplikacja 1.1.0 ze starym serwerem traktuje budowy jako bez podziału.

## 1.0.6 – 2026-11-07
- Rzut: krótkie dotknięcie znacznika otwiera okno urządzenia (wcześniej kliknięcie generowane przez Androida od razu zamykało okno; działało tylko dłuższe przytrzymanie).

## 1.0.5 – 2026-11-07
- Ekran logowania: dopisek o autorze aplikacji.

## 1.0.4 – 2026-11-07
- Przycisk pracownika w prawym górnym rogu szerszy (min. 160 px), większa czcionka, ikona osoby; nie zwęża się przy długiej nazwie budowy.

## 1.0.3 – 2026-11-07
- Logowanie: szersze pola pracowników (min. 230 px, większa czcionka); na tablecie w pionie pasek ELWIS u góry zamiast kolumny z boku.

## 1.0.2 – 2026-11-07
- Rzut nie da się odsunąć poza ekran – przesuwanie zatrzymuje się na krawędziach arkusza (margines 40 px).

## 1.0.1 – 2026-11-07
- Rzut: dotknięcie znacznika działa pewniej – drżenie palca do 12 px nie przesuwa rzutu, a dotknięcie wybiera najbliższy znacznik w promieniu 28 px.

## Serwer 1.0.1 – 2026-11-07
- Odczyt Konfiguracji, Tabletów, Pracowników, Projektów i Słowników jako tekst (arkusz zamieniał „1.2” na datę; PIN z zerem na początku).
- Zakładka Zdarzenia oraz kolumny Nr seryjny / Status zapisywane w formacie tekstowym (czas zdarzenia i długie numery seryjne bez przeróbek arkusza).

## 1.0.0 – 2026-11-07
- Pierwsza wersja (etap 1): logowanie PIN, lista budów z wyszukiwaniem, karta budowy, rzuty z markerami, lista urządzeń, kroki podłączeń, numery seryjne (skan / ręcznie / zdjęcie tabliczki), braki ze zdjęciami, notatki, postęp, praca offline i synchronizacja.
- Serwer Apps Script: bootstrap, project, file, events, push; przeliczanie statusów; kopie tygodniowe.
- Schemat danych 1.2.
