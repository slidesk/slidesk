import { styles } from "../../templates/present";
import type { SliDeskEnv } from "../../types";

const getCSS = (env: SliDeskEnv) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${Number(env.slidesk?.TRANSITION ?? 300)}ms; `,
  );

export default getCSS;
