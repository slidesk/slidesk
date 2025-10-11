import { view } from "../../templates/present";
import type { SliDeskConfig, SliDeskFavicon, SliDeskPlugin } from "../../types";

export default (
  config: SliDeskConfig,
  plugins: SliDeskPlugin[],
  favicon: SliDeskFavicon,
  sdfPath: string,
) => {
  let template = String(view);
  const css = [
    '<link rel="stylesheet" href="slidesk.css" />',
    ...config.customIncludes.css,
  ];
  const js = [
    ...config.customIncludes.js,
    '<script src="slidesk.js"></script>',
  ];
  try {
    const globCSS = new Bun.Glob("**/*.css");
    for (const file of globCSS.scanSync(`${sdfPath}templates`)) {
      css.push(`<link href="templates/${file}" rel="stylesheet"/>`);
    }
    for (const file of globCSS.scanSync(`${sdfPath}themes`)) {
      css.push(`<link href="themes/${file}" rel="stylesheet"/>`);
    }
    const globJS = new Bun.Glob("**/*.js");
    for (const file of globCSS.scanSync(`${sdfPath}templates`)) {
      js.push(`<script src="templates/${file}"></script>`);
    }
    for (const file of globJS.scanSync(`${sdfPath}themes`)) {
      js.push(`<script src="themes/${file}"></script>`);
    }
  } catch (_) {}
  plugins.forEach((p, _) => {
    if (p.addStyles) {
      (p.addStyles as string[]).forEach((k: string, _) => {
        css.push(
          `<link href="${k.replace(/plugins\/([^/]+)\//g, `plugins/${p.name}/`)}" rel="stylesheet"/>`,
        );
      });
    }
    if (p.addScripts) {
      (p.addScripts as string[]).forEach((k: string, _) => {
        js.push(
          `<script src="${k.replace(/plugins\/([^/]+)\//g, `plugins/${p.name}/`)}"></script>`,
        );
      });
    }
    if (p.addScriptModules) {
      (p.addScriptModules as string[]).forEach((k: string, _) => {
        js.push(
          `<script src="${k.replace(/plugins\/([^/]+)\//g, `plugins/${p.name}/`)}" type="module"></script>`,
        );
      });
    }
  });
  template = template.replace("#STYLES#", `${css.join("")}${config.customCSS}`);
  template = template.replace("#SCRIPTS#", `${js.join("")}`);
  template = template.replace("#FAVICON#", favicon.name);
  template = template.replace("#FAVICON_TYPE#", favicon.type);
  return template;
};
