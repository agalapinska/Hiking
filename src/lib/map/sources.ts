import { env } from '$env/dynamic/public';

export type CountryCode = 'PL' | 'CZ' | 'SK' | 'SI' | 'AT' | 'IT' | 'CH';

export interface TileSource {
	id: string;
	name: string;
	tiles: string[];
	attribution: string;
	maxzoom: number;
	minzoom?: number;
	tileSize?: number;
	/** countries where this map is the best choice */
	bestFor?: CountryCode[];
	/** countries where this map has coverage at all; undefined = worldwide */
	coverage?: CountryCode[];
	needsKey?: 'mapy' | 'maptiler';
	overlay?: boolean;
	opacity?: number;
}

const MAPY_KEY = env.PUBLIC_MAPY_KEY ?? '';
const MAPTILER_KEY = env.PUBLIC_MAPTILER_KEY ?? '';

export const hasKey = { mapy: !!MAPY_KEY, maptiler: !!MAPTILER_KEY };

const wms = (base: string, layers: string, extra = '') =>
	`${base}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layers}&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true${extra}`;

export const basemaps: TileSource[] = [
	{
		id: 'opentopo',
		name: 'OpenTopoMap',
		tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://b.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'],
		attribution: '© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)',
		maxzoom: 17
	},
	{
		id: 'mapy',
		name: 'Mapy.com Outdoor',
		tiles: [`https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${MAPY_KEY}`],
		attribution: '© Seznam.cz a.s., © OpenStreetMap',
		maxzoom: 19,
		bestFor: ['PL', 'CZ', 'SK', 'SI', 'AT'],
		needsKey: 'mapy'
	},
	{
		id: 'maptiler',
		name: 'MapTiler Outdoor',
		tiles: [`https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`],
		attribution: '© MapTiler © OpenStreetMap contributors',
		maxzoom: 19,
		bestFor: ['IT'],
		needsKey: 'maptiler'
	},
	{
		id: 'osm',
		name: 'OpenStreetMap',
		tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
		attribution: '© OpenStreetMap contributors',
		maxzoom: 19
	},
	{
		id: 'pl-topo',
		name: 'Geoportal PL – topo',
		tiles: [wms('https://mapy.geoportal.gov.pl/wss/service/img/guest/TOPO/MapServer/WMSServer', 'Raster')],
		attribution: '© GUGiK, geoportal.gov.pl',
		maxzoom: 18,
		bestFor: ['PL'],
		coverage: ['PL']
	},
	{
		id: 'pl-orto',
		name: 'Geoportal PL – ortofoto',
		tiles: [wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution', 'Raster')],
		attribution: '© GUGiK, geoportal.gov.pl',
		maxzoom: 19,
		coverage: ['PL']
	},
	{
		id: 'cz-ztm',
		name: 'ČÚZK – ZTM (CZ)',
		tiles: ['https://ags.cuzk.gov.cz/arcgis1/rest/services/ZTM_WM/MapServer/tile/{z}/{y}/{x}'],
		attribution: '© ČÚZK',
		maxzoom: 18,
		bestFor: ['CZ'],
		coverage: ['CZ']
	},
	{
		id: 'sk-freemap',
		name: 'Freemap Outdoor (SK)',
		tiles: ['https://outdoor.tiles.freemap.sk/{z}/{x}/{y}'],
		attribution: '© Freemap Slovakia, © OpenStreetMap, © ÚGKK SR',
		maxzoom: 19,
		bestFor: ['SK'],
		coverage: ['SK', 'PL', 'CZ', 'AT']
	},
	{
		id: 'at-basemap',
		name: 'basemap.at (AT)',
		tiles: ['https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png'],
		attribution: '© basemap.at',
		maxzoom: 19,
		bestFor: ['AT'],
		coverage: ['AT']
	},
	{
		id: 'ch-swisstopo',
		name: 'swisstopo (CH)',
		tiles: ['https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg'],
		attribution: '© swisstopo',
		maxzoom: 18,
		bestFor: ['CH'],
		coverage: ['CH']
	},
	{
		id: 'esri-sat',
		name: 'Satelita (Esri)',
		tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
		attribution: '© Esri, Maxar, Earthstar Geographics',
		maxzoom: 19
	}
];

export const overlays: TileSource[] = [
	{
		id: 'waymarked',
		name: 'Szlaki piesze (Waymarked Trails)',
		tiles: ['https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png'],
		attribution: '© waymarkedtrails.org (CC-BY-SA)',
		maxzoom: 18,
		overlay: true
	},
	{
		id: 'pl-hillshade',
		name: 'Cieniowanie LIDAR (PL)',
		tiles: [wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMS/ShadedRelief', 'Raster')],
		attribution: '© GUGiK',
		maxzoom: 18,
		overlay: true,
		opacity: 0.5,
		coverage: ['PL']
	},
	{
		id: 'ch-hiking',
		name: 'Szlaki swisstopo (CH)',
		tiles: ['https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swisstlm3d-wanderwege/default/current/3857/{z}/{x}/{y}.png'],
		attribution: '© swisstopo',
		maxzoom: 18,
		overlay: true,
		coverage: ['CH']
	},
	{
		id: 'at-hillshade',
		name: 'Cieniowanie basemap.at (AT)',
		tiles: ['https://mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg'],
		attribution: '© basemap.at',
		maxzoom: 19,
		overlay: true,
		opacity: 0.45,
		coverage: ['AT']
	}
];

export function isAvailable(s: TileSource) {
	return !s.needsKey || hasKey[s.needsKey];
}

/** Best basemap for a set of countries; falls back to OpenTopoMap. */
export function recommendBasemap(countries: CountryCode[]): TileSource {
	for (const b of basemaps) {
		if (!isAvailable(b)) continue;
		if (b.bestFor && countries.length && countries.every((c) => b.bestFor!.includes(c))) return b;
	}
	return basemaps[0];
}
