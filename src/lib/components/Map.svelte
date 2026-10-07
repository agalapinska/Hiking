<script lang="ts">
	import { Map as MLMap, ScaleControl, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike } from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

	// MapLibre resolves its worker relative to import.meta.url, which bundlers break.
	setWorkerUrl(workerUrl);
	import { onMount } from 'svelte';
	import { basemaps, overlays, type TileSource } from '$lib/map/sources';
	import { bbox, type Pt } from '$lib/geo/geo';

	interface Props {
		basemapId: string;
		overlayIds: string[];
		waypoints: Pt[];
		line: Pt[];
		/** index into `line` to highlight (from profile hover) */
		hoverIdx?: number | null;
		interactive?: boolean;
		onTap?: (p: Pt) => void;
		onWaypointTap?: (index: number) => void;
		fitKey?: number; // bump to fit map to the line
	}
	let {
		basemapId,
		overlayIds,
		waypoints,
		line,
		hoverIdx = null,
		interactive = true,
		onTap,
		onWaypointTap,
		fitKey = 0
	}: Props = $props();

	let el: HTMLDivElement;
	let map: MLMap | undefined;
	let ready = $state(false);

	const srcId = (s: TileSource) => `src-${s.id}`;
	const lyrId = (s: TileSource) => `lyr-${s.id}`;

	function addRaster(s: TileSource, before?: string) {
		if (!map) return;
		if (!map.getSource(srcId(s))) {
			map.addSource(srcId(s), {
				type: 'raster',
				tiles: s.tiles,
				tileSize: s.tileSize ?? 256,
				maxzoom: s.maxzoom,
				minzoom: s.minzoom ?? 0,
				attribution: s.attribution
			});
		}
		if (!map.getLayer(lyrId(s))) {
			map.addLayer(
				{ id: lyrId(s), type: 'raster', source: srcId(s), paint: { 'raster-opacity': s.opacity ?? 1 } },
				before
			);
		}
	}

	function syncLayers() {
		if (!map || !ready) return;
		for (const b of basemaps) {
			if (b.id === basemapId) addRaster(b, 'route-casing');
			else if (map.getLayer(lyrId(b))) map.removeLayer(lyrId(b));
		}
		// ensure basemap is the bottom-most raster
		if (map.getLayer(`lyr-${basemapId}`)) map.moveLayer(`lyr-${basemapId}`, overlays.map(lyrId).find((id) => map!.getLayer(id)) ?? 'route-casing');
		for (const o of overlays) {
			if (overlayIds.includes(o.id)) addRaster(o, 'route-casing');
			else if (map.getLayer(lyrId(o))) map.removeLayer(lyrId(o));
		}
	}

	function syncData() {
		if (!map || !ready) return;
		(map.getSource('route') as GeoJSONSource)?.setData({
			type: 'Feature',
			properties: {},
			geometry: { type: 'LineString', coordinates: line.map((p) => [p[0], p[1]]) }
		});
		(map.getSource('wps') as GeoJSONSource)?.setData({
			type: 'FeatureCollection',
			features: waypoints.map((p, i) => ({
				type: 'Feature',
				properties: { i, label: i === 0 ? 'S' : i === waypoints.length - 1 ? 'M' : String(i) },
				geometry: { type: 'Point', coordinates: [p[0], p[1]] }
			}))
		});
		const h = hoverIdx != null && line[hoverIdx] ? [line[hoverIdx]] : [];
		(map.getSource('hover') as GeoJSONSource)?.setData({
			type: 'FeatureCollection',
			features: h.map((p) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [p[0], p[1]] } }))
		});
	}

	export function fit() {
		if (!map || line.length < 2) return;
		map.fitBounds(bbox(line) as LngLatBoundsLike, { padding: { top: 80, bottom: 260, left: 40, right: 40 }, duration: 600 });
	}

	export function locate() {
		if (!map) return;
		navigator.geolocation?.getCurrentPosition(
			(pos) => map!.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 }),
			() => {},
			{ enableHighAccuracy: true, timeout: 8000 }
		);
	}

	onMount(() => {
		const m = new MLMap({
			container: el,
			style: { version: 8, sources: {}, layers: [] },
			center: [19.95, 49.25],
			zoom: 10,
			attributionControl: { compact: true },
			dragRotate: false,
			pitchWithRotate: false,
			touchPitch: false
		});
		map = m;
		m.touchZoomRotate.disableRotation();
		m.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');

		m.on('load', () => {
			map!.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
			map!.addSource('wps', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
			map!.addSource('hover', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
			map!.addLayer({ id: 'route-casing', type: 'line', source: 'route', paint: { 'line-color': '#fff', 'line-width': 7, 'line-opacity': 0.8 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
			map!.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#d9480f', 'line-width': 4 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
			map!.addLayer({ id: 'wps-circle', type: 'circle', source: 'wps', paint: { 'circle-radius': 11, 'circle-color': '#1b4332', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
			map!.addLayer({ id: 'wps-label', type: 'symbol', source: 'wps', layout: { 'text-field': ['get', 'label'], 'text-size': 11, 'text-allow-overlap': true }, paint: { 'text-color': '#fff' } });
			map!.addLayer({ id: 'hover-pt', type: 'circle', source: 'hover', paint: { 'circle-radius': 8, 'circle-color': '#ffd43b', 'circle-stroke-color': '#000', 'circle-stroke-width': 2 } });
			ready = true;
			syncLayers();
			syncData();
			if (line.length > 1) fit();
		});

		m.on('click', (e) => {
			if (!interactive) return;
			const hits = map!.queryRenderedFeatures(e.point, { layers: ['wps-circle'] });
			if (hits.length) {
				onWaypointTap?.(hits[0].properties.i as number);
				return;
			}
			onTap?.([e.lngLat.lng, e.lngLat.lat]);
		});
		m.on('mouseenter', 'wps-circle', () => (m.getCanvas().style.cursor = 'pointer'));
		m.on('mouseleave', 'wps-circle', () => (m.getCanvas().style.cursor = ''));

		return () => m.remove();
	});

	$effect(() => {
		basemapId;
		overlayIds;
		syncLayers();
	});
	$effect(() => {
		line;
		waypoints;
		hoverIdx;
		syncData();
	});
	$effect(() => {
		if (fitKey > 0 && ready) fit();
	});
</script>

<div class="map" bind:this={el}></div>

<style>
	.map {
		position: absolute;
		inset: 0;
	}
	:global(.maplibregl-ctrl-bottom-left) {
		bottom: 0;
	}
</style>
