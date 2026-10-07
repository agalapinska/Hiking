import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Pt } from '$lib/geo/geo';
import type { Hike } from '$lib/geo/pace';

export interface SavedRoute {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	waypoints: Pt[];
	line: Pt[];
	followTrails: boolean;
	countries: string[];
	/** planned start time, minutes from midnight */
	startMin: number;
	/** hours per day for multi-day split */
	hoursPerDay: number;
}

export interface Settings {
	theme: 'auto' | 'dark' | 'light';
	basemap: string;
	overlays: string[];
}

function persisted<T>(key: string, initial: T) {
	let value = initial;
	if (browser) {
		try {
			const raw = localStorage.getItem(key);
			if (raw) value = JSON.parse(raw) as T;
		} catch {
			/* ignore corrupt storage */
		}
	}
	const store = writable<T>(value);
	if (browser) store.subscribe((v) => localStorage.setItem(key, JSON.stringify(v)));
	return store;
}

export const routes = persisted<SavedRoute[]>('routes', []);
export const hikes = persisted<Hike[]>('hikes', []);
export const settings = persisted<Settings>('settings', { theme: 'auto', basemap: 'opentopo', overlays: ['waymarked'] });

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
