import mainSDF from "./main.md" with { type: "text" };
import slidesSpeaker from "./slides/01-speaker.md" with { type: "text" };
import slidesChapter from "./slides/02-first-chapter.md" with { type: "text" };
import slidesSplitted from "./slides/03-splitted.md" with { type: "text" };
import slidesCode from "./slides/04-code.md" with { type: "text" };
import slidesSteps from "./slides/05-steps.md" with { type: "text" };
import assetsThemeCSS from "./themes/default/theme.css" with { type: "text" };

const files = {
  "main.md": mainSDF,
  "themes/default/theme.css": assetsThemeCSS,
  "slides/01-speaker.md": slidesSpeaker,
  "slides/02-first-chapter.md": slidesChapter,
  "slides/03-splitted.md": slidesSplitted,
  "slides/04-code.md": slidesCode,
  "slides/05-steps.md": slidesSteps,
} as { [key: string]: string };

export default files;
