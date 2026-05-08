<script lang="ts">
  import { Sparkles, Play, ExternalLink } from "lucide-svelte";

  type Citation = {
    title: string;
    byline: string;
    type: "podcast" | "newsletter";
    source_url?: string;
    search_url: string;
    quote_excerpt: string;
    timestamp?: string;
  };

  type Props = {
    correct: boolean;
    correctKey: string;
    explanationMd: string;
    pmTakeaway: string;
    citation: Citation;
  };

  let { correct, correctKey, explanationMd, pmTakeaway, citation }: Props = $props();
</script>

<!-- TAKEAWAY HERO — the visual hero of this screen -->
<div
  class="bg-paper-cream border-2 border-ink rounded-2xl px-5 py-5 shadow-brut-accent-lg"
  style="animation: slideUp 0.4s ease-out;"
>
  <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-2.5">
    This week —
  </p>
  <p class="serif text-[22px] italic font-semibold leading-[1.25] tracking-tight m-0">
    {pmTakeaway}
  </p>
</div>

<div class="mt-3.5 mb-3.5 flex items-baseline gap-2.5">
  <span class="serif text-base {correct ? 'text-ok' : 'text-wrong'}">
    {correct ? "✓ Correct." : "Not quite."}
  </span>
  <span class="sans text-sm text-ink-mute">
    The answer was <span class="mono">{correctKey}</span>.
  </span>
</div>

<!-- WHY card -->
<div class="bg-ink text-paper rounded-2xl p-4 border-2 border-ink mb-3.5">
  <p
    class="sans text-[11px] font-bold tracking-[0.12em] uppercase text-gold mb-2 flex items-center gap-1.5"
  >
    <Sparkles size={12} /> Why
  </p>
  <p class="serif text-[15px] leading-relaxed m-0">
    {explanationMd}
  </p>
</div>

<!-- Citation pull-quote -->
<div class="pl-5 border-l-2 border-paper-fill mb-3.5">
  <p class="serif text-[15px] italic text-ink-soft leading-snug m-0">
    “{citation.quote_excerpt}”
  </p>
  <p class="sans text-[10px] uppercase tracking-widest text-ink-mute mt-1.5">
    {citation.byline}
    {#if citation.timestamp}&nbsp;·&nbsp;<span class="mono">{citation.timestamp}</span>{/if}
  </p>
</div>

<!-- Listen at timestamp -->
{#if citation.timestamp}
  <a
    class="w-full bg-paper-warm border-2 border-dashed border-ink-mute rounded-xl px-3.5 py-3 mb-2.5 flex items-center justify-between no-underline"
    href={citation.source_url || citation.search_url}
  >
    <span class="flex items-center gap-2.5">
      <span class="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
        <Play size={14} fill="#FBF7F0" class="text-paper" />
      </span>
      <span>
        <span class="block sans text-[13px] font-bold text-ink">
          Listen at {citation.timestamp}
        </span>
        <span class="block sans text-[11px] text-ink-mute">
          Hear {citation.byline} explain it
        </span>
      </span>
    </span>
    <ExternalLink size={14} class="text-ink-mute" />
  </a>
{/if}
