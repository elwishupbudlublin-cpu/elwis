# Zmiany

## 1.47.0 – 2026-11-19 (aplikacja)
- Lista urządzeń – zbiorcze zaznaczanie (tylko rola biuro): przycisk „Zaznaczanie”, pola wyboru przy wierszach, „Zaznacz widoczne” (wg filtra), „Odznacz wszystko”, pasek z licznikiem i „Dalej: kroki / nr”.
- Okno zbiorcze: zaznacz / odznacz kroki (jeden typ – wybór kroków, kilka typów – wszystkie kroki), wariant kroku, wspólny nr seryjny tylko tam, gdzie brak numeru, ostrzeżenie o brakujących numerach, potwierdzenie z liczbą urządzeń i kroków.
- Zapis jako zwykłe zdarzenia `krok` / `nr` (pole `zb: 1`), także offline; cofnięcie = zdarzenie odznaczające. Serwer i schemat bez zmian.
- Poprawka: kolor niebieskich etykiet i telefonów w oknie „i” (brakująca zmienna koloru).

## 1.46.0 – 2026-11-19 (aplikacja)
- Lista budów: przycisk „Zwolnij” pod znaczkiem „offline” (tylko rola biuro) – usuwa dane budowy z tabletu (rzuty, dokumenty, wysłane zdarzenia i zdjęcia) i wyłącza ją z synchronizacji do czasu ponownego otwarcia; budowy z niewysłanymi wpisami nie zwalnia. Liczniki na liście zostają (liczy je serwer).
- Budowa niepobrana na tablet: szary znaczek „offline” z przekreśloną ikoną.
- „Pobierz wszystko ponownie (WiFi)” wymaga potwierdzenia (liczba budów, czas, WiFi).

## 1.45.1 – 2026-11-19 (aplikacja)
- Nagłówek budowy: numer budowy za nazwą, ta sama wielkość czcionki; etykiety „K. AKPiA” i „K. Sanit.” (zamiast „Kierownik AKPiA” / „Kierownik HUP-BUD”).
- Okno „i”: numer za nazwą; kierownicy i inne kontakty w jednej zwartej liście „Kontakty” (jeden wiersz na kontakt) nad notatką o budowie.

## 1.45.0 – 2026-11-19 (aplikacja i serwer, schemat 1.14)
- Okno „i” budowy: sekcja „Inne kontakty” (rola, imię i nazwisko / firma, telefon do dotknięcia); rola biuro dodaje i usuwa kontakty w trakcie budowy („+ Dodaj kontakt” lub „Edytuj”).
- Dodawanie: „Wpisz ręcznie” albo „Z kontaktów urządzenia” (książka kontaktów tabletu / telefonu – Chrome na Androidzie, Contact Picker API; można wybrać kilka osób, rolę dopisuje się ręcznie). Gdzie przeglądarka nie obsługuje wyboru kontaktów, przycisk jest ukryty.
- Serwer: nowa kolumna R „Inne kontakty” w Projekty (jeden kontakt w wierszu: „Rola: Nazwa, telefon”), zapis przez `projekt_edyc`, odczyt w bootstrap; można edytować także w arkuszu.

## 1.44.0 – 2026-11-19 (aplikacja i serwer, schemat 1.13)
- Nagłówek budowy: Kierownik AKPiA (pierwszy, na każdej budowie – Konfiguracja → `kierownik_akpia`) i Kierownik HUP-BUD budowy (Projekty → P, telefon z nowej kolumny Q „Telefon kierownika”), telefony do dotknięcia (dzwonienie); notatka o budowie skrócona do 2 linii.
- Przycisk „i”: pełna informacja o budowie – kierownicy z telefonami, cała notatka, adres, kontakt, zakres prac, etapy, inwestor, zamawiający, obiekt wojskowy.
- Rola biuro: „Edytuj” w oknie „i” – notatka o budowie, kierownik i telefon (podpowiedzi z innych budów); zdarzenie `projekt_edyc`, serwer zapisuje Projekty H, P, Q (tylko od roli biuro; od podwykonawcy pomijane).

## 1.43.1 – 2026-11-19 (aplikacja)
- Okno braku: „Zapisz zmiany” bez opisu, gdy brak ma wybrany rodzaj (np. „Brak urządzenia”, „Uszkodzenie”); opis wymagany tylko bez rodzaju albo przy „Inne” – jak przy zgłaszaniu.

## 1.43.0 – 2026-11-19 (aplikacja i serwer, schemat 1.12)
- Dostęp podwykonawcy przez link: klucz w Tablety z kolumnami G „Budowy (dostęp)” i H „Ważny do”; serwer wpuszcza tylko do wybranych budów, bez planu dnia, Priorytetów, Word i statusów ClickUp; logowanie kontem Pracownicy z rolą „podwykonawca” i Ekipą = „Przypisany do”; wpisy biura (urządzenia, pozycje, pinezka) od podwykonawcy pomijane. Link z funkcji `linkPodwykonawcy(firma, budowy, waznyDo)`; aplikacja czyta konfigurację z `#cfg=` i usuwa ją z paska adresu. Konta podwykonawców nie pojawiają się na tabletach HUP-BUD.
- Okno braku: zdjęcia dodane przez „+ Zdjęcie” zapisują się także przy „Zamknij brak”, komentarzu i „Otwórz ponownie”; „Anuluj” pyta o niezapisane zmiany; nowe zdjęcia widać od razu (wcześniej ginęły, gdy nie kliknięto „Zapisz zmiany”). Edycja braku nie zmienia danych pierwotnego zgłoszenia w pamięci tabletu.

## 1.42.0 – 2026-11-18 (aplikacja i serwer)
- Notatki: „Edytuj” dla każdego pracownika (wcześniej tylko biuro); „Usuń” (kosz) i „Przywróć” nadal tylko rola biuro. Serwer przyjmuje edycję tekstu od każdego, kosz / przywrócenie tylko od biura.

## 1.41.0 – 2026-11-18 (aplikacja; serwer bez zmian – 1.40.0)
- Mój plan: przesunięcie palcem po harmonogramie w lewo – następny dzień, w prawo – poprzedni (wyraźny ruch poziomy; przewijanie godzin bez zmian; w widoku „Wszyscy” z przewijanymi kolumnami – dopiero na krawędzi).

## 1.40.0 – 2026-11-18 (serwer; aplikacja bez zmian – numer wspólny)
- Kontrola miejsca na Dysku konta ELWIS raz dziennie (przy przeliczaniu priorytetów) i przy kopii tygodniowej: gdy wolnego miejsca zostaje mniej niż 20% – porządki archiwum bez czekania na 12 tygodni; wszystkie kopie poza najnowszą każdego pliku usuwane trwale (kosz też zajmuje miejsce).
- Kopia folderów budów pomijana, gdy wolnego miejsca jest mniej niż 5%.

## 1.39.0 – 2026-11-18 (serwer; aplikacja bez zmian – numer wspólny)
- Kopie zapasowe: porządki w _Archiwum – kopie starsze niż 12 tygodni do kosza Dysku, z każdego pliku zawsze zostaje najnowsza kopia.
- Kopia różnicowa folderów aktywnych budów (Zdjęcia, Protokoły, Notatki budowy i inne pliki poza „Do wglądu” i arkuszami) do _Archiwum/Foldery budów – tylko pliki nowe lub zmienione od ostatniej kopii; usunięcie pliku na Dysku nie kasuje kopii; przy braku czasu dokończenie wyzwalaczem po 5 min.

## 1.38.0 – 2026-11-18 (aplikacja i serwer)
- Liczniki w kolumnach – każda liczba nad swoim opisem (lista budów, kafelki ostatnich budów, kafelek Urządzenia na ekranie budowy); pasek postępu wrócił na kafelek Urządzenia.
- „Do rozp.” = urządzenia, na których nic nie wpisano: bez kroku, nr seryjnego, zdjęcia, braku (także zamkniętego), notatki i protokołu; zmiany biura (pozycja, system, edycja) się nie liczą. Ta sama reguła: filtr listy urządzeń, liczniki aplikacji, serwer (`licz.r`) i zakładka Liczniki.

## 1.37.0 – 2026-11-18 (aplikacja i serwer)
- Karta urządzenia (rola biuro): „Edytuj” – Typ, Zasilanie, Oznaczenie z projektu, Uwagi; podpowiedzi z wartości na budowie; ID i rodzaj urządzenia bez zmian.
- Zdarzenie `urz_edyc` (tylko rola biuro): zmiana widoczna od razu na tablecie, w historii urządzenia z poprzednią wartością; serwer poprawia kolumny C, D, G, M w zakładce Urządzenia.

## 1.36.0 – 2026-11-18 (aplikacja; numer wspólny z serwerem 1.36.0)
- Ekran budowy, kafelek Urządzenia: dwie linie liczników – „do rozp. / otw. f.” i „uruch. / podł. / rozp. / wszystkie”, mniejsza czcionka (mieszczą się liczby trzycyfrowe na tablecie w pionie).
- Lista urządzeń: filtr „Do rozp.” (bez żadnego kroku i nr seryjnego – ta sama reguła co licznik); filtr „Front otw.” przemianowany na „Otw. f.”.

## Serwer 1.36.0 – 2026-11-18 (schemat 1.11)
- Zakładka „Liczniki” w Bazie: przy każdym przeliczeniu liczników skrypt wpisuje wiersz budowy (wszystkie, rozpoczęte, podłączone, uruchomione, do rozpoczęcia, otworzył się front, otwarte braki, notatki, ostatni wpis, autor) – źródło dla porannego zadania Claude → ClickUp (etap „Status”).
- Priorytety: etap „Status” w liście ClickUp i jego podzadania pomijane w ocenie budowy.

## 1.35.0 – 2026-11-18 (aplikacja)
- Zdjęcia z budowy (rola biuro): „Pobierz miniatury” – archiwum ZIP ze zdjęciami z wybranej zakładki, 800 px; brakujące na tablecie pobierane z Dysku (wymaga sieci); komunikat o pominiętych.

## 1.34.0 – 2026-11-18
- Notatki (rola biuro): „Edytuj”, „Usuń” (do kosza) i „Przywróć”; kosz notatek w widoku Notatki; zmiany jako zdarzenie `notatka_edyc` (historia zostaje); notatki w koszu poza listą, licznikami i zdjęciami budowy.
- Okno zdjęcia (rola biuro): „Pobierz” – plik w pełnej rozdzielczości (z tego tabletu oryginał, z innych – pełny plik z Dysku).
- Lista budów: sortowanie „Nr / Naz. / Rozp / Fr.otw” (Fr.otw – liczba urządzeń z otwartym frontem, malejąco); filtr „front otw.” zastąpiony sortowaniem.
- Serwer 1.34.0: zdarzenie `notatka_edyc` przyjmowane tylko od roli biuro; licznik notatek bez notatek w koszu.

## 1.33.2 – 2026-11-18 (aplikacja)
- Lista budów na wąskim ekranie (tablet w pionie): liczniki w drugiej linii wiersza pod nazwą, mniejsza czcionka, pasek postępu na całą szerokość; nagłówek „Aktywne budowy (N)”, filtr i sortowanie w osobnej linii.

## 1.33.1 – 2026-11-18 (aplikacja)
- Kafelki „Ostatnio na tym tablecie”: licznik „do rozp.” bez „otw. f.”; otwarty front jako zielona ikona drzwi z liczbą obok usterek i notatek; mniejsza czcionka liczników.

## 1.33.0 – 2026-11-18
- Lista budów i kafelki: licznik „do rozp. / otw. f.” (urządzenia bez żadnej czynności / urządzenia, na których otworzył się front), odstęp, dalej uruch. / podł. / rozp. / wszystkie; pod spodem usterki i liczba notatek.
- Kierownik HUP-BUD budowy pod adresem (Baza → Projekty → Kierownik, schemat 1.10).
- „Otworzył się front”: zamknięcie braku urządzenia ustawia flagę, czynność (krok, nr seryjny) lub nowy brak ją kasuje; ikona drzwi na liście urządzeń; serwer zapisuje kolumnę „Otworzył się front” w Urządzeniach.
- Filtr „front otw.” na liście budów (zapamiętany na tablecie) i w filtrach listy urządzeń.
- Notatki: dotknięcie otwiera okno z pełnym tekstem, autorem, urządzeniem („Na rzucie”) i zdjęciami.
- Serwer 1.33.0: `licz.f`, `licz.nt`, pole `kierownik` w liście budów.

## 1.32.3 – 2026-11-17 (aplikacja)
- Zdjęcia z budowy: przycisk „Na rzucie” na kafelku przeniesiony do pola opisu zdjęcia, po prawej.

## 1.32.2 – 2026-11-17 (aplikacja)
- Lista urządzeń: ikonka czerwonego trójkąta przy otwartym braku i ikonka aparatu przy zdjęciach (urządzenia i jego braków), z liczbą, gdy więcej niż 1.
- Zdjęcia z budowy: przycisk „Na rzucie” w dolnym prawym rogu zdjęcia na kafelku.

## 1.32.1 – 2026-11-17 (aplikacja)
- Zdjęcia z budowy: na kafelku zdjęcia urządzenia (także zdjęcia braku przy urządzeniu) okrągły przycisk z celownikiem, a w podglądzie zdjęcia przycisk „Na rzucie” – przejście do urządzenia na rzucie z pulsującą kropką. Brak przycisku, gdy urządzenie nie ma pozycji na rzucie lub zdjęcie nie dotyczy urządzenia.

## 1.32.0 – 2026-11-17 (aplikacja)
- Znacznik „offline” (budowy zapisane w tablecie, pliki na kafelku Dokumenty): ikona chmury z pobieraniem zamiast „✓”.

## 1.31.9 – 2026-11-17 (aplikacja)
- Nagłówek: bieżąca czynność synchronizacji (np. „Pobieranie rzutów 3/7 · 45%”) w polu stanu sieci zamiast „Online”, z migającą żółtą kropką; po zakończeniu wraca „Zsynchr. gg:mm” / „Online” / „Offline”. Osobna plakietka pod nagłówkiem usunięta, cienka linia postępu zostaje.

## 1.31.8 – 2026-11-17 (aplikacja)
- Lista budów: przycisk sortowania „Podłączone” → „Rozpoczęto %”.

## 1.31.7 – 2026-11-17 (aplikacja)
- Synchronizacja: pasek postępu jako cienka linia na dolnej krawędzi nagłówka i mały napis nad treścią – nie powiększa górnego paska i nie przesuwa widoku.

## 1.31.6 – 2026-11-17 (aplikacja)
- Automatyczna synchronizacja co 10 min (wcześniej co 3 min). Bez zmian: synchronizacja po zalogowaniu, po odzyskaniu sieci, po otwarciu budowy, po zamknięciu protokołu i przyciskiem ⟳.

## 1.31.5 – 2026-11-17 (aplikacja)
- Przyciski z ikoną (m.in. „Na rzucie”): ikona i tekst w jednej linii, wyśrodkowane w pionie.

## 1.31.4 – 2026-11-17 (aplikacja)
- Karta urządzenia i okno braku: przycisk „Na rzucie” z ikoną celownika (pinezka zostaje przy „Ustaw na rzucie”).

## 1.31.3 – 2026-11-17 (aplikacja)
- Karta urządzenia: przycisk „Na rzucie” → „Pokaż” z ikoną pinezki (jak w oknie braku).

## 1.31.2 – 2026-11-17 (aplikacja)
- Lista budów: sortowanie „Podłączone” po % urządzeń z rozpoczętą pracą (rozp. / wszystkie), a nie po liczbie podłączonych; budowy bez liczników zawsze na końcu.

## 1.31.1 – 2026-11-17 (aplikacja – poprawka)
- Rzut: „Pokaż” / „Na rzucie” przy dużym pliku rzutu wskazywały zawsze cały rzut – przybliżenie liczone było przed wczytaniem obrazu i po wczytaniu nadpisywane widokiem całości. Teraz wskazanie czeka na wczytanie rzutu.

## 1.31.0 – 2026-11-17 (aplikacja)
- Budowa → Urządzenia: pasek Rzut / Lista, lista rozwijana System (wszystkie, każda szafa / rozdzielnica z liczbą urządzeń, bez systemu), lista rozwijana Filtr (stan, protokoły, typy urządzeń), „+ Dodaj urządzenie” po prawej w tej samej wysokości; w pionie pasek w dwóch liniach.
- Okno braku: przyciski „Urządzenie …” i „Pokaż” (rzut z przybliżeniem na urządzenie; wyszarzony, gdy brak pozycji).
- Rzut: kropka wskazanego urządzenia pulsuje ok. 1 s (także „Na rzucie” w karcie urządzenia).

## 1.30.3 – 2026-11-17 (aplikacja)
- Rzut: urządzenia w tym samym (lub prawie tym samym, < 0,006) miejscu – kropki w rzędzie obok siebie, stykające się bokiem, przy każdym powiększeniu; dotknięcie trafia we właściwą kropkę.
- Przesuwanie kropki: dotyk 2 lub więcej palcami (powiększanie) nie uruchamia odliczania – aż do zdjęcia wszystkich palców.

## 1.30.2 – 2026-11-17 (aplikacja)
- Rzut: przy przytrzymaniu kropki okrąg rośnie przez 0,5 s, potem do 2 s linia zmienia kolor na zielony stopniowo dookoła; w trybie przesuwania otoczka miga na zielono.

## 1.30.1 – 2026-11-17 (aplikacja)
- Rzut: otoczka wokół kropki przy przesuwaniu – podczas 2 s przytrzymania rośnie (postęp), w trybie przesuwania miga, kilka razy większa od kropki.

## 1.30.0 – 2026-11-17 (aplikacja i serwer)
- Wpisany nr seryjny = prace rozpoczęte: urządzenie „w toku” (kolor na rzucie i liście), liczy się do „rozp.” (tablet i serwer).
- Zgłoś brak: bez domyślnego rodzaju; opis wymagany tylko przy „Inne” lub bez rodzaju.
- Rzut: przytrzymanie znacznika 2 s → przesuwanie palcem → potwierdzenie „Zapisz pozycję / Anuluj” (każdy). Lista: „Ustaw na rzucie” dla urządzeń bez pozycji.
- Karta urządzenia (biuro): Administracja – zmiana systemu, ponowne ustawienie pozycji, usunięcie urządzenia (z powodem).
- Serwer: zdarzenia `urz_poz`, `urz_sys`, `urz_usun` zapisywane w zakładce Urządzenia; usunięte wiersze w zakładce „Usunięte”, ich ID nie wracają do puli.

## 1.29.0 – 2026-11-16 (aplikacja)
- Lista budów: sortowanie „Wszystkie aktywne budowy” obok nagłówka – Nr (budowy), Nazwa (alfabetycznie), Podłączone (liczba podłączonych urządzeń, domyślnie od największej); ponowne dotknięcie odwraca kierunek; wybór zapamiętany na tablecie. Kafelki „Ostatnio na tym tablecie” bez zmian.

## 1.28.1 – 2026-11-16 (aplikacja)
- Protokoły: `z_urzadzenia` przyjmuje `oz|id` (pierwsza niepusta wartość), `(id)` (w nawiasie) i `oz?(id)` (tylko gdy jest oznaczenie z projektu); nowy typ pola `ukryte` – tylko do Worda, bez pola na tablecie.
- WB-COLPG v0.4: nr wentylatora = oznaczenie z projektu (brak → ID ELWIS), w Wordzie pod nim ID ELWIS w nawiasie.

## 1.28.0 – 2026-11-16 (aplikacja)
- Karta szafy: protokół dedykowany („Do wykonania”, „+ kolejny”) dostępny dopiero, gdy wszystkie urządzenia systemu są uruchomione (wszystkie kroki) i mają nr seryjny (typy z „Nr seryjny wymagany”); inaczej lista braków z przejściem do karty urządzenia. Ekran Protokoły: „Czego brakuje” zamiast „Wypełnij”.
- Tabele protokołu: „Dodaj wszystkie” dodaje brakujące urządzenia systemu szafy; wyszarzone, gdy w systemie nie ma urządzeń tego typu.
- Definicja: `siatka` i `waga` – układ pól w kolumnach (biegi Hz | A, wąskie „Obsługiwany”, szerszy nr seryjny).
- WB-COLPG v0.4 (plik definicji): „Obsługiwany” domyślnie TAK; usunięte „Uruchomiony” (wyciągowe) i „Uruchomiony bieg 1/2” (strumieniowe).

## 1.27.0 – 2026-11-16 (aplikacja)
- Protokoły z karty szafy: tabele z polem „urządzenie” wypełniają się od razu urządzeniami systemu szafy (pasujące typem, wybrany etap, kolejno kondygnacja → ID) z danymi z karty (ID, nr seryjny…). Wyłączenie w definicji: `"z_systemu": false`.
- Pole definicji `ilosc_z_systemu: [prefiksy]` – liczba takich urządzeń w systemie (WB-COLPG: ilość detektorów CO = DC, LPG = DL).
- Dotyczy tylko nowych protokołów; zapisane bez zmian.

## 1.26.0 – 2026-11-16 (aplikacja)
- Rzut: przyciski + / − / ⤢ przeniesione do prawego górnego rogu rzutu – nie chowają się pod dolnym paskiem skrótów.
- Lista budów: „Wszystkie aktywne budowy” przewijana w sobie (wysokość do dolnego paska, min. 280 px) – strona nie przesuwa się przy przewijaniu do ostatniej budowy.

## 1.25.1 – 2026-11-16 (aplikacja i serwer – poprawka)
- Lista budów i „Ostatnie zmiany”: liczniki uruch./podł./rozp./wszystkie i usterki liczone na tablecie dla każdej budowy zapisanej na tablecie, nie tylko otwartej (wcześniej pojawiały się dopiero po wejściu w budowę i powrocie).
- Serwer: `uzupelnijLicz_` – co godzinę (z `przeliczPriorytety`) uzupełnia liczniki budów, które ich nie mają (po 5 na godzinę); `przeliczLiczniki()` – ręczne przeliczenie wszystkich aktywnych budów.

## 1.25.0 – 2026-11-16 (aplikacja i serwer, schemat 1.9)
- Schemat 1.9: kolumna N „System” w zakładce Urządzenia list urządzeń – ID urządzenia sterującego (szafy), kilka przez średnik; szafa ma w niej swoje ID.
- Serwer: `project` przekazuje pole `sys`.
- Karta urządzenia: „System” – przycisk otwierający kartę szafy; w karcie szafy podsumowanie jej systemu (liczba urządzeń, podłączone, uruchomione, pasek). Wyszukiwarka listy urządzeń szuka też po systemie.

## 1.24.0 – 2026-11-16 (aplikacja i serwer)
- Priorytety → nowa zakładka „Ostatnie zmiany” (tylko rola biuro): aktywne budowy od najnowszej zmiany – kod, nazwa, adres, czas i autor ostatniego wpisu z tabletu, liczba wpisów tego dnia, liczniki uruchomione / podłączone / rozpoczęte / wszystkie i usterki. Dotknięcie otwiera budowę.
- Serwer: `licz` uzupełniony o `t` (czas ostatniego wpisu), `k` (autor), `n` (wpisy tego dnia). Wymaga wdrożenia Code.gs (Nowa wersja) – razem ze zmianą z 1.23.0.

## 1.23.3 – 2026-11-16 (aplikacja)
- Napis ELWIS (logowanie, górny pasek) czcionką Orbitron (lokalna, licencja OFL – `fonts/LICENSE-Orbitron.txt`) z żółtą literą „I”.
- Ekran logowania: „Designed by / Łukasz Pomarański” w dwóch liniach; pod klawiaturą PIN znak wodny – ikona ELWIS i „Designed by Łukasz Pomarański for HUP-BUD Sp. z o.o.”.

## 1.23.2 – 2026-11-16 (aplikacja)
- Plan „Wszyscy”: po dotknięciu osoby w pasku osób pasek zostaje w tym samym miejscu (wcześniej przewijał się na początek).

## 1.23.1 – 2026-11-16 (aplikacja)
- Kafelek „Urządzenia” na ekranie budowy: te same liczniki co na liście budów (uruchomione / podłączone / rozpoczęte / wszystkie, pasek w trzech odcieniach, „⚠ N usterek”) – dla wybranego etapu.

## 1.23.0 – 2026-11-16 (aplikacja i serwer)
- Lista budów (kafelki i lista): liczniki `uruchomione / podłączone / rozpoczęte / wszystkie` urządzenia i pasek w trzech odcieniach zieleni; otwarte braki na czerwono („⚠ N usterek”). Uruchomione = wszystkie kroki; podłączone = wszystkie kroki ze słowem „podłącz”; rozpoczęte = co najmniej jeden krok. Otwarty brak nie zeruje już postępu urządzenia.
- Serwer: liczniki budowy (`licz` w `bootstrap`) liczone przy każdym `push` z nowymi zdarzeniami, także przy brakach bez urządzenia. Wymaga wdrożenia Code.gs (Nowa wersja); do tego czasu nieotwarte budowy pokazują dotychczasowe „gotowe / wszystkie”.

## 1.22.1 – 2026-11-16 (aplikacja)
- Poprawka: przy wpisywaniu w wyszukiwarkę (lista budów, notatki, lista urządzeń) klawiatura chowała się po każdej literze – cały ekran był przerysowywany razem z polem. Teraz odświeżane są tylko wyniki, pole i klawiatura zostają.

## 1.22.0 – 2026-11-16 (aplikacja)
- Kroki z wariantami: w Słownikach krok zapisany jako `Nazwa [wariant A | wariant B]` (np. `Podłączony [puszka HupBud | puszka b. el.]`) – na tablecie dotknięcie kroku pokazuje przyciski wariantów; wybrany wariant widać przy kroku i w historii; ponowne dotknięcie: zmiana wariantu lub „Cofnij”. Krok liczy się jako wykonany niezależnie od wariantu (postęp, status, Priorytety bez zmian). Serwer bez zmian (wartość kroku = nazwa wariantu).

## 1.21.1 – 2026-11-14 (aplikacja)
- Poprawka 1.21.0: kod QR zrobiony w przeglądarce otwartej na adresie `…/exec` zawierał adres przekierowania `script.googleusercontent.com/…/echo` (jednorazowa odpowiedź serwera – zawsze „Nieznany lub wyłączony klucz tabletu”). Taki adres jest teraz odrzucany przy skanowaniu i przy połączeniu, z podpowiedzią, skąd wziąć właściwy.

## 1.21.0 – 2026-11-14 (aplikacja)
- Konfiguracja tabletu: przycisk „Skanuj QR” przy adresie serwera – adres `…/exec` wczytuje się z kodu QR wygenerowanego na komputerze (np. Chrome → Udostępnij → Utwórz kod QR). Działa także w trybie kiosku, bez przepisywania długiego adresu. Klucz tabletu wpisuje się jak dotąd.

## 1.20.1 – 2026-11-10 (aplikacja)
- Poprawka: na ekranie Plan wróciła oś godzin i układ kolumn (błąd z 1.17.0 – pomyłkowo zmieniona nazwa klasy siatki planu).

## 1.20.0 – 2026-11-10 (aplikacja + serwer)
- Priorytety liczone także dla budów wpisanych do Bazy z „Aktywna = nie” i ID listy ClickUp (projekty czekające na skill „nowa budowa”): oceniane z zadań ClickUp, a gdy mają już listę urządzeń – także z danych z budowy. Na kafelku dopisek „poza ELWIS”; w zakładce Budowy nadal widać tylko budowy aktywne.
- Listy z przestrzeni „PROJ …”, których nie ma jeszcze w Bazie, dalej trafiają na ekran (zabezpieczenie przed pominięciem nowego projektu).

## 1.19.0 – 2026-11-10 (aplikacja + serwer)
- Priorytety obejmują wszystkie projekty z przestrzeni ClickUp „PROJ …” (także oferty z kodem `RRpNNN`), nie tylko budowy z Bazy. Budowa spoza Bazy ma dopisek „tylko ClickUp”, jest oceniana z zadań (terminy, zamówienia, zależności, przerwane, bez ekipy), a kafelek otwiera listę w ClickUp.
- Pomijane są tylko projekty, w których wszystkie zadania są zakończone.
- Serwer pobiera zadania jednym zapytaniem na przestrzenie (otwarte + zamknięte z 12 tygodni) zamiast osobno dla każdej listy – mniej zapytań do ClickUp.

## 1.18.0 – 2026-11-10 (aplikacja + serwer, schemat 1.8)
- Ekran „Wydajność ekip” (tylko rola biuro): wykres trendu tygodniowego / miesięcznego z porównaniem ekip w 4 kategoriach – podłączenia (% normy dnia), terminowość zadań, kompletność wpisów (nr seryjne), przestoje (braki blokujące); karta ekipy z wynikiem, strzałką trendu i zmierzonym czasem na typ urządzenia.
- Progi alarmowe i normy czasu w Bazie → Konfiguracja (`progi`, `normy_min`); przekroczony próg = alarm na ekranach Priorytety i Wydajność ekip.
- Komentarz z analizy Claude (`analiza_claude` w Konfiguracji) widoczny na ekranie Priorytety i na kafelkach budów.

## 1.17.0 – 2026-11-10 (aplikacja + serwer)
- Ekran „Priorytety” (tylko rola biuro, czwarty przycisk dolnego paska): kafelki wszystkich aktywnych budów w kolejności wymaganego działania – pilne, uwaga, w normie.
- Silnik reguł na serwerze (operacja `priorytety`, tylko odczyt): termin „Koniec umowny projektu” i zapas dni roboczych, zamówienia (po terminie / najpóźniejszy dzień zamówienia), zadania po terminie, przerwane i niepodjęte, start bez ekipy, zadania blokujące inne (zależności ClickUp), braki blokujące, tempo podłączeń wobec potrzebnego, brak protokołów, punkty „Do weryfikacji po rozpoznaniu”.
- Przeliczanie co godzinę (funkcja `instalacjaPriorytetow` uruchamiana raz z edytora) albo przyciskiem „Przelicz teraz”; wynik dostępny offline.

## 1.16.0 – 2026-11-10 (aplikacja + serwer)
- Szybsza synchronizacja: pliki (rzuty, dokumenty, DTR) pobierane po 3 naraz – narzut serwera na każde zapytanie nakłada się zamiast sumować (pierwsze pobranie 30 budów ok. 2× szybciej).
- Serwer pamięta listę tabletów (60 s) i aktywnych budów (5 min) – każde zapytanie nie czyta Bazy od nowa; nowa / wyłączona budowa widoczna na tabletach najpóźniej po 5 min (pinezka – od razu).
- Serwer podaje w `bootstrap` liczbę zdarzeń każdej budowy (`zd`); tablet nie pyta o nowe wpisy budowy, w której nic nie przybyło.
- Pomiar: czas ostatniej synchronizacji, liczba budów i pobrane MB dopisywane do Tablety → Stan pamięci.
- Historia urządzenia: wpis „dodano urządzenie”.

## 1.15.0 – 2026-11-10 (aplikacja + serwer)
- „+ Dodaj urządzenie” na rzucie i liście urządzeń – tylko rola biuro. Typ ze Słowników, rzut, kondygnacja, oznaczenie z projektu, uwagi; pozycja przez dotknięcie rzutu. Działa offline (nowe zdarzenie `urz_nowe`); do synchronizacji urządzenie ma ID tymczasowe, potem serwer nadaje kolejny numer dla prefiksu i dopisuje wiersz do zakładki Urządzenia. Wpisy i zdjęcia zrobione na nowym urządzeniu przed synchronizacją dostają nadane ID.
- Przyciski rzutów opisane poziomem („-1 garaż”, „0 parter”, „1 piętro”, tekst z kolumny Kondygnacja, np. „+2 poddasze”, „dach niski”), pod spodem szarą czcionką nazwa rzutu; kolejność od najniższego poziomu do najwyższego. Na liście urządzeń te same przyciski jako filtr („Wszystkie poziomy”), grupy listy w kolejności poziomów; poziom także w karcie urządzenia, opisie zdjęć i wyborze urządzenia w protokole.
- Serwer 1.15.0: zdarzenie `urz_nowe`, w odpowiedzi `push` mapa `nowe`.

## 1.14.1 – 2026-11-10 (aplikacja)
- Plan dnia: oś zawsze od 7:00, najpóźniej do 24:00 – kafelki nie pokazują już godzin powyżej 24 (błąd: zadania wielodniowe i długie szacowane czasy wpasowywane za północ).
- Zadania całodniowe (bez godzin i bez „Estimated Time”) oraz wielodniowe bez godzin: 7:00–15:00, opis „cały dzień”; stoją obok innych zadań, nie wypychają ich.
- Zadania wielodniowe z godzinami: 1. dzień od godziny startu, środkowe dni 7–15, ostatni do godziny końca; na kafelku dni i godziny (np. „pn 08:00 – śr 16:00”).
- Zadania z „Estimated Time” bez godzin: wpasowane od 7:00, gdy brak miejsca przed północą – ostatnie miejsce przed 24:00 obok innych.

## 1.14.0 – 2026-11-09 (aplikacja + serwer, schemat 1.7)
- Oznaczenie z projektu (kolumna M „Oznaczenie proj.” listy urządzeń) przy ID urządzenia: lista, karta urządzenia, braki, notatki, protokoły (wybór urządzenia), podpis na rzucie, opis zdjęć i galeria.
- Lista urządzeń: sortowanie „ID ELWIS” / „Oznaczenie proj.” (sortowanie naturalne, w grupach kondygnacji, wybór zapamiętany), wyszukiwanie po ID, oznaczeniu, typie, uwagach i nr seryjnym.
- Pasek z przełącznikiem Rzut/Lista, filtrami, wyszukiwaniem i sortowaniem przyklejony u góry przy przewijaniu.
- Serwer 1.14.0: czyta kolumnę M („oz”).

## 1.13.0 – 2026-11-09 (aplikacja + serwer)
- Plan: bez przycisku „Wszystkie budowy”; dolny pasek Plan · Budowy · Dokumenty techniczne (wcześniej Synchronizuj – przyciski paska nie działały, naprawione); synchronizacja ⟳ w górnym pasku z liczbą rzeczy do wysłania.
- Plan „Wszyscy”: wybrane osoby i tryb widoku zapamiętane dla użytkownika – nie znikają po zmianie dnia ani po zamknięciu aplikacji.
- Po ponownym otwarciu aplikacji (bez wylogowania) – powrót do ostatniego ekranu (budowa, zakładka, etap, dzień).
- Ekran budowy: w ciemnym nagłówku tylko nazwa, adres i Nawiguj / pinezka; etapy pod nagłówkiem („Cała budowa”, „Etap A” …); bez paska statystyk – 6 kafelków ze statystykami: Urządzenia (podłączone / wszystkie), Protokoły (wykonane / wymagane), Braki (otwarte + „Zgłoś brak”), Zdjęcia, Notatki (+ „Notatka”), Dokumenty projektowe (pliki, ile offline); „Więcej”: Dokumenty techniczne, Postęp.
- Lista budów: ciemny nagłówek „Wyszukaj budowę” z polem wyszukiwania; przy budowach postęp „podłączone / wszystkie” (serwer liczy przy pobraniu budowy i przy zmianie statusów).
- Systemowe „wstecz”: wpis historii dodawany przy dotknięciu ekranu (Chrome na Androidzie pomijał wpis dodany przy starcie, przez co „wstecz” zamykało aplikację bez pytania).
- Serwer 1.13.0: postęp budów (`postep: [gotowe, wszystkie]`) w bootstrap.

## 1.12.0 – 2026-11-09 (aplikacja + serwer)
- Wygląd B: czcionki Inter i JetBrains Mono (lokalnie, działa offline), granatowy nagłówek, karty z cieniem, ikony liniowe, dolny pasek Plan · Budowy · Synchronizuj (z liczbą rzeczy do wysłania).
- Ekran budowy: nagłówek z numerem i nazwą, adresem i kontaktem; Nawiguj / Zapisz pinezkę / Dodaj pinezkę, Zgłoś brak, Notatka; pierścień postępu; 4 główne kafelki (Urządzenia, Protokoły, Braki, Zdjęcia); sekcja „Więcej”: Notatki, Postęp i etapy, Dokumenty projektowe, Dokumenty techniczne.
- Nowe ekrany: Notatki (z wyszukiwaniem), Zdjęcia z budowy (z opisem urządzenia / braku / notatki, filtry), Dokumenty projektowe, Dokumenty techniczne.
- Lista urządzeń: znacznik protokołu (✓ numer / roboczy / do wykonania) i filtry Bez protokołu / Protokół roboczy / Z protokołem.
- Pinezka GPS: zapis aktualnej pozycji (zgoda na lokalizację, ostrzeżenie przy dokładności > 50 m); offline w kolejce; serwer wpisuje do Projekty!D „Pinezka GPS (lat,lon)” – pustą każdy, istniejącą zmienia tylko biuro.
- Plan: dotknięcie zadania otwiera okienko (opis z ClickUp, godziny, osoby, „Przejdź do budowy”) z trzema statusami: Wykonane (complete), Do kontynuacji (update required), Zadanie niepodjęte (on hold); powód i komentarz opcjonalne. Działa offline – status czeka w kolejce, serwer zmienia status w ClickUp i dodaje komentarz.
- Zdjęcia: opis wtopiony w lewy górny róg – budowa, urządzenie (ID, typ, kondygnacja, arkusz) lub brak/notatka, data, godzina, autor.
- Systemowe „wstecz” na planie dnia: pytanie „Zamknąć aplikację?”; kolejne „wstecz” zamyka.
- Serwer 1.12.0: operacja `zadania` (tylko 3 statusy), zdarzenie `pinezka`, opis zadania w planie, odświeżanie pamięci planu po zmianie statusu.

## 1.11.9 – 2026-11-09 (aplikacja)
- Plan: zadania nachodzące na siebie stoją obok siebie (tory), stykające się (koniec = początek) jedno pod drugim; krótkie zadania (< ok. 50 min) w jednej linii – godzina i nazwa.

## 1.11.8 – 2026-11-08 (aplikacja)
- „Wstecz” wszędzie wraca do poprzedniego ekranu (stos nawigacji zamiast stałych powrotów): np. protokół lub rzut otwarty z karty urządzenia wraca na ekran, z którego przyszliśmy, i ponownie otwiera kartę urządzenia; po przesłaniu lub usunięciu protokołu też wraca tam, skąd go otwarto.
- Systemowy przycisk „wstecz” Androida działa jak strzałka w aplikacji: najpierw zamyka otwarte okno, potem cofa ekran; na planie dnia zamyka aplikację.

## 1.11.7 – 2026-11-08 (aplikacja)
- Budowa otwarta z kafelka zadania w planie: przycisk „wstecz” wraca do planu (ten sam dzień i widok), a nie do listy budów. Budowa otwarta z listy budów wraca jak dotąd do listy.

## 1.11.6 – 2026-11-08 (aplikacja)
- Kafelki zadań w planie: nad nazwą zadania mała szara linia z numerem i nazwą budowy (zamiast plakietki z samym numerem); dla zadań spoza ELWIS – nazwa listy z ClickUp.

## 1.11.5 – 2026-11-08 (aplikacja)
- Pasek dni: przy przeciąganiu kolejne dni wjeżdżają płynnie (po 7 dni zapasu z każdej strony), po puszczeniu pasek dociąga do pełnego dnia; tap w dzień działa jak dotąd.
- Kafelek zadania: po prawej pogoda (7–16, deszcz) z lokalizacji budowy, jeśli jest wpisana.

## 1.11.4 – 2026-11-08 (aplikacja i serwer)
- Plan dnia: serwer wysyła pracownikowi plan bez zadań osób z rolą biuro (wspólne zadania zostają, bez osób z biura); pełny plan tylko dla roli biuro (parametr `kto` w operacji `plan`). Po wylogowaniu roli biuro plan jest usuwany z tabletu.

## 1.11.3 – 2026-11-08 (aplikacja)
- Kafelki dni wróciły do dawnej wysokości: duża ikona pogody obok daty, temperatura 7–16 w jednej linii z kropkami zadań; deszcz pokazuje ikona (bez napisu „pada”).

## 1.11.2 – 2026-11-08 (aplikacja)
- Plan „Wszyscy”: pracownicy nie widzą kalendarzy osób z rolą biuro (administratora) – ani kolumn, ani ich nazwisk przy wspólnych zadaniach; rola biuro widzi wszystkich.

## 1.11.1 – 2026-11-08 (aplikacja)
- Pogoda: duża ikona na kafelku dnia (najgorsza pogoda w godzinach 7–16: ☀️ ⛅ ☁️ 🌫️ 🌧️ 🌨️ ⛈️; przy prognozie opadu zawsze ikona deszczu i napis „pada”), większa temperatura; ikona także w podsumowaniu dnia.

## 1.11.0 – 2026-11-08 (aplikacja)
- Pogoda w planie: na kafelkach dni temperatura min/maks w godzinach 7–16 i „☔ pada” / „—”; w podsumowaniu dnia „7–16: 6°…9° · bez opadów / będzie padać (do 70%)” i miejsce prognozy (żółte tło, gdy pada).
- Miejsce prognozy: budowa z kolumną „Lokalizacja” (współrzędne), na której zalogowany ma zadania tego dnia; inaczej Lublin.
- Prognoza z Open-Meteo (bez konta i klucza; wysyłane tylko współrzędne) pobierana przy synchronizacji, 7 dni wstecz i 16 naprzód, zapamiętana na tablecie (działa offline). „Pada” = opad ≥ 0,2 mm lub prawdopodobieństwo ≥ 60% w godzinach 7–16.

## 1.10.2 – 2026-11-08 (aplikacja)
- Pasek dni: 7 kolejnych dni przesuwanych o pojedyncze dni – przeciągnięcie o jeden kafelek = jeden dzień (o kilka kafelków = kilka dni); domyślnie wybrany dzień w środku; „↺ dziś” wraca do bieżącego dnia.

## 1.10.1 – 2026-11-08 (aplikacja)
- Plan: zadania bez godzin i bez „Estimated Time” też trafiają na oś (po zadaniach z szacowanym czasem), z czasem 1,5 h dobranym do wielkości kafelka i opisem „czas nieokreślony”; lista „Bez godziny” znika, gdy pusta.
- Pasek tygodnia: zmiana tygodnia przeciągnięciem kafelków dni w lewo / prawo (bez strzałek); dotknięcie dnia – jak dotąd.

## 1.10.0 – 2026-11-08 (aplikacja i serwer)
- Nowy wygląd ekranu „Mój plan”: karta z powitaniem, przełącznik Mój plan / Wszyscy i „Wszystkie budowy” u góry, pasek tygodnia (pn–nd, kropki = liczba zadań), podsumowanie dnia, linia „teraz”, plakietki z kodem budowy, zadania bez godziny jako kafelki.
- „Wszyscy”: kolumna zalogowanej osoby pierwsza; domyślnie tylko osoby z zadaniami w danym dniu (wcześniej np. kolumna biura była poza ekranem); pasek osób z liczbą zadań – dotknięcie pokazuje / ukrywa kolumnę; nazwiska przyklejone przy przewijaniu.
- Zadania bez godzin z „Estimated Time” w ClickUp są wpasowywane w wolne miejsca osi od 7:00 (kreskowane, „Kierownik nie określił pory dnia”); serwer zwraca `est` (ms).
- Ekran logowania i konfiguracji: „Designed by Łukasz Pomarański” pod logo.
- Przycisk „wstecz” w nagłówku dwa razy szerszy (88 px) – łatwiej trafić na budowie.

## 1.9.0 – 2026-11-08 (aplikacja i serwer)
- Braki: dotknięcie kafelka otwiera okno braku – kategoria, opis, „blokuje pracę”, zdjęcia, komentarze (z tekstem i zdjęciami), historia zmian.
- Uprawnienia: edycja, komentarz i zamknięcie – każdy; usunięcie – autor braku i biuro; ponowne otwarcie zamkniętego – biuro.
- Nowe zdarzenia `brak_edyc` (`kat, opis, blokuje, foto[]`, `usun`, `otworz`) i `brak_kom` (`tekst, foto[]`); serwer sprawdza uprawnienia do usunięcia i ponownego otwarcia; status urządzenia uwzględnia usunięte / ponownie otwarte braki.
- Tematy do wyjaśnienia widoczne tylko dla roli biuro (dotyczą przygotowania projektu); kafelek „Braki” dla pracowników.

## 1.8.0 – 2026-11-08 (aplikacja i serwer)
- Podgląd zdjęć: dotknięcie miniatury (karta urządzenia, karty braków) otwiera zdjęcie na cały ekran z autorem i datą. Zdjęcia zrobione na tym tablecie – w pełnej rozdzielczości; z innych tabletów – pobierane na żądanie i zapisywane pomniejszone (ok. 800 px), żeby nie zajmowały miejsca; usuwane razem z budową z pamięci.
- Usuwanie zdjęć: w podglądzie „Usuń zdjęcie” (autor – swoje, biuro – wszystkie); nowe zdarzenie `foto_usun`; niewysłane zdjęcie nie zostanie wysłane, wysłane serwer przenosi z Dysku do kosza (sprawdza autora).
- Serwer: operacja `foto` (podgląd zdjęcia z folderu Zdjęcia aktywnej budowy, tylko pliki zapisane przez ELWIS).

## 1.7.0 – 2026-11-08 (aplikacja i serwer, schemat 1.6)
- Synchronizacja: procent w nagłówku („Synchronizuję… 45%”) i pasek postępu pod nagłówkiem z opisem etapu (wysyłka zdjęć i wpisów, plan dnia, „Budowa 2/6 · pliki 3/12”, „DTR 5/18 · 45 MB / 120 MB”).
- Pamięć tabletu: limit budów liczony z wolnego miejsca (rezerwa 1 GB na zdjęcia, szkice i aktualizacje) – do 30 przy dużej ilości miejsca, mniej przy małej; najstarsze budowy usuwane najpierw; bieżąca i budowy z niewysłanymi danymi zostają zawsze.
- Miejsca na mniej niż 2 budowy (albo brak miejsca przy pobieraniu) → czerwony komunikat „Mało miejsca na tablecie – zgłoś to administratorowi (Łukasz P)”.
- Ustawienia: liczba budów w pamięci, aktualny limit, zajęte i wolne miejsce.
- Tablet zgłasza stan pamięci przy każdej synchronizacji (parametr `pamiec` w `bootstrap`); serwer wpisuje go w Bazie → Tablety, kolumna F „Stan pamięci” (schemat 1.6), z dopiskiem „MAŁO MIEJSCA”, gdy trzeba.

## 1.6.2 – 2026-11-08 (aplikacja)
- Protokół: przycisk „Zakończ” nazywa się „Prześlij” (działanie bez zmian: sprawdza pola wymagane, po synchronizacji serwer nadaje numer); na kafelku budowy „przesłanych” zamiast „zakończonych”.

## 1.6.1 – 2026-11-08 (aplikacja i serwer)
- Usuwanie protokołu: przycisk „Usuń protokół” w formularzu (z potwierdzeniem). Rola biuro – każdy protokół; pracownik – tylko szkic bez numeru.
- Usunięcie = zdarzenie `protokol` ze stanem `usuniety` (historia zostaje); protokół znika z list, „Do wykonania” wraca. Numer nie jest nadawany ponownie.
- Serwer: usuniętemu protokołowi nie nadaje numeru; wygenerowany Word przenosi do kosza; usunięcie protokołu z numerem przez pracownika jest ignorowane; „Generuj Word” dla usuniętego – odmowa.

## 1.6.0 – 2026-11-08 (aplikacja i serwer)
- Powiązanie protokołu z kilkoma typami urządzeń: Baza → Protokoły, kolumna E, np. `SZ; SP` (tekst w nawiasie = opis, pusto = każde urządzenie). Bootstrap zwraca `powiazania[]` (oraz `powiazanie` = pierwszy prefiks, dla zgodności).
- Lista protokołów budowy: najpierw **dedykowane** (rodzaj pracy w zakresie prac i typ urządzenia obecny na budowie, kolejność jak w zakładce Protokoły), niżej zwinięte **pozostałe** aktywne protokoły (alfabetycznie) z wyborem urządzenia z listy budowy lub „bez urządzenia”.
- Karta urządzenia: przycisk „Do wykonania: <protokół>” dla nierozpoczętego protokołu dedykowanego, zapisane protokoły ze stanem, „+ kolejny”, zwinięte „Inne protokoły”.
- Nowy typ pola definicji `urzadzenie` (`typy[]` – prefiksy): wybór urządzenia z listy budowy (filtr etapu, bez użytych w innych wierszach). Pola z `z_urzadzenia` (`id, sn, typ, kond, etap, arkusz, zasilanie, grupa`) wypełniają się po wyborze – m.in. nr seryjny spisany przy podłączeniu.
- Tabele z polem `urzadzenie`: przycisk „Dodaj wszystkie” (wiersz dla każdego urządzenia danego typu w etapie).
- Nr seryjny wpisany w wierszu tabeli z `zapisz_do_urzadzenia` trafia do karty wybranego urządzenia, gdy urządzenie nie ma jeszcze numeru.

## 1.5.2 – 2026-11-08 (aplikacja i serwer)
- Protokoły: gdy w Bazie projektów brak inwestora, pole „Inwestor” przyjmuje wartość z kolumny „Zamawiający”.

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
