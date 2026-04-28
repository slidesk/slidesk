import { script } from "../../templates/present";
import type { SliDeskPlugin } from "../../types";

export default (
  plugins: SliDeskPlugin[],
  env: Record<string, unknown | Record<string, unknown>>,
) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number((env.slidesk as Record<string, unknown>)?.TRANSITION ?? 300)},
  onSlideChange: () => {${plugins.map((p) => p.onSlideChange ?? "").join(";")}},
  env: ${JSON.stringify(env)},
  lastAction: "",
  domain: "${(env.slidesk as Record<string, unknown>)?.DOMAIN ?? "localhost"}"
};
${script}`;
