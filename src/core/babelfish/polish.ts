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
  if (slideskEnv.TITLE) tpl = tpl.replace("#TITLE#", slideskEnv.TITLE);
  else
    [...presentation.matchAll(/<h1>(.*)<\/h1>/g)].forEach((title, _) => {
      tpl = tpl.replace("#TITLE#", title[1]);
    });
  tpl = tpl.replace("#TITLE#", "SliDesk");
  tpl = tpl.replace("#SECTIONS#", presentation);

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
