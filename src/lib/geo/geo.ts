export type LngLat = [number, number];
/** [lng, lat, ele?] */
export type Pt = [number, number, number?];

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: LngLat | Pt, b: LngLat | Pt): number {
	const dLat = rad(b[1] - a[1]);
	const dLng = rad(b[0] - a[0]);
	const s =
		Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
}

export function lineLength(pts: Pt[]): number {
	let d = 0;
	for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
	return d;
}

/** Insert intermediate points so that no segment is longer than `step` metres. */
export function densify(pts: Pt[], step = 50): Pt[] {
	if (pts.length < 2) return pts.slice();
	const out: Pt[] = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		const a = pts[i - 1];
		const b = pts[i];
		const d = haversine(a, b);
		const n = Math.max(1, Math.ceil(d / step));
		for (let k = 1; k <= n; k++) {
			const f = k / n;
			out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
		}
	}
	return out;
}

/** Moving-average smoothing of elevations to suppress DEM noise. */
export function smoothElevation(pts: Pt[], window = 3): Pt[] {
	return pts.map((p, i) => {
		let s = 0;
		let n = 0;
		for (let k = -window; k <= window; k++) {
			const q = pts[i + k];
			if (q && q[2] != null) {
				s += q[2]!;
				n++;
			}
		}
		return [p[0], p[1], n ? s / n : p[2]];
	});
}

export interface Stats {
	distance: number; // m
	ascent: number; // m
	descent: number; // m
	minEle: number;
	maxEle: number;
}

export function stats(pts: Pt[]): Stats {
	let distance = 0;
	let ascent = 0;
	let descent = 0;
	let minEle = Infinity;
	let maxEle = -Infinity;
	for (let i = 0; i < pts.length; i++) {
		const e = pts[i][2];
		if (e != null) {
			minEle = Math.min(minEle, e);
			maxEle = Math.max(maxEle, e);
		}
		if (i === 0) continue;
		distance += haversine(pts[i - 1], pts[i]);
		const pe = pts[i - 1][2];
		if (e != null && pe != null) {
			const diff = e - pe;
			if (diff > 0) ascent += diff;
			else descent -= diff;
		}
	}
	if (!isFinite(minEle)) minEle = maxEle = 0;
	return { distance, ascent, descent, minEle, maxEle };
}

export type SegKind = 'flat' | 'up' | 'down';

export interface Segment {
	kind: SegKind;
	startIdx: number;
	endIdx: number;
	startDist: number; // m from route start
	distance: number; // m
	gain: number; // m (signed)
	avgGrade: number; // %
	maxGrade: number; // %
	startEle: number;
	endEle: number;
}

/**
 * Split a route into ascent / descent / flat segments.
 * A segment ends when the direction changes for at least `minGain` metres.
 */
export function segments(pts: Pt[], minGain = 25): Segment[] {
	if (pts.length < 2) return [];
	const cum: number[] = [0];
	for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + haversine(pts[i - 1], pts[i]);
	const ele = (i: number) => pts[i][2] ?? 0;

	// find turning points: local extrema with minimum prominence
	const turns: number[] = [0];
	let dir: 1 | -1 | 0 = 0;
	let extremeIdx = 0;
	for (let i = 1; i < pts.length; i++) {
		const d = ele(i) - ele(extremeIdx);
		if (dir === 0) {
			if (Math.abs(d) >= minGain) {
				dir = d > 0 ? 1 : -1;
				extremeIdx = i;
			} else if ((d > 0 && ele(i) > ele(extremeIdx)) || (d < 0 && ele(i) < ele(extremeIdx))) {
				// keep searching
			}
			continue;
		}
		if ((dir === 1 && ele(i) > ele(extremeIdx)) || (dir === -1 && ele(i) < ele(extremeIdx))) {
			extremeIdx = i;
		} else if (Math.abs(d) >= minGain) {
			turns.push(extremeIdx);
			dir = d > 0 ? 1 : -1;
			extremeIdx = i;
		}
	}
	if (turns[turns.length - 1] !== pts.length - 1) turns.push(pts.length - 1);

	const out: Segment[] = [];
	for (let s = 0; s < turns.length - 1; s++) {
		const a = turns[s];
		const b = turns[s + 1];
		if (b <= a) continue;
		const distance = cum[b] - cum[a];
		const gain = ele(b) - ele(a);
		let maxGrade = 0;
		for (let i = a + 1; i <= b; i++) {
			const dd = cum[i] - cum[i - 1];
			if (dd > 5) maxGrade = Math.max(maxGrade, Math.abs((ele(i) - ele(i - 1)) / dd) * 100);
		}
		const avgGrade = distance > 0 ? (gain / distance) * 100 : 0;
		const kind: SegKind = Math.abs(avgGrade) < 3 ? 'flat' : gain > 0 ? 'up' : 'down';
		out.push({
			kind,
			startIdx: a,
			endIdx: b,
			startDist: cum[a],
			distance,
			gain,
			avgGrade,
			maxGrade,
			startEle: ele(a),
			endEle: ele(b)
		});
	}
	return out;
}

export function fmtDist(m: number): string {
	return m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.round(m)} m`;
}

export function fmtTime(min: number): string {
	const h = Math.floor(min / 60);
	const m = Math.round(min % 60);
	return h ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
}

export function fmtClock(minFromMidnight: number): string {
	const m = ((Math.round(minFromMidnight) % 1440) + 1440) % 1440;
	return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

// --- polyline encoding (Google format, precision 5) for share links ---

export function encodePolyline(pts: Pt[]): string {
	let out = '';
	let plat = 0;
	let plng = 0;
	const enc = (v: number) => {
		let n = v < 0 ? ~(v << 1) : v << 1;
		let s = '';
		while (n >= 0x20) {
			s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
			n >>= 5;
		}
		return s + String.fromCharCode(n + 63);
	};
	for (const p of pts) {
		const lat = Math.round(p[1] * 1e5);
		const lng = Math.round(p[0] * 1e5);
		out += enc(lat - plat) + enc(lng - plng);
		plat = lat;
		plng = lng;
	}
	return out;
}

export function decodePolyline(s: string): Pt[] {
	const pts: Pt[] = [];
	let i = 0;
	let lat = 0;
	let lng = 0;
	const dec = () => {
		let shift = 0;
		let result = 0;
		let b: number;
		do {
			b = s.charCodeAt(i++) - 63;
			result |= (b & 0x1f) << shift;
			shift += 5;
		} while (b >= 0x20);
		return result & 1 ? ~(result >> 1) : result >> 1;
	};
	while (i < s.length) {
		lat += dec();
		lng += dec();
		pts.push([lng / 1e5, lat / 1e5]);
	}
	return pts;
}

export function bbox(pts: Pt[]): [LngLat, LngLat] {
	let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
	for (const p of pts) {
		w = Math.min(w, p[0]); e = Math.max(e, p[0]);
		s = Math.min(s, p[1]); n = Math.max(n, p[1]);
	}
	return [[w, s], [e, n]];
}
