import { existsSync } from "node:fs";
import { view } from "../../templates/present";
import type { SliDeskConfig, SliDeskFavicon, SliDeskPlugin } from "../../types";
import { inTheme } from "../../utils/themes";

const getCSS = (config: SliDeskConfig, sdfPath: string, theme?: string) => {
  const css = ['<link rel="stylesheet" href="slidesk.css" />', ...config.css];
  const globCSS = new Bun.Glob("**/*.css");
  if (existsSync(`${sdfPath}/templates`)) {
    for (const file of globCSS.scanSync(`${sdfPath}/templates`)) {
      css.push(`<link href="templates/${file}" rel="stylesheet"/>`);
    }
  }
  if (existsSync(`${sdfPath}/themes`)) {
    for (const file of globCSS.scanSync(`${sdfPath}/themes`)) {
      if (!file.includes("/plugins/") && inTheme(file, theme))
        css.push(`<link href="themes/${file}" rel="stylesheet"/>`);
    }
  }
  return css;
};

const getJS = (config: SliDeskConfig, sdfPath: string, theme?: string) => {
  const js = [...config.js, '<script src="slidesk.js"></script>'];
  const globJS = new Bun.Glob("**/*.js");
  if (existsSync(`${sdfPath}/templates`)) {
    for (const file of globJS.scanSync(`${sdfPath}/templates`)) {
      js.push(`<script src="templates/${file}"></script>`);
    }
  }
  if (existsSync(`${sdfPath}/themes`)) {
    for (const file of globJS.scanSync(`${sdfPath}/themes`)) {
      if (!file.includes("/plugins/") && inTheme(file, theme))
        js.push(`<script src="themes/${file}"></script>`);
    }
  }
  return js;
};

/**
 * The URL of a plugin file: `plugins/<name>/` as the plugin is installed,
 * under its theme when it comes from one.
 */
export const pluginUrl = (p: SliDeskPlugin, file: string) =>
  `${p.theme ?? ""}${file.replaceAll(/plugins\/([^/]+)\//g, `plugins/${p.name}/`)}`;

const prepareTPL = (
  config: SliDeskConfig,
  plugins: SliDeskPlugin[],
  favicon: SliDeskFavicon,
  sdfPath: string,
  theme?: string,
) => {
  let template = view;
  const css = getCSS(config, sdfPath, theme);
  const js = getJS(config, sdfPath, theme);
  plugins.forEach((p, _) => {
    if (p.addStyles) {
      p.addStyles.forEach((k) => {
        css.push(`<link href="${pluginUrl(p, k)}" rel="stylesheet"/>`);
      });
    }
    if (p.addScripts) {
      p.addScripts.forEach((k) => {
        js.push(`<script src="${pluginUrl(p, k)}"></script>`);
      });
    }
    if (p.addScriptModules) {
      p.addScriptModules.forEach((k) => {
        js.push(`<script src="${pluginUrl(p, k)}" type="module"></script>`);
      });
    }
  });
  template = template.replace("#STYLES#", () => css.join(""));
  template = template.replace("#SCRIPTS#", () => js.join(""));
  template = template.replace("#FAVICON#", () => favicon.name);
  template = template.replace("#FAVICON_TYPE#", () => favicon.type);
  return template;
};

export default prepareTPL;
