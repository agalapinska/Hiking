import type { CountryCode } from '$lib/map/sources';

export type Topic =
	| 'camping' | 'dogs' | 'fire' | 'drones' | 'fees' | 'closures' | 'rescue' | 'health' | 'border' | 'trails' | 'access';

export type Status = 'current' | 'check' | 'outdated';

export interface Rule {
	id: string;
	country: CountryCode;
	/** 'country' applies everywhere; 'park' only inside the area's bbox */
	scope: 'country' | 'region' | 'park';
	area?: string; // name of park/region
	/** [west, south, east, north] – orientacyjny prostokąt obszaru */
	bbox?: [number, number, number, number];
	topic: Topic;
	pl: string;
	en: string;
	source: string;
	sourceName: string;
	verified: string; // ISO date of last human verification
	status: Status;
}

export interface CountryInfo {
	code: CountryCode;
	pl: string;
	en: string;
	emergency: { label: string; number: string }[];
	trailMarking: { pl: string; en: string };
}

export const countries: CountryInfo[] = [
	{
		code: 'PL', pl: 'Polska', en: 'Poland',
		emergency: [{ label: '112', number: '112' }, { label: 'TOPR / GOPR', number: '985' }, { label: 'Ratunek (app)', number: '601 100 300' }],
		trailMarking: {
			pl: 'Szlaki PTTK: biały pasek z kolorem w środku (czerwony, niebieski, zielony, żółty, czarny). Kolor nie oznacza trudności. Czasy na drogowskazach są planistyczne, bez odpoczynków.',
			en: 'PTTK trails: white stripe with a colour in the middle (red, blue, green, yellow, black). Colour does not indicate difficulty. Signpost times are planning times without rests.'
		}
	},
	{
		code: 'CZ', pl: 'Czechy', en: 'Czechia',
		emergency: [{ label: '112', number: '112' }, { label: 'Horská služba', number: '1210' }],
		trailMarking: {
			pl: 'Znakowanie KČT jak w Polsce: biały pasek z kolorem. Czerwony = szlaki dalekobieżne i grzbietowe. Kilometry na drogowskazach zamiast czasu.',
			en: 'KČT marking like in Poland: white stripe with colour. Red = long-distance and ridge trails. Signposts show kilometres rather than time.'
		}
	},
	{
		code: 'SK', pl: 'Słowacja', en: 'Slovakia',
		emergency: [{ label: '112', number: '112' }, { label: 'Horská záchranná služba', number: '18 300' }],
		trailMarking: {
			pl: 'Znakowanie jak w Polsce. Czerwony = magistrale (np. Tatranská magistrála). Na drogowskazach czas w minutach.',
			en: 'Marking as in Poland. Red = main ridge routes. Signposts show time in minutes.'
		}
	},
	{
		code: 'SI', pl: 'Słowenia', en: 'Slovenia',
		emergency: [{ label: '112', number: '112' }],
		trailMarking: {
			pl: 'Znak Knafelca: czerwone koło z białym środkiem. Czasy na drogowskazach. Szlaki „zelo zahtevna” (bardzo wymagające) mają stałe ubezpieczenia; zalecany zestaw via ferrata.',
			en: 'Knafelc blaze: red circle with white centre. Signposts show times. “Zelo zahtevna” (very demanding) trails have fixed protection; via ferrata kit recommended.'
		}
	},
	{
		code: 'AT', pl: 'Austria', en: 'Austria',
		emergency: [{ label: '112', number: '112' }, { label: 'Bergrettung', number: '140' }],
		trailMarking: {
			pl: 'Czerwono-biało-czerwone paski. Trudność na tabliczkach: niebieska (łatwy), czerwona (średni), czarna (trudny, alpejski). Czasy na drogowskazach.',
			en: 'Red-white-red stripes. Difficulty on signposts: blue (easy), red (moderate), black (difficult, alpine). Signposts show times.'
		}
	},
	{
		code: 'IT', pl: 'Włochy', en: 'Italy',
		emergency: [{ label: '112', number: '112' }, { label: 'Soccorso Alpino', number: '118' }],
		trailMarking: {
			pl: 'Znaki CAI: czerwono-biało-czerwone z numerem szlaku. Skala trudności T (turystyczny), E (wędrówka), EE (doświadczeni), EEA (via ferrata ze sprzętem).',
			en: 'CAI blazes: red-white-red with trail number. Difficulty scale T (tourist), E (hiking), EE (experienced hikers), EEA (via ferrata with equipment).'
		}
	},
	{
		code: 'CH', pl: 'Szwajcaria', en: 'Switzerland',
		emergency: [{ label: '112', number: '112' }, { label: 'Rega (śmigłowiec)', number: '1414' }],
		trailMarking: {
			pl: 'Żółte drogowskazy = szlak piesze (T1). Biało-czerwono-białe = górskie (T2–T3). Biało-niebiesko-białe = alpejskie (T4–T6), wymagają sprzętu i doświadczenia. Skala SAC T1–T6.',
			en: 'Yellow signposts = hiking trail (T1). White-red-white = mountain trail (T2–T3). White-blue-white = alpine route (T4–T6), requiring gear and experience. SAC scale T1–T6.'
		}
	}
];

const r = (x: Rule) => x;

export const rules: Rule[] = [
	// ---------------- POLSKA ----------------
	r({ id: 'pl-camp', country: 'PL', scope: 'country', topic: 'camping',
		pl: 'Nocleg w lesie dozwolony tylko w wyznaczonych obszarach programu „Zanocuj w lesie” Lasów Państwowych (max 2 noce, do 9 osób, bez ognia). Poza nimi biwakowanie w lasach państwowych jest zabronione. W parkach narodowych biwak tylko w wyznaczonych miejscach.',
		en: 'Overnight stays in forests are allowed only in the State Forests “Zanocuj w lesie” areas (max 2 nights, up to 9 people, no fire). Elsewhere in state forests camping is prohibited. In national parks only at designated sites.',
		source: 'https://www.lasy.gov.pl/pl/turystyka/program-zanocuj-w-lesie', sourceName: 'Lasy Państwowe', verified: '2026-10-07', status: 'current' }),
	r({ id: 'pl-fire', country: 'PL', scope: 'country', topic: 'fire',
		pl: 'Zakaz rozpalania ognia w lesie i do 100 m od granicy lasu poza wyznaczonymi miejscami (art. 30 ustawy o lasach). Przy 3. stopniu zagrożenia pożarowego nadleśnictwa mogą wprowadzić zakaz wstępu do lasu.',
		en: 'No open fire in forests and within 100 m of a forest edge except at designated spots (Forest Act art. 30). At fire danger level 3, forest districts may close forests to entry.',
		source: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19911010444', sourceName: 'ISAP – ustawa o lasach', verified: '2026-10-07', status: 'current' }),
	r({ id: 'pl-drones', country: 'PL', scope: 'country', topic: 'drones',
		pl: 'Loty dronem wg przepisów EASA (kategoria otwarta, rejestracja operatora w ULC). Nad parkami narodowymi obowiązują strefy geograficzne; wiele parków wymaga zgody dyrekcji. Sprawdź mapę stref w aplikacji DroneRadar / PansaUTM.',
		en: 'Drone flights follow EASA rules (open category, operator registration with ULC). National parks have geographic zones; many require the park director’s consent. Check zones in DroneRadar / PansaUTM.',
		source: 'https://www.ulc.gov.pl/pl/drony', sourceName: 'Urząd Lotnictwa Cywilnego', verified: '2026-10-07', status: 'current' }),
	r({ id: 'pl-rescue', country: 'PL', scope: 'country', topic: 'rescue',
		pl: 'Ratownictwo górskie (TOPR, GOPR) jest bezpłatne i finansowane z budżetu państwa. Numer ratunkowy w górach: 985 lub 112. Aplikacja „Ratunek” wysyła pozycję do ratowników.',
		en: 'Mountain rescue (TOPR, GOPR) is free of charge, funded by the state. Mountain emergency number: 985 or 112. The “Ratunek” app sends your position to rescuers.',
		source: 'https://www.gov.pl/web/mswia/ratownictwo-gorskie', sourceName: 'MSWiA', verified: '2026-10-07', status: 'current' }),
	r({ id: 'pl-health', country: 'PL', scope: 'country', topic: 'health',
		pl: 'Kleszcze: ryzyko boreliozy i KZM w całym kraju, najwyższe na Podlasiu, Warmii i Mazurach oraz w Karpatach. Szczepienie przeciw KZM zalecane dla osób często przebywających w lasach.',
		en: 'Ticks: Lyme disease and TBE risk nationwide, highest in Podlasie, Warmia-Masuria and the Carpathians. TBE vaccination recommended for frequent forest visitors.',
		source: 'https://www.gov.pl/web/psse-szczecin/kleszczowe-zapalenie-mozgu', sourceName: 'GIS / gov.pl', verified: '2026-10-07', status: 'current' }),
	r({ id: 'pl-border', country: 'PL', scope: 'region', area: 'Strefa przygraniczna PL–BY', bbox: [22.9, 50.5, 24.2, 54.4], topic: 'border',
		pl: 'Przy granicy z Białorusią obowiązują ograniczenia wstępu w pasie przygranicznym (strefy buforowe ogłaszane rozporządzeniem MSWiA). Sprawdź aktualne rozporządzenie przed wyjściem na Puszczę Białowieską i okolice.',
		en: 'Along the Belarusian border, entry restrictions apply in the border strip (buffer zones set by MSWiA regulation). Check the current regulation before hiking in Białowieża Forest and nearby.',
		source: 'https://www.gov.pl/web/mswia', sourceName: 'MSWiA', verified: '2026-10-07', status: 'check' }),
	r({ id: 'pl-hunting', country: 'PL', scope: 'country', topic: 'closures',
		pl: 'Polowania zbiorowe (głównie X–I) są ogłaszane w BIP gmin i na stronach nadleśnictw; w czasie polowania wstęp na teren jest zabroniony. Nadleśnictwa publikują też okresowe zakazy wstępu (prace leśne, pożary).',
		en: 'Collective hunts (mainly Oct–Jan) are announced on municipal BIP pages and forest district sites; entry is prohibited during a hunt. Forest districts also publish temporary entry bans (forestry works, fire risk).',
		source: 'https://www.bdl.lasy.gov.pl/portal/mapy', sourceName: 'Bank Danych o Lasach – zakazy wstępu', verified: '2026-10-07', status: 'current' }),
	// Tatrzański PN
	r({ id: 'tpn-access', country: 'PL', scope: 'park', area: 'Tatrzański Park Narodowy', bbox: [19.75, 49.15, 20.15, 49.32], topic: 'access',
		pl: 'Poruszanie się wyłącznie po znakowanych szlakach. Bilet wstępu obowiązuje (ulgowy dla dzieci, seniorów). Nocleg tylko w schroniskach; biwakowanie zabronione.',
		en: 'Hiking only on marked trails. Entry ticket required (reduced for children and seniors). Overnight only in huts; camping is prohibited.',
		source: 'https://tpn.gov.pl/zwiedzaj/turystyka/zasady', sourceName: 'TPN – zasady', verified: '2026-10-07', status: 'current' }),
	r({ id: 'tpn-dogs', country: 'PL', scope: 'park', area: 'Tatrzański Park Narodowy', bbox: [19.75, 49.15, 20.15, 49.32], topic: 'dogs',
		pl: 'Zakaz wprowadzania psów do TPN (wyjątek: psy asystujące).',
		en: 'Dogs are not allowed in TPN (exception: assistance dogs).',
		source: 'https://tpn.gov.pl/zwiedzaj/turystyka/zasady', sourceName: 'TPN – zasady', verified: '2026-10-07', status: 'current' }),
	r({ id: 'tpn-closures', country: 'PL', scope: 'park', area: 'Tatrzański Park Narodowy', bbox: [19.75, 49.15, 20.15, 49.32], topic: 'closures',
		pl: 'Część szlaków zamykana sezonowo (np. Dolina Pięciu Stawów – Świstówka 1.12–15.05, Kozi Wierch – Zawrat). Lawiny: komunikaty TOPR, stopnie 1–5. Aktualne zamknięcia na stronie TPN.',
		en: 'Some trails close seasonally (e.g. Five Lakes – Świstówka 1 Dec–15 May, Kozi Wierch – Zawrat). Avalanches: TOPR bulletins, levels 1–5. Current closures on the TPN website.',
		source: 'https://tpn.gov.pl/zwiedzaj/turystyka/zamkniete-szlaki', sourceName: 'TPN – zamknięte szlaki', verified: '2026-10-07', status: 'current' }),
	// Karkonoski PN
	r({ id: 'kpn-access', country: 'PL', scope: 'park', area: 'Karkonoski Park Narodowy', bbox: [15.45, 50.70, 15.95, 50.85], topic: 'access',
		pl: 'Bilet wstępu obowiązuje. Ruch tylko po szlakach. Psy dozwolone na smyczy. Biwak zabroniony. Szlak graniczny pozwala na przejście do Czech (KRNAP), gdzie obowiązują czeskie zasady.',
		en: 'Entry ticket required. Trails only. Dogs allowed on a leash. No camping. The border trail crosses into Czechia (KRNAP), where Czech rules apply.',
		source: 'https://kpnmab.pl/dla-turystow', sourceName: 'Karkonoski PN', verified: '2026-10-07', status: 'current' }),
	// Bieszczadzki PN
	r({ id: 'bdpn-access', country: 'PL', scope: 'park', area: 'Bieszczadzki Park Narodowy', bbox: [22.45, 49.0, 22.95, 49.3], topic: 'access',
		pl: 'Bilet wstępu (sezon). Ruch tylko po szlakach. Psy dozwolone na smyczy na większości szlaków. Teren niedźwiedzi brunatnych: nie zostawiaj jedzenia, zachowaj dystans. Biwak tylko na polach namiotowych poza parkiem.',
		en: 'Entry ticket (in season). Trails only. Dogs on a leash allowed on most trails. Brown bear country: store food, keep distance. Camping only at campsites outside the park.',
		source: 'https://www.bdpn.pl/index.php/turystyka', sourceName: 'Bieszczadzki PN', verified: '2026-10-07', status: 'current' }),

	// ---------------- CZECHY ----------------
	r({ id: 'cz-camp', country: 'CZ', scope: 'country', topic: 'camping',
		pl: 'Lasy są publicznie dostępne (ustawa 289/1995), ale biwakowanie i rozpalanie ognia w lesie jest zabronione. Nocleg „pod gołym niebem” bez namiotu jest tolerowany poza obszarami chronionymi. W parkach narodowych i CHKO biwak tylko w wyznaczonych miejscach.',
		en: 'Forests are open to the public (Act 289/1995), but camping and fires in forests are prohibited. Bivouacking without a tent is tolerated outside protected areas. In national parks and CHKO, camp only at designated sites.',
		source: 'https://www.zakonyprolidi.cz/cs/1995-289', sourceName: 'Zákon o lesích 289/1995', verified: '2026-10-07', status: 'current' }),
	r({ id: 'cz-rescue', country: 'CZ', scope: 'country', topic: 'rescue',
		pl: 'Horská služba ČR działa bezpłatnie. Numer 1210 lub 112. Aplikacja „Záchranka” wysyła pozycję.',
		en: 'Czech Mountain Rescue is free of charge. Call 1210 or 112. The “Záchranka” app sends your location.',
		source: 'https://www.horskasluzba.cz', sourceName: 'Horská služba ČR', verified: '2026-10-07', status: 'current' }),
	r({ id: 'cz-drones', country: 'CZ', scope: 'country', topic: 'drones',
		pl: 'Przepisy EASA; w parkach narodowych i CHKO loty wymagają zgody zarządu. Mapa stref: dronview.rlp.cz.',
		en: 'EASA rules; in national parks and CHKO flights need the administration’s consent. Zone map: dronview.rlp.cz.',
		source: 'https://dronview.rlp.cz', sourceName: 'ŘLP ČR – DroneView', verified: '2026-10-07', status: 'current' }),
	r({ id: 'krnap-access', country: 'CZ', scope: 'park', area: 'KRNAP (Karkonosze)', bbox: [15.4, 50.65, 15.95, 50.82], topic: 'access',
		pl: 'Ruch w I strefie tylko po szlakach. Psy na smyczy. Biwak zabroniony. Zimą zamknięcia szlaków ze względu na lawiny i ochronę przyrody (ogłaszane przez KRNAP).',
		en: 'In zone I trails only. Dogs on a leash. No camping. Winter closures for avalanche risk and nature protection (announced by KRNAP).',
		source: 'https://www.krnap.cz/navstevni-rad', sourceName: 'KRNAP – návštěvní řád', verified: '2026-10-07', status: 'current' }),
	r({ id: 'sumava-access', country: 'CZ', scope: 'park', area: 'NP Šumava', bbox: [13.2, 48.7, 13.9, 49.2], topic: 'access',
		pl: 'W strefie przyrodniczej ruch tylko po szlakach; część terenów dostępna sezonowo (15.7–15.11). Biwak w wyznaczonych „nouzových nocovištích” (bez namiotu, 1 noc).',
		en: 'In the nature zone, trails only; some areas are open seasonally (15 Jul–15 Nov). Overnight only at designated emergency bivouac sites (no tent, 1 night).',
		source: 'https://www.npsumava.cz/navstevni-rad', sourceName: 'NP Šumava', verified: '2026-10-07', status: 'current' }),

	// ---------------- SŁOWACJA ----------------
	r({ id: 'sk-rescue', country: 'SK', scope: 'country', topic: 'rescue',
		pl: 'Akcja Horskiej záchrannej služby jest PŁATNA dla ratowanego (ustawa 544/2002). Koszt sięga tysięcy euro. Wykup ubezpieczenie obejmujące ratownictwo górskie (np. członkostwo w klubie alpejskim lub polisa turystyczna). Numer: 18 300 lub 112.',
		en: 'Slovak Mountain Rescue (HZS) operations are CHARGED to the rescued person (Act 544/2002); costs can reach thousands of euros. Buy insurance covering mountain rescue. Call 18 300 or 112.',
		source: 'https://www.hzs.sk', sourceName: 'Horská záchranná služba', verified: '2026-10-07', status: 'current' }),
	r({ id: 'sk-camp', country: 'SK', scope: 'country', topic: 'camping',
		pl: 'W parkach narodowych i obszarach z 3.–5. stopniem ochrony biwak poza wyznaczonymi miejscami jest zabroniony. Poza obszarami chronionymi nocleg jest tolerowany za zgodą właściciela terenu.',
		en: 'In national parks and areas with protection level 3–5 camping outside designated sites is prohibited. Outside protected areas overnight stays are tolerated with the landowner’s consent.',
		source: 'https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2002/543/', sourceName: 'Zákon 543/2002 o ochrane prírody', verified: '2026-10-07', status: 'current' }),
	r({ id: 'sk-health', country: 'SK', scope: 'country', topic: 'health',
		pl: 'Niedźwiedzie brunatne występują w całych Karpatach słowackich. Hałasuj na szlaku, nie zostawiaj jedzenia, w razie spotkania wycofuj się powoli. Kleszcze: KZM, szczepienie zalecane.',
		en: 'Brown bears live throughout the Slovak Carpathians. Make noise, store food, retreat slowly if you meet one. Ticks: TBE, vaccination recommended.',
		source: 'https://www.sopsr.sk/web/?cl=11', sourceName: 'Štátna ochrana prírody SR', verified: '2026-10-07', status: 'current' }),
	r({ id: 'tanap-closures', country: 'SK', scope: 'park', area: 'TANAP (Tatry)', bbox: [19.6, 49.05, 20.4, 49.3], topic: 'closures',
		pl: 'Sezonowe zamknięcie szlaków powyżej schronisk i linii lasu: od 1 listopada do 15 czerwca. Wyjątki ogłasza Správa TANAP. Na szczyty bez szlaku tylko z licencjonowanym przewodnikiem.',
		en: 'Seasonal closure of trails above huts and the tree line: 1 November to 15 June. Exceptions announced by TANAP administration. Off-trail summits only with a licensed guide.',
		source: 'https://www.tanap.org/sezonna-uzavera', sourceName: 'Správa TANAP', verified: '2026-10-07', status: 'current' }),
	r({ id: 'tanap-dogs', country: 'SK', scope: 'park', area: 'TANAP (Tatry)', bbox: [19.6, 49.05, 20.4, 49.3], topic: 'dogs',
		pl: 'Psy dozwolone tylko na smyczy i tylko na wybranych szlakach (lista na stronie TANAP). Poruszanie się wyłącznie po szlakach; wstęp bezpłatny.',
		en: 'Dogs allowed only on a leash and only on selected trails (list on the TANAP site). Trails only; entry is free.',
		source: 'https://www.tanap.org/navstevny-poriadok', sourceName: 'Správa TANAP', verified: '2026-10-07', status: 'current' }),

	// ---------------- SŁOWENIA ----------------
	r({ id: 'si-camp', country: 'SI', scope: 'country', topic: 'camping',
		pl: 'Dzikie biwakowanie jest zabronione w całym kraju (Zakon o ohranjanju narave), z karami do kilkuset euro. Nocleg w schroniskach PZS lub na campingach.',
		en: 'Wild camping is prohibited nationwide (Nature Conservation Act), with fines of several hundred euros. Sleep in PZS huts or at campsites.',
		source: 'https://www.gov.si/teme/varstvo-narave/', sourceName: 'gov.si – varstvo narave', verified: '2026-10-07', status: 'current' }),
	r({ id: 'si-rescue', country: 'SI', scope: 'country', topic: 'rescue',
		pl: 'Ratownictwo górskie (GRZS) jest bezpłatne, jeśli nie doszło do rażącego niedbalstwa. Ratownictwo śmigłowcowe może być obciążone kosztami. Zalecane ubezpieczenie. Numer 112.',
		en: 'Mountain rescue (GRZS) is free unless gross negligence is found; helicopter rescue may be charged. Insurance recommended. Call 112.',
		source: 'https://www.grzs.si', sourceName: 'GRZS', verified: '2026-10-07', status: 'check' }),
	r({ id: 'tnp-access', country: 'SI', scope: 'park', area: 'Triglavski narodni park', bbox: [13.4, 46.2, 14.0, 46.5], topic: 'access',
		pl: 'Biwak i ogień zabronione. Psy na smyczy. Drony tylko za zgodą parku. Na Triglav zalecany sprzęt via ferrata i kask (odcinki ubezpieczone). Schroniska PZS: rezerwacja w sezonie obowiązkowa.',
		en: 'Camping and fires prohibited. Dogs on a leash. Drones only with park permission. Triglav: via ferrata kit and helmet recommended (protected sections). PZS huts: booking mandatory in season.',
		source: 'https://www.tnp.si/sl/obisk/pravila-obnasanja/', sourceName: 'Triglavski narodni park', verified: '2026-10-07', status: 'current' }),

	// ---------------- AUSTRIA ----------------
	r({ id: 'at-camp', country: 'AT', scope: 'country', topic: 'camping',
		pl: 'Przepisy zależą od landu. Biwakowanie w lesie jest zabronione w całym kraju (Forstgesetz). Powyżej linii lasu: zakaz w Tyrolu, Salzburgu, Karyntii i Dolnej Austrii; tolerowany nocleg awaryjny w Vorarlbergu i Styrii. Sprawdź przepisy landu, przez który biegnie trasa.',
		en: 'Rules depend on the federal state. Camping in forests is prohibited nationwide (Forest Act). Above the tree line: banned in Tyrol, Salzburg, Carinthia and Lower Austria; emergency bivouac tolerated in Vorarlberg and Styria. Check the state your route crosses.',
		source: 'https://www.oesterreich.gv.at/themen/freizeit_und_strassenverkehr/Camping.html', sourceName: 'oesterreich.gv.at', verified: '2026-10-07', status: 'current' }),
	r({ id: 'at-rescue', country: 'AT', scope: 'country', topic: 'rescue',
		pl: 'Akcje Bergrettung i śmigłowca są PŁATNE (śmigłowiec od ok. 3 000 € w górę). Ubezpieczenie: członkostwo w Alpenverein (ÖAV/DAV) lub polisa turystyczna obejmująca ratownictwo. Numer: 140 lub 112.',
		en: 'Bergrettung and helicopter rescues are CHARGED (helicopter from about €3,000 upwards). Insurance: Alpenverein membership (ÖAV/DAV) or a travel policy covering rescue. Call 140 or 112.',
		source: 'https://www.bergrettung.at', sourceName: 'Österreichischer Bergrettungsdienst', verified: '2026-10-07', status: 'current' }),
	r({ id: 'at-dogs', country: 'AT', scope: 'country', topic: 'dogs',
		pl: 'Psy na halach z bydłem: trzymaj na smyczy, a przy ataku krów spuść psa ze smyczy. W parkach narodowych psy tylko na smyczy; w rezerwatach bywa zakaz.',
		en: 'Dogs on alpine pastures with cattle: keep on a leash, but release the dog if cattle attack. In national parks dogs on a leash; some reserves ban dogs.',
		source: 'https://www.sichere-almen.at', sourceName: 'Sichere Almen (Landwirtschaftskammer)', verified: '2026-10-07', status: 'current' }),
	r({ id: 'hohetauern-access', country: 'AT', scope: 'park', area: 'Nationalpark Hohe Tauern', bbox: [12.1, 46.9, 13.3, 47.3], topic: 'access',
		pl: 'W strefie centralnej ruch po szlakach, biwak zabroniony, drony zabronione bez zgody. Lodowce: wymagana lina, raki i doświadczenie. Schroniska: rezerwacja przez alpenverein.at.',
		en: 'In the core zone keep to trails, no camping, no drones without permission. Glaciers: rope, crampons and experience required. Huts: book via alpenverein.at.',
		source: 'https://hohetauern.at/de/besucherinfo/verhaltensregeln.html', sourceName: 'Nationalpark Hohe Tauern', verified: '2026-10-07', status: 'current' }),

	// ---------------- WŁOCHY ----------------
	r({ id: 'it-camp', country: 'IT', scope: 'country', topic: 'camping',
		pl: 'Przepisy ustalają regiony i gminy; dzikie biwakowanie jest w większości regionów alpejskich zabronione (kary 100–500 €). Tolerowany bywa nocleg „od zmierzchu do świtu” powyżej 2 500 m w niektórych regionach (np. Trydent). Parki narodowe: zakaz.',
		en: 'Rules are set by regions and municipalities; wild camping is banned in most Alpine regions (fines €100–500). Dusk-to-dawn bivouac above 2,500 m is tolerated in some regions (e.g. Trentino). National parks: banned.',
		source: 'https://www.cai.it', sourceName: 'Club Alpino Italiano', verified: '2026-10-07', status: 'check' }),
	r({ id: 'it-rescue', country: 'IT', scope: 'country', topic: 'rescue',
		pl: 'Soccorso Alpino: akcje bywają płatne w zależności od regionu (np. Lombardia, Veneto, Trydent naliczają koszty śmigłowca, jeśli nie było zagrożenia życia). Numer 118 lub 112. Zalecane ubezpieczenie (np. CAI).',
		en: 'Soccorso Alpino: operations may be charged depending on region (e.g. Lombardy, Veneto, Trentino charge helicopter costs if there was no life threat). Call 118 or 112. Insurance recommended (e.g. CAI).',
		source: 'https://www.cnsas.it', sourceName: 'CNSAS', verified: '2026-10-07', status: 'current' }),
	r({ id: 'it-dolomiti', country: 'IT', scope: 'region', area: 'Dolomity (parki naturalne)', bbox: [11.4, 46.2, 12.6, 46.8], topic: 'access',
		pl: 'Parki naturalne Dolomitów: psy na smyczy, drony zabronione, biwak zabroniony. Rifugi wymagają rezerwacji w sezonie (lipiec–wrzesień). Via ferraty: obowiązkowy zestaw i kask.',
		en: 'Dolomites nature parks: dogs on a leash, no drones, no camping. Rifugi require booking in season (Jul–Sep). Via ferratas: kit and helmet mandatory.',
		source: 'https://www.dolomitiunesco.info', sourceName: 'Fondazione Dolomiti UNESCO', verified: '2026-10-07', status: 'check' }),

	// ---------------- SZWAJCARIA ----------------
	r({ id: 'ch-camp', country: 'CH', scope: 'country', topic: 'camping',
		pl: 'Nocleg powyżej linii lasu na jedną noc jest zasadniczo dozwolony (prawo swobodnego dostępu, ZGB art. 699), ale zabroniony w rezerwatach, strefach ciszy dla zwierzyny i Parku Narodowym. Gminy mogą wprowadzać własne zakazy. Nie w lasach i nie na pastwiskach bez zgody.',
		en: 'One night above the tree line is generally allowed (free access right, Civil Code art. 699), but prohibited in reserves, wildlife quiet zones and the National Park. Municipalities may impose bans. Not in forests or on pastures without consent.',
		source: 'https://www.sac-cas.ch/de/umwelt/wildcampen-und-biwakieren/', sourceName: 'SAC-CAS (za BAFU)', verified: '2026-10-07', status: 'current' }),
	r({ id: 'ch-rescue', country: 'CH', scope: 'country', topic: 'rescue',
		pl: 'Ratownictwo jest PŁATNE. Rega (śmigłowiec) nalicza koszty, chyba że jesteś patronem Rega (ok. 40 CHF/rok). Numer Rega 1414, alarm 112. Sprawdź, czy polisa obejmuje Szwajcarię (poza UE; EKUZ działa).',
		en: 'Rescue is CHARGED. Rega (helicopter) bills costs unless you are a Rega patron (about CHF 40/year). Rega 1414, emergency 112. Check your policy covers Switzerland (non-EU; EHIC works).',
		source: 'https://www.rega.ch', sourceName: 'Rega', verified: '2026-10-07', status: 'current' }),
	r({ id: 'ch-drones', country: 'CH', scope: 'country', topic: 'drones',
		pl: 'Przepisy EASA przyjęte przez Szwajcarię (rejestracja w BAZL/UAS.gate). Zakaz lotów w rezerwatach i Parku Narodowym; mapa ograniczeń na map.geo.admin.ch.',
		en: 'Switzerland applies EASA rules (registration via BAZL/UAS.gate). No flights in reserves and the National Park; restriction map on map.geo.admin.ch.',
		source: 'https://www.bazl.admin.ch/bazl/de/home/gutzuwissen/drohnen.html', sourceName: 'BAZL', verified: '2026-10-07', status: 'current' }),
	r({ id: 'ch-np', country: 'CH', scope: 'park', area: 'Schweizerischer Nationalpark', bbox: [10.05, 46.55, 10.45, 46.75], topic: 'access',
		pl: 'Najsurowsze zasady w Alpach: tylko znakowane szlaki, zakaz schodzenia ze szlaku, psów (nawet na smyczy), biwaku, ognia, zbierania czegokolwiek. Park otwarty zwykle od maja do października.',
		en: 'Strictest rules in the Alps: marked trails only, no leaving the trail, no dogs (even leashed), no camping, no fire, no collecting. Park usually open May to October.',
		source: 'https://www.nationalpark.ch/de/besuchen/parkregeln/', sourceName: 'Schweizerischer Nationalpark', verified: '2026-10-07', status: 'current' }),

	// ---------------- WSPÓLNE ----------------
	...(['PL', 'CZ', 'SK', 'SI', 'AT', 'IT'] as CountryCode[]).map((c) =>
		r({ id: `${c.toLowerCase()}-ekuz`, country: c, scope: 'country', topic: 'rescue',
			pl: 'Kraj UE: EKUZ pokrywa leczenie w publicznej służbie zdrowia na zasadach lokalnych (może być współpłatność), ale NIE pokrywa transportu do Polski ani kosztów akcji ratowniczych, jeśli są płatne w danym kraju.',
			en: 'EU country: EHIC covers public healthcare on local terms (co-payments possible) but does NOT cover repatriation or rescue costs where those are charged.',
			source: 'https://www.nfz.gov.pl/dla-pacjenta/nasze-zdrowie-w-ue/leczenie-w-krajach-unii-europejskiej-i-efta/', sourceName: 'NFZ – EKUZ', verified: '2026-10-07', status: 'current' })
	),
	...(['CZ', 'SK', 'SI', 'AT', 'IT', 'CH'] as CountryCode[]).map((c) =>
		r({ id: `${c.toLowerCase()}-msz`, country: c, scope: 'country', topic: 'border',
			pl: 'Sprawdź aktualne ostrzeżenia MSZ i informacje dla podróżujących w serwisie „Polak za granicą” przed wyjazdem.',
			en: 'Check current Polish MFA travel advisories (“Polak za granicą”) before you go.',
			source: 'https://www.gov.pl/web/dyplomacja/informacje-dla-podrozujacych', sourceName: 'MSZ – Polak za granicą', verified: '2026-10-07', status: 'current' })
	)
];

export function rulesForCountry(code: CountryCode) {
	return rules.filter((x) => x.country === code);
}

/** Rules that apply to a route: country-wide ones for each country crossed, plus any area whose bbox the route enters. */
export function rulesForRoute(countryCodes: string[], line: [number, number, number?][]) {
	return rules.filter((x) => {
		if (!countryCodes.includes(x.country)) return false;
		if (x.scope === 'country') return true;
		if (!x.bbox) return false;
		const [w, s, e, n] = x.bbox;
		return line.some((p) => p[0] >= w && p[0] <= e && p[1] >= s && p[1] <= n);
	});
}
