import { script } from "../../templates/present";
import type { SliDeskEnv, SliDeskPlugin } from "../../types";

// what only the server reads: slidesk.js is served to every viewer, and exported
const PRIVATE = ["PASSPHRASE", "KEY", "CERT"];

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

const getJS = (plugins: SliDeskPlugin[], env: SliDeskEnv) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number(env.slidesk?.TRANSITION ?? 300)},
  onSlideChange: () => {${plugins.map((p) => p.onSlideChange ?? "").join(";")}},
  env: ${JSON.stringify(publicEnv(env))},
  lastAction: "",
  domain: "${env.slidesk?.DOMAIN ?? "localhost"}",
  deployed: ${env.slidesk?.deployed ? "true" : "false"}
};
${script}`;

export default getJS;
