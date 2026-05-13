<script lang="ts">
  import { ArrowRight } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import { page } from "$app/state";
  let { data } = $props();
  let email = $state("");
  let submitted = $state(false);
  let pending = $state(false);
  let pendingGoogle = $state(false);
  let error = $state<string | null>(null);
  let googleError = $state<string | null>(null);
  let callbackURL = $derived(page.url.searchParams.get("callbackURL") ?? "/onboarding");

  async function signInWithGoogle() {
    pendingGoogle = true;
    googleError = null;
    try {
      const res = await fetch("/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL }),
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

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    pending = true;
    error = null;
    try {
      const res = await fetch("/auth/sign-in/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL }),
      });
      if (!res.ok) {
        error = "Couldn't send the magic link. Try again in a moment.";
        return;
      }
      submitted = true;
    } finally {
      pending = false;
    }
  }
</script>

<svelte:head><title>Sign in — {brandCopy.appName}</title></svelte:head>

<main class="max-w-md mx-auto px-6 py-16">
  <h1 class="serif text-3xl font-extrabold mb-3">Sign in.</h1>
  <p class="serif italic text-ink-soft mb-7">
    Enter your email — we'll send a one-tap link.
  </p>

  {#if submitted}
    <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg p-6">
      <p class="serif text-xl font-bold">Check your email.</p>
      <p class="sans text-sm text-ink-soft mt-2">
        We sent a magic link to <strong class="text-ink">{email}</strong>. Click it to sign in.
      </p>
      <p class="sans text-xs text-ink-mute mt-4">
        Didn't get it? Check spam, or wait 30 seconds and try again.
      </p>
    </div>
  {:else}
    <form onsubmit={submit} class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg p-6">
      {#if data.googleEnabled}
        <button
          type="button"
          onclick={signInWithGoogle}
          disabled={pendingGoogle}
          class="sans btn-press w-full bg-accent text-paper border-2 border-ink rounded-2xl py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
        >
          {pendingGoogle ? "Redirecting..." : "Continue with Google"} <ArrowRight size={16} />
        </button>
        {#if googleError}<p class="sans text-xs text-wrong mb-3">{googleError}</p>{/if}
        <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-mute text-center mb-4">
          Or use email
        </div>
      {/if}
      <label class="sans block text-xs font-bold text-ink mb-1.5 tracking-wide">
        Email
      </label>
      <input
        type="email"
        name="email"
        required
        bind:value={email}
        placeholder="you@company.com"
        class="serif w-full px-3.5 py-3 border-2 border-ink rounded-lg text-base bg-paper outline-none mb-4"
      />
      {#if error}<p class="sans text-xs text-wrong mb-3">{error}</p>{/if}
      <button
        type="submit"
        disabled={pending || !email}
        class="sans btn-press w-full bg-accent text-paper border-2 border-ink rounded-2xl py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Email me the link"} <ArrowRight size={16} />
      </button>
    </form>
  {/if}

  <p class="sans text-center mt-5">
    <a href="/" class="sans text-xs text-ink-mute underline">Back</a>
  </p>
</main>
