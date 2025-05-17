import type { DotenvParseOutput } from "dotenv";
import { styles } from "../../templates/present";
import type { SliDeskPresentOptions } from "../../types";

export default (options: SliDeskPresentOptions, env: DotenvParseOutput) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${Number(env.ANIMATION_TIMER ?? options.transition ?? 300)}ms; `,
  );
