<script lang="ts">
  import { Calendar, Share2 } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import { resultShareText } from "$lib/brand/share";
  import { track } from "$lib/analytics/client";
  let { data } = $props();
  let shareState = $state<"idle" | "copied" | "error">("idle");
  function fmtTime(s: number) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`; }
  function fmtDate(iso: string) {
    return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // Heatmap palette: pale teal (missed) → cream → orange → brown → olive
  const heatColors = ["#DDEDEC", "#F0E8D4", "#E8B04B", "#D2691E", "#8B4513", "#5A8A3A"];
  function heatColor(score: number | null): string {
    if (score === null) return heatColors[0];
    return heatColors[Math.min(Math.max(score, 1), 5)];
  }
  async function challengeFriends() {
    if (!data.shareResult) return;
    const url = new URL(data.shareResult.url, window.location.origin).toString();
    const text = resultShareText({
      correct: data.shareResult.totalCorrect,
      date: data.shareResult.date,
      rank: data.shareResult.rank,
    });
    try {
      if (navigator.share) {
        await navigator.share({ title: `${brandCopy.appName} challenge`, text, url });
        track("result_share", { source: "profile", method: "native" });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      shareState = "copied";
      track("result_share", { source: "profile", method: "clipboard" });
    } catch {
      shareState = "error";
    }
  }
</script>

<svelte:head><title>{brandCopy.profileName} — {brandCopy.appName}</title></svelte:head>

<main class="max-w-2xl mx-auto px-6 py-10">
  <!-- Header -->
  <div class="flex items-center gap-3.5 mb-6">
    <div
      class="w-16 h-16 rounded-full text-paper flex items-center justify-center sans font-bold text-2xl border-2 border-ink shadow-brut-accent flex-shrink-0"
      style="background-color: #8B4513"
    >
      {(data.user.displayName ?? "?")[0].toUpperCase()}
    </div>
    <div class="flex-1 min-w-0">
      <h1 class="serif text-3xl font-extrabold m-0 leading-tight tracking-tight">{data.user.displayName}</h1>
      <div class="sans text-xs text-ink-mute mt-0.5">
        {data.user.role} · joined {data.user.joined} · {data.stats.totalAttempts} sessions
      </div>
    </div>
  </div>

  <!-- Streak hero -->
  <div class="bg-accent text-paper rounded-2xl p-5 mb-3.5 border-2 border-ink shadow-brut relative overflow-hidden">
    <div class="grain absolute inset-0 opacity-[0.18]"></div>
    <div class="relative flex items-center gap-4.5" style="gap: 18px;">
      <span class="animate-flame" style="font-size: 54px; line-height: 1;">🔥</span>
      <div class="flex-1">
        <div class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-paper-cream mb-1">{brandCopy.streakName}</div>
        <div class="serif text-[40px] font-extrabold leading-none mono">{data.stats.currentStreak} {data.stats.currentStreak === 1 ? "day" : "days"}</div>
        <div class="sans text-xs text-paper-cream mt-1">
          Best ever: <strong class="mono">{data.stats.bestStreak} days</strong> · Tomorrow’s rep at <strong class="mono">08:00</strong> your time
        </div>
      </div>
    </div>
  </div>

  <!-- 4-column stat grid -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
    {#each [
      { label: "Total points", val: data.stats.totalPoints.toLocaleString() },
      { label: "This week", val: data.stats.weeklyPoints.toLocaleString() },
      { label: "Weekly rank", val: data.stats.weeklyRank ? `#${data.stats.weeklyRank}` : "—" },
      { label: "Sessions", val: data.stats.totalAttempts.toString() },
    ] as s}
      <div class="bg-white border-2 border-ink rounded-xl px-3 py-3 shadow-brut-deep min-h-[74px]">
        <div class="sans text-[9px] font-bold tracking-widest uppercase text-ink-mute mb-1 leading-tight">{s.label}</div>
        <div class="serif text-xl font-extrabold leading-none mono break-words">{s.val}</div>
      </div>
    {/each}
  </div>

  {#if data.shareResult}
    <div class="bg-paper-cream rounded-xl border-2 border-ink px-4 py-4 mb-3.5 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <div class="sans text-[11px] font-bold tracking-widest uppercase text-accent mb-1">Challenge friends</div>
        <div class="serif text-sm font-bold text-ink leading-tight">
          Share your latest {data.shareResult.totalCorrect}/5 and ask someone to beat it.
        </div>
        {#if shareState === "error"}
          <div class="sans text-[11px] text-wrong mt-1">Couldn’t open sharing. Copy your result page URL instead.</div>
        {/if}
      </div>
      <button
        type="button"
        onclick={challengeFriends}
        class="sans btn-press flex-shrink-0 bg-accent text-paper border-2 border-ink rounded-xl px-3 py-2 text-xs font-bold shadow-brut flex items-center gap-1.5"
      >
        <Share2 size={14} /> {shareState === "copied" ? "Copied" : "Share"}
      </button>
    </div>
  {/if}

  <!-- 14-day heatmap -->
  <div class="bg-white rounded-xl border-2 border-ink p-4 mb-3.5">
    <div class="flex justify-between items-baseline mb-3">
      <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-soft">Last 14 days</div>
      <div class="sans text-[10px] text-ink-mute">{fmtDate(data.heatmap[0].date)} — {fmtDate(data.heatmap[data.heatmap.length-1].date)}</div>
    </div>
    <div class="grid grid-cols-14 gap-1" style="grid-template-columns: repeat(14, minmax(0, 1fr));">
      {#each data.heatmap as h}
        {#if h.available}
          <a
            href={h.href}
            title={h.score ? `${h.score}/5` : "Missed · available as late challenge"}
            class="block aspect-square border-[1.5px] border-ink rounded"
            style="background-color: {heatColor(h.score)};"
          ></a>
        {:else}
          <div
            title="not available"
            class="aspect-square border-[1.5px] border-ink rounded opacity-40"
            style="background-color: {heatColor(h.score)};"
          ></div>
        {/if}
      {/each}
    </div>
    <div class="flex items-center gap-1.5 mt-2.5 text-[10px] text-ink-mute sans">
      <span>Less</span>
      {#each heatColors as c}
        <div class="w-3 h-3 border-[1.5px] border-ink rounded" style="background-color: {c};"></div>
      {/each}
      <span>5/5</span>
    </div>
  </div>

  <!-- Recent sessions -->
  <div class="bg-white rounded-xl border-2 border-ink overflow-hidden mb-3.5">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-soft px-5 py-3 border-b-[1.5px] border-paper-fill bg-paper-warm">
      Recent sessions
    </div>
    {#each data.recent as r, i}
      <a href={`/quiz/${r.date}/done`} class="flex items-center gap-3.5 px-5 py-3 no-underline text-ink {i < data.recent.length - 1 ? 'border-b border-paper-fill' : ''}">
        <div class="serif w-11 text-[13px] font-bold text-ink-mute mono">{fmtDate(r.date)}</div>
        <div class="flex-1 min-w-0">
          <div class="serif text-[15px] font-bold leading-tight text-ink truncate">{r.headline || "Today's session"}</div>
          <div class="sans text-[11px] text-ink-mute mt-0.5">with {r.byline}</div>
        </div>
        <div class="flex gap-1 items-center">
          {#each [1,2,3,4,5] as n}
            <div class="w-1.5 h-1.5 rounded-full border border-ink {n <= r.totalCorrect ? 'bg-ok' : 'bg-paper-fill'}"></div>
          {/each}
        </div>
        <div class="sans text-xs text-ink-soft mono min-w-9 text-right">{fmtTime(r.totalSeconds)}</div>
        <span class="sans flex-shrink-0 bg-transparent border-[1.5px] border-ink rounded-lg px-3 py-1.5 text-xs font-bold text-ink">
          Review
        </span>
      </a>
    {/each}
    {#if data.recent.length === 0}
      <div class="py-8 text-center serif italic text-ink-soft">No sessions yet.</div>
    {/if}
  </div>

  <!-- Settings -->
  <div class="bg-white rounded-xl border-2 border-ink overflow-hidden mb-3.5">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-soft px-5 py-3 border-b-[1.5px] border-paper-fill bg-paper-warm">Settings</div>
    {#each [
      { label: "Display name", val: data.user.displayName, action: "Edit" },
      { label: "Timezone", val: data.user.timezone, action: "Edit" },
      { label: "Daily reminder", val: "Add Product Gym to your calendar", action: "Download .ics" },
    ] as s, i}
      <div class="flex items-center justify-between px-5 py-3.5 {i < 2 ? 'border-b border-paper-fill' : ''}">
        <div>
          <div class="sans text-[11px] font-bold tracking-wider uppercase text-ink-mute mb-0.5">{s.label}</div>
          <div class="serif text-sm font-semibold text-ink">{s.val}</div>
        </div>
        {#if s.label === "Daily reminder"}
          <a href="/api/calendar.ics" download class="sans bg-transparent border-[1.5px] border-ink rounded-lg px-3 py-1.5 text-xs font-bold text-ink no-underline">{s.action}</a>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Privacy & data -->
  <div class="bg-paper-warm rounded-xl border-2 border-ink-mute overflow-hidden mb-3.5">
    <div class="sans text-[11px] font-bold tracking-widest uppercase text-ink-soft px-5 py-3 border-b-[1.5px] border-ink-mute">Privacy & data</div>
    <div class="flex items-center justify-between px-5 py-3.5 border-b border-paper-fill">
      <div>
        <div class="serif text-sm font-bold text-ink">Download my data</div>
        <div class="sans text-[11px] text-ink-mute mt-0.5">JSON export · profile, sessions, answers</div>
      </div>
      <a href="/me/export" class="sans bg-transparent border-[1.5px] border-ink rounded-lg px-3 py-1.5 text-xs font-bold text-ink no-underline">Export</a>
    </div>
    <form method="POST" action="/me/delete">
      <div class="flex items-center justify-between px-5 py-3.5">
        <div>
          <div class="serif text-sm font-bold text-wrong">Delete my account</div>
          <div class="sans text-[11px] text-ink-mute mt-0.5">Anonymizes your sessions; you'll lose access immediately.</div>
        </div>
        <button type="submit" onclick={(e) => { if (!confirm('Delete your account? This cannot be undone.')) e.preventDefault(); }} class="sans bg-transparent border-[1.5px] border-wrong rounded-lg px-3 py-1.5 text-xs font-bold text-wrong">Delete</button>
      </div>
    </form>
  </div>

  <!-- Sign out -->
  <div class="text-center pt-3 border-t border-paper-fill">
    <a href="/auth/sign-out" class="sans bg-transparent border-none text-ink-mute text-[13px] no-underline">Sign out</a>
  </div>
</main>
