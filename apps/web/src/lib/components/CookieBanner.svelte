<script lang="ts">
  import { onMount } from "svelte";

  onMount(async () => {
    const cc = await import("vanilla-cookieconsent");
    // Inject the library's CSS once
    if (typeof document !== "undefined" && !document.getElementById("cc-css")) {
      const link = document.createElement("link");
      link.id = "cc-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@v3.1.0/dist/cookieconsent.css";
      document.head.appendChild(link);
    }
    cc.run({
      categories: {
        necessary: { readOnly: true, enabled: true },
      },
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookies",
              description: "We use a cookie to keep you signed in. Nothing else.",
              acceptAllBtn: "Got it",
            },
            preferencesModal: {
              title: "Preferences",
              acceptAllBtn: "OK",
              sections: [
                {
                  title: "Necessary",
                  description: "Required for sign-in. Cannot be disabled.",
                  linkedCategory: "necessary",
                },
              ],
            },
          },
        },
      },
    });
  });
</script>
