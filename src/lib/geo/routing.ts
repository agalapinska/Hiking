import { env } from '$env/dynamic/public';
import { densify, type Pt } from './geo';

const ORS_KEY = env.PUBLIC_ORS_KEY ?? '';
export const hasRouting = !!ORS_KEY;

/**
 * Route between consecutive waypoints. With an OpenRouteService key the
 * foot-hiking profile follows trails; otherwise segments are straight lines.
 * Returns the full line (without elevation) and the index of each waypoint in it.
 */
export async function routeWaypoints(
	wps: Pt[],
	followTrails: boolean,
	signal?: AbortSignal
): Promise<{ line: Pt[]; wpIdx: number[] }> {
	if (wps.length < 2) return { line: wps.slice(), wpIdx: wps.map((_, i) => i) };
	if (!followTrails || !hasRouting) {
		const line = densify(wps, 60);
		// locate waypoints in the densified line by exact coordinate match
		const wpIdx: number[] = [];
		let j = 0;
		for (const w of wps) {
			while (j < line.length && (line[j][0] !== w[0] || line[j][1] !== w[1])) j++;
			wpIdx.push(Math.min(j, line.length - 1));
		}
		return { line, wpIdx };
	}
	const res = await fetch('https://api.openrouteservice.org/v2/directions/foot-hiking/geojson', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: ORS_KEY },
		body: JSON.stringify({ coordinates: wps.map((p) => [p[0], p[1]]), elevation: true, instructions: false }),
		signal
	});
	if (!res.ok) throw new Error(`routing ${res.status}`);
	const gj = await res.json();
	const f = gj.features[0];
	const line: Pt[] = f.geometry.coordinates.map((c: number[]) => [c[0], c[1], c[2]]);
	const wpIdx: number[] = f.properties.way_points ?? [0, line.length - 1];
	return { line, wpIdx };
}
