import { script } from "../../templates/present";
import type { SliDeskEnv, SliDeskPlugin } from "../../types";

// what only the server reads: slidesk.js is served to every viewer, and exported
export const PRIVATE = ["PASSPHRASE", "KEY", "CERT"];

/** The configuration of the talk as the pages see it, without what the server keeps. */
const publicEnv = (env: SliDeskEnv) =>
  env.slidesk
    ? {
        ...env,
        slidesk: Object.fromEntries(
          Object.entries(env.slidesk).filter(([k]) => !PRIVATE.includes(k)),
        ),
      }
    : env;

/**
 * The plugins' code for one hook, each in its own try: a plugin that throws
 * does not stop the next ones, nor the page load that runs the first change.
 */
export const pluginHooks = (
  plugins: SliDeskPlugin[],
  hook: "onSlideChange" | "onSpeakerViewSlideChange",
) =>
  plugins
    .filter((p) => p[hook])
    .map(
      (p) =>
        `try { ${p[hook]} } catch (e) { console.error(${JSON.stringify(`plugin ${p.name}:`)}, e); }`,
    )
    .join("\n");

const getJS = (
  plugins: SliDeskPlugin[],
  env: SliDeskEnv,
  lang?: string,
) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number(env.slidesk?.TRANSITION ?? 300)},
  onSlideChange: () => {
${pluginHooks(plugins, "onSlideChange")}
  },
  env: ${JSON.stringify(publicEnv(env))},
  lang: ${JSON.stringify(lang ?? null)},
  lastAction: "",
  domain: "${env.slidesk?.DOMAIN ?? "localhost"}",
  deployed: ${env.slidesk?.deployed ? "true" : "false"}
};
${script}`;

export default getJS;
