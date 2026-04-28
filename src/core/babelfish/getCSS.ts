import { styles } from "../../templates/present";

export default (env: Record<string, unknown | Record<string, unknown>>) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${Number((env.slidesk as Record<string, unknown>)?.TRANSITION ?? 300)}ms; `,
  );
