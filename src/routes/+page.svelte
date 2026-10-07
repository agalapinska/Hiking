<script lang="ts">
	import { page } from '$app/state';
	import Planner from '$lib/components/Planner.svelte';
	import { routes } from '$lib/stores/db';

	let id = $derived(page.url.searchParams.get('id'));
	let initial = $derived(id ? ($routes.find((r) => r.id === id) ?? null) : null);
</script>

{#key id}
	<Planner {initial} />
{/key}
