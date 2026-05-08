<script lang="ts">
	import "../app.css";
	import favicon from '$lib/assets/favicon.svg';
	import Footer from "$lib/components/Footer.svelte";
	import CookieBanner from "$lib/components/CookieBanner.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<div class="flex-1">
		{@render children?.()}
	</div>
	<Footer />
</div>
<CookieBanner />
