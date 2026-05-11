<script lang="ts">
  let {
    size = "md",
    mood = "idle",
    label = "",
  }: {
    size?: "sm" | "md" | "lg";
    mood?: "idle" | "wave" | "think" | "celebrate" | "coach";
    label?: string;
  } = $props();

  const sizeClass = $derived(
    size === "sm" ? "w-14 h-14" : size === "lg" ? "w-28 h-28" : "w-20 h-20",
  );
</script>

<div class="flex items-center gap-2.5">
<div class={["mascot-wrap relative flex items-center justify-center flex-shrink-0", sizeClass, `mood-${mood}`]}>
  <img
    src="/mascots/kettlebell-coach.png"
    alt="Kettlebell Coach"
    class="mascot-img w-full h-full object-contain drop-shadow-[3px_3px_0_#241812]"
    loading="lazy"
  />
</div>
{#if label}
  <div class="sans text-[11px] leading-tight text-ink-soft bg-white border-2 border-ink rounded-xl px-3 py-2 shadow-brut-sm max-w-[190px]">
    {label}
  </div>
{/if}
</div>

<style>
  .mascot-img {
    transform-origin: 50% 78%;
  }

  .mood-idle .mascot-img {
    animation: coach-idle 3.6s ease-in-out infinite;
  }

  .mood-wave .mascot-img {
    animation: coach-wave 2.4s ease-in-out infinite;
  }

  .mood-think .mascot-img {
    animation: coach-think 2.8s ease-in-out infinite;
  }

  .mood-celebrate .mascot-img {
    animation: coach-celebrate 1.4s ease-in-out infinite;
  }

  .mood-coach .mascot-img {
    animation: coach-pulse 2.1s ease-in-out infinite;
  }

  @keyframes coach-idle {
    0%, 100% { transform: translateY(0) rotate(-1deg); }
    50% { transform: translateY(-3px) rotate(1deg); }
  }

  @keyframes coach-wave {
    0%, 100% { transform: rotate(-5deg) translateY(0); }
    35% { transform: rotate(7deg) translateY(-4px); }
    70% { transform: rotate(-3deg) translateY(0); }
  }

  @keyframes coach-think {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(-4deg) scale(0.98); }
  }

  @keyframes coach-celebrate {
    0%, 100% { transform: translateY(0) rotate(-2deg) scale(1); }
    45% { transform: translateY(-8px) rotate(5deg) scale(1.04); }
  }

  @keyframes coach-pulse {
    0%, 100% { transform: scale(1) rotate(-1deg); }
    50% { transform: scale(1.05) rotate(2deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mascot-img {
      animation: none !important;
    }
  }
</style>
