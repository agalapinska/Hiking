# Szlaki — planowanie szlaków (PWA, mobile-first)

Aplikacja webowa do planowania wędrówek w PL, CZ, SK, SI, AT, IT i CH na bazie wielu map, z profilem podejścia, tempem osobistym i zasadami prawnymi kraju, przez który biegnie trasa. Pełna lista funkcji i roadmapa: [FEATURES.md](FEATURES.md).

## Uruchomienie

```bash
npm install
cp .env.example .env   # opcjonalnie wpisz klucze API
npm run dev            # http://localhost:5173, dostępne też w sieci lokalnej (telefon)
npm run build && npm run preview
```

Bez kluczy aplikacja działa na mapach darmowych (OpenTopoMap, OSM, Waymarked Trails, Geoportal PL, ČÚZK, Freemap SK, basemap.at, swisstopo, Esri). Klucze (`PUBLIC_MAPY_KEY`, `PUBLIC_MAPTILER_KEY`, `PUBLIC_ORS_KEY`) włączają Mapy.com, MapTiler i prowadzenie trasy po szlakach (OpenRouteService). Jak je zdobyć: tabela na końcu FEATURES.md.

## Co jest w MVP

- **Planuj** (`/`): dotknij mapy, aby dodać punkty; dotknij punktu, aby go usunąć. Dystans, przewyższenia, szacowany czas z przedziałem.
  - *Profil podejścia*: wykres z odcinkami kolorowanymi według nachylenia, lista podejść i zejść, podział na dni.
  - *Oś czasu*: godzina dotarcia do każdego punktu i końca podejścia, wschód i zachód słońca, ostrzeżenie o zmroku.
  - *Zasady*: wykryte kraje, numery alarmowe, oznakowanie szlaków, przepisy dla kraju i parków na trasie (z linkami do źródeł i datą weryfikacji).
  - *Mapa*: wybór mapy bazowej i nakładek; mapa polecana dla kraju trasy.
  - Zapis lokalny, eksport i import GPX, **udostępnianie linkiem** — odbiorca widzi trasę na własnej mapie i może zapisać kopię.
- **Trasy** (`/trasy/`): zapisane trasy.
- **Zasady** (`/zasady/`): przeglądarka przepisów wg kraju i tematu.
- **Profil** (`/profil/`): model tempa uczony z przejść (ręcznie lub z GPX z Garmina), język PL/EN, motyw.

## Struktura

```
src/lib/geo        geometria, wysokości (terrarium + Open-Meteo), routing, GPX, tempo, udostępnianie, kraj
src/lib/map        źródła map (bazowe i nakładki) i rekomendacja wg kraju
src/lib/rules      baza zasad prawnych i zdrowotnych + numery alarmowe
src/lib/stores     zapis lokalny (trasy, przejścia, ustawienia)
src/lib/components Map, Planner, Profile (wykres), RuleCard
src/routes         ekrany: /, /trasy, /zasady, /profil, /s (link udostępniony)
```

## Dane prawne

`src/lib/rules/data.ts` zawiera wpisy z polami `source`, `verified` i `status`. Każda zmiana przepisów wymaga aktualizacji daty weryfikacji. Aplikacja wyświetla zastrzeżenie, że nie jest to porada prawna.
