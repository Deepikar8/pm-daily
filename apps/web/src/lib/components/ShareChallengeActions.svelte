<script lang="ts">
  import { browser } from "$app/environment";
  import { Copy, MessageCircle, Share2 } from "lucide-svelte";
  import { normalizeShareTakeaway, resultShareText } from "$lib/brand/share";
  import { track } from "$lib/analytics/client";

  let {
    correct,
    date,
    rank = null,
    points = null,
    lessonTitle = "",
    operatorName = "",
    sourceLabel = "",
    url,
    source,
  }: {
    correct: number;
    date: string;
    rank?: number | null;
    points?: number | null;
    lessonTitle?: string | null;
    operatorName?: string | null;
    sourceLabel?: string | null;
    url: string;
    source: string;
  } = $props();

  let copied = $state(false);
  let failed = $state(false);
  let absoluteUrl = $state("");
  let takeawayDraft = $state("");

  $effect(() => {
    if (browser) absoluteUrl = new URL(url, window.location.origin).toString();
  });

  const sharedTakeaway = $derived(normalizeShareTakeaway(takeawayDraft));
  const shareUrl = $derived.by(() => {
    const base = absoluteUrl || url;
    if (!browser || !sharedTakeaway) return base;
    const withTakeaway = new URL(base, window.location.origin);
    withTakeaway.searchParams.set("takeaway", sharedTakeaway);
    return withTakeaway.toString();
  });
  const text = $derived(
    resultShareText({
      correct,
      date,
      rank,
      points,
      lessonTitle,
      operatorName,
      sourceLabel,
      takeaway: sharedTakeaway,
    }),
  );
  const invite = $derived(`${text}\n${shareUrl}`);
  const linkedInUrl = $derived(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  );
  const whatsappUrl = $derived(`https://wa.me/?text=${encodeURIComponent(invite)}`);

  async function copyInvite() {
    copied = false;
    failed = false;
    try {
      await navigator.clipboard.writeText(invite);
      copied = true;
      track("result_share", { source, method: "clipboard" });
    } catch {
      failed = true;
    }
  }

  function trackChannel(method: "linkedin" | "whatsapp") {
    track("result_share", { source, method });
  }
</script>

<div class="flex flex-col gap-2">
  <label for="share-takeaway" class="sans text-[11px] font-bold tracking-widest uppercase text-ink-mute">
    Add your takeaway
  </label>
  <textarea
    id="share-takeaway"
    bind:value={takeawayDraft}
    maxlength="160"
    rows="2"
    placeholder="Optional: what are you taking back to work?"
    class="sans w-full resize-none bg-white text-ink border-2 border-ink rounded-xl px-3 py-2.5 text-[13px] leading-snug outline-none focus:border-accent"
  ></textarea>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
    <button
      type="button"
      onclick={copyInvite}
      class="sans btn-press bg-white text-ink border-2 border-ink rounded-xl px-3 py-3 text-[13px] font-bold shadow-brut flex items-center justify-center gap-2"
    >
      <Copy size={15} /> {copied ? "Copied" : "Copy invite"}
    </button>
    <a
      href={linkedInUrl}
      target="_blank"
      rel="noreferrer"
      onclick={() => trackChannel("linkedin")}
      class="sans btn-press bg-white text-ink border-2 border-ink rounded-xl px-3 py-3 text-[13px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
    >
      <Share2 size={15} /> LinkedIn
    </a>
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      onclick={() => trackChannel("whatsapp")}
      class="sans btn-press bg-white text-ink border-2 border-ink rounded-xl px-3 py-3 text-[13px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
    >
      <MessageCircle size={15} /> WhatsApp
    </a>
  </div>
  {#if failed}
    <p class="sans text-xs text-wrong text-center">
      Couldn’t copy the invite. Use LinkedIn or WhatsApp instead.
    </p>
  {/if}
</div>
