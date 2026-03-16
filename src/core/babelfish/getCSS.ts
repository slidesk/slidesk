import { styles } from "../../templates/present";
import type { SliDeskEnv, SliDeskPresentOptions } from "../../types";

export default (options: SliDeskPresentOptions, env: SliDeskEnv) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${Number(env.ANIMATION_TIMER ?? options.transition ?? 300)}ms; `,
  );
