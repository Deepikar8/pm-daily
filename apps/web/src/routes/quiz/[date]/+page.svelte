<script lang="ts">
  import QuizPage from "../+page.svelte";

  let { data } = $props();
</script>

<QuizPage {data} />

