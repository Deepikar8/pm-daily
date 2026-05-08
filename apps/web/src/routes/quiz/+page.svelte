<script lang="ts">
  import { goto } from "$app/navigation";
  import { Headphones, Clock, ArrowRight, Check, X as XIcon } from "lucide-svelte";
  import ResultPanel from "$lib/components/ResultPanel.svelte";

  let { data } = $props();

  type Question = {
    position: number;
    archetype: string;
    scenario_md: string;
    options: { key: "A" | "B" | "C" | "D"; text: string }[];
    citation: {
      title: string;
      byline: string;
      type: "podcast" | "newsletter";
      source_url?: string;
      search_url: string;
      timestamp?: string;
    };
  };
  type Reveal = {
    correct_key: "A" | "B" | "C" | "D";
    explanation_md: string;
    pm_takeaway: string;
    citation_quote_excerpt: string;
  };

  const questions: Question[] = $state(data.questions ?? []);
  let currentIndex = $state(data.state?.currentIndex ?? 0);
  let selected = $state<string | null>(null);
  let revealed = $state(false);
  let revealData = $state<Reveal | null>(null);
  let pending = $state(false);
  let elapsed = $state(0);
  let startedAt = $state<number>(data.state?.startedAt ?? Date.now());
  let answersLog = $state<Array<{ position: number; correct: boolean }>>([]);

  // Tick timer
  $effect(() => {
    const interval = setInterval(() => {
      elapsed = Math.floor((Date.now() - startedAt) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  });

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  async function submitAnswer() {
    if (!selected || pending) return;
    pending = true;
    const q = questions[currentIndex];
    try {
      const res = await fetch("/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: q.position,
          selectedKey: selected,
          date: data.date,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      // Reveal: ask the server for the correct key + explanation for THIS question
      const rev = await fetch(
        `/quiz/reveal?date=${encodeURIComponent(data.date)}&position=${q.position}`,
      );
      if (!rev.ok) throw new Error("reveal failed");
      const r = (await rev.json()) as Reveal;
      revealData = r;
      revealed = true;
      answersLog.push({ position: q.position, correct: r.correct_key === selected });
    } catch (e) {
      console.error(e);
      pending = false;
      return;
    }
    pending = false;
  }

  async function next() {
    revealed = false;
    revealData = null;
    selected = null;
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
    } else {
      // Finalize
      pending = true;
      const res = await fetch("/quiz/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.date }),
      });
      pending = false;
      if (res.ok) {
        await goto("/quiz/done");
      }
    }
  }
</script>

<svelte:head><title>Today's quiz — PM Daily</title></svelte:head>

{#if data.missing || !questions.length}
  <main class="max-w-2xl mx-auto px-6 py-16 text-center">
    <h1 class="serif text-3xl font-bold">No quiz today.</h1>
    <p class="serif italic text-lg text-ink-soft mt-3">
      Check back tomorrow at 8am your local time.
    </p>
    <a
      href="/today"
      class="sans inline-block mt-5 bg-accent text-paper border-2 border-ink rounded-xl px-5 py-3 font-bold shadow-brut"
    >
      Back to today
    </a>
  </main>
{:else}
  {@const q = questions[currentIndex]}
  <main class="max-w-2xl mx-auto px-6 py-8">
    <!-- Progress + timer header -->
    <div class="flex justify-between items-center mb-2">
      <span class="sans text-xs font-bold tracking-widest uppercase text-ink-mute">
        Question {currentIndex + 1} of {questions.length}
      </span>
      <span class="flex items-center gap-1.5 text-ink-soft">
        <Clock size={14} />
        <span class="sans text-[13px] font-semibold mono">{fmtTime(elapsed)}</span>
      </span>
    </div>
    <div class="flex gap-1 mb-6">
      {#each questions as _, i}
        <div
          class="flex-1 h-2 rounded-full border-2 border-ink transition-colors"
          style="background-color: {i < currentIndex
            ? answersLog[i]?.correct
              ? '#5A8A3A'
              : '#B84A2A'
            : i === currentIndex
              ? '#D2691E'
              : '#F0E8D4'}"
        ></div>
      {/each}
    </div>

    <!-- Episode pill -->
    <div
      class="inline-flex items-center gap-2 bg-paper-warm border border-ink-mute px-3 py-1 rounded-full mb-3.5"
    >
      <Headphones size={12} class="text-ink-mute" />
      <span class="sans text-[11px] font-semibold text-ink-soft">
        {q.citation.byline}
        {#if q.citation.timestamp}
          &nbsp;·&nbsp;<span class="mono font-bold">{q.citation.timestamp}</span>
        {/if}
        &nbsp;·&nbsp;{q.archetype}
      </span>
    </div>

    <!-- Scenario -->
    <h2 class="serif text-[26px] font-bold leading-[1.25] tracking-tight mt-0 mb-6">
      {q.scenario_md}
    </h2>

    <!-- Options -->
    <div class="flex flex-col gap-3 mb-5">
      {#each q.options as opt}
        {@const isSelected = selected === opt.key}
        {@const isCorrectKey = revealData?.correct_key === opt.key}
        {@const showCorrect = revealed && isCorrectKey}
        {@const showWrong = revealed && isSelected && !isCorrectKey}
        <button
          onclick={() => {
            if (!revealed) selected = opt.key;
          }}
          disabled={revealed}
          class="sans btn-press text-left rounded-2xl px-4 py-4 text-[15px] font-medium leading-snug border-2 flex items-center gap-3.5 transition-all
            {showCorrect
            ? 'bg-[#E8F0DC] border-ok'
            : showWrong
              ? 'bg-[#F8DDD3] border-wrong'
              : revealed
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

    {#if !revealed}
      <button
        onclick={submitAnswer}
        disabled={!selected || pending}
        class="sans btn-press w-full bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[16px] font-bold shadow-brut-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Submit answer"} <ArrowRight size={16} />
      </button>
    {:else if revealData}
      <ResultPanel
        correct={revealData.correct_key === selected}
        correctKey={revealData.correct_key}
        explanationMd={revealData.explanation_md}
        pmTakeaway={revealData.pm_takeaway}
        citation={{ ...q.citation, quote_excerpt: revealData.citation_quote_excerpt }}
      />
      <button
        onclick={next}
        disabled={pending}
        class="sans btn-press w-full mt-3 bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[16px] font-bold shadow-brut-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {pending
          ? "Saving…"
          : currentIndex < questions.length - 1
            ? "Next question"
            : "See your result"}
        <ArrowRight size={16} />
      </button>
    {/if}
  </main>
{/if}

<style>
  @keyframes slideUp {
    from {
      transform: translateY(16px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
