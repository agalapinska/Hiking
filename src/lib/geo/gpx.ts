import type { Pt } from './geo';

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

export function toGpx(name: string, line: Pt[], waypoints: Pt[] = []): string {
	const trk = line
		.map((p) => `<trkpt lat="${p[1].toFixed(6)}" lon="${p[0].toFixed(6)}">${p[2] != null ? `<ele>${p[2].toFixed(1)}</ele>` : ''}</trkpt>`)
		.join('\n');
	const wpts = waypoints
		.map((p, i) => `<wpt lat="${p[1].toFixed(6)}" lon="${p[0].toFixed(6)}"><name>WP${i + 1}</name></wpt>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Szlaki" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${esc(name)}</name></metadata>
${wpts}
<trk><name>${esc(name)}</name><trkseg>
${trk}
</trkseg></trk>
</gpx>`;
}

export interface ParsedGpx {
	name: string;
	line: Pt[];
	/** Unix ms timestamps parallel to `line`, when present */
	times: (number | null)[];
	waypoints: Pt[];
}

export function parseGpx(xml: string): ParsedGpx {
	const doc = new DOMParser().parseFromString(xml, 'application/xml');
	const name =
		doc.querySelector('trk > name')?.textContent ?? doc.querySelector('metadata > name')?.textContent ?? 'GPX';
	const line: Pt[] = [];
	const times: (number | null)[] = [];
	const pts = doc.querySelectorAll('trkpt, rtept');
	pts.forEach((el) => {
		const lat = parseFloat(el.getAttribute('lat') ?? '');
		const lon = parseFloat(el.getAttribute('lon') ?? '');
		if (isNaN(lat) || isNaN(lon)) return;
		const eleTxt = el.querySelector('ele')?.textContent;
		const ele = eleTxt ? parseFloat(eleTxt) : undefined;
		line.push([lon, lat, isNaN(ele as number) ? undefined : ele]);
		const t = el.querySelector('time')?.textContent;
		times.push(t ? Date.parse(t) : null);
	});
	const waypoints: Pt[] = [];
	doc.querySelectorAll('wpt').forEach((el) => {
		waypoints.push([parseFloat(el.getAttribute('lon') ?? '0'), parseFloat(el.getAttribute('lat') ?? '0')]);
	});
	return { name, line, times, waypoints };
}

export function download(filename: string, content: string, type = 'application/gpx+xml') {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
