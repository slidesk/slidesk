import layoutHTML from "./layout.html" with { type: "text" };
import scriptJS from "./script.js" with { type: "text" };
import stylesCSS from "./styles.css" with { type: "text" };

export const view = layoutHTML;
export const script = scriptJS;
export const styles = stylesCSS;
