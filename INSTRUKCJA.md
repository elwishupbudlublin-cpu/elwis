# ELWIS – instrukcja uruchomienia

Wszystkie kroki wykonuje się **raz**, zalogowanym na konto ELWIS.

## 1. Serwer (Google Apps Script)
1. Otwórz https://script.google.com → **Nowy projekt**, nazwij go `ELWIS serwer`.
2. Wklej całą zawartość `apps-script/Code.gs` w miejsce pliku `Kod.gs`.
3. Ustawienia projektu (koło zębate) → zaznacz „Pokaż plik manifestu appsscript.json” → wklej zawartość `apps-script/appsscript.json`.
4. Wybierz funkcję `instalacja` → **Uruchom** → zezwól na dostęp (Zaawansowane → Przejdź do projektu).
5. **Wdróż → Nowe wdrożenie → Aplikacja internetowa**: Wykonaj jako **Ja**, Dostęp: **Każdy**. Skopiuj adres kończący się na `/exec`.
6. Dla każdego tabletu uruchom raz funkcję `dodajTablet` – w zakładce **Tablety** pojawi się wiersz z kluczem. Zmień nazwę tabletu w kolumnie A.

Aktualizacja serwera: wklej nowy kod → Wdróż → Zarządzaj wdrożeniami → edytuj → Wersja: nowa. Adres się nie zmienia.

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

## 5. Gdy coś nie działa
| Komunikat | Co zrobić |
|---|---|
| Nieznany lub wyłączony klucz tabletu | Sprawdź klucz i `Aktywny = tak` w zakładce Tablety |
| Skrypt nie jest zainstalowany | Uruchom `instalacja` |
| Wymagana nowsza wersja aplikacji | Otwórz aplikację przy WiFi, przeciągnij w dół, uruchom ponownie |
| Budowa nieaktywna lub nieznana | Sprawdź wiersz budowy w Bazie projektów |
