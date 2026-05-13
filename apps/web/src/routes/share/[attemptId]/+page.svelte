<script lang="ts">
  import { Check, Dumbbell, Trophy, X as XIcon } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import ShareChallengeActions from "$lib/components/ShareChallengeActions.svelte";

  let { data } = $props();

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }
</script>

<svelte:head>
  <title>{data.player.displayName} scored {data.result.totalCorrect}/5 — {brandCopy.appName}</title>
  <meta name="description" content={`${data.player.displayName} scored ${data.result.totalCorrect}/5 in Product Gym.`} />
  <meta property="og:title" content={`${data.player.displayName} scored ${data.result.totalCorrect}/5 in Product Gym`} />
  <meta property="og:description" content={`Think you can beat ${data.player.displayName}'s score? Try today's Product Gym challenge.`} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={data.absoluteUrl} />
  <meta property="og:image" content={data.imageUrl} />
  <meta property="og:image:secure_url" content={data.imageUrl} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${data.player.displayName} scored ${data.result.totalCorrect}/5 in Product Gym`} />
  <meta name="twitter:description" content="One daily product judgment challenge based on lessons from top operators." />
  <meta name="twitter:image" content={data.imageUrl} />
</svelte:head>

<main class="max-w-2xl mx-auto px-6 py-9 sm:py-12">
  <div class="sans inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-accent bg-paper-cream border-2 border-accent rounded-full px-3.5 py-1.5 mb-4">
    <Trophy size={12} />
    Public result
  </div>

  <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg overflow-hidden mb-5">
    <div class="px-5 py-5 sm:px-6 sm:py-6">
      <div class="flex items-start justify-between gap-4 mb-5">
        <div class="min-w-0">
          <h1 class="serif text-[34px] sm:text-[44px] font-extrabold leading-[1.03] tracking-tight mb-2">
            {data.player.displayName} hit {data.result.totalCorrect}/5.
          </h1>
          <p class="serif italic text-lg text-ink-soft">
            {data.session.headline}
          </p>
        </div>
        <div class="w-14 h-14 rounded-2xl border-2 border-ink bg-paper-warm flex items-center justify-center flex-shrink-0">
          <Dumbbell size={24} class="text-accent" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="bg-ink text-paper rounded-xl border-2 border-ink px-3 py-3">
          <div class="sans text-[10px] font-bold tracking-widest uppercase text-gold mb-1">Score</div>
          <div class="serif text-3xl font-extrabold leading-none">{data.result.totalCorrect}/5</div>
        </div>
        <div class="bg-ink text-paper rounded-xl border-2 border-ink px-3 py-3">
          <div class="sans text-[10px] font-bold tracking-widest uppercase text-gold mb-1">Time</div>
          <div class="serif text-3xl font-extrabold leading-none mono">{fmtTime(data.result.totalSeconds)}</div>
        </div>
        <div class="bg-ink text-paper rounded-xl border-2 border-ink px-3 py-3">
          <div class="sans text-[10px] font-bold tracking-widest uppercase text-gold mb-1">Points</div>
          <div class="serif text-3xl font-extrabold leading-none">{data.result.totalPoints}</div>
        </div>
      </div>
    </div>
  </div>

  <section class="bg-white rounded-2xl border-2 border-ink p-4 mb-5">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-mute mb-3">
      Takeaways
    </div>
    <ol class="list-none p-0 m-0 flex flex-col gap-2">
      {#each data.questions as q}
        <li
          class="flex items-baseline gap-3 px-2.5 py-2.5 rounded-lg"
          style="background-color: {q.correct ? '#F4EFD8' : '#F8E8E0'};"
        >
          <span
            class="w-6 h-6 rounded-full {q.correct
              ? 'bg-ok'
              : 'bg-wrong'} text-paper flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            {#if q.correct}<Check size={13} stroke-width={3} />
            {:else}<XIcon size={13} stroke-width={3} />{/if}
          </span>
          <div class="flex-1 min-w-0">
            <div class="sans text-[10px] font-bold uppercase tracking-wider text-ink-mute mb-0.5">
              Q{q.position} · {q.archetype}
            </div>
            <div class="serif text-[15px] italic font-medium text-ink leading-snug">
              {q.pmTakeaway}
            </div>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <div class="flex flex-col gap-3">
    <a
      href="/"
      class="sans btn-press flex-1 bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
    >
      Beat this score
    </a>
    <ShareChallengeActions
      correct={data.result.totalCorrect}
      date={data.date}
      url={data.absoluteUrl}
      source="public_share_page"
    />
  </div>
</main>
