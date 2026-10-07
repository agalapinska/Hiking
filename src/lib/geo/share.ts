import { decodePolyline, encodePolyline, type Pt } from './geo';

export interface SharePayload {
	n: string; // name
	w: string; // encoded waypoints
	l?: string; // encoded full line (optional, when routed)
}

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encodeShare(name: string, waypoints: Pt[], line?: Pt[]): string {
	const p: SharePayload = { n: name, w: encodePolyline(waypoints) };
	if (line && line.length > waypoints.length) p.l = encodePolyline(line);
	return b64(JSON.stringify(p));
}

export function decodeShare(hash: string): { name: string; waypoints: Pt[]; line?: Pt[] } | null {
	try {
		const p = JSON.parse(unb64(hash)) as SharePayload;
		return { name: p.n, waypoints: decodePolyline(p.w), line: p.l ? decodePolyline(p.l) : undefined };
	} catch {
		return null;
	}
}
