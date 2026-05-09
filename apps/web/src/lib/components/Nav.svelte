<script lang="ts">
  import { page } from "$app/state";
  import { Calendar, Trophy, Users, Coffee } from "lucide-svelte";

  type Tab = { href: string; label: string; matches: (path: string) => boolean };

  const tabs: { href: string; label: string; Icon: typeof Calendar; matches: (path: string) => boolean }[] = [
    {
      href: "/today",
      label: "Today",
      Icon: Calendar,
      // /today is also active during the quiz flow (which lives under /quiz)
      matches: (p) => p === "/today" || p.startsWith("/quiz"),
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      Icon: Trophy,
      matches: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
    },
    {
      href: "/me",
      label: "You",
      Icon: Users,
      matches: (p) => p === "/me" || p.startsWith("/me/"),
    },
  ];
</script>

<header class="sticky top-0 z-40 bg-paper border-b-2 border-ink">
  <div class="max-w-2xl mx-auto flex items-center justify-between px-6 py-3">
    <a href="/today" class="flex items-center gap-2.5 no-underline">
      <span
        class="w-9 h-9 rounded-xl bg-accent border-2 border-ink shadow-brut-sm flex items-center justify-center flex-shrink-0"
        style="transform: rotate(-3deg);"
      >
        <Coffee size={18} class="text-paper" />
      </span>
      <span class="leading-tight">
        <span class="block serif text-lg font-extrabold leading-none tracking-tight text-ink">PM Daily</span>
        <span class="block sans text-[9px] text-ink-mute uppercase tracking-[0.14em] mt-0.5">Sourced from Lenny's</span>
      </span>
    </a>
  </div>
  <nav class="bg-paper border-t border-paper-fill">
    <div class="max-w-2xl mx-auto flex px-6">
      {#each tabs as tab}
        {@const active = tab.matches(page.url.pathname)}
        <a
          href={tab.href}
          class="sans flex items-center gap-2 px-4 py-3 text-[13px] no-underline transition-colors border-b-[3px] {active
            ? 'text-ink font-bold border-accent'
            : 'text-ink-mute font-medium border-transparent hover:text-ink'}"
        >
          <tab.Icon size={15} />
          {tab.label}
        </a>
      {/each}
    </div>
  </nav>
</header>
