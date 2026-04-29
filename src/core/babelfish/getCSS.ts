import { styles } from "../../templates/present";

const getCSS = (env: Record<string, unknown>) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${Number((env.slidesk as Record<string, unknown>)?.TRANSITION ?? 300)}ms; `,
  );

export default getCSS;
