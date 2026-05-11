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

  const sizeClass = $derived(size === "sm" ? "size-sm" : size === "lg" ? "size-lg" : "size-md");
</script>

<div class="flex items-center gap-2.5">
  <div class={["mascot-wrap relative flex items-center justify-center flex-shrink-0", sizeClass, `mood-${mood}`]}>
    <div class="mascot-sprite" role="img" aria-label="Kettlebell Coach"></div>
  </div>
{#if label}
  <div class="sans text-[11px] leading-tight text-ink-soft bg-white border-2 border-ink rounded-xl px-3 py-2 shadow-brut-sm max-w-[190px]">
    {label}
  </div>
{/if}
</div>

<style>
  .mascot-wrap {
    filter: drop-shadow(3px 3px 0 #241812);
  }

  .size-sm {
    width: 3.5rem;
    height: 3.8rem;
  }

  .size-md {
    width: 5rem;
    height: 5.42rem;
  }

  .size-lg {
    width: 7rem;
    height: 7.58rem;
  }

  .mascot-sprite {
    width: 100%;
    height: 100%;
    background-image: url("/mascots/kettlebell-coach-spritesheet.webp");
    background-repeat: no-repeat;
    background-size: 800% 900%;
    image-rendering: auto;
    transform-origin: 50% 78%;
  }

  .mood-idle .mascot-sprite {
    animation: sprite-idle 1.2s steps(6) infinite;
  }

  .mood-wave .mascot-sprite {
    animation: sprite-wave 0.9s steps(4) infinite;
  }

  .mood-think .mascot-sprite {
    animation: sprite-think 1.15s steps(6) infinite;
  }

  .mood-celebrate .mascot-sprite {
    animation: sprite-celebrate 0.85s steps(5) infinite;
  }

  .mood-coach .mascot-sprite {
    animation: sprite-coach 1.2s steps(6) infinite;
  }

  @keyframes sprite-idle {
    from { background-position: 0% 0%; }
    to { background-position: 71.4286% 0%; }
  }

  @keyframes sprite-wave {
    from { background-position: 0% 37.5%; }
    to { background-position: 42.8571% 37.5%; }
  }

  @keyframes sprite-think {
    from { background-position: 0% 100%; }
    to { background-position: 71.4286% 100%; }
  }

  @keyframes sprite-celebrate {
    from { background-position: 0% 50%; }
    to { background-position: 57.1429% 50%; }
  }

  @keyframes sprite-coach {
    from { background-position: 0% 75%; }
    to { background-position: 71.4286% 75%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .mascot-sprite {
      animation: none !important;
    }
  }
</style>
