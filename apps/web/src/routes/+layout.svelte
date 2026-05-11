<script lang="ts">
	import "../app.css";
	import favicon from '$lib/assets/favicon.svg';
	import Footer from "$lib/components/Footer.svelte";
	import CookieBanner from "$lib/components/CookieBanner.svelte";
	import Nav from "$lib/components/Nav.svelte";
	import { page } from "$app/state";

	let { data, children } = $props();

	// Show Nav on app surfaces. Landing/auth/legal pages stay focused.
	const HIDDEN_PREFIXES = ["/", "/signin", "/onboarding", "/auth", "/terms", "/privacy"];
	let showNav = $derived(
		!HIDDEN_PREFIXES.some((p) =>
			p === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(p),
		),
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	{#if showNav}
		<Nav user={data.user} />
	{/if}
	<div class="flex-1">
		{@render children?.()}
	</div>
	<Footer />
</div>
<CookieBanner />
