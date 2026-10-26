import { script } from "../../templates/present";
import type { SliDeskEnv, SliDeskPlugin } from "../../types";

const getJS = (plugins: SliDeskPlugin[], env: SliDeskEnv) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number(env.slidesk?.TRANSITION ?? 300)},
  onSlideChange: () => {${plugins.map((p) => p.onSlideChange ?? "").join(";")}},
  env: ${JSON.stringify(env)},
  lastAction: "",
  domain: "${env.slidesk?.DOMAIN ?? "localhost"}",
  deployed: ${env.slidesk?.deployed ? "true" : "false"}
};
${script}`;

export default getJS;
