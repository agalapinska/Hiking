import type { Pt } from './geo';

/**
 * Elevation lookup.
 *
 * Primary: Mapzen/AWS "terrarium" tiles (open data, no key, no request limits).
 * Elevation is decoded from PNG pixels in the browser:  h = R*256 + G + B/256 - 32768.
 * Fallback: Open-Meteo elevation API (Copernicus DEM, free but daily-limited).
 */

const ZOOM = 13; // ~19 m/px at 49°N
const TILE_URL = (z: number, x: number, y: number) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

const tileCache = new Map<string, Promise<Uint8ClampedArray | null>>();

function tileXY(lng: number, lat: number, z: number) {
	const n = 2 ** z;
	const xf = ((lng + 180) / 360) * n;
	const latR = (lat * Math.PI) / 180;
	const yf = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
	return { x: Math.floor(xf), y: Math.floor(yf), px: (xf % 1) * 256, py: (yf % 1) * 256 };
}

async function loadTile(z: number, x: number, y: number, signal?: AbortSignal): Promise<Uint8ClampedArray | null> {
	const key = `${z}/${x}/${y}`;
	if (!tileCache.has(key)) {
		tileCache.set(
			key,
			(async () => {
				const res = await fetch(TILE_URL(z, x, y), { signal });
				if (!res.ok) return null;
				const bmp = await createImageBitmap(await res.blob());
				const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(256, 256) : document.createElement('canvas');
				canvas.width = 256;
				canvas.height = 256;
				const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
				ctx.drawImage(bmp, 0, 0);
				return ctx.getImageData(0, 0, 256, 256).data;
			})().catch((e) => {
				tileCache.delete(key);
				throw e;
			})
		);
	}
	return tileCache.get(key)!;
}

function sample(data: Uint8ClampedArray, px: number, py: number): number {
	// bilinear interpolation between the four surrounding pixels
	const x0 = Math.min(255, Math.max(0, Math.floor(px - 0.5)));
	const y0 = Math.min(255, Math.max(0, Math.floor(py - 0.5)));
	const x1 = Math.min(255, x0 + 1);
	const y1 = Math.min(255, y0 + 1);
	const fx = Math.min(1, Math.max(0, px - 0.5 - x0));
	const fy = Math.min(1, Math.max(0, py - 0.5 - y0));
	const h = (x: number, y: number) => {
		const i = (y * 256 + x) * 4;
		return data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
	};
	return h(x0, y0) * (1 - fx) * (1 - fy) + h(x1, y0) * fx * (1 - fy) + h(x0, y1) * (1 - fx) * fy + h(x1, y1) * fx * fy;
}

async function terrarium(pts: Pt[], signal?: AbortSignal): Promise<Pt[]> {
	const out: Pt[] = pts.map((p) => [p[0], p[1], p[2]]);
	const need = out.map((p, i) => (p[2] == null ? i : -1)).filter((i) => i >= 0);
	// group by tile so each tile is fetched once
	const byTile = new Map<string, number[]>();
	for (const i of need) {
		const t = tileXY(out[i][0], out[i][1], ZOOM);
		const key = `${t.x}/${t.y}`;
		if (!byTile.has(key)) byTile.set(key, []);
		byTile.get(key)!.push(i);
	}
	await Promise.all(
		[...byTile.entries()].map(async ([key, idxs]) => {
			const [x, y] = key.split('/').map(Number);
			const data = await loadTile(ZOOM, x, y, signal);
			if (!data) throw new Error('tile');
			for (const i of idxs) {
				const t = tileXY(out[i][0], out[i][1], ZOOM);
				out[i][2] = Math.round(sample(data, t.px, t.py) * 10) / 10;
			}
		})
	);
	return out;
}

async function openMeteo(pts: Pt[], signal?: AbortSignal): Promise<Pt[]> {
	const out: Pt[] = pts.map((p) => [p[0], p[1], p[2]]);
	const todo = out.map((p, i) => (p[2] == null ? i : -1)).filter((i) => i >= 0);
	for (let k = 0; k < todo.length; k += 100) {
		const batch = todo.slice(k, k + 100);
		const lat = batch.map((i) => out[i][1].toFixed(5)).join(',');
		const lon = batch.map((i) => out[i][0].toFixed(5)).join(',');
		const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`, { signal });
		if (!res.ok) throw new Error(`elevation ${res.status}`);
		const data = (await res.json()) as { elevation?: number[]; error?: boolean };
		if (!data.elevation) throw new Error('elevation quota');
		batch.forEach((i, j) => (out[i][2] = data.elevation![j]));
	}
	return out;
}

export async function addElevation(pts: Pt[], signal?: AbortSignal): Promise<Pt[]> {
	try {
		return await terrarium(pts, signal);
	} catch (e) {
		if ((e as Error).name === 'AbortError') throw e;
		return openMeteo(pts, signal);
	}
}
