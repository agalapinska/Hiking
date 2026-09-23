# Aplikacja do planowania szlaków — specyfikacja funkcji

Mobilna aplikacja webowa (PWA) do planowania wędrówek w kraju i za granicą na bazie wielu map, z informacjami prawnymi z rządowych stron kraju, przez który przebiega trasa.

## Decyzje

| Obszar | Decyzja |
|---|---|
| Persona główna | Osoba robiąca dużo szlaków (10+ rocznie), wielodniowe wędrówki, korzysta z Garmina |
| Persona druga | Turysta weekendowy w polskich górach |
| Kraje na start | Polska, Czechy, Słowacja, Słowenia, Austria, Włochy, Szwajcaria |
| Języki | polski, angielski |
| Konta | W MVP brak kont; dane zapisywane lokalnie na urządzeniu |
| Mapy z kluczem API | Tak (Mapy.com, MapTiler / Thunderforest, OpenRouteService) |
| Model biznesowy | Bez decyzji |
| Garmin | MVP: eksport GPX/FIT, import aktywności z Garmin Connect; Garmin Connect API po uzyskaniu dostępu |

## A. Profil użytkownika i grupy
- Poziom doświadczenia, kondycja, ograniczenia, preferowany typ tras.
- Skład grupy na dane wyjście: liczba osób, dzieci z wiekiem, pies, najsłabszy uczestnik.
- Waga plecaka i jej wpływ na tempo.
- Posiadany sprzęt (raki, czekan, uprząż) do ostrzeżeń „brakuje Ci…”.
- Jednostki (km/mile, m/ft), język, tryb ciemny, duże elementy dotykowe.

## B. Tempo osobiste i szacowanie czasu
- Nauka tempa z nagranych śladów GPS, z importu aktywności Garmin (FIT/GPX/TCX) i z ręcznie wpisanych przejść (trasa + czas).
- Tempo liczone osobno dla: płaskiego, podejścia, zejścia, terenu technicznego, śniegu.
- Uwzględnienie zmęczenia w ciągu dnia, wagi plecaka i tempa grupy (liczy się najwolniejszy).
- Na start wzór Naismitha / tablice PTTK, potem model osobisty.
- Wynik z przedziałem („5 h 10 min – 6 h 20 min”) i liczbą przejść, na których się opiera.
- Po każdym wyjściu porównanie planu z rzeczywistością i korekta modelu.

## C. Profil podejścia
- Wykres wysokości z odcinkami według nachylenia, najbardziej strome wyróżnione kolorem.
- Lista podejść i zejść: długość, przewyższenie, średnie i maksymalne nachylenie.
- Oś czasu: „o 11:30 w schronisku, o 13:00 na przełęczy” liczona z tempa użytkownika.
- Punkty krytyczne: ostatnie źródło wody, ostatni punkt zawrócenia, odcinek eksponowany.
- Profil na etap i na całą trasę wielodniową.

## D. Mapy i warstwy

### Mapy bazowe
| Źródło | Zasięg | Klucz |
|---|---|---|
| OpenStreetMap / OpenTopoMap | świat | nie |
| Waymarked Trails (nakładka szlaków) | świat | nie |
| Mapy.com | Europa, najlepsza w PL/CZ/SK/SI/AT | tak |
| MapTiler Outdoor / Thunderforest | świat, zapas dla Włoch | tak |
| Geoportal.gov.pl (GUGiK) | PL: orto, topo, cieniowanie LIDAR | nie |
| ČÚZK ZTM | CZ | nie |
| ZBGIS | SK | nie |
| e-prostor / ARSO | SI | nie |
| basemap.at | AT | nie |
| swisstopo | CH | nie |
| satelita (Esri, Sentinel-2) | świat | nie |

Aplikacja automatycznie podpowiada najlepszą mapę dla kraju trasy.

### Nakładki
- Obszary chronione: parki narodowe, rezerwaty, Natura 2000 (WDPA, GDOŚ i odpowiedniki).
- Strefy zamknięte i przygraniczne.
- Nachylenie stoku (lawiny).
- Schroniska, źródła wody, wiaty, biwaki, parkingi, przystanki.
- Zasięg sieci komórkowej.
- Tereny polowań i poligony (okresowe zamknięcia).
- Wyjaśnienie lokalnych oznaczeń szlaków (kolory PL/CZ/SK, skala SAC, znaki w Alpach).

## E. Planowanie trasy
- Rysowanie przez punkty z przyciąganiem do szlaków (OpenRouteService / GraphHopper / BRouter).
- Etapy wielodniowe z noclegami; pętla lub A→B.
- Import/eksport GPX, FIT, KML, GeoJSON; eksport do Garmin/Suunto; PDF z mapą i planem do druku.
- Udostępnianie linkiem: odbiorca bez konta widzi trasę na własnej mapie i może zapisać kopię u siebie; zakres udostępnienia: sama trasa / z planem czasowym / z kartą zasad.
- Warianty B: drogi ewakuacji, skróty, alternatywy przy złej pogodzie, punkty „do tej pory można zawrócić”.
- Ostrzeżenia o niedopasowaniu: trudność powyżej poziomu, brak sprzętu, za mało światła dziennego, pies/dzieci na zakazanym odcinku.
- Sezonowość: realność trasy w danym miesiącu, śnieg, zamknięcia sezonowe, wschód i zachód słońca.
- Wyszukiwarka tras z filtrami: kraj, długość, trudność, pętla/A→B, dla rodzin, z psem, dojazd komunikacją.

## F. Logistyka
- Dojazd: komunikacja publiczna do startu i ze szlaku, rozkłady, parkingi z cenami.
- Powrót na trasie A→B: transport między końcem a autem.
- Noclegi: schroniska, sezony otwarcia, obowiązek rezerwacji, link do rezerwacji, termin „zarezerwuj do…”, campingi.
- Woda i zaopatrzenie: źródła z oceną niezawodności, sklepy, ostatnia możliwość zakupu.
- Budżet wyjścia: bilety, noclegi, transport, waluta.

## G. Zasady prawne i zdrowotne kraju
Aplikacja sprawdza, przez jakie kraje, parki i obszary chronione przechodzi trasa, i pokazuje kartę zasad dotyczącą tej konkretnej trasy.

- Biwak i dziki nocleg, psy, ogień, drony, opłaty, limity, zamknięcia sezonowe.
- Granice i strefy przygraniczne, wymagane dokumenty.
- Pozwolenia jako proces: gdzie złożyć, do kiedy, koszt, przypomnienie.
- Ratownictwo i ubezpieczenie: czy akcja jest płatna (np. HZS na Słowacji), EKUZ, co dokupić.
- Zdrowie: kleszcze i KZM, niedźwiedzie, jakość wody, wysokość (GIS, NIZP-PZH i odpowiedniki).
- Ostrzeżenia MSZ „Polak za granicą”.
- Komunikaty bieżące: zamknięcia szlaków, lawiny (TOPR, EAWS), zakaz wstępu do lasu, polowania.
- Każdy wpis: link do źródła rządowego, data weryfikacji, zasięg obowiązywania (kraj/region/park), status (aktualne / do sprawdzenia / nieaktualne).
- Zastrzeżenie: to nie jest porada prawna.

### Architektura danych prawnych
1. Ręcznie przygotowana baza zasad per kraj / region / obszar chroniony, z linkami do źródeł.
2. Monitoring zmian stron źródłowych: zmiana strony → wpis trafia do ponownej weryfikacji.
3. Streszczenia AI z cytatem źródła, PL i EN, zawsze po weryfikacji ludzkiej.

## H. Bezpieczeństwo i tryb awaryjny
- Pogoda punktowa dla wysokości, burze, wiatr, temperatura odczuwalna (Open-Meteo, IMGW).
- Plan wyjścia z automatycznym alertem: udostępniasz trasę i godzinę powrotu; brak potwierdzenia → alert z ostatnią pozycją do wskazanej osoby.
- Karta awaryjna offline: numery alarmowe kraju, polisa, kontakty ICE, grupa krwi, leki, ostatnia pozycja, SMS z pozycją jednym przyciskiem.
- Lista pakowania generowana z trasy, pogody, sezonu i przepisów, z wagą.
- Alert przy zejściu ze szlaku, wejściu w strefę zakazaną, przekroczeniu planowanego czasu.
- Tryb oszczędzania baterii.

## I. W terenie
- Mapy offline z kartą zasad i kartą awaryjną.
- Nawigacja GPS, nagrywanie śladu, tempo vs plan („25 min za planem”).
- Szybkie notatki i zdjęcia przypięte do miejsca.

## J. Po wyjściu
- Porównanie planu z rzeczywistością, aktualizacja modelu tempa.
- Dziennik, statystyki, zdjęcia z geolokalizacją.
- Punkty GOT PTTK i Korona Gór Polski liczone automatycznie.
- Relacja o stanie szlaku, zgłoszenie nieaktualnych przepisów.

## K. Powiadomienia i społeczność
- Alerty o zmianach na zapisanych trasach: zamknięcie, lawiny, pogoda przed wyjazdem.
- Planowanie w grupie: wspólna trasa, głosowanie na termin, integracja z kalendarzem.

## L. Fundamenty
- RODO: zgoda na lokalizację, eksport i usunięcie danych.
- Atrybucje licencji map, zastrzeżenie odpowiedzialności.
- Kolejka weryfikacji ludzkiej danych prawnych, monitoring stron źródłowych.
- Analityka użycia.

## Kolejność prac

| Etap | Zakres |
|---|---|
| **MVP** | PWA PL/EN; mapy OSM, OpenTopoMap, Waymarked Trails, Mapy.com, Geoportal i mapy państwowe CZ/SK/SI/AT/CH; rysowanie trasy z routingiem; etapy wielodniowe; profil podejścia; tempo ze wzoru + ręcznie wpisane przejścia + import Garmin; GPX/FIT; link do trasy dla znajomych; wykrywanie kraju i obszaru chronionego; karty zasad dla 7 krajów; karta awaryjna offline; zapis lokalny bez kont |
| **v2** | Mapy offline, nawigacja i nagrywanie śladu, uczenie tempa ze śladów, pogoda i lawiny, plan wyjścia z alertem, logistyka noclegów i dojazdu, GOT PTTK, Garmin Connect API |
| **v3** | Konta i synchronizacja, powiadomienia o zmianach, grupy, monitoring stron rządowych, streszczenia AI, budżet, PDF |

## Stos technologiczny
- Front: SvelteKit jako PWA, MapLibre GL JS, offline przez service worker i PMTiles w IndexedDB.
- Dane lokalne: IndexedDB (trasy, przejścia, profil).
- Backend (od v2/v3): Postgres + PostGIS (przecięcia trasy z obszarami chronionymi), proxy dla kluczy API.
- Bez Google Maps: licencja zabrania zapisu kafelków offline.

## Klucze API
| Usługa | Rejestracja | Darmowy limit |
|---|---|---|
| Mapy.com | developer.mapy.com → projekt → klucz | ~250 tys. zapytań/mies. |
| MapTiler | cloud.maptiler.com → API keys | 100 tys. kafelków/mies. |
| Thunderforest | thunderforest.com → plan Hobby | 150 tys. kafelków/mies. |
| OpenRouteService | openrouteservice.org → Sign up | 2 000 zapytań/dzień |
| GraphHopper | graphhopper.com → klucz | 500 zapytań/dzień |
| Open-Meteo | bez klucza | — |

Klucze w `.env` (poza repo), ograniczone do domeny aplikacji; docelowo przez proxy.
