<script lang="ts">
  let { size = "md" }: { size?: "sm" | "md" | "lg" } = $props();

  const sizeClass = $derived(
    size === "sm" ? "w-14 h-14" : size === "lg" ? "w-28 h-28" : "w-20 h-20",
  );
</script>

<div class={["relative flex items-center justify-center flex-shrink-0", sizeClass]}>
  <img
    src="/mascots/kettlebell-coach.png"
    alt="Kettlebell Coach"
    class="w-full h-full object-contain drop-shadow-[3px_3px_0_#241812]"
    loading="lazy"
  />
</div>
