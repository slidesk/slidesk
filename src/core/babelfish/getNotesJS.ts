import { script } from "../../templates/notes";
import type { SliDeskPlugin } from "../../types";

const getNotesJS = (plugins: SliDeskPlugin[]) => `window.slidesk = {
  io: {},
  timer: document.querySelector("#sd-sv-timer"),
  subtimer: document.querySelector("#sd-sv-subtimer"),
  scrollPosition: 0,
  onSpeakerViewSlideChange: () => {
    window.slidesk.scrollPosition = 0;
    ${plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
  }
};
${script}`;

export default getNotesJS;
