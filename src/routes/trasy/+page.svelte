<script lang="ts">
	import { t } from '$lib/i18n';
	import { routes } from '$lib/stores/db';
	import { fmtDist, fmtTime, stats } from '$lib/geo/geo';
	import { estimateMinutes, fitPace } from '$lib/geo/pace';
	import { hikes } from '$lib/stores/db';

	let pace = $derived(fitPace($hikes));
	function remove(id: string) {
		if (confirm($t('delete') + '?')) routes.update((l) => l.filter((r) => r.id !== id));
	}
</script>

<div class="page">
	<h1>{$t('nav_routes')}</h1>
	{#if !$routes.length}
		<p class="muted">{$t('no_routes')}</p>
	{/if}
	{#each $routes as r (r.id)}
		{@const s = stats(r.line)}
		<div class="card">
			<h3>{r.name}</h3>
			<div class="row muted">
				<span>{fmtDist(s.distance)}</span>
				<span style="color:var(--up)">+{Math.round(s.ascent)} m</span>
				<span style="color:var(--down)">−{Math.round(s.descent)} m</span>
				<span>{fmtTime(estimateMinutes(pace, s.distance, s.ascent, s.descent))}</span>
				{#each r.countries as c}<span class="chip">{c}</span>{/each}
			</div>
			<div class="row" style="margin-top:10px">
				<a href="/?id={r.id}"><button class="primary">{$t('open')}</button></a>
				<button onclick={() => remove(r.id)}>{$t('delete')}</button>
			</div>
		</div>
	{/each}
</div>
