import type { DotenvParseOutput } from "dotenv";
import { minify } from "html-minifier-terser";
import type { SliDeskPlugin } from "../../types";

export default async (
  presentation: string,
  template: string,
  env: DotenvParseOutput,
  plugins: SliDeskPlugin[],
) => {
  let tpl = template;
  if (env.TITLE) tpl = tpl.replace("#TITLE#", env.TITLE.toString());
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
        p.addHTMLFromFiles
          ? Object.keys(p.addHTMLFromFiles)
              .map((k) => (p.addHTMLFromFiles as { [key: string]: string })[k])
              .join("")
          : "",
      )
      .join("")}</body>`,
  );
};
