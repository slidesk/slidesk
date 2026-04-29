import { script } from "../../templates/present";
import type { SliDeskPlugin } from "../../types";

const getJS = (
  plugins: SliDeskPlugin[],
  env: Record<string, unknown>,
) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number(((env.slidesk as Record<string, unknown>)?.TRANSITION as string) ?? 300)},
  onSlideChange: () => {${plugins.map((p) => p.onSlideChange ?? "").join(";")}},
  env: ${JSON.stringify(env)},
  lastAction: "",
  domain: "${((env.slidesk as Record<string, unknown>)?.DOMAIN as string) ?? "localhost"}",
  deployed: ${((env.slidesk as Record<string, unknown>)?.deployed as boolean) ? "true" : "false"}
};
${script}`;

export default getJS;
