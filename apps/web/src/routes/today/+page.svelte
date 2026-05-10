<script lang="ts">
  import { marked } from "marked";
  import { Sparkles, Headphones, Clock, Play, BookOpen, ArrowRight } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import { track } from "$lib/analytics/client";
  import MascotCoach from "$lib/components/MascotCoach.svelte";

  let { data } = $props();

  // Configure marked for safe-ish rendering. We control the content (LLM
  // pipeline output) so we don't need full sanitization in v1.
  marked.setOptions({ breaks: false, gfm: true });

  let formattedDate = $derived(
    data.date
      ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      : ""
  );

  let publishedDate = $derived(
    data.content?.source?.date
      ? new Date(data.content.source.date + "T12:00:00Z").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : ""
  );

  // For decorative pull quote: take the first sentence of the first
  // digest paragraph. (Server-side digest_md is the source of truth;
  // we synthesize the pull quote client-side until v1.5 adds a dedicated
  // pullQuote field.)
  let pullQuoteText = $derived(
    data.content?.digest_md
      ? (
          data.content.digest_md.split(/\n\n/)[0].split(/(?<=[.!?])\s/)[0] ?? ""
        ).replace(/\*([^*]+)\*/g, "$1")
      : ""
  );
</script>

<svelte:head>
  <title>{data.content?.headline ?? "Today"} — {brandCopy.appName}</title>
</svelte:head>

{#if data.missing}
  <main class="max-w-2xl mx-auto px-6 py-16 text-center">
    <h1 class="serif text-3xl font-bold">Tomorrow.</h1>
    <p class="serif italic text-lg text-ink-soft mt-3">
      Today’s rep isn’t published yet. Try again in a few minutes.
    </p>
  </main>
{:else if data.content}
  {@const c = data.content}
  <main class="max-w-2xl mx-auto px-6 py-7 sm:py-10">
    <!-- Operator-of-the-day pill -->
    <div class="sans inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-accent bg-paper-cream border-2 border-accent rounded-full px-3.5 py-1.5 mb-4">
      <Sparkles size={12} />
      Operator of the day &nbsp;·&nbsp; {formattedDate}
    </div>

    <!-- Headline + italic angle (single line until v1.5 adds an angle field) -->
    <h1 class="serif text-[34px] sm:text-[44px] font-extrabold leading-[1.03] tracking-tight mt-1 mb-3">
      {c.headline}.
    </h1>

    <!-- Byline strip -->
    <div class="sans text-[10px] font-bold tracking-[0.18em] uppercase text-ink-mute border-y border-paper-fill py-2.5 my-5 flex flex-wrap gap-3.5 items-center">
      <span class="text-accent">{c.source.type === "podcast" ? "Interview" : "Newsletter"}</span>
      <span>·</span>
      <span>{c.source.byline}</span>
      <span>·</span>
      <span>{publishedDate}</span>
      <span>·</span>
      <span class="inline-flex items-center gap-1"><Clock size={11} /> 5 min read</span>
    </div>

    <a href="/quiz"
       class="sans block text-center text-[12px] font-semibold text-accent underline underline-offset-4 mb-5 sm:hidden">
      Skip to today’s rep →
    </a>

    <!-- CTA strip -->
    <div class="bg-paper-warm border-2 border-ink rounded-2xl px-5 py-5 flex items-center justify-between gap-3.5 flex-wrap mb-6">
      <MascotCoach size="sm" />
      <div class="flex-1 min-w-0" style="flex: 1 1 220px;">
        <div class="serif text-xl font-bold leading-tight text-ink">Apply this today.</div>
        <div class="sans text-[13px] text-ink-soft mt-0.5">Five calls. One attempt.</div>
      </div>
      <a href="/quiz" onclick={() => track("today_start", { source: "today_top_cta" })} class="sans btn-press bg-accent text-paper border-2 border-ink rounded-2xl px-5.5 py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center gap-2 flex-shrink-0 no-underline" style="padding: 14px 22px;">
        {brandCopy.takeRepCta} <ArrowRight size={16} />
      </a>
    </div>

    {#if pullQuoteText}
      <blockquote class="serif text-[21px] sm:text-[26px] italic leading-[1.28] text-ink my-6 sm:my-7 pl-5 border-l-[3px] border-accent font-medium tracking-tight">
        &ldquo;{pullQuoteText}&rdquo;
      </blockquote>
    {/if}

    <!-- Digest body -->
    <article class="serif text-[17px] leading-[1.65] text-ink prose-pmd">
      {@html marked(c.digest_md ?? "")}
    </article>

    <!-- Takeaways -->
    <div class="mt-9 mb-7">
      <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-3.5">
        Takeaways
      </p>
      <ol class="list-none p-0 m-0 flex flex-col gap-3.5">
        {#each c.takeaways as takeaway, i}
          <li class="grid grid-cols-[32px_1fr] gap-3.5 items-baseline bg-white border-2 border-ink rounded-xl px-4.5 py-3.5 shadow-brut-deep" style="padding-left: 18px; padding-right: 18px;">
            <span class="serif text-[15px] font-extrabold text-accent mono">0{i + 1}</span>
            <span class="serif text-[17px] font-medium leading-[1.35] text-ink italic">{takeaway}</span>
          </li>
        {/each}
      </ol>
    </div>

    <!-- Source card -->
    <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-deep overflow-hidden mb-6">
      <div class="px-5 py-4.5 flex items-center gap-3.5" style="padding: 18px 20px;">
        <div class="w-[54px] h-[54px] rounded-xl border-2 border-ink flex-shrink-0 flex items-center justify-center relative overflow-hidden grain"
             style="background: linear-gradient(135deg, #D2691E 0%, #8B4513 100%);">
          <Headphones size={22} class="text-paper relative" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="sans text-[10px] font-bold tracking-[0.14em] uppercase text-accent mb-0.5">
            Source &nbsp;·&nbsp; {c.source.type === "podcast" ? "podcast" : "newsletter"}
          </div>
          <div class="serif text-[15px] font-bold leading-tight">{c.source.title}</div>
          <div class="sans text-xs text-ink-mute mt-0.5">with {c.source.byline}</div>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-paper-fill flex gap-2 flex-wrap" style="padding: 12px 20px;">
        <a href={c.source.source_url || c.source.search_url}
           class="sans inline-flex items-center gap-1.5 bg-ink text-paper rounded-full px-3.5 py-1.5 text-[12px] font-semibold no-underline">
          <Play size={12} fill="currentColor" /> {c.source.type === "podcast" ? "Listen on Lenny's Podcast" : "Read on Lenny's Newsletter"}
        </a>
        {#if c.source.type === "podcast"}
          <a href={c.source.search_url}
             class="sans inline-flex items-center gap-1.5 bg-transparent text-ink border border-ink rounded-full px-3.5 py-1.5 text-[12px] font-semibold no-underline">
            <BookOpen size={12} /> Read transcript
          </a>
        {/if}
      </div>
    </div>

    <!-- Bottom CTA strip -->
    <div class="bg-paper-warm border-2 border-ink rounded-2xl px-5 py-5 flex items-center justify-between gap-3.5 flex-wrap">
      <div class="flex-1 min-w-0" style="flex: 1 1 220px;">
        <div class="serif text-xl font-bold leading-tight text-ink">Ready for the rep?</div>
        <div class="sans text-[13px] text-ink-soft mt-0.5">Make the call while the lesson is fresh.</div>
      </div>
      <a href="/quiz" onclick={() => track("today_start", { source: "today_bottom_cta" })} class="sans btn-press bg-accent text-paper border-2 border-ink rounded-2xl px-5.5 py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center gap-2 flex-shrink-0 no-underline" style="padding: 14px 22px;">
        {brandCopy.takeRepCta} <ArrowRight size={16} />
      </a>
    </div>

  </main>
{/if}

<style>
  /* Tighten paragraph spacing in marked-rendered prose */
  :global(.prose-pmd p) {
    margin: 0 0 18px 0;
  }
  :global(.prose-pmd p:last-child) {
    margin-bottom: 0;
  }
  :global(.prose-pmd em) {
    font-style: italic;
  }
</style>
