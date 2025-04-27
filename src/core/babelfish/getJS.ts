import type { DotenvParseOutput } from "dotenv";
import { script } from "../../templates/present";
import type { SliDeskPlugin, SliDeskPresentOptions } from "../../types";

export default (
  options: SliDeskPresentOptions,
  plugins: SliDeskPlugin[],
  env: DotenvParseOutput,
) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number(options.transition)},
  onSlideChange: () => {${plugins.map((p) => p.onSlideChange ?? "").join(";")}},
  env: ${JSON.stringify(env)},
  lastAction: "",
  domain: "${options.domain}"
};
${
  !options.save
    ? `window.slidesk.io = new WebSocket(\`ws\${window.location.protocol.includes('https') ? "s" : ""}://\${window.location.host}\${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)}ws\`);`
    : "window.slidesk.save = true;"
}
${script}`;
