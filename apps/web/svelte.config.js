import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Enables D1/KV/DO bindings + .dev.vars in `pnpm dev`
      // via miniflare's platformProxy.
      platformProxy: {
        configPath: "wrangler.toml",
        persist: true,
      },
    }),
  },
};
