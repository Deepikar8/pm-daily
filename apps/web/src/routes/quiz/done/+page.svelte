<script lang="ts">
  import {
    Trophy,
    Share2,
    Headphones,
    Play,
    BookOpen,
    Check,
    X as XIcon,
    Calendar,
  } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import { resultShareText } from "$lib/brand/share";
  import { track } from "$lib/analytics/client";
  import MascotCoach from "$lib/components/MascotCoach.svelte";
  let { data }: { data: any } = $props();
  let shareState = $state<"idle" | "copied" | "error">("idle");

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }
  async function shareResult() {
    if (data.mode === "practice") return;
    const text = resultShareText({
      correct: data.attempt.totalCorrect,
      date: data.date,
      rank: data.rank,
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${brandCopy.appName} result`,
          text,
          url: data.shareUrl,
        });
        track("result_share", { source: "quiz_done", method: "native" });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${data.shareUrl}`);
      shareState = "copied";
      track("result_share", { source: "quiz_done", method: "clipboard" });
    } catch {
      shareState = "error";
    }
  }
  let scoreHeadline = $derived(
    data.attempt.totalCorrect === 5
      ? "Clean sheet."
      : data.attempt.totalCorrect === 4
        ? "Solid run."
        : data.attempt.totalCorrect === 3
          ? "Decent."
          : data.attempt.totalCorrect >= 1
            ? "Tomorrow’s another rep."
            : "Rough one.",
  );
  let scoreSub = $derived(
    data.attempt.totalCorrect === 5
      ? "You absorbed today’s playbook."
      : "Every miss is a thing you now know.",
  );
</script>

<svelte:head><title>Done — {brandCopy.appName}</title></svelte:head>

<main class="max-w-2xl mx-auto px-6 py-10">
  <!-- Score headline -->
  <div class="text-center mb-6">
    <div class="flex justify-center mb-3">
      <MascotCoach
        size="md"
        mood={data.attempt.totalCorrect >= 4 ? "celebrate" : "coach"}
        label={data.attempt.totalCorrect >= 4
          ? "That one belongs on the highlight reel."
          : "Not a miss. A very expensive warm-up."}
      />
    </div>
    <p class="sans text-[12px] font-bold tracking-[0.12em] uppercase text-accent mb-2">
      {data.date} · Done
    </p>
    <h1 class="serif text-5xl font-extrabold leading-[1] tracking-tight mb-2">
      {scoreHeadline}
    </h1>
    <p class="serif italic text-lg text-ink-soft m-0">{scoreSub}</p>
  </div>

  <!-- 3-column score panel -->
  <div
    class="bg-ink text-paper rounded-2xl p-5 mb-4 border-2 border-ink shadow-brut-accent-lg relative overflow-hidden"
  >
    <div class="grain absolute inset-0 opacity-15"></div>
    <div class="relative grid grid-cols-3 gap-4">
      <div>
        <div class="sans text-[11px] font-bold tracking-widest uppercase text-gold mb-1.5">
          Score
        </div>
        <div class="serif text-[40px] font-extrabold leading-none">
          {data.attempt.totalCorrect}<span class="text-ink-mute">/5</span>
        </div>
      </div>
      <div>
        <div class="sans text-[11px] font-bold tracking-widest uppercase text-gold mb-1.5">
          Time
        </div>
        <div class="serif text-[40px] font-extrabold leading-none mono">
          {fmtTime(data.attempt.totalSeconds)}
        </div>
      </div>
      <div>
        <div class="sans text-[11px] font-bold tracking-widest uppercase text-gold mb-1.5">
          Rank
        </div>
        <div class="serif text-[40px] font-extrabold leading-none">
          {data.rank ? `#${data.rank}` : "—"}
        </div>
      </div>
    </div>
  </div>

  {#if data.mode === "late"}
    <div class="bg-paper-cream border-2 border-ink rounded-2xl p-4 mb-4">
      <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">
        Saved to your history
      </div>
      <p class="sans text-[13px] text-ink-soft m-0">
        Late challenges help you catch up, but only same-day attempts count toward streaks and leaderboard.
      </p>
    </div>
  {:else if data.mode === "practice"}
    <div class="bg-paper-cream border-2 border-ink rounded-2xl p-4 mb-4">
      <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">
        Practice replay
      </div>
      <p class="sans text-[13px] text-ink-soft m-0">
        Practice replays do not change your score, streak, or leaderboard rank.
      </p>
    </div>
  {/if}

  <div class="bg-white rounded-2xl border-2 border-ink p-4 mb-4">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-mute mb-3">
      How your score was calculated
    </div>
    <div class="grid grid-cols-2 gap-2 sans text-sm">
      <div>Correct</div>
      <div class="text-right mono">{data.scoreBreakdown.basePoints} pts</div>
      <div>Speed bonus</div>
      <div class="text-right mono">+{data.scoreBreakdown.speedBonus}</div>
      <div>Streak</div>
      <div class="text-right mono">{data.scoreBreakdown.streakMultiplier.toFixed(2)}x</div>
      <div class="font-bold">Total</div>
      <div class="text-right mono font-bold">
        {data.scoreBreakdown.leaderboardEligible ? `${data.scoreBreakdown.totalPoints} pts` : "No leaderboard points"}
      </div>
    </div>
  </div>

  <a
    href="/api/calendar.ics"
    download
    class="sans flex items-center justify-between px-4 py-3.5 bg-paper-warm border-2 border-dashed border-ink-mute rounded-xl no-underline text-ink mb-4"
  >
    <span class="flex items-center gap-2.5">
      <span class="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
        <Calendar size={16} class="text-paper" />
      </span>
      <span>
        <span class="block text-[13px] font-bold">Get tomorrow’s challenge on your calendar</span>
        <span class="block text-[11px] text-ink-mute">Recurring 8am-local reminder</span>
      </span>
    </span>
    <span class="text-[12px] font-bold text-accent">Add</span>
  </a>

  <!-- Streak card -->
  <div
    class="bg-accent text-paper rounded-2xl p-4 mb-4 border-2 border-ink shadow-brut flex items-center gap-3.5 relative overflow-hidden"
  >
    <div class="grain absolute inset-0 opacity-20"></div>
    <span class="text-[36px] relative" style="animation: flame 1.6s ease-in-out infinite;"
      >🔥</span
    >
    <div class="flex-1 relative">
      <div class="serif text-[22px] font-extrabold leading-tight">
        {data.streak.current}
        {data.streak.current === 1 ? "day" : "days"}
      </div>
      <div class="sans text-xs text-paper-cream mt-0.5">
        Best: <strong>{data.streak.best}</strong> · Tomorrow’s rep opens at 8am your local time.
      </div>
    </div>
  </div>

  <!-- Now go deeper -->
  {#if data.source}
    <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-deep overflow-hidden mb-4">
      <div class="px-5 py-4 flex items-center gap-3.5">
        <div
          class="w-[54px] h-[54px] rounded-xl border-2 border-ink flex-shrink-0 flex items-center justify-center relative overflow-hidden grain"
          style="background: linear-gradient(135deg, #D2691E 0%, #8B4513 100%);"
        >
          <Headphones size={22} class="text-paper relative" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="sans text-[10px] font-bold tracking-widest uppercase text-accent mb-0.5">
            Now go deeper
          </div>
          <div class="serif text-[15px] font-bold leading-tight">{data.source.title}</div>
          <div class="sans text-xs text-ink-mute mt-0.5">with {data.source.byline}</div>
        </div>
      </div>
      <div class="px-5 py-2.5 border-t border-paper-fill flex gap-2 flex-wrap">
        <a
          href={data.source.source_url || data.source.search_url}
          class="sans inline-flex items-center gap-1.5 bg-ink text-paper rounded-full px-3.5 py-1.5 text-[12px] font-semibold no-underline"
        >
          <Play size={12} fill="currentColor" />
          {data.source.type === "podcast" ? "Listen" : "Read"}
        </a>
        {#if data.source.type === "podcast"}
          <a
            href={data.source.search_url}
            class="sans inline-flex items-center gap-1.5 bg-transparent text-ink border border-ink rounded-full px-3.5 py-1.5 text-[12px] font-semibold no-underline"
          >
            <BookOpen size={12} /> Transcript
          </a>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Question recap with takeaways -->
  <div class="bg-white rounded-2xl border-2 border-ink p-4 mb-4">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-mute mb-3">
      Five takeaways from today’s rep
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
  </div>

  <!-- CTA row -->
  <div class="flex gap-2.5">
    <a
      href={`/quiz/${data.date}?mode=practice`}
      class="sans btn-press flex-1 bg-paper-warm text-ink border-2 border-ink rounded-2xl py-4 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
    >
      Replay as practice
    </a>
    <a
      href="/leaderboard"
      class="sans btn-press flex-1 bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
    >
      <Trophy size={15} /> See Leaderboard
    </a>
    {#if data.mode !== "practice"}
      <button
        type="button"
        onclick={shareResult}
        class="sans btn-press bg-white text-ink border-2 border-ink rounded-2xl px-5 py-4 text-[14px] font-bold shadow-brut flex items-center gap-2"
      >
        <Share2 size={15} /> {shareState === "copied" ? "Copied" : "Share"}
      </button>
    {/if}
  </div>
  {#if shareState === "error"}
    <p class="sans text-xs text-wrong text-center mt-3">
      Couldn’t open sharing. Copy this page URL instead.
    </p>
  {/if}
</main>

<style>
  @keyframes flame {
    0%,
    100% {
      transform: rotate(-3deg) scale(1);
    }
    50% {
      transform: rotate(3deg) scale(1.08);
    }
  }
</style>
