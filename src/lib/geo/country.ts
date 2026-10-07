import type { CountryCode } from '$lib/map/sources';
import type { Pt } from './geo';

/**
 * Country detection by reverse geocoding a handful of points along the route
 * (Nominatim, max 1 request/s). Results are cached per rounded coordinate.
 */
const cache = new Map<string, string>();
let lastCall = 0;

async function reverseCountry(p: Pt, signal?: AbortSignal): Promise<string | null> {
	const key = `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
	if (cache.has(key)) return cache.get(key)!;
	const wait = Math.max(0, 1100 - (Date.now() - lastCall));
	if (wait) await new Promise((r) => setTimeout(r, wait));
	lastCall = Date.now();
	const res = await fetch(
		`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&lat=${p[1]}&lon=${p[0]}&accept-language=pl`,
		{ signal, headers: { Accept: 'application/json' } }
	);
	if (!res.ok) return null;
	const j = await res.json();
	const cc = (j?.address?.country_code as string | undefined)?.toUpperCase() ?? null;
	if (cc) cache.set(key, cc);
	return cc;
}

export async function detectCountries(line: Pt[], signal?: AbortSignal): Promise<string[]> {
	if (!line.length) return [];
	const n = Math.min(5, line.length);
	const sample: Pt[] = [];
	for (let i = 0; i < n; i++) sample.push(line[Math.round((i * (line.length - 1)) / Math.max(1, n - 1))]);
	const found = new Set<string>();
	for (const p of sample) {
		const cc = await reverseCountry(p, signal);
		if (cc) found.add(cc);
	}
	return [...found];
}

export const SUPPORTED: CountryCode[] = ['PL', 'CZ', 'SK', 'SI', 'AT', 'IT', 'CH'];

export function isSupported(cc: string): cc is CountryCode {
	return (SUPPORTED as string[]).includes(cc);
}
