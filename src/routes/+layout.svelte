<script lang="ts">
	import '../app.css';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/db';
	import { onMount } from 'svelte';

	let { children } = $props();

	$effect(() => {
		const th = $settings.theme;
		if (th === 'auto') document.documentElement.removeAttribute('data-theme');
		else document.documentElement.setAttribute('data-theme', th);
	});

	let online = $state(true);
	onMount(() => {
		online = navigator.onLine;
		const on = () => (online = true);
		const off = () => (online = false);
		addEventListener('online', on);
		addEventListener('offline', off);
		return () => {
			removeEventListener('online', on);
			removeEventListener('offline', off);
		};
	});

	const tabs = [
		{ href: '/', key: 'nav_plan', icon: '🗺️' },
		{ href: '/trasy/', key: 'nav_routes', icon: '📁' },
		{ href: '/zasady/', key: 'nav_rules', icon: '📜' },
		{ href: '/profil/', key: 'nav_profile', icon: '🥾' }
	] as const;
</script>

<svelte:head><title>{$t('app')}</title></svelte:head>

{#if !online}
	<div class="offline">{$t('offline')}</div>
{/if}

{@render children()}

<nav>
	{#each tabs as tab}
		<a href="{base}{tab.href}" class:active={page.url.pathname === base + tab.href} aria-label={$t(tab.key)}>
			<span class="ic">{tab.icon}</span>
			<span>{$t(tab.key)}</span>
		</a>
	{/each}
</nav>

<style>
	nav {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: calc(var(--nav-h) + var(--safe-b));
		padding-bottom: var(--safe-b);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		background: var(--bg-2);
		border-top: 1px solid var(--line);
		z-index: 20;
	}
	nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 0.7rem;
		text-decoration: none;
		color: var(--fg-2);
	}
	nav a.active {
		color: var(--accent);
		font-weight: 600;
	}
	.ic {
		font-size: 1.3rem;
	}
	.offline {
		position: absolute;
		top: var(--safe-t);
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
		background: var(--warn);
		color: #fff;
		font-size: 0.75rem;
		padding: 2px 10px;
		border-radius: 0 0 8px 8px;
	}
</style>
