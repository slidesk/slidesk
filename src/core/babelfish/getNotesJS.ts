import { script } from "../../templates/notes";
import type { SliDeskPlugin } from "../../types";

const getNotesJS = (plugins: SliDeskPlugin[]) => `window.slidesk = {
  io: {},
  timer: document.querySelector("#sd-sv-timer"),
  subtimer: document.querySelector("#sd-sv-subtimer"),
  onSpeakerViewSlideChange: () => {
    ${plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
  }
};
${script}`;

export default getNotesJS;
