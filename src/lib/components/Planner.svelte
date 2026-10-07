<script lang="ts">
	import { goto } from '$app/navigation';
	import Map from './Map.svelte';
	import Profile from './Profile.svelte';
	import RuleCard from './RuleCard.svelte';
	import { lang, t } from '$lib/i18n';
	import { basemaps, overlays, isAvailable, recommendBasemap, type CountryCode } from '$lib/map/sources';
	import { addElevation } from '$lib/geo/elevation';
	import { routeWaypoints, hasRouting } from '$lib/geo/routing';
	import { detectCountries, isSupported } from '$lib/geo/country';
	import { fmtClock, fmtDist, fmtTime, haversine, segments, smoothElevation, stats, type Pt } from '$lib/geo/geo';
	import { estimateMinutes, fitPace } from '$lib/geo/pace';
	import { sunTimes } from '$lib/geo/sun';
	import { toGpx, parseGpx, download } from '$lib/geo/gpx';
	import { encodeShare } from '$lib/geo/share';
	import { countries as countryInfo, rulesForRoute } from '$lib/rules/data';
	import { hikes, routes, settings, uid, type SavedRoute } from '$lib/stores/db';

	interface Props {
		initial?: Partial<SavedRoute> | null;
		readonly?: boolean;
	}
	let { initial = null, readonly = false }: Props = $props();

	// ---------- state ----------
	let id = $state(initial?.id ?? uid());
	let name = $state(initial?.name ?? '');
	let waypoints = $state<Pt[]>(initial?.waypoints ?? []);
	let line = $state<Pt[]>(initial?.line ?? []);
	let followTrails = $state(initial?.followTrails ?? hasRouting);
	let countries = $state<string[]>(initial?.countries ?? []);
	let startMin = $state(initial?.startMin ?? 7 * 60);
	let hoursPerDay = $state(initial?.hoursPerDay ?? 8);
	let loading = $state(false);
	let error = $state('');
	let detecting = $state(false);
	let hoverIdx = $state<number | null>(null);
	let fitKey = $state(initial?.line?.length ? 1 : 0);
	let sheet = $state<'min' | 'half' | 'full'>(initial?.line?.length ? 'half' : 'min');
	let tab = $state<'profile' | 'timeline' | 'rules' | 'layers'>('profile');
	let toast = $state('');
	let mapRef: ReturnType<typeof Map> | undefined = $state();

	function showToast(msg: string) {
		toast = msg;
		setTimeout(() => (toast = ''), 1800);
	}

	// ---------- derived ----------
	let st = $derived(stats(line));
	let segs = $derived(segments(line));
	let pace = $derived(fitPace($hikes));
	let minutes = $derived(estimateMinutes(pace, st.distance, st.ascent, st.descent));
	let minLo = $derived(minutes * (1 - pace.spread));
	let minHi = $derived(minutes * (1 + pace.spread));

	/** cumulative minutes at every point of the line (for timeline & day split) */
	let cumMin = $derived.by(() => {
		const c = [0];
		for (let i = 1; i < line.length; i++) {
			const d = haversine(line[i - 1], line[i]);
			const dz = (line[i][2] ?? 0) - (line[i - 1][2] ?? 0);
			c[i] = c[i - 1] + estimateMinutes(pace, d, Math.max(0, dz), Math.max(0, -dz));
		}
		return c;
	});

	let dayBreaks = $derived.by(() => {
		const limit = hoursPerDay * 60;
		const breaks: number[] = [];
		let dayStart = 0;
		for (let i = 1; i < line.length; i++) {
			if (cumMin[i] - cumMin[dayStart] > limit) {
				breaks.push(i - 1);
				dayStart = i - 1;
			}
		}
		return breaks;
	});

	let days = $derived.by(() => {
		const idx = [0, ...dayBreaks, line.length - 1];
		const out = [];
		for (let d = 0; d < idx.length - 1; d++) {
			const a = idx[d], b = idx[d + 1];
			if (b <= a) continue;
			const part = line.slice(a, b + 1);
			out.push({ day: d + 1, ...stats(part), minutes: cumMin[b] - cumMin[a] });
		}
		return out;
	});

	let sun = $derived(line.length ? sunTimes(line[0][1], line[0][0]) : null);
	let endOfDay1 = $derived(startMin + (days[0]?.minutes ?? 0) * (1 + pace.spread));
	let daylightWarn = $derived(!!sun && days.length > 0 && endOfDay1 > sun.sunset);

	let timeline = $derived.by(() => {
		// arrival at each waypoint and at each segment end
		const marks: { label: string; dist: number; ele: number; min: number }[] = [];
		const wpIdx = waypoints.map((w) => nearestIdx(w));
		wpIdx.forEach((i, k) => {
			marks.push({ label: k === 0 ? 'Start' : k === waypoints.length - 1 ? 'Meta' : `WP${k}`, dist: distAt(i), ele: line[i]?.[2] ?? 0, min: cumMin[i] ?? 0 });
		});
		for (const s of segs) {
			if (s.kind !== 'flat' && Math.abs(s.gain) >= 100) {
				marks.push({ label: s.kind === 'up' ? `▲ +${Math.round(s.gain)} m` : `▼ ${Math.round(s.gain)} m`, dist: distAt(s.endIdx), ele: s.endEle, min: cumMin[s.endIdx] });
			}
		}
		return marks.sort((a, b) => a.min - b.min);
	});

	let cumDist = $derived.by(() => {
		const c = [0];
		for (let i = 1; i < line.length; i++) c[i] = c[i - 1] + haversine(line[i - 1], line[i]);
		return c;
	});
	const distAt = (i: number) => cumDist[i] ?? 0;
	function nearestIdx(p: Pt) {
		let best = 0, bd = Infinity;
		for (let i = 0; i < line.length; i++) {
			const d = haversine(p, line[i]);
			if (d < bd) { bd = d; best = i; }
		}
		return best;
	}

	let supported = $derived(countries.filter(isSupported) as CountryCode[]);
	let routeRules = $derived(rulesForRoute(countries, line));
	let emergency = $derived(countryInfo.filter((c) => countries.includes(c.code)));
	let recommended = $derived(recommendBasemap(supported));

	// ---------- actions ----------
	let abort: AbortController | undefined;
	async function rebuild() {
		abort?.abort();
		abort = new AbortController();
		const sig = abort.signal;
		error = '';
		if (waypoints.length < 2) {
			line = waypoints.map((w) => [w[0], w[1], w[2]]);
			return;
		}
		loading = true;
		try {
			const { line: raw } = await routeWaypoints(waypoints, followTrails, sig);
			if (sig.aborted) return;
			line = raw; // show geometry right away, elevation follows
			if (sheet === 'min') sheet = 'half';
			detect();
			try {
				const withEle = await addElevation(raw, sig);
				if (sig.aborted) return;
				line = smoothElevation(withEle);
			} catch (e) {
				if ((e as Error).name !== 'AbortError') error = $t('elev_error');
			}
		} catch (e) {
			if ((e as Error).name !== 'AbortError') error = $t('elev_error');
		} finally {
			if (!sig.aborted) loading = false;
		}
	}

	let detectAbort: AbortController | undefined;
	async function detect() {
		detectAbort?.abort();
		detectAbort = new AbortController();
		detecting = true;
		try {
			const found = await detectCountries(line, detectAbort.signal);
			if (found.length) {
				countries = found;
				const rec = recommendBasemap(found.filter(isSupported) as CountryCode[]);
				if (!$settings.basemap || $settings.basemap === 'opentopo') settings.update((s) => ({ ...s, basemap: rec.id }));
			}
		} catch {
			/* offline: keep previous */
		} finally {
			detecting = false;
		}
	}

	function onTap(p: Pt) {
		if (readonly) return;
		waypoints = [...waypoints, p];
		rebuild();
	}
	function onWaypointTap(i: number) {
		if (readonly) return;
		waypoints = waypoints.filter((_, k) => k !== i);
		rebuild();
	}
	function undo() {
		waypoints = waypoints.slice(0, -1);
		rebuild();
	}
	function clear() {
		waypoints = [];
		line = [];
		countries = [];
		sheet = 'min';
	}
	function toggleRouting() {
		followTrails = !followTrails;
		rebuild();
	}

	function save() {
		const now = new Date().toISOString();
		const r: SavedRoute = {
			id, name: name || `${$t('nav_routes')} ${new Date().toLocaleDateString()}`, createdAt: initial?.createdAt ?? now, updatedAt: now,
			waypoints: $state.snapshot(waypoints), line: $state.snapshot(line), followTrails, countries: $state.snapshot(countries), startMin, hoursPerDay
		};
		routes.update((list) => {
			const i = list.findIndex((x) => x.id === id);
			if (i >= 0) list[i] = r; else list.unshift(r);
			return [...list];
		});
		showToast($t('saved'));
	}
	function copyToMine() {
		id = uid();
		save();
		goto(`/?id=${id}`);
	}

	async function share() {
		const hash = encodeShare(name || 'Trasa', $state.snapshot(waypoints), followTrails ? $state.snapshot(line) : undefined);
		const url = `${location.origin}/s/#${hash}`;
		if (navigator.share) {
			try { await navigator.share({ title: name || $t('app'), url }); return; } catch { /* cancelled */ }
		}
		await navigator.clipboard.writeText(url);
		showToast($t('link_copied'));
	}

	function exportGpx() {
		download(`${(name || 'trasa').replace(/[^\w\- ]+/g, '')}.gpx`, toGpx(name || 'Trasa', $state.snapshot(line), $state.snapshot(waypoints)));
	}
	async function importGpx(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const parsed = parseGpx(await file.text());
		if (parsed.line.length < 2) return;
		name = name || parsed.name;
		// GPX track becomes the line; waypoints = start, end, and every ~2 km so the route can still be edited
		const stepPts = Math.max(1, Math.floor(parsed.line.length / 12));
		waypoints = parsed.line.filter((_, i) => i % stepPts === 0 || i === parsed.line.length - 1).map((p) => [p[0], p[1]]);
		followTrails = false;
		loading = true;
		try {
			const withEle = await addElevation(parsed.line);
			line = smoothElevation(withEle);
			fitKey++;
			sheet = 'half';
			detect();
		} catch {
			error = $t('elev_error');
		} finally {
			loading = false;
		}
		(e.target as HTMLInputElement).value = '';
	}

	function setBasemap(idv: string) { settings.update((s) => ({ ...s, basemap: idv })); }
	function toggleOverlay(idv: string) {
		settings.update((s) => ({ ...s, overlays: s.overlays.includes(idv) ? s.overlays.filter((x) => x !== idv) : [...s.overlays, idv] }));
	}
	let visibleBasemaps = $derived(basemaps.filter((b) => !b.coverage || !supported.length || b.coverage.some((c) => supported.includes(c))));
	let visibleOverlays = $derived(overlays.filter((b) => !b.coverage || !supported.length || b.coverage.some((c) => supported.includes(c))));

	// sheet drag
	let dragY = 0;
	function sheetStart(e: TouchEvent) { dragY = e.touches[0].clientY; }
	function sheetEnd(e: TouchEvent) {
		const dy = e.changedTouches[0].clientY - dragY;
		if (dy < -40) sheet = sheet === 'min' ? 'half' : 'full';
		else if (dy > 40) sheet = sheet === 'full' ? 'half' : 'min';
	}
	const gradeLabel = (g: number) => (Math.abs(g) > 20 ? $t('very_steep') : Math.abs(g) > 10 ? $t('steep') : '');
</script>

<div class="planner">
	<Map
		bind:this={mapRef}
		basemapId={$settings.basemap}
		overlayIds={$settings.overlays}
		{waypoints}
		{line}
		{hoverIdx}
		{fitKey}
		interactive={!readonly}
		{onTap}
		{onWaypointTap}
	/>

	<div class="top">
		{#if readonly}
			<div class="banner">{$t('shared_hint')}</div>
		{:else if waypoints.length === 0}
			<div class="banner">{$t('tap_to_add')}</div>
		{/if}
	</div>

	<div class="fabs">
		<button class="icon" onclick={() => mapRef?.locate()} aria-label={$t('locate')}>📍</button>
		<button class="icon" onclick={() => { tab = 'layers'; sheet = 'full'; }} aria-label={$t('layers')}>🗂️</button>
		{#if !readonly}
			<button class="icon" onclick={undo} disabled={!waypoints.length} aria-label={$t('undo')}>↩︎</button>
		{/if}
		{#if line.length > 1}
			<button class="icon" onclick={() => fitKey++} aria-label="fit">⤢</button>
		{/if}
	</div>

	{#if toast}<div class="toast">{toast}</div>{/if}

	<section class="sheet {sheet}" role="region" aria-label="details" ontouchstart={sheetStart} ontouchend={sheetEnd}>
		<button class="handle" onclick={() => (sheet = sheet === 'min' ? 'half' : sheet === 'half' ? 'full' : 'min')} aria-label="toggle"></button>

		<div class="summary">
			{#if readonly}
				<h2>{name || $t('shared_route')}</h2>
			{:else}
				<input class="name" placeholder={$t('route_name')} bind:value={name} />
			{/if}
			<div class="stats">
				<div class="stat"><b>{fmtDist(st.distance)}</b><span>{$t('distance')}</span></div>
				<div class="stat"><b style="color:var(--up)">+{Math.round(st.ascent)} m</b><span>{$t('ascent')}</span></div>
				<div class="stat"><b style="color:var(--down)">−{Math.round(st.descent)} m</b><span>{$t('descent')}</span></div>
				<div class="stat"><b>{fmtTime(minutes)}</b><span>{$t('time')}</span></div>
			</div>
			{#if loading}<div class="muted">{$t('loading_elev')}</div>{/if}
			{#if error}<div class="muted" style="color:var(--danger)">{error}</div>{/if}
		</div>

		<div class="actions scroll-x">
			{#if readonly}
				<button class="primary" onclick={copyToMine}>{$t('copy_to_mine')}</button>
			{:else}
				<button class="primary" onclick={save} disabled={line.length < 2}>{$t('save')}</button>
				<button onclick={share} disabled={waypoints.length < 2}>{$t('share')}</button>
				<button onclick={exportGpx} disabled={line.length < 2}>{$t('export_gpx')}</button>
				<label class="filebtn"><input type="file" accept=".gpx" onchange={importGpx} hidden />{$t('import_gpx')}</label>
				<button onclick={clear} disabled={!waypoints.length}>{$t('clear')}</button>
			{/if}
		</div>

		<div class="tabs">
			<button class:active={tab === 'profile'} onclick={() => (tab = 'profile')}>{$t('profile_title')}</button>
			<button class:active={tab === 'timeline'} onclick={() => (tab = 'timeline')}>{$t('timeline')}</button>
			<button class:active={tab === 'rules'} onclick={() => (tab = 'rules')}>{$t('nav_rules')} {routeRules.length ? `(${routeRules.length})` : ''}</button>
			<button class:active={tab === 'layers'} onclick={() => (tab = 'layers')}>{$t('layers')}</button>
		</div>

		<div class="body">
			{#if tab === 'profile'}
				{#if line.length > 1}
					<Profile {line} {segs} {dayBreaks} onHover={(i) => (hoverIdx = i)} />
					<div class="muted" style="margin:6px 0">
						{$t('time_range')}: <b>{fmtTime(minLo)} – {fmtTime(minHi)}</b>
						· {pace.n ? $t('pace_personal', { n: pace.n }) : 'PTTK'}
					</div>
					{#if days.length > 1}
						<div class="card">
							<h3>{$t('days')}: {days.length}</h3>
							{#each days as d}
								<div class="row seg">
									<b>{$t('day')} {d.day}</b>
									<span>{fmtDist(d.distance)}</span>
									<span style="color:var(--up)">+{Math.round(d.ascent)}</span>
									<span style="color:var(--down)">−{Math.round(d.descent)}</span>
									<span>{fmtTime(d.minutes)}</span>
								</div>
							{/each}
						</div>
					{:else if minutes > hoursPerDay * 60}
						<div class="warn">{$t('warn_long', { h: hoursPerDay })}</div>
					{/if}
					<h3>{$t('segments')}</h3>
					{#each segs as s}
						<div class="row seg {s.kind}">
							<span class="k">{s.kind === 'up' ? '▲' : s.kind === 'down' ? '▼' : '→'}</span>
							<span>{fmtDist(s.startDist)}</span>
							<span><b>{fmtDist(s.distance)}</b></span>
							<span>{s.kind === 'flat' ? '' : `${s.gain > 0 ? '+' : ''}${Math.round(s.gain)} m`}</span>
							<span class="muted">{Math.abs(s.avgGrade).toFixed(0)}% / {s.maxGrade.toFixed(0)}% {gradeLabel(s.maxGrade)}</span>
						</div>
					{/each}
				{:else}
					<p class="muted">{$t('tap_to_add')}</p>
				{/if}

			{:else if tab === 'timeline'}
				<div class="row" style="margin-bottom:8px">
					<span class="muted">{$t('start_time')}</span>
					<input type="time" style="width:auto" value={fmtClock(startMin)} onchange={(e) => { const [h, m] = (e.target as HTMLInputElement).value.split(':').map(Number); startMin = h * 60 + m; }} />
					<span class="muted">{$t('per_day_hours')}</span>
					<input type="number" min="3" max="14" style="width:70px" bind:value={hoursPerDay} />
				</div>
				{#if sun}
					<div class="muted">☀ {fmtClock(sun.sunrise)} – {fmtClock(sun.sunset)}</div>
				{/if}
				{#if daylightWarn}<div class="warn">{$t('warn_daylight')}</div>{/if}
				{#each timeline as m}
					<div class="row seg">
						<b class="clock">{fmtClock(startMin + m.min)}</b>
						<span>{m.label}</span>
						<span class="muted">{fmtDist(m.dist)} · {Math.round(m.ele)} m</span>
					</div>
				{/each}

			{:else if tab === 'rules'}
				{#if detecting}<p class="muted">{$t('detecting')}</p>{/if}
				{#if countries.length}
					<div class="row" style="margin-bottom:8px">
						<span class="muted">{$t('countries')}:</span>
						{#each countries as c}<span class="chip active">{c}</span>{/each}
					</div>
					{#each emergency as c}
						<div class="card">
							<h3>{$lang === 'pl' ? c.pl : c.en} · {$t('emergency')}</h3>
							<div class="row">
								{#each c.emergency as e}<a class="chip" href="tel:{e.number.replace(/\s/g, '')}">☎ {e.label}: {e.number}</a>{/each}
							</div>
							<p class="muted" style="margin-top:8px">{$lang === 'pl' ? c.trailMarking.pl : c.trailMarking.en}</p>
						</div>
					{/each}
					{#each routeRules as r (r.id)}<RuleCard rule={r} />{/each}
					<p class="muted" style="margin-top:10px">{$t('disclaimer')}</p>
				{:else}
					<p class="muted">{$t('rules_none')}</p>
				{/if}

			{:else if tab === 'layers'}
				<h3>{$t('basemap')}</h3>
				{#each visibleBasemaps as b}
					<button class="layer" class:active={$settings.basemap === b.id} disabled={!isAvailable(b)} onclick={() => setBasemap(b.id)}>
						<span>{b.name}</span>
						{#if !isAvailable(b)}<span class="muted">{$t('needs_key')}</span>
						{:else if b.id === recommended.id && supported.length}<span class="chip">{$t('recommended')}</span>{/if}
					</button>
				{/each}
				<h3 style="margin-top:12px">{$t('overlays')}</h3>
				{#each visibleOverlays as o}
					<button class="layer" class:active={$settings.overlays.includes(o.id)} onclick={() => toggleOverlay(o.id)}>
						<span>{o.name}</span><span>{$settings.overlays.includes(o.id) ? '✓' : ''}</span>
					</button>
				{/each}
				{#if !readonly}
					<h3 style="margin-top:12px">Routing</h3>
					<button class="layer" class:active={followTrails} disabled={!hasRouting} onclick={toggleRouting}>
						<span>{$t('routing_trail')}</span><span>{followTrails ? '✓' : ''}</span>
					</button>
					<button class="layer" class:active={!followTrails} onclick={() => { if (followTrails) toggleRouting(); }}>
						<span>{$t('routing_straight')}</span><span>{!followTrails ? '✓' : ''}</span>
					</button>
					{#if !hasRouting}<p class="muted">{$t('routing_hint')}</p>{/if}
				{/if}
			{/if}
		</div>
	</section>
</div>

<style>
	.planner {
		position: absolute;
		inset: 0;
		bottom: calc(var(--nav-h) + var(--safe-b));
		overflow: hidden;
	}
	.top {
		position: absolute;
		top: calc(10px + var(--safe-t));
		left: 12px;
		right: 70px;
		z-index: 5;
		pointer-events: none;
	}
	.banner {
		background: var(--bg-2);
		border-radius: 10px;
		padding: 8px 12px;
		font-size: 0.85rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
	}
	.fabs {
		position: absolute;
		top: calc(10px + var(--safe-t));
		right: 12px;
		z-index: 5;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.toast {
		position: absolute;
		top: 40%;
		left: 50%;
		transform: translateX(-50%);
		background: var(--fg);
		color: var(--bg);
		padding: 10px 18px;
		border-radius: 999px;
		z-index: 10;
	}
	.sheet {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 6;
		background: var(--bg-2);
		border-radius: 18px 18px 0 0;
		box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		transition: height 0.25s ease;
		height: 150px;
	}
	.sheet.half { height: 52%; }
	.sheet.full { height: calc(100% - 60px - var(--safe-t)); }
	.handle {
		width: 100%;
		min-height: 22px;
		padding: 0;
		background: transparent;
		border-radius: 0;
		justify-content: center;
	}
	.handle::before {
		content: '';
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: var(--line);
	}
	.summary { padding: 0 16px; }
	.name {
		min-height: 36px;
		padding: 4px 8px;
		border: 0;
		border-bottom: 1px solid var(--line);
		border-radius: 0;
		font-weight: 600;
		font-size: 1rem;
		background: transparent;
		margin-bottom: 6px;
	}
	.stats {
		display: flex;
		justify-content: space-between;
		gap: 6px;
	}
	.actions {
		padding: 8px 16px;
	}
	.filebtn {
		display: inline-flex;
		align-items: center;
		padding: 10px 16px;
		min-height: 44px;
		border-radius: 999px;
		background: var(--bg-3);
		color: var(--fg);
		font-size: 1rem;
		white-space: nowrap;
	}
	.tabs {
		display: flex;
		border-bottom: 1px solid var(--line);
		padding: 0 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.tabs button {
		background: transparent;
		border-radius: 0;
		padding: 8px 10px;
		font-size: 0.85rem;
		border-bottom: 2px solid transparent;
		min-height: 40px;
	}
	.tabs button.active {
		border-bottom-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}
	.body {
		flex: 1;
		overflow-y: auto;
		padding: 12px 16px 24px;
		-webkit-overflow-scrolling: touch;
	}
	.seg {
		padding: 6px 0;
		border-top: 1px solid var(--line);
		font-size: 0.88rem;
		flex-wrap: nowrap;
		gap: 10px;
	}
	.seg .k { width: 16px; }
	.seg.up .k { color: var(--up); }
	.seg.down .k { color: var(--down); }
	.seg.flat .k { color: var(--flat); }
	.clock { min-width: 50px; }
	.warn {
		background: color-mix(in srgb, var(--warn) 15%, transparent);
		border-left: 3px solid var(--warn);
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 0.88rem;
		margin: 8px 0;
	}
	.layer {
		width: 100%;
		justify-content: space-between;
		border-radius: 10px;
		margin-bottom: 6px;
		background: var(--bg-3);
	}
	.layer.active {
		outline: 2px solid var(--accent);
	}
</style>
