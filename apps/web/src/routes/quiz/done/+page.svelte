<script lang="ts">
  import {
    Trophy,
    Headphones,
    Play,
    BookOpen,
    Check,
    X as XIcon,
    Calendar,
  } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import MascotCoach from "$lib/components/MascotCoach.svelte";
  import ShareChallengeActions from "$lib/components/ShareChallengeActions.svelte";
  let { data }: { data: any } = $props();
  let pendingGoogle = $state(false);
  let googleError = $state<string | null>(null);
  let claimUrl = $derived(data.claimUrl ?? `/quiz/claim?date=${encodeURIComponent(data.date)}`);

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }
  async function signInWithGoogle() {
    pendingGoogle = true;
    googleError = null;
    try {
      const res = await fetch("/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: claimUrl }),
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
      {data.date} · {data.preview ? "Preview result" : "Done"}
    </p>
    <h1 class="serif text-5xl font-extrabold leading-[1] tracking-tight mb-2">
      {scoreHeadline}
    </h1>
    <p class="sans text-lg font-medium text-ink-soft m-0">{scoreSub}</p>
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
          {data.preview ? "Projected" : "Rank"}
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
  {:else if data.preview}
    <div class="bg-paper-cream border-2 border-ink rounded-2xl p-4 mb-4">
      <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">
        Preview score
      </div>
      <p class="sans text-[13px] text-ink-soft m-0">
        This score is not saved yet. Sign in to claim it, join the leaderboard, and continue your weekly streak.
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
        {data.preview
          ? `${data.scoreBreakdown.totalPoints} pts preview`
          : data.scoreBreakdown.leaderboardEligible ? `${data.scoreBreakdown.totalPoints} pts` : "No leaderboard points"}
      </div>
    </div>
  </div>

  {#if data.preview}
    <div class="bg-accent text-paper rounded-2xl p-5 mb-4 border-2 border-ink shadow-brut-accent-lg">
      <div class="serif text-[24px] font-extrabold leading-tight">
        Your score is not saved yet.
      </div>
      <p class="sans text-[13px] text-paper-cream mt-1.5 mb-4">
        Sign in to save this result, claim your leaderboard rank, and continue your weekly streak. We’ll automatically claim it after sign-in — no retake needed.
      </p>
      <div class="flex flex-col gap-2.5">
        {#if data.googleEnabled}
          <button
            type="button"
            onclick={signInWithGoogle}
            disabled={pendingGoogle}
            class="sans btn-press w-full bg-paper text-ink border-2 border-ink rounded-2xl py-3.5 text-[15px] font-bold shadow-brut flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {pendingGoogle ? "Redirecting..." : "Continue with Google"}
          </button>
        {/if}
        {#if googleError}
          <p class="sans text-xs text-paper text-center">{googleError}</p>
        {/if}
        <a
          href={`/signin/email?callbackURL=${encodeURIComponent(claimUrl)}`}
          class="sans btn-press w-full bg-transparent text-paper border-2 border-paper rounded-2xl py-3.5 text-[15px] font-bold flex items-center justify-center gap-2 no-underline"
        >
          Email me a magic link
        </a>
      </div>
    </div>
  {/if}

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
  {#if !data.preview}
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
  {/if}

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
            Based on Lenny’s
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
          {data.source.type === "podcast" ? "Open episode" : "Read on Lenny’s"}
        </a>
        {#if data.source.source_url && data.source.search_url && data.source.search_url !== data.source.source_url}
          <a
            href={data.source.search_url}
            class="sans inline-flex items-center gap-1.5 bg-transparent text-ink border border-ink rounded-full px-3.5 py-1.5 text-[12px] font-semibold no-underline"
          >
            <BookOpen size={12} /> Search on Lenny’s
          </a>
        {/if}
      </div>
    </div>
    <p class="sans text-center text-[11px] text-ink-mute leading-relaxed -mt-1 mb-4 px-2">
      {brandCopy.sourceLine}
    </p>
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
    {#if !data.preview}
      <a
        href={`/quiz/${data.date}?mode=practice`}
        class="sans btn-press flex-1 bg-paper-warm text-ink border-2 border-ink rounded-2xl py-4 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
      >
        Replay as practice
      </a>
    {/if}
    <a
      href="/leaderboard"
      class="sans btn-press flex-1 bg-accent text-paper border-2 border-ink rounded-2xl py-4 text-[14px] font-bold shadow-brut flex items-center justify-center gap-2 no-underline"
    >
      <Trophy size={15} /> See Leaderboard
    </a>
  </div>
  {#if data.mode !== "practice" && !data.preview}
    <section class="bg-paper-cream border-2 border-ink rounded-2xl p-4 mt-3">
      <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">
        Challenge a friend
      </div>
      <p class="serif text-sm font-bold text-ink leading-tight mb-3">
        Share your score and ask someone to beat it.
      </p>
      <ShareChallengeActions
        correct={data.attempt.totalCorrect}
        date={data.date}
        rank={data.rank}
        url={data.shareUrl}
        source="quiz_done"
      />
    </section>
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
