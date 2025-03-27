import type { DotenvParseOutput } from "dotenv";
import { script } from "../../templates/notes";
import type { SliDeskPlugin, SliDeskPresentOptions } from "../../types";

export default (
  options: SliDeskPresentOptions,
  plugins: SliDeskPlugin[],
  env: DotenvParseOutput,
) => `window.slidesk = {
  io: {},
  timer: document.querySelector("#sd-sv-timer"),
  subtimer: document.querySelector("#sd-sv-subtimer"),
  scrollPosition: 0,
  cwd: '${process.cwd()}/',
  onSpeakerViewSlideChange: () => {
    window.slidesk.scrollPosition = 0;
    ${plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
  }
};
window.slidesk.io = new WebSocket("ws${
  env?.HTTPS === "true" ? "s" : ""
}://${options.domain}:${options.port}/ws");
${script}`;
