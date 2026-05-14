<script lang="ts">
  import { Sparkles, Calendar, Users, Check, X as XIcon, ArrowRight } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import MascotCoach from "$lib/components/MascotCoach.svelte";
  import { track } from "$lib/analytics/client";
  let { data } = $props();
  const preview = $derived(data.previewQuestion);
  const todayContent = $derived(data.todayContent);
  const operatorDate = $derived(
    todayContent?.source?.date
      ? new Date(`${todayContent.source.date}T00:00:00Z`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      : null
  );
  let selectedKey = $state<string | null>(null);
  let submitted = $state(false);
  let revealData = $state<{
    correct_key: string;
    explanation_md: string;
    pm_takeaway: string;
  } | null>(null);
  let revealError = $state<string | null>(null);
  let revealing = $state(false);
  const selectedOption = $derived(
    preview.options.find((option: { key: string }) => option.key === selectedKey)
  );
  const reveal = $derived(revealData ?? preview);
  const isCorrect = $derived(submitted && !!reveal.correct_key && selectedKey === reveal.correct_key);

  function choose(key: string) {
    if (submitted) return;
    selectedKey = key;
  }

  async function submitDecision() {
    if (!selectedKey) return;
    submitted = true;
    revealError = null;

    if (preview.correct_key) {
      revealData = {
        correct_key: preview.correct_key,
        explanation_md: preview.explanation_md,
        pm_takeaway: preview.pm_takeaway,
      };
      track("landing_question_submit", { selectedKey, correct: selectedKey === preview.correct_key });
      return;
    }

    revealing = true;
    try {
      const res = await fetch("/api/landing/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.todayDate,
          position: preview.position ?? 1,
          selectedKey,
        }),
      });
      if (!res.ok) throw new Error("reveal failed");
      revealData = await res.json();
      track("landing_question_submit", {
        selectedKey,
        correct: selectedKey === revealData?.correct_key,
      });
    } catch {
      revealError = "Couldn't load the coaching note. You can still continue to the full challenge.";
      track("landing_question_submit", { selectedKey, correct: null });
    } finally {
      revealing = false;
    }
  }
</script>

<svelte:head>
  <title>{brandCopy.appName} — {brandCopy.tagline}</title>
  <meta name="description" content={`${brandCopy.tagline} Try one daily product judgment challenge based on top operator conversations.`} />
  <meta property="og:title" content={brandCopy.appName} />
  <meta property="og:description" content={`${brandCopy.tagline} Try one daily product judgment challenge based on top operator conversations.`} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://daily.deepikamurthy.com/" />
  <meta property="og:image" content="https://daily.deepikamurthy.com/social/product-gym-share-v2.png" />
  <meta property="og:image:secure_url" content="https://daily.deepikamurthy.com/social/product-gym-share-v2.png" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={brandCopy.appName} />
  <meta name="twitter:description" content={`${brandCopy.tagline} Try one daily product judgment challenge based on top operator conversations.`} />
  <meta name="twitter:image" content="https://daily.deepikamurthy.com/social/product-gym-share-v2.png" />
</svelte:head>

<main class="max-w-xl mx-auto px-6 py-12">
  <div class="text-center mb-7">
    <div class="flex items-center justify-center gap-3 mb-4">
      <MascotCoach size="sm" mood="wave" />
      <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
        Applied learning for product operators
      </p>
    </div>
    <h1 class="serif text-[52px] font-extrabold leading-[0.96] tracking-tight mt-3 mb-3">
      {brandCopy.appName}
    </h1>
    <p class="sans text-xl font-semibold text-ink-soft leading-tight">
      {brandCopy.tagline}
    </p>
    <div class="mt-3 flex items-center justify-center gap-2">
      <Sparkles size={14} class="text-accent" />
      <p class="sans text-[14px] text-ink-soft leading-relaxed">
        {brandCopy.landingSupport}
      </p>
    </div>
  </div>

  <div class="bg-paper-warm border-2 border-ink rounded-2xl px-5 py-4 mb-5 shadow-brut">
    <p class="sans text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-2">
      Today’s source
    </p>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="serif text-[23px] font-bold leading-tight tracking-tight text-ink">
          {todayContent.source.byline}
        </h2>
        <p class="sans text-[13px] text-ink-soft leading-relaxed mt-1">
          {todayContent.headline}
        </p>
      </div>
      <div class="sans text-[11px] text-ink-mute text-right flex-shrink-0 pt-1">
        <div class="capitalize">{todayContent.source.type}</div>
        {#if operatorDate}
          <div>{operatorDate}</div>
        {/if}
      </div>
    </div>
    <p class="sans text-[12px] text-ink-soft leading-relaxed mt-3">
      Start with the core idea from {todayContent.source.byline}, then apply it to realistic product decisions.
    </p>
    <div class="flex flex-wrap gap-3 mt-3">
      <a
        href="/today"
        class="sans inline-flex text-[12px] font-bold text-accent underline underline-offset-4"
      >
        Read the 3-minute summary
      </a>
      <a
        href={todayContent.source.source_url ?? todayContent.source.search_url}
        target="_blank"
        rel="noreferrer"
        class="sans inline-flex text-[12px] font-bold text-ink underline underline-offset-4"
      >
        Open Lenny’s original source
      </a>
    </div>
  </div>
  <p class="sans text-center text-[11px] text-ink-mute leading-relaxed -mt-2 mb-5 px-2">
    {brandCopy.sourceLine}
  </p>

  <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg overflow-hidden mb-6">
    <div class="px-5 py-3.5 bg-paper-warm border-b-2 border-ink flex items-center justify-between">
      <span class="sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-soft">
        {data.isFallback ? "Sample application rep · what to expect" : "Try one application rep"}
      </span>
      <span class="sans text-[11px] text-ink-mute mono">1 of 5</span>
    </div>
    <div class="px-5 py-5">
      <h2 class="serif text-[20px] font-bold leading-tight tracking-tight mb-4">
        {preview.scenario_md}
      </h2>
      <div class="flex flex-col gap-2.5">
        {#each preview.options as opt}
          {@const isSelected = selectedKey === opt.key}
          {@const isCorrectKey = reveal.correct_key === opt.key}
          {@const showCorrect = submitted && isCorrectKey}
          {@const showWrong = submitted && isSelected && !isCorrectKey}
          <button
            type="button"
            onclick={() => choose(opt.key)}
            disabled={submitted}
            class="sans btn-press text-left rounded-2xl px-4 py-4 text-[15px] font-medium leading-snug border-2 flex items-center gap-3.5 transition-all
              {showCorrect
              ? 'bg-[#E8F0DC] border-ok'
              : showWrong
                ? 'bg-[#F8DDD3] border-wrong'
                : submitted
                  ? 'border-paper-fill text-ink-mute'
                  : isSelected
                    ? 'bg-paper-cream border-accent'
                    : 'bg-white border-ink shadow-brut'}"
          >
            <span
              class="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 serif text-[13px] font-bold
                {showCorrect
                ? 'border-ok bg-ok text-paper'
                : showWrong
                  ? 'border-wrong bg-wrong text-paper'
                  : isSelected
                    ? 'border-accent bg-accent text-paper'
                    : 'border-ink bg-transparent text-ink'}"
            >
              {#if showCorrect}<Check size={16} stroke-width={3} />
              {:else if showWrong}<XIcon size={16} stroke-width={3} />
              {:else}{opt.key}{/if}
            </span>
            <span class="flex-1">{opt.text}</span>
          </button>
        {/each}
      </div>

      {#if !submitted}
        <button
          type="button"
          onclick={submitDecision}
          disabled={!selectedKey}
          class="sans btn-press w-full mt-4 bg-accent text-paper border-2 border-ink rounded-2xl py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          Check my application <ArrowRight size={16} />
        </button>
        {#if selectedOption}
          <p class="sans text-xs font-bold text-accent text-center mt-2">
            Selected {selectedOption.key}
          </p>
        {/if}
      {:else}
        <div class="mt-5 border-2 border-ink rounded-2xl bg-paper-warm px-4 py-4">
          <div class="mb-3">
            <MascotCoach
              size="sm"
              mood={isCorrect ? "celebrate" : "coach"}
              label={isCorrect ? "Nice lift. Now add four more plates." : "Form check. The insight was heavier than it looked."}
            />
          </div>
          <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-2">
            {revealing ? "Checking application" : isCorrect ? "Strong application" : "Practice note"}
          </p>
          {#if revealing}
            <p class="serif text-[17px] leading-[1.45] text-ink">Loading your coaching note...</p>
          {:else if revealError}
            <p class="serif text-[17px] leading-[1.45] text-ink">{revealError}</p>
          {:else}
            <p class="serif text-[17px] leading-[1.45] text-ink mb-3">
              {reveal.explanation_md}
            </p>
            <p class="sans text-sm font-bold text-ink">
              {reveal.pm_takeaway}
            </p>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  {#if submitted}
    <div class="bg-paper-cream border-2 border-ink rounded-2xl px-5 py-5 mb-5">
      <div class="serif text-xl font-bold leading-tight text-ink">Keep practicing this idea</div>
      <p class="sans text-[13px] text-ink-soft mt-1.5 mb-4">
        Finish four more application reps, see what stuck, then sign in only if you want to save progress and compete.
      </p>
      <div class="flex flex-col gap-3">
        <a href={`/quiz/${data.todayDate}`}
           class="sans btn-press w-full bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[15px] font-bold shadow-brut-accent-lg flex items-center justify-center gap-2 no-underline">
          Continue to rep 2 <ArrowRight size={16} />
        </a>
        <a href="/today"
           class="sans btn-press w-full bg-white text-ink border-2 border-ink rounded-2xl py-3.5 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline">
          Read the 3-minute summary first
        </a>
      </div>
    </div>
  {/if}

  <div class="flex flex-col gap-3 mb-5">
    {#if !submitted}
      <p class="sans text-center text-[12px] text-ink-mute leading-relaxed">
        Try one rep now. Finish all five to see what stuck; sign in only to save progress and compete.
      </p>
    {/if}
    <a href="/api/calendar.ics"
       download
       class="sans btn-press w-full bg-transparent text-ink-soft border-2 border-ink rounded-2xl py-4 text-[15px] font-bold flex items-center justify-center gap-2 no-underline">
      <Calendar size={16} /> Add the daily reminder
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
