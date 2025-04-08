import mainSDF from "./main.sdf" with { type: "text" };
import assetsThemeCSS from "./assets/theme.css" with { type: "text" };
import templatesSplit from "./templates/split.sdt" with { type: "text" };
import slidesSpeaker from "./slides/01-speaker.sdf" with { type: "text" };
import slidesChapter from "./slides/02-first-chapter.sdf" with { type: "text" };
import slidesSplitted from "./slides/03-splitted.sdf" with { type: "text" };
import slidesCode from "./slides/04-code.sdf" with { type: "text" };
import slidesSteps from "./slides/05-steps.sdf" with { type: "text" };

const files = {
  "main.sdf": mainSDF,
  "assets/theme.css": assetsThemeCSS,
  "templates/split.sdt": templatesSplit,
  "slides/01-speaker.sdf": slidesSpeaker,
  "slides/02-first-chapter.sdf": slidesChapter,
  "slides/03-splitted.sdf": slidesSplitted,
  "slides/04-code.sdf": slidesCode,
  "slides/05-steps.sdf": slidesSteps,
} as { [key: string]: string };

export default files;
