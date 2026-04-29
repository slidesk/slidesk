import { existsSync } from "node:fs";
import { view } from "../../templates/present";
import type { SliDeskConfig, SliDeskFavicon, SliDeskPlugin } from "../../types";

const getCSS = (config: SliDeskConfig, sdfPath: string) => {
  const css = ['<link rel="stylesheet" href="slidesk.css" />', ...config.css];
  const globCSS = new Bun.Glob("**/*.css");
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

const getJS = (config: SliDeskConfig, sdfPath: string) => {
  const js = [...config.js, '<script src="slidesk.js"></script>'];
  const globJS = new Bun.Glob("**/*.js");
  if (existsSync(`${sdfPath}/templates`)) {
    for (const file of globJS.scanSync(`${sdfPath}/templates`)) {
      js.push(`<script src="templates/${file}"></script>`);
    }
  }
  if (existsSync(`${sdfPath}/themes`)) {
    for (const file of globJS.scanSync(`${sdfPath}/themes`)) {
      if (!file.includes("/plugins/"))
        js.push(`<script src="themes/${file}"></script>`);
    }
  }
  return js;
};

const prepareTPL = (
  config: SliDeskConfig,
  plugins: SliDeskPlugin[],
  favicon: SliDeskFavicon,
  sdfPath: string,
) => {
  let template = view;
  const css = getCSS(config, sdfPath);
  const js = getJS(config, sdfPath);
  plugins.forEach((p, _) => {
    const pname = `plugins/${p.name}/`;
    if (p.addStyles) {
      (p.addStyles as string[]).forEach((k: string, _) => {
        css.push(
          `<link href="${p.theme}${k.replaceAll(/plugins\/([^/]+)\//g, pname)}" rel="stylesheet"/>`,
        );
      });
    }
    if (p.addScripts) {
      (p.addScripts as string[]).forEach((k: string, _) => {
        js.push(
          `<script src="${p.theme}${k.replaceAll(/plugins\/([^/]+)\//g, pname)}"></script>`,
        );
      });
    }
    if (p.addScriptModules) {
      (p.addScriptModules as string[]).forEach((k: string, _) => {
        js.push(
          `<script src="${p.theme}${k.replaceAll(/plugins\/([^/]+)\//g, pname)}" type="module"></script>`,
        );
      });
    }
  });
  template = template.replace("#STYLES#", `${css.join("")}`);
  template = template.replace("#SCRIPTS#", `${js.join("")}`);
  template = template.replace("#FAVICON#", favicon.name);
  template = template.replace("#FAVICON_TYPE#", favicon.type);
  return template;
};

export default prepareTPL;
