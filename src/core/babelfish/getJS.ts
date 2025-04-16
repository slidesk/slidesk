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
  animationTimer: ${options.transition},
  onSlideChange: function() {${plugins
    .map((p) => p.onSlideChange ?? "")
    .join(";")}},
  env: ${JSON.stringify(env)},
  cwd: '${process.cwd()}/',
  lastAction: "",
  domain: "${options.domain}"
};
${
  !options.save
    ? `window.slidesk.io = new WebSocket(\`ws\${window.location.protocol.includes('https') ? "s" : ""}://\${window.location.host}/ws\`);`
    : "window.slidesk.save = true;"
}
${script}`;
