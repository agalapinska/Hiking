<script lang="ts">
	import RuleCard from '$lib/components/RuleCard.svelte';
	import { lang, t } from '$lib/i18n';
	import { countries, rulesForCountry, type Topic } from '$lib/rules/data';
	import type { CountryCode } from '$lib/map/sources';

	let code = $state<CountryCode>('PL');
	let topic = $state<Topic | ''>('');
	const topics: Topic[] = ['camping', 'dogs', 'fire', 'drones', 'fees', 'closures', 'rescue', 'health', 'border', 'trails', 'access'];
	let info = $derived(countries.find((c) => c.code === code)!);
	let list = $derived(rulesForCountry(code).filter((r) => !topic || r.topic === topic));
</script>

<div class="page">
	<h1>{$t('rules_browser')}</h1>
	<div class="scroll-x" style="margin-bottom:10px">
		{#each countries as c}
			<button class="chip" class:active={code === c.code} onclick={() => (code = c.code)}>{$lang === 'pl' ? c.pl : c.en}</button>
		{/each}
	</div>
	<div class="scroll-x" style="margin-bottom:12px">
		<button class="chip" class:active={topic === ''} onclick={() => (topic = '')}>{$t('all_topics')}</button>
		{#each topics as tp}
			<button class="chip" class:active={topic === tp} onclick={() => (topic = tp)}>{$t(`topic_${tp}`)}</button>
		{/each}
	</div>

	<div class="card">
		<h3>{$t('emergency')}</h3>
		<div class="row">
			{#each info.emergency as e}<a class="chip" href="tel:{e.number.replace(/\s/g, '')}">☎ {e.label}: {e.number}</a>{/each}
		</div>
		<h3 style="margin-top:12px">{$t('topic_trails')}</h3>
		<p class="muted">{$lang === 'pl' ? info.trailMarking.pl : info.trailMarking.en}</p>
	</div>

	<div class="card">
		{#each list as r (r.id)}<RuleCard rule={r} />{/each}
		<p class="muted" style="margin-top:10px">{$t('disclaimer')}</p>
	</div>
</div>
