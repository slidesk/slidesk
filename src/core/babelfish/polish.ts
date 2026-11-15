import { minify } from "html-minifier-terser";
import type { SliDeskEnv, SliDeskPlugin } from "../../types";

const polish = async (
  presentation: string,
  template: string,
  env: SliDeskEnv,
  plugins: SliDeskPlugin[],
) => {
  let tpl = template;
  const slideskEnv = env.slidesk ?? {};
  const heading = (level: number) =>
    new RegExp(`<h${level}[^>]*>(.*?)</h${level}>`).exec(presentation)?.[1];
  // a talk without "#" (its cover in "##") is named after its first slide
  const title = slideskEnv.TITLE || heading(1) || heading(2);
  // replacements are functions: a "$$" or "$&" in the talk is kept as written
  tpl = tpl.replace("#TITLE#", () =>
    // the tab shows the text of the heading, not its formatting
    title ? title.replaceAll(/<[^>]*>/g, "") : "SliDesk",
  );
  tpl = tpl.replace("#SECTIONS#", () => presentation);

  tpl = await minify(tpl, {
    collapseWhitespace: true,
    removeEmptyElements: false,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    removeAttributeQuotes: true,
  });
  return tpl.replace(
    "</body>",
    () =>
      `${plugins.map((p) => p.addHTML ?? "").join("")}${plugins
        .map((p) =>
          p.addHTMLFromFiles && !Array.isArray(p.addHTMLFromFiles)
            ? Object.values(p.addHTMLFromFiles).join("")
            : "",
        )
        .join("")}</body>`,
  );
};

export default polish;
