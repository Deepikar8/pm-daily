<script lang="ts">
  import { enhance } from "$app/forms";
  import { Sparkles, ArrowRight, Calendar } from "lucide-svelte";

  let { data, form } = $props();
  let timezone = $state(
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      : "UTC"
  );
</script>

<main class="max-w-xl mx-auto px-6 py-12">
  <div class="mb-6">
    <p class="sans inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
      <Sparkles size={12} /> Welcome
    </p>
    <h1 class="serif text-4xl font-extrabold leading-[1.05] tracking-tight mt-3">
      Set up your daily.
    </h1>
    <p class="serif italic text-lg text-ink-soft mt-2">
      Two fields you have to fill. Two you can skip.
    </p>
  </div>

  <form
    method="POST"
    use:enhance
    class="bg-white border-2 border-ink rounded-2xl shadow-brut-accent-lg p-6 mb-4"
  >
    <div class="mb-5">
      <label class="sans block text-xs font-bold text-ink mb-1.5 tracking-wide">
        Display name <span class="text-accent">*</span>
      </label>
      <input
        name="displayName"
        required
        placeholder="Aditi M."
        value={form?.values?.displayName ?? data.suggestedDisplayName ?? ""}
        class="serif w-full px-3.5 py-3 border-2 border-ink rounded-lg text-base bg-paper outline-none"
      />
      <p class="sans text-[11px] text-ink-mute mt-1.5">
        Shown in the Arena. You can change it after launch.
      </p>
    </div>

    <div class="mb-5">
      <label class="sans block text-xs font-bold text-ink mb-1.5 tracking-wide">
        Timezone <span class="text-accent">*</span>
      </label>
      <input
        name="timezone"
        required
        bind:value={timezone}
        class="serif w-full px-3.5 py-3 border-2 border-ink rounded-lg text-[15px] bg-paper outline-none mono"
      />
      <p class="sans text-[11px] text-ink-mute mt-1.5">
        Auto-detected. Streak day boundaries and your calendar reminder use this.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-5">
      <div>
        <label class="sans block text-xs font-bold text-ink-soft mb-1.5 tracking-wide">
          Company <span class="font-normal text-ink-mute text-[10px] uppercase tracking-widest">· optional</span>
        </label>
        <input
          name="company"
          placeholder="e.g. Stripe"
          value={form?.values?.company ?? ""}
          class="serif w-full px-3 py-2.5 border border-ink-mute rounded-lg text-sm bg-paper outline-none"
        />
      </div>
      <div>
        <label class="sans block text-xs font-bold text-ink-soft mb-1.5 tracking-wide">
          Role <span class="font-normal text-ink-mute text-[10px] uppercase tracking-widest">· optional</span>
        </label>
        <input
          name="role"
          placeholder="e.g. Senior PM"
          value={form?.values?.role ?? ""}
          class="serif w-full px-3 py-2.5 border border-ink-mute rounded-lg text-sm bg-paper outline-none"
        />
      </div>
    </div>

    <label class="sans flex gap-2.5 items-start cursor-pointer pt-2.5 border-t border-paper-fill">
      <input
        type="checkbox"
        name="acceptTerms"
        required
        class="mt-1 w-4 h-4 accent-accent"
      />
      <span class="text-[13px] text-ink leading-snug">
        I agree to the
        <a href="/terms" class="text-accent underline">Terms</a>
        and
        <a href="/privacy" class="text-accent underline">Privacy Policy</a>.
      </span>
    </label>

    {#if form?.error}
      <p class="sans text-[12px] text-wrong mt-3">{form.error}</p>
    {/if}

    <button
      type="submit"
      class="sans btn-press w-full mt-5 bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-base font-bold shadow-brut-lg flex items-center justify-center gap-2"
    >
      Get started <ArrowRight size={18} />
    </button>
  </form>

  <a
    href="/api/calendar.ics"
    download
    class="sans flex items-center justify-between px-4 py-3.5 bg-paper-warm border-2 border-dashed border-ink-mute rounded-xl no-underline text-ink"
  >
    <span class="flex items-center gap-2.5">
      <span class="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
        <Calendar size={16} class="text-paper" />
      </span>
      <span>
        <span class="block text-[13px] font-bold">Add Product Gym to your calendar</span>
        <span class="block text-[11px] text-ink-mute">Recurring 8am-local · the only reminder we send</span>
      </span>
    </span>
    <ArrowRight size={14} class="text-ink-mute" />
  </a>
</main>
