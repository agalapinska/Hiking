<script lang="ts">
	import { onMount } from 'svelte';
	import Planner from '$lib/components/Planner.svelte';
	import { decodeShare } from '$lib/geo/share';
	import { addElevation } from '$lib/geo/elevation';
	import { routeWaypoints } from '$lib/geo/routing';
	import { smoothElevation, type Pt } from '$lib/geo/geo';
	import { t } from '$lib/i18n';
	import type { SavedRoute } from '$lib/stores/db';

	let initial = $state<Partial<SavedRoute> | null>(null);
	let bad = $state(false);

	onMount(async () => {
		const d = decodeShare(location.hash.slice(1));
		if (!d) { bad = true; return; }
		let line: Pt[] = d.line ?? (await routeWaypoints(d.waypoints, false)).line;
		try { line = smoothElevation(await addElevation(line)); } catch { /* show without elevation */ }
		initial = { name: d.name, waypoints: d.waypoints, line, followTrails: !!d.line, countries: [] };
	});
</script>

{#if bad}
	<div class="page"><p class="muted">Nieprawidłowy link / invalid link.</p></div>
{:else if initial}
	<Planner {initial} readonly />
{:else}
	<div class="page"><p class="muted">{$t('loading_elev')}</p></div>
{/if}
