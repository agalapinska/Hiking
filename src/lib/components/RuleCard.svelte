<script lang="ts">
	import { lang, t } from '$lib/i18n';
	import type { Rule } from '$lib/rules/data';

	let { rule }: { rule: Rule } = $props();
	const topicKey = (tp: Rule['topic']) => `topic_${tp}` as const;
</script>

<div class="rule" class:outdated={rule.status === 'outdated'}>
	<div class="head">
		<span class="chip">{$t(topicKey(rule.topic))}</span>
		<span class="chip scope">{rule.area ?? $t('scope_country')}</span>
		<span class="status {rule.status}">{$t(`status_${rule.status}`)}</span>
	</div>
	<p>{$lang === 'pl' ? rule.pl : rule.en}</p>
	<div class="muted">
		{$t('source')}: <a href={rule.source} target="_blank" rel="noopener">{rule.sourceName}</a> · {$t('verified')}: {rule.verified}
	</div>
</div>

<style>
	.rule {
		padding: 10px 0;
		border-top: 1px solid var(--line);
	}
	.rule.outdated {
		opacity: 0.6;
	}
	.head {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 6px;
		align-items: center;
	}
	.scope {
		background: transparent;
		border: 1px solid var(--line);
	}
	.status {
		margin-left: auto;
		font-size: 0.72rem;
		padding: 2px 8px;
		border-radius: 999px;
		color: #fff;
	}
	.status.current {
		background: var(--flat);
	}
	.status.check {
		background: var(--warn);
	}
	.status.outdated {
		background: var(--danger);
	}
	p {
		font-size: 0.92rem;
	}
</style>
