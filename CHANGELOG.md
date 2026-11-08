# Zmiany

## 1.5.1 – 2026-11-08 (aplikacja i serwer, schemat 1.5)
- Protokoły: pola „Inwestor” i „Zamawiający” wypełniają się z Bazy projektów (zakładka Projekty, nowe kolumny N „Inwestor” i O „Zamawiający” – uzupełniane przy zakładaniu projektu). Puste w Bazie → wartość z poprzedniego protokołu budowy. Na tablecie można je poprawić.
- Serwer: bootstrap zwraca `inwestor` i `zamawiajacy` budowy; dostępne też we wzorach definicji i nazwie pliku Word.

## 1.5.0 – 2026-11-08 (aplikacja i serwer)
- Protokoły na tablecie: formularz budowany z pliku definicji (`_Szablony/szablon_konfig`), bez zmiany aplikacji przy nowych protokołach. Dostępne, gdy protokół ma w Bazie „Aktywny = tak”, a budowa ma jego rodzaj pracy w zakresie prac.
- Wejście: kafelek „<rodzaj pracy> – protokoły” na karcie budowy (lista urządzeń danego typu ze stanem protokołów) oraz sekcja „Protokoły” w karcie urządzenia.
- Formularz: wartości domyślne (np. harmonogram przewietrzania), pola automatyczne (nr seryjny szafy, uruchamiający), sekcje zależne (LPG tylko przy „CO / LPG”), wentylatory dodawane i usuwane w trakcie, skanowanie numerów seryjnych. Pola „pamiętaj dla budowy” (inwestor, obiekt, zamawiający…) przechodzą z poprzedniego protokołu budowy.
- Praca z przerwami: każda zmiana zapisuje się od razu na tablecie (szkic); „Zapisz” / wyjście – zapis do synchronizacji; „Zakończ” sprawdza pola wymagane i zaznacza braki.
- Numer protokołu nadaje serwer przy pierwszej synchronizacji po „Zakończ”: prefiks z definicji (PU, PR, PP…) + numer kolejny w budowie, dwie cyfry (PU01, PU02…) – bez kolizji między tabletami.
- Nr seryjny z protokołu trafia do karty urządzenia i listy urządzeń (zdarzenie `nr`).
- Rola biuro: „Zablokuj / Odblokuj” protokół, „Generuj Word” – serwer wypełnia szablon Word i zapisuje plik w folderze budowy → Protokoły (ponowne wygenerowanie zastępuje plik).
- Serwer: bootstrap zwraca aktywne protokoły z definicjami; zdarzenie `protokol`; operacja `docx`. Skrypt czyta tylko pliki wskazane w zakładce Protokoły i zapisuje Word tylko do folderu Protokoły budowy.

## 1.4.1 – 2026-11-08
- Mój plan: pod datą „Plan z: <dzień, godzina>” – czas ostatniego pobrania planu; plan starszy niż 12 h wyróżniony, offline – informacja, że zmiany z ClickUp pojawią się po połączeniu.

## 1.4.0 – 2026-11-08 (aplikacja i serwer, schemat 1.4)
- „Mój plan” – pierwszy ekran po zalogowaniu: zadania z ClickUp przypisane do zalogowanej osoby na wybrany dzień; zadania z godziną startu i końca jako bloki na osi dnia, pozostałe na liście „Bez godziny”; przełączanie dni; „Pokaż wszystkich” – osie dnia wszystkich pracowników obok siebie; dotknięcie zadania otwiera kartę budowy (lista ClickUp ↔ „ID listy ClickUp”). Plan ±7 dni dostępny offline.
- Obiekty wojskowe: budowę z „Obiekt wojskowy = tak” otwiera tylko osoba z uprawnieniem M (kolumna „Uprawnienie M” w zakładce Pracownicy) lub rola biuro; pozostali widzą okno „Brak dostępu”. Na liście budów 🔒 przy takich budowach.
- Serwer: operacja `plan` (ClickUp API, klucz we właściwości skryptu CLICKUP_TOKEN, pamięć podręczna 5 min); bootstrap zwraca ID ClickUp i uprawnienie M pracowników oraz listę ClickUp budowy. Nowe uprawnienie skryptu: połączenia zewnętrzne (ClickUp).

## 1.3.2 – 2026-11-08
- Nagłówek: numer wersji aplikacji małą czcionką pod napisem ELWIS.

## 1.3.1 – 2026-11-08
- Braki: dotknięcie kafelka braku przypisanego do urządzenia otwiera kartę tego urządzenia.
- Poprawka: „Anuluj” w oknie zamykania braku zostawia brak otwarty (wcześniej brak był zamykany).

## 1.3.0 – 2026-11-07 (aplikacja i serwer)
- „Pozostałe DTR”: wspólny folder `_Techniczne` (Konfiguracja → `folder_techniczne_id`, podfoldery = grupy) pobierany na każdy tablet; sekcja pod „Dokumenty pomocnicze” na karcie budowy. Pliki usunięte z Dysku znikają z tabletu, zmienione pobierają się ponownie.
- Pamięć tabletu: komplet danych 30 ostatnio otwieranych budów; na liście budów „✓ offline”. Starsze budowy są usuwane z tabletu (poza niewysłanymi wpisami i zdjęciami) i pobierane ponownie przy otwarciu.
- Zwykła synchronizacja odświeża bieżącą i 5 ostatnich budów; „Pobierz wszystko ponownie” – wszystkie 30.
- Prośba o pamięć trwałą przeglądarki; w Ustawieniach liczba budów w pamięci i zajęte miejsce.
- Serwer: operacja `techniczne`; pliki udostępniane z „Do wglądu” aktywnych budów i z `_Techniczne` (do 3 poziomów podfolderów).

## 1.2.0 – 2026-11-07 (aplikacja i serwer)
- Dokumenty pomocnicze do 60 MB: serwer wysyła duże pliki w częściach po 6 MB, aplikacja składa je i trzyma offline (wcześniej limit 15 MB w aplikacji / 20 MB na serwerze).
- Dotknięcie dokumentu, którego jeszcze nie ma w tablecie, pobiera go od razu (przy internecie) z postępem w procentach.
- Przy dokumentach rozmiar pliku i ✓, gdy plik jest w pamięci tabletu.
- Zgodność: aplikacja 1.2.0 ze starym serwerem pobiera pliki jak dotąd (do 20 MB); stara aplikacja z nowym serwerem – bez zmian.

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
