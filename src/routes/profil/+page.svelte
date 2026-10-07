<script lang="ts">
	import { lang, t } from '$lib/i18n';
	import { hikes, settings, uid } from '$lib/stores/db';
	import { fitPace, type Hike } from '$lib/geo/pace';
	import { parseGpx } from '$lib/geo/gpx';
	import { smoothElevation, stats, fmtDist, fmtTime } from '$lib/geo/geo';
	import { addElevation } from '$lib/geo/elevation';

	let pace = $derived(fitPace($hikes));
	let form = $state({ name: '', distance: '', ascent: '', descent: '', minutes: '' });
	let needTime = $state<Partial<Hike> | null>(null);
	let busy = $state(false);

	function add() {
		const h: Hike = {
			id: uid(), name: form.name || new Date().toLocaleDateString(), date: new Date().toISOString().slice(0, 10),
			distance: parseFloat(form.distance) * 1000 || 0, ascent: parseFloat(form.ascent) || 0, descent: parseFloat(form.descent) || 0, minutes: parseFloat(form.minutes) || 0
		};
		if (!h.distance || !h.minutes) return;
		hikes.update((l) => [h, ...l]);
		form = { name: '', distance: '', ascent: '', descent: '', minutes: '' };
	}

	async function fromGpx(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		busy = true;
		try {
			const p = parseGpx(await file.text());
			let line = p.line;
			if (line.some((x) => x[2] == null)) line = await addElevation(line);
			line = smoothElevation(line);
			const s = stats(line);
			const ts = p.times.filter((x): x is number => x != null);
			let minutes = 0;
			if (ts.length > 1) {
				// moving time: sum of gaps shorter than 5 min
				for (let i = 1; i < ts.length; i++) {
					const gap = (ts[i] - ts[i - 1]) / 60000;
					if (gap > 0 && gap < 5) minutes += gap;
				}
			}
			const h: Partial<Hike> = { id: uid(), name: p.name, date: ts.length ? new Date(ts[0]).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), distance: s.distance, ascent: s.ascent, descent: s.descent, minutes: Math.round(minutes) };
			if (minutes > 0) hikes.update((l) => [h as Hike, ...l]);
			else needTime = h;
		} finally {
			busy = false;
			(e.target as HTMLInputElement).value = '';
		}
	}
	function confirmTime() {
		if (!needTime) return;
		const m = parseFloat(form.minutes);
		if (!m) return;
		hikes.update((l) => [{ ...(needTime as Hike), minutes: m }, ...l]);
		needTime = null;
		form.minutes = '';
	}
	function remove(id: string) { hikes.update((l) => l.filter((h) => h.id !== id)); }
</script>

<div class="page">
	<h1>{$t('nav_profile')}</h1>

	<div class="card">
		<h2>{$t('pace')}</h2>
		<p class="muted">{$t('pace_hint')}</p>
		<p>{pace.n ? $t('pace_personal', { n: pace.n }) : $t('pace_default')}</p>
		<div class="stats">
			<div class="stat"><b>{pace.flatKmh.toFixed(1)} km/h</b><span>{$t('pace_flat')}</span></div>
			<div class="stat"><b style="color:var(--up)">{Math.round(pace.upMh)} m/h</b><span>{$t('pace_up')}</span></div>
			<div class="stat"><b style="color:var(--down)">{Math.round(pace.downMh)} m/h</b><span>{$t('pace_down')}</span></div>
			<div class="stat"><b>±{Math.round(pace.spread * 100)}%</b><span>σ</span></div>
		</div>
	</div>

	<div class="card">
		<h2>{$t('add_hike')}</h2>
		<label class="filebtn">
			<input type="file" accept=".gpx,.tcx" onchange={fromGpx} hidden />
			{busy ? '…' : '⬆ ' + $t('hike_from_gpx')}
		</label>
		{#if needTime}
			<div class="warn" style="margin-top:10px">
				{$t('hike_time_needed')} — {needTime.name}: {fmtDist(needTime.distance!)}, +{Math.round(needTime.ascent!)} m
				<div class="row" style="margin-top:6px">
					<input type="number" placeholder={$t('hike_time')} bind:value={form.minutes} style="width:120px" />
					<button class="primary" onclick={confirmTime}>OK</button>
				</div>
			</div>
		{/if}
		<div class="grid" style="margin-top:12px">
			<div class="field"><span class="muted lbl">{$t('hike_name')}</span><input bind:value={form.name} /></div>
			<div class="field"><span class="muted lbl">{$t('hike_distance')}</span><input type="number" inputmode="decimal" bind:value={form.distance} /></div>
			<div class="field"><span class="muted lbl">{$t('hike_ascent')}</span><input type="number" inputmode="numeric" bind:value={form.ascent} /></div>
			<div class="field"><span class="muted lbl">{$t('hike_descent')}</span><input type="number" inputmode="numeric" bind:value={form.descent} /></div>
			<div class="field"><span class="muted lbl">{$t('hike_time')}</span><input type="number" inputmode="numeric" bind:value={form.minutes} /></div>
		</div>
		<button class="primary" onclick={add}>{$t('add_hike')}</button>
	</div>

	<div class="card">
		<h2>{$t('hikes')} ({$hikes.length})</h2>
		{#if !$hikes.length}<p class="muted">{$t('no_hikes')}</p>{/if}
		{#each $hikes as h (h.id)}
			<div class="row hike">
				<div style="flex:1">
					<b>{h.name}</b>
					<div class="muted">{h.date} · {fmtDist(h.distance)} · +{Math.round(h.ascent)} / −{Math.round(h.descent)} m · {fmtTime(h.minutes)}</div>
				</div>
				<button class="icon" onclick={() => remove(h.id)} aria-label={$t('delete')}>🗑</button>
			</div>
		{/each}
	</div>

	<div class="card">
		<div class="field">
			<span class="muted lbl">{$t('language')}</span>
			<select bind:value={$lang}><option value="pl">Polski</option><option value="en">English</option></select>
		</div>
		<div class="field">
			<span class="muted lbl">{$t('theme')}</span>
			<select bind:value={$settings.theme}>
				<option value="auto">{$t('theme_auto')}</option>
				<option value="dark">{$t('theme_dark')}</option>
				<option value="light">{$t('theme_light')}</option>
			</select>
		</div>
		<p class="muted">{$t('attribution_hint')}</p>
	</div>
</div>

<style>
	.stats { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; }
	.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
	.grid .field:first-child { grid-column: 1 / -1; }
	.filebtn {
		display: inline-flex; align-items: center; padding: 10px 16px; min-height: 44px;
		border-radius: 999px; background: var(--bg-3); color: var(--fg); font-size: 1rem;
	}
	.lbl { display:block; font-size:0.85rem; margin-bottom:4px; }
	.hike { padding: 8px 0; border-top: 1px solid var(--line); flex-wrap: nowrap; }
	.warn {
		background: color-mix(in srgb, var(--warn) 15%, transparent);
		border-left: 3px solid var(--warn); padding: 8px 10px; border-radius: 6px; font-size: 0.9rem;
	}
</style>
