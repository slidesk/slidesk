import { script } from "../../templates/notes";
import type { SliDeskPlugin } from "../../types";

export default (plugins: SliDeskPlugin[]) => `window.slidesk = {
  io: {},
  timer: document.querySelector("#sd-sv-timer"),
  subtimer: document.querySelector("#sd-sv-subtimer"),
  scrollPosition: 0,
  onSpeakerViewSlideChange: () => {
    window.slidesk.scrollPosition = 0;
    ${plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
  }
};
window.slidesk.io = new WebSocket(\`ws\${window.location.protocol.includes('https') ? "s" : ""}://\${window.location.host}\${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)}ws\`);
${script}`;
