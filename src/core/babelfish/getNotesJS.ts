import { script } from "../../templates/notes";
import type { SliDeskPlugin } from "../../types";
import { pluginHooks } from "./getJS";

const getNotesJS = (plugins: SliDeskPlugin[]) => `window.slidesk = {
  io: {},
  timer: document.querySelector("#sd-sv-timer"),
  subtimer: document.querySelector("#sd-sv-subtimer"),
  onSpeakerViewSlideChange: () => {
${pluginHooks(plugins, "onSpeakerViewSlideChange")}
  }
};
${script}`;

export default getNotesJS;
