import { styles } from "../../templates/present";
import type { SliDeskPresentOptions } from "../../types";

export default (options: SliDeskPresentOptions) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${options.transition}ms; `,
  );
