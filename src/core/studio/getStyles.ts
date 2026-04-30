import { existsSync } from "node:fs";
import type { SliDeskConfig, SliDeskPlugin } from "../../types";

const getStyles = async (
  config: SliDeskConfig,
  plugins: SliDeskPlugin[],
  sdfPath: string,
) => {
  const css = ['<link rel="stylesheet" href="slidesk.css" />', ...config.css];
  const globCSS = new Bun.Glob("**/*.css");
  plugins.forEach((p, _) => {
    const pname = `plugins/${p.name}/`;
    if (p.addStyles) {
      (p.addStyles as string[]).forEach((k: string, _) => {
        css.push(
          `<link href="${p.theme}${k.replaceAll(/plugins\/([^/]+)\//g, pname)}" rel="stylesheet"/>`,
        );
      });
    }
  });
  if (existsSync(`${sdfPath}/templates`)) {
    for (const file of globCSS.scanSync(`${sdfPath}/templates`)) {
      css.push(`<link href="templates/${file}" rel="stylesheet"/>`);
    }
  }
  if (existsSync(`${sdfPath}/themes`)) {
    for (const file of globCSS.scanSync(`${sdfPath}/themes`)) {
      if (!file.includes("/plugins/"))
        css.push(`<link href="themes/${file}" rel="stylesheet"/>`);
    }
  }
  return css;
};

export default getStyles;
