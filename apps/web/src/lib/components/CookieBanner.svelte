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
        analytics: { enabled: true },
      },
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookies",
              description: "We use required cookies for sign-in and PostHog analytics to understand product usage.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Necessary only",
              showPreferencesBtn: "Manage",
            },
            preferencesModal: {
              title: "Preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Necessary only",
              savePreferencesBtn: "Save choices",
              sections: [
                {
                  title: "Necessary",
                  description: "Required for sign-in. Cannot be disabled.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics",
                  description: "PostHog helps us understand page views, quiz starts, answer submits, and shares so we can improve Product Gym.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
    });
  });
</script>
