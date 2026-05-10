<script lang="ts">
  import { Trophy, Crown, TrendingUp, Users, ArrowRight } from "lucide-svelte";
  import { brandCopy } from "$lib/brand/product-gym";
  import { getLeaderboardDisplay, type LeaderboardScope } from "$lib/leaderboard/view";
  let { data } = $props();
  let scope = $state<LeaderboardScope>("weekly");
  let activeBoard = $derived(scope === "weekly" ? data.weekly.rows : data.allTime.rows);
  let display = $derived(
    getLeaderboardDisplay({
      rows: activeBoard,
      scope,
      currentUserId: data.currentUserId,
    })
  );

  function avatarBg(i: number) {
    const palette = ["#2F6F73", "#8B4513", "#5A8A3A", "#A0522D", "#17484B", "#8B7355"];
    return palette[i % palette.length];
  }
</script>

<svelte:head><title>{brandCopy.leaderboardName} — {brandCopy.appName}</title></svelte:head>

<main class="max-w-2xl mx-auto px-6 py-10">
  <!-- Header -->
  <div class="mb-5">
    <p class="sans text-[11px] font-bold tracking-[0.14em] uppercase text-accent mb-1.5">
      {scope === "allTime" ? "All-time Arena" : `Arena · Week ${data.weekKey || "—"}`}
    </p>
    <h1 class="serif text-4xl font-extrabold leading-[1.05] tracking-tight m-0">
      {#if scope === "allTime"}
        The compounders.
      {:else}
        Same five decisions. <em class="italic font-bold text-accent">Different times.</em>
      {/if}
    </h1>
    <p class="sans text-[13px] text-ink-soft mt-2">
      {#if scope === "allTime"}
        Ranked by total points. Training streak shown as tie-break — consistency beats intensity.
      {:else}
        Ranked by weekly points. The Arena resets Monday at 00:00 UTC.
      {/if}
    </p>
  </div>

  <!-- Toggle -->
  <div class="flex gap-1.5 mb-4 bg-paper-fill p-1 rounded-xl border-2 border-ink">
    {#each [{ id: "weekly" as LeaderboardScope, label: "This week", Icon: Users }, { id: "allTime" as LeaderboardScope, label: "All-time", Icon: TrendingUp }] as opt}
      <button
        onclick={() => (scope = opt.id)}
        class="sans flex-1 py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors {scope === opt.id ? 'bg-ink text-paper' : 'text-secondary-deep hover:text-ink'}"
      >
        <opt.Icon size={14} /> {opt.label}
      </button>
    {/each}
  </div>

  <div class="bg-white rounded-2xl border-2 border-ink shadow-brut-accent-lg overflow-hidden">

    <!-- Podium (top 3) -->
    {#if display.podium.length >= 3}
      <div class="px-5 py-6 bg-paper-warm border-b-2 border-ink">
        <div class="flex justify-center items-end gap-3 mx-auto" style="max-width: 420px;">
          {#each display.podium as p, i}
            {@const heights = ["72px", "100px", "60px"]}
            {@const colors = ["#8B7355", "#CC5500", "#A0522D"]}
            {@const rank = i === 1 ? 1 : i === 0 ? 2 : 3}
            <div class="flex-1 text-center">
              <div
                class="w-[46px] h-[46px] mx-auto mb-1.5 rounded-full text-paper flex items-center justify-center sans font-bold text-base relative"
                style="background-color: {avatarBg(rank - 1)}; border: 3px solid {colors[i]}"
              >
                {(p.displayName ?? "?")[0]}
                <div
                  class="absolute -top-2.5 -right-1.5 rounded-full w-[22px] h-[22px] flex items-center justify-center border-2 border-ink serif text-[11px] font-extrabold text-paper"
                  style="background-color: {colors[i]}"
                >
                  {rank}
                </div>
              </div>
              <div class="serif text-[13px] font-bold mb-0.5 truncate">{p.displayName}</div>
              <div class="sans text-[10px] text-ink-mute mb-1.5 mono">
                {scope === "weekly" ? p.weeklyPoints ?? 0 : p.totalPoints ?? 0} pts
              </div>
              <div
                class="rounded-t-lg border-2 border-b-0 border-ink flex items-start justify-center pt-2"
                style="height: {heights[i]}; background-color: {colors[i]}"
              >
                {#if i === 1}<Crown size={20} fill="#FBF7F0" class="text-paper" />{/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Pinned current-user row (only if user is on the board, scope=weekly) -->
    {#if display.pinned && display.pinnedRank}
      {@const me = display.pinned}
      <div class="relative px-5 py-3.5 bg-paper-cream border-b-2 border-ink flex items-center gap-3">
        <span class="absolute left-0 top-0 bottom-0 w-1 bg-accent"></span>
        <div class="serif w-8 text-center text-[17px] font-extrabold text-accent">#{display.pinnedRank}</div>
        <div class="w-9 h-9 rounded-full text-paper flex items-center justify-center sans font-bold text-sm border-2 border-ink flex-shrink-0"
             style="background-color: #8B4513">
          {(me.displayName ?? "?")[0]}
        </div>
        <div class="flex-1 min-w-0">
          <div class="serif text-[15px] font-bold">
            {me.displayName}
            <span class="sans text-[9px] bg-accent text-paper px-1.5 py-0.5 rounded ml-1.5 font-bold tracking-wider uppercase">You</span>
          </div>
        </div>
        <div class="flex items-center gap-1 mono text-xs">🔥 {me.currentStreak}</div>
        <div class="text-right">
          <div class="serif text-[15px] font-bold">
            {scope === "weekly" ? me.weeklyPoints ?? 0 : me.totalPoints ?? 0}
          </div>
          <div class="sans text-[10px] text-ink-mute mono">pts</div>
        </div>
      </div>
    {/if}

    <!-- All rows (post-podium when scope=weekly, full list when scope=allTime) -->
    <div>
      {#each display.rows as p}
        {@const rank = p.rank}
        <div class="flex items-center gap-3 px-5 py-3.5 border-b border-paper-fill last:border-b-0">
          <div class="serif w-8 text-center text-[17px] font-extrabold text-ink-mute">{rank}</div>
          <div class="w-9 h-9 rounded-full text-paper flex items-center justify-center sans font-bold text-sm border-2 border-ink flex-shrink-0"
               style="background-color: {avatarBg(rank)}">
            {(p.displayName ?? "?")[0]}
          </div>
          <div class="flex-1 min-w-0">
            <div class="serif text-[15px] font-bold">{p.displayName}</div>
          </div>
          <div class="flex items-center gap-1 mono text-xs">🔥 {p.currentStreak}</div>
          <div class="text-right min-w-[64px]">
            <div class="serif text-[15px] font-bold mono">
              {scope === "weekly" ? p.weeklyPoints ?? 0 : p.totalPoints ?? 0}
            </div>
            <div class="sans text-[10px] text-ink-mute">pts</div>
          </div>
        </div>
      {/each}
    </div>

    {#if activeBoard.length === 0}
      <div class="px-5 py-10 text-center">
        <Trophy size={32} class="text-secondary mx-auto mb-3" />
        <p class="serif italic text-ink-soft mb-4">
          No Arena standings yet — be the first to train today.
        </p>
        <a
          href="/quiz"
          class="sans btn-press inline-flex items-center justify-center gap-2 bg-accent text-paper border-2 border-ink rounded-2xl px-5 py-3 text-[14px] font-bold shadow-brut no-underline"
        >
          {brandCopy.takeRepCta} <ArrowRight size={15} />
        </a>
      </div>
    {/if}
  </div>
</main>
