import { styles } from "../../templates/present";

export default (env: object) =>
  styles.replace(
    ":root {",
    `:root { --animationTimer: ${Number(env.slidesk?.TRANSITION ?? 300)}ms; `,
  );
