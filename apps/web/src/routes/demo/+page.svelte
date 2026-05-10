<script lang="ts">
  import { ArrowRight, CheckCircle2, Dumbbell, XCircle } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import MascotCoach from "$lib/components/MascotCoach.svelte";
  import { track } from "$lib/analytics/client";

  let { data } = $props();
  const question = $derived(data.question);
  let selectedKey = $state<string | null>(null);
  let submitted = $state(false);

  const selectedOption = $derived(
    question.options.find((option: { key: string }) => option.key === selectedKey)
  );
  const isCorrect = $derived(submitted && selectedKey === question.correct_key);

  function choose(key: string) {
    if (submitted) return;
    selectedKey = key;
  }

  function submit() {
    if (!selectedKey) return;
    submitted = true;
    track("demo_submit", { selectedKey, correct: isCorrect });
  }
</script>

<svelte:head>
  <title>Sample rep — {brandCopy.appName}</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-6 py-8 sm:py-12">
  <div class="sans inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-accent bg-paper-cream border-2 border-accent rounded-full px-3.5 py-1.5 mb-4">
    <Dumbbell size={12} />
    Sample rep
  </div>

  <div class="flex items-end justify-between gap-4 mb-6">
    <div class="min-w-0">
      <h1 class="serif text-[34px] sm:text-[44px] font-extrabold leading-[1.03] tracking-tight mb-3">
        Make the call.
      </h1>
      <p class="serif italic text-lg text-ink-soft">
        One product judgment rep. No account needed.
      </p>
    </div>
    <MascotCoach size="md" />
  </div>

  <section class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg overflow-hidden">
    <div class="px-5 py-3.5 bg-paper-warm border-b-2 border-ink flex items-center justify-between gap-3">
      <span class="sans text-[11px] font-bold tracking-[0.12em] uppercase text-ink-soft">
        {question.archetype}
      </span>
      <span class="sans text-[11px] text-ink-mute mono">1 of 1</span>
    </div>

    <div class="px-5 py-5 sm:px-6 sm:py-6">
      <h2 class="serif text-[22px] sm:text-[26px] font-bold leading-tight tracking-tight mb-5">
        {question.scenario_md}
      </h2>

      <div class="flex flex-col gap-3">
        {#each question.options as option}
          {@const active = selectedKey === option.key}
          {@const correct = submitted && option.key === question.correct_key}
          {@const wrong = submitted && active && !correct}
          <button
            type="button"
            onclick={() => choose(option.key)}
            class={[
              "sans text-left px-4 py-3.5 border-2 border-ink rounded-xl text-sm text-ink flex gap-3 items-center bg-white transition",
              submitted ? "cursor-default" : "btn-press cursor-pointer",
              active && !submitted ? "shadow-brut bg-paper-cream" : "",
              correct ? "bg-correct/10 border-correct" : "",
              wrong ? "bg-wrong/10 border-wrong" : "",
            ]}
          >
            <span class="serif font-bold text-ink-mute min-w-[20px]">{option.key}</span>
            <span class="flex-1 leading-snug">{option.text}</span>
            {#if correct}
              <CheckCircle2 size={17} class="text-correct flex-shrink-0" />
            {:else if wrong}
              <XCircle size={17} class="text-wrong flex-shrink-0" />
            {/if}
          </button>
        {/each}
      </div>

      {#if submitted}
        <div class="mt-5 border-2 border-ink rounded-2xl bg-paper-warm px-4 py-4">
          <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-2">
            {isCorrect ? "Good rep" : "Training note"}
          </p>
          <p class="serif text-[17px] leading-[1.45] text-ink mb-3">
            {question.explanation_md}
          </p>
          <p class="sans text-sm font-bold text-ink">
            {question.pm_takeaway}
          </p>
        </div>
      {/if}
    </div>
  </section>

  <div class="mt-6 flex flex-col sm:flex-row gap-3">
    {#if submitted}
      <a href="/signin/email"
         class="sans btn-press bg-accent text-paper border-2 border-ink rounded-2xl px-5 py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center justify-center gap-2 no-underline">
        Save your streak <ArrowRight size={16} />
      </a>
      <a href="/today"
         class="sans btn-press bg-white text-ink border-2 border-ink rounded-2xl px-5 py-3.5 text-[15px] font-bold shadow-brut flex items-center justify-center no-underline">
        Read today’s lesson
      </a>
    {:else}
      <button
        type="button"
        onclick={submit}
        disabled={!selectedKey}
        class="sans btn-press bg-accent text-paper border-2 border-ink rounded-2xl px-5 py-3.5 text-[15px] font-bold shadow-brut-lg flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
      >
        Check my call <ArrowRight size={16} />
      </button>
      {#if selectedOption}
        <p class="sans text-sm text-ink-soft self-center">
          Selected {selectedOption.key}
        </p>
      {/if}
    {/if}
  </div>
</main>
