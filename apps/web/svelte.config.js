import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Wrap adapter-cloudflare so we can post-process `_worker.js` to also
 * re-export the QuizSession Durable Object class AND synthesize a
 * `scheduled(event, env, ctx)` export for the cron trigger declared in
 * `wrangler.toml`. The default adapter template only re-exports
 * `default` (the fetch handler); Cloudflare looks up DO classes by name
 * on the same module, and invokes `scheduled` on it for cron events.
 */
function patchWorkerForDO(baseAdapter) {
  return {
    ...baseAdapter,
    name: "adapter-cloudflare-with-do",
    async adapt(builder) {
      await baseAdapter.adapt(builder);
      const out = ".svelte-kit/cloudflare/_worker.js";
      try {
        let src = readFileSync(out, "utf8");
        if (!src.includes("QuizSession") || !src.includes("scheduled:")) {
          // hooks.server.js (relative to _worker.js) re-exports both
          // QuizSession and runCron and is bundled into output/server.
          const importLine = `import { QuizSession, runCron } from "./../output/server/entries/hooks.server.js";\n`;
          src = importLine + src;
          // Replace the default-only export with one that also names
          // QuizSession (for DO lookup) and a wrapped default object that
          // exposes both `fetch` (delegating to the SvelteKit handler) and
          // `scheduled` (delegating to runCron via ctx.waitUntil).
          src = src.replace(
            /export\s*\{\s*worker_default as default\s*\}/,
            `const patched_default = {
  fetch: (request, env, ctx) => worker_default.fetch(request, env, ctx),
  scheduled: (event, env, ctx) => ctx.waitUntil(runCron(event, env)),
};
export { patched_default as default, QuizSession }`,
          );
          writeFileSync(out, src);
          console.log(
            "[adapter-cloudflare-with-do] patched _worker.js to re-export QuizSession and add scheduled handler",
          );
        }
      } catch (e) {
        // If the file isn't where we expect or we can't patch, fail loudly so
        // it's caught in CI; production needs both the DO export and the
        // scheduled handler to be wired up.
        console.error("[adapter-cloudflare-with-do] failed to patch _worker.js", e);
        throw e;
      }
    },
  };
}

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: patchWorkerForDO(
      adapter({
        // Enables D1/KV/DO bindings + .dev.vars in `pnpm dev`
        // via miniflare's platformProxy.
        platformProxy: {
          configPath: "wrangler.toml",
          persist: true,
        },
      }),
    ),
  },
};
