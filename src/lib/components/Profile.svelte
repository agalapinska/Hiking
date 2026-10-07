<script lang="ts">
	import { haversine, type Pt, type Segment } from '$lib/geo/geo';

	interface Props {
		line: Pt[];
		segs: Segment[];
		onHover?: (idx: number | null) => void;
		/** indices in `line` where days split */
		dayBreaks?: number[];
	}
	let { line, segs, onHover, dayBreaks = [] }: Props = $props();

	const W = 360;
	const H = 150;
	const PAD = { l: 34, r: 8, t: 10, b: 20 };

	let cum = $derived.by(() => {
		const c = [0];
		for (let i = 1; i < line.length; i++) c[i] = c[i - 1] + haversine(line[i - 1], line[i]);
		return c;
	});
	let total = $derived(cum[cum.length - 1] ?? 0);
	let eles = $derived(line.map((p) => p[2] ?? 0));
	let minE = $derived(Math.floor((Math.min(...eles) - 20) / 50) * 50);
	let maxE = $derived(Math.ceil((Math.max(...eles) + 20) / 50) * 50);

	const x = (d: number) => PAD.l + (d / Math.max(1, total)) * (W - PAD.l - PAD.r);
	const y = (e: number) => PAD.t + (1 - (e - minE) / Math.max(1, maxE - minE)) * (H - PAD.t - PAD.b);

	let areaPath = $derived.by(() => {
		if (line.length < 2) return '';
		let d = `M${x(0)},${y(eles[0])}`;
		for (let i = 1; i < line.length; i++) d += `L${x(cum[i]).toFixed(1)},${y(eles[i]).toFixed(1)}`;
		d += `L${x(total)},${H - PAD.b}L${x(0)},${H - PAD.b}Z`;
		return d;
	});

	// one coloured polyline per segment, colour by steepness
	function color(s: Segment) {
		const g = Math.abs(s.avgGrade);
		if (s.kind === 'flat') return 'var(--flat)';
		if (s.kind === 'up') return g > 20 ? '#a61e4d' : g > 10 ? 'var(--up)' : '#f59f00';
		return g > 20 ? '#5f3dc4' : 'var(--down)';
	}
	function segPath(s: Segment) {
		let d = `M${x(cum[s.startIdx])},${y(eles[s.startIdx])}`;
		for (let i = s.startIdx + 1; i <= s.endIdx; i++) d += `L${x(cum[i]).toFixed(1)},${y(eles[i]).toFixed(1)}`;
		return d;
	}

	let hover = $state<number | null>(null);
	function onMove(e: PointerEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = ((e.clientX - r.left) / r.width) * W;
		const d = ((px - PAD.l) / (W - PAD.l - PAD.r)) * total;
		let lo = 0, hi = cum.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (cum[mid] < d) lo = mid + 1;
			else hi = mid;
		}
		hover = Math.max(0, Math.min(cum.length - 1, lo));
		onHover?.(hover);
	}
	function onLeave() {
		hover = null;
		onHover?.(null);
	}
	const yTicks = $derived.by(() => {
		const step = maxE - minE > 1500 ? 500 : maxE - minE > 600 ? 200 : 100;
		const t: number[] = [];
		for (let e = minE; e <= maxE; e += step) t.push(e);
		return t;
	});
</script>

<svg viewBox="0 0 {W} {H}" class="profile" role="img" aria-label="profile" onpointermove={onMove} onpointerleave={onLeave} onpointerdown={onMove}>
	{#each yTicks as e}
		<line x1={PAD.l} x2={W - PAD.r} y1={y(e)} y2={y(e)} class="grid" />
		<text x={PAD.l - 4} y={y(e) + 3} class="tick" text-anchor="end">{e}</text>
	{/each}
	<path d={areaPath} class="area" />
	{#each segs as s}
		<path d={segPath(s)} stroke={color(s)} class="seg" />
	{/each}
	{#each dayBreaks as idx}
		<line x1={x(cum[idx])} x2={x(cum[idx])} y1={PAD.t} y2={H - PAD.b} class="daybreak" />
	{/each}
	{#if hover != null}
		<line x1={x(cum[hover])} x2={x(cum[hover])} y1={PAD.t} y2={H - PAD.b} class="cursor" />
		<circle cx={x(cum[hover])} cy={y(eles[hover])} r="4" class="dot" />
		<text x={x(cum[hover]) < W / 2 ? x(cum[hover]) + 6 : x(cum[hover]) - 6} y={PAD.t + 10} class="hint" text-anchor={x(cum[hover]) < W / 2 ? 'start' : 'end'}>
			{(cum[hover] / 1000).toFixed(1)} km · {Math.round(eles[hover])} m
		</text>
	{/if}
	<text x={PAD.l} y={H - 4} class="tick">0</text>
	<text x={W - PAD.r} y={H - 4} class="tick" text-anchor="end">{(total / 1000).toFixed(1)} km</text>
</svg>

<style>
	.profile {
		width: 100%;
		height: auto;
		display: block;
		touch-action: pan-y;
		user-select: none;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 0.5;
	}
	.tick,
	.hint {
		font-size: 9px;
		fill: var(--fg-2);
	}
	.hint {
		fill: var(--fg);
		font-weight: 600;
	}
	.area {
		fill: var(--accent);
		opacity: 0.15;
	}
	.seg {
		fill: none;
		stroke-width: 2.5;
		stroke-linejoin: round;
	}
	.cursor {
		stroke: var(--fg);
		stroke-width: 1;
		stroke-dasharray: 2 2;
	}
	.daybreak {
		stroke: var(--fg-2);
		stroke-width: 1;
		stroke-dasharray: 4 3;
	}
	.dot {
		fill: #ffd43b;
		stroke: #000;
	}
</style>
