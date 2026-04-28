import { script } from "../../templates/present";
import type { SliDeskPlugin } from "../../types";

export default (plugins: SliDeskPlugin[], env: object) => `window.slidesk = {
  currentSlide: 0,
  slides: [],
  animationTimer: ${Number(env.slidesk?.TRANSITION ?? 300)},
  onSlideChange: () => {${plugins.map((p) => p.onSlideChange ?? "").join(";")}},
  env: ${JSON.stringify(env)},
  lastAction: "",
  domain: "${env.slidesk?.DOMAIN ?? "localhost"}"
};
if (window.location.origin !== "file://")
  window.slidesk.io = new WebSocket(\`ws\${window.location.protocol.includes('https') ? "s" : ""}://\${window.location.host}\${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)}ws\`);
${script}`;
