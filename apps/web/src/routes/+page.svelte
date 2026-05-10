<script lang="ts">
  import { Sparkles, Calendar, Users } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import MascotCoach from "$lib/components/MascotCoach.svelte";
  import { track } from "$lib/analytics/client";
  let { data } = $props();
  const preview = $derived(data.previewQuestion);
  let pendingGoogle = $state(false);
  let googleError = $state<string | null>(null);

  async function signInWithGoogle() {
    pendingGoogle = true;
    googleError = null;
    try {
      const res = await fetch("/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: "/onboarding" }),
      });
      if (!res.ok) {
        googleError = "Couldn't start Google sign-in. Try email instead.";
        pendingGoogle = false;
        return;
      }
      const json = (await res.json()) as { url?: string };
      if (json.url) {
        window.location.href = json.url;
      } else {
        googleError = "Sign-in didn't return a redirect URL.";
        pendingGoogle = false;
      }
    } catch {
      googleError = "Network error. Try again.";
      pendingGoogle = false;
    }
  }
</script>

<svelte:head>
  <title>{brandCopy.appName} — {brandCopy.tagline}</title>
</svelte:head>

<main class="max-w-xl mx-auto px-6 py-12">
  <div class="text-center mb-7">
    <div class="flex items-center justify-center gap-3 mb-4">
      <MascotCoach size="sm" />
      <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
        Daily product training
      </p>
    </div>
    <h1 class="serif text-[52px] font-extrabold leading-[0.96] tracking-tight mt-3 mb-3">
      {brandCopy.appName}
    </h1>
    <p class="serif italic text-xl text-ink-soft leading-tight">
      {brandCopy.tagline}
    </p>
    <div class="mt-3 flex items-center justify-center gap-2">
      <Sparkles size={14} class="text-accent" />
      <p class="sans text-[14px] text-ink-soft leading-relaxed">
        {brandCopy.landingSupport}
      </p>
    </div>
  </div>

  <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg overflow-hidden mb-6">
    <div class="px-5 py-3.5 bg-paper-warm border-b-2 border-ink flex items-center justify-between">
      <span class="sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-soft">
        {data.isFallback ? "Sample rep · what to expect" : "Today's rep · preview"}
      </span>
      <span class="sans text-[11px] text-ink-mute mono">1 of 5</span>
    </div>
    <div class="px-5 py-5">
      <h2 class="serif text-[20px] font-bold leading-tight tracking-tight mb-4">
        {preview.scenario_md}
      </h2>
      <div class="flex flex-col gap-2">
        {#each preview.options.slice(0, 2) as opt}
          <div class="sans px-3.5 py-3 border-2 border-ink rounded-xl text-sm text-ink flex gap-3 items-center bg-white opacity-95">
            <span class="serif font-bold text-ink-mute min-w-[18px]">{opt.key}</span>
            <span class="flex-1">{opt.text}</span>
          </div>
        {/each}
        <div class="sans px-3.5 py-2.5 text-center text-ink-mute text-xs italic">
          +2 more options · sign in to save your streak
        </div>
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-3 mb-5">
    <a href="/demo"
       onclick={() => track("demo_start", { source: "landing" })}
       class="sans btn-press w-full bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[15px] font-bold shadow-brut-accent-lg flex items-center justify-center gap-2 no-underline">
      <Sparkles size={16} /> {brandCopy.demoCta}
    </a>
    {#if data.googleEnabled}
      <button onclick={signInWithGoogle} disabled={pendingGoogle}
         class="sans btn-press w-full bg-white text-ink border-2 border-ink rounded-2xl py-4 text-[15px] font-bold shadow-brut flex items-center justify-center gap-3 disabled:opacity-50">
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {pendingGoogle ? "Redirecting…" : "Continue with Google"}
      </button>
      {#if googleError}
        <p class="sans text-xs text-wrong text-center -mt-1">{googleError}</p>
      {/if}
    {/if}
    <a href="/signin/email"
       class="sans btn-press w-full bg-transparent text-ink-soft border-2 border-ink rounded-2xl py-4 text-[15px] font-bold flex items-center justify-center gap-2 no-underline">
      <Calendar size={16} /> Email me a magic link
    </a>
  </div>

  <p class="sans text-center text-xs text-ink-mute mb-5 flex justify-center items-center gap-5 flex-wrap">
    <span class="flex items-center gap-1.5"><Users size={13} class="text-accent" /> {data.launchProof}</span>
  </p>

  <div class="border-t border-paper-fill pt-4 text-center">
    <p class="sans text-[11px] text-ink-mute leading-relaxed">
      By signing in you agree to the
      <a href="/terms" class="text-ink-soft underline">Terms</a> and
      <a href="/privacy" class="text-ink-soft underline">Privacy Policy</a>.
      <br/>
      We email you only for sign-in. Reminders go to your calendar.
    </p>
  </div>
</main>
