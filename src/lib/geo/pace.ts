/**
 * Personal pace model.
 *
 * time[min] = distance[km] / vFlat * 60 + ascent[m] / vUp * 60 + descent[m] / vDown * 60
 *
 * Defaults follow PTTK planning tables (4 km/h, 300 m/h up, 500 m/h down).
 * With logged hikes the three rates are fitted by non-negative least squares
 * (simple projected gradient) and blended with defaults until there is enough data.
 */

export interface Hike {
	id: string;
	name: string;
	date: string; // ISO date
	distance: number; // m
	ascent: number; // m
	descent: number; // m
	minutes: number; // moving/total time in minutes
}

export interface Pace {
	flatKmh: number;
	upMh: number;
	downMh: number;
	/** number of hikes the model is based on */
	n: number;
	/** relative uncertainty, 0.1 = ±10% */
	spread: number;
}

export const DEFAULT_PACE: Pace = { flatKmh: 4, upMh: 300, downMh: 500, n: 0, spread: 0.25 };

export function fitPace(hikes: Hike[]): Pace {
	const valid = hikes.filter((h) => h.minutes > 0 && h.distance > 0);
	if (valid.length === 0) return DEFAULT_PACE;

	// unknowns: a = h/km, b = h/m up, c = h/m down  (time in hours)
	let a = 1 / DEFAULT_PACE.flatKmh;
	let b = 1 / DEFAULT_PACE.upMh;
	let c = 1 / DEFAULT_PACE.downMh;
	const rows = valid.map((h) => ({ x: [h.distance / 1000, h.ascent, h.descent], y: h.minutes / 60 }));
	// scale features so gradient steps are comparable
	const scale = [1, 100, 100];
	const lr = 0.02;
	for (let it = 0; it < 4000; it++) {
		let ga = 0, gb = 0, gc = 0;
		for (const r of rows) {
			const pred = a * r.x[0] + b * r.x[1] + c * r.x[2];
			const e = pred - r.y;
			ga += e * r.x[0];
			gb += e * r.x[1];
			gc += e * r.x[2];
		}
		const n = rows.length;
		a -= (lr * ga) / n / scale[0] ** 2;
		b -= (lr * gb) / n / scale[1] ** 2;
		c -= (lr * gc) / n / scale[2] ** 2;
		// keep rates in physically sensible ranges
		a = Math.min(Math.max(a, 1 / 7), 1 / 1.5); // 1.5–7 km/h
		b = Math.min(Math.max(b, 1 / 800), 1 / 120); // 120–800 m/h
		c = Math.min(Math.max(c, 1 / 1200), 1 / 150); // 150–1200 m/h
	}
	// blend with defaults: weight of personal data grows with number of hikes
	const w = Math.min(1, valid.length / 6);
	const flatKmh = 1 / (w * a + (1 - w) / DEFAULT_PACE.flatKmh);
	const upMh = 1 / (w * b + (1 - w) / DEFAULT_PACE.upMh);
	const downMh = 1 / (w * c + (1 - w) / DEFAULT_PACE.downMh);

	// spread from residuals
	let ss = 0;
	for (const r of rows) {
		const pred = ((r.x[0] / flatKmh) + r.x[1] / upMh + r.x[2] / downMh) * 60;
		ss += ((pred - r.y * 60) / (r.y * 60)) ** 2;
	}
	const resid = Math.sqrt(ss / rows.length);
	const spread = Math.max(0.08, Math.min(0.35, (1 - w) * 0.25 + w * resid));
	return { flatKmh, upMh, downMh, n: valid.length, spread };
}

export function estimateMinutes(p: Pace, distanceM: number, ascentM: number, descentM: number): number {
	return ((distanceM / 1000) / p.flatKmh + ascentM / p.upMh + descentM / p.downMh) * 60;
}
