# ELWIS – instrukcja uruchomienia

Wszystkie kroki wykonuje się **raz**, zalogowanym na konto ELWIS.

## 1. Serwer (Google Apps Script)
1. Otwórz https://script.google.com → **Nowy projekt**, nazwij go `ELWIS serwer`.
2. Wklej całą zawartość `apps-script/Code.gs` w miejsce pliku `Kod.gs`.
3. Ustawienia projektu (koło zębate) → zaznacz „Pokaż plik manifestu appsscript.json” → wklej zawartość `apps-script/appsscript.json`.
4. Wybierz funkcję `instalacja` → **Uruchom** → zezwól na dostęp (Zaawansowane → Przejdź do projektu).
5. **Wdróż → Nowe wdrożenie → Aplikacja internetowa**: Wykonaj jako **Ja**, Dostęp: **Każdy**. Skopiuj adres kończący się na `/exec`.
6. Dla każdego tabletu uruchom raz funkcję `dodajTablet` – w zakładce **Tablety** pojawi się wiersz z kluczem. Zmień nazwę tabletu w kolumnie A.

Aktualizacja serwera: wklej nowy kod → Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: **Nowa wersja** → Wdróż. Adres `/exec` się nie zmienia. Funkcji `instalacja` nie trzeba uruchamiać ponownie.

## 2. Aplikacja (GitHub Pages)
1. Repozytorium `elwis` → Settings → General → Danger Zone → **Change visibility → Public**.
2. Settings → **Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
3. Po 1–2 min aplikacja działa pod adresem `https://elwishupbudlublin-cpu.github.io/elwis/`.

## 3. Tablet (Android, Chrome)
1. Otwórz adres aplikacji w Chrome → menu ⋮ → **Dodaj do ekranu głównego / Zainstaluj**.
2. Przy pierwszym uruchomieniu wpisz adres serwera (`…/exec`) i klucz tabletu → **Połącz**.
3. Pracownik wybiera siebie i wpisuje PIN.

Tablet **nie loguje się** na konto Google ELWIS.

## 4. Budowa w aplikacji
Budowa pojawia się, gdy w Bazie projektów ma: kod, `Aktywna = tak`, wypełnione „Obiekt wojskowy”, link do folderu i listy urządzeń.
Rzuty: pliki `<Arkusz>.jpg` w folderze budowy **Do wglądu** (nazwa = wartość z kolumny Arkusz). Pozostałe pliki z „Do wglądu” są dokumentami.

## 4a. Etapy budowy (schemat 1.3)
Budowa z kilkoma budynkami / częściami: w Bazie projektów kolumna „Etap Budowy” (np. `A: Budynek A; B: Budynek B`), w liście urządzeń kolumna „Etap Budowy” z oznaczeniem (`A`, `B`). Przy co najmniej dwóch etapach aplikacja pokazuje przełącznik etapu.

## 4b. Pozostałe DTR
Folder `_Budowy/_Techniczne` – DTR wszystkich urządzeń, wrzucane ręcznie (można tworzyć podfoldery, np. producentów). Każdy tablet pobiera całość przy synchronizacji; pierwsze pobranie najlepiej przy WiFi. Pliki do 60 MB.

## 4c. Pamięć tabletu
Tablet trzyma komplet danych 30 ostatnio otwieranych budów (na liście „✓ offline”). Starsze są usuwane i pobierane ponownie przy otwarciu (wymaga internetu).

## 4d. Plan dnia z ClickUp (od 1.4.0)
1. W ClickUp: awatar → **Settings → Apps → API Token → Generate** – skopiuj klucz (zaczyna się od `pk_`). Nie wysyłaj go nikomu.
2. W Apps Script (projekt „ELWIS serwer”): ikona koła zębatego **Ustawienia projektu → Właściwości skryptu → Dodaj właściwość**: nazwa `CLICKUP_TOKEN`, wartość – klucz z punktu 1 → Zapisz.
3. Przy aktualizacji do 1.4.0 wklej też nowy `appsscript.json` (dochodzi uprawnienie połączeń zewnętrznych), uruchom raz funkcję `instalacja` i zatwierdź nowe uprawnienie, potem Wdróż → Zarządzaj wdrożeniami → Nowa wersja.
4. Pracownicy muszą mieć wpisane „ID ClickUp” (zakładka Pracownicy), a budowy „ID listy ClickUp” (zakładka Projekty) – wtedy dotknięcie zadania otwiera budowę.

## 4e. Obiekty wojskowe
Kolumna „Uprawnienie M” (tak/nie) w zakładce Pracownicy. Budowę z „Obiekt wojskowy = tak” otwiera tylko osoba z M = tak lub rola biuro.

## 5. Gdy coś nie działa
| Komunikat | Co zrobić |
|---|---|
| Nieznany lub wyłączony klucz tabletu | Sprawdź klucz i `Aktywny = tak` w zakładce Tablety |
| Skrypt nie jest zainstalowany | Uruchom `instalacja` |
| Wymagana nowsza wersja aplikacji | Otwórz aplikację przy WiFi, przeciągnij w dół, uruchom ponownie |
| Budowa nieaktywna lub nieznana | Sprawdź wiersz budowy w Bazie projektów |
| ClickUp: zły klucz API | Sprawdź właściwość CLICKUP_TOKEN w ustawieniach skryptu |
