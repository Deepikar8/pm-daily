<script lang="ts">
	import "../app.css";
	import favicon from '$lib/assets/favicon.svg';
	import Footer from "$lib/components/Footer.svelte";
	import CookieBanner from "$lib/components/CookieBanner.svelte";
	import Nav from "$lib/components/Nav.svelte";
	import { page } from "$app/state";

	let { data, children } = $props();

	// Show Nav only on authenticated app routes. Hide on public landing,
	// signin, onboarding, auth handlers, terms/privacy. The Nav links to
	// /today /leaderboard /me — all of which require sign-in.
	const HIDDEN_PREFIXES = ["/", "/signin", "/onboarding", "/auth", "/terms", "/privacy"];
	let showNav = $derived(
		!!data.user &&
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
		<Nav />
	{/if}
	<div class="flex-1">
		{@render children?.()}
	</div>
	<Footer />
</div>
<CookieBanner />
