import { existsSync } from "node:fs";
import { view } from "../../templates/notes";
import type { SliDeskConfig, SliDeskPlugin } from "../../types";

const getNotesView = (
  config: SliDeskConfig,
  plugins: SliDeskPlugin[],
  sdfPath: string,
) => {
  let template = view;
  const globCSS = new Bun.Glob("**/*.css");
  const css = [
    '<link rel="stylesheet" href="slidesk.css" />',
    '<link rel="stylesheet" href="slidesk-notes.css" />',
    ...config.css,
  ];
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
  const js = ['<script src="slidesk-notes.js"></script>'];
  plugins.forEach((p, _) => {
    if (p.addSpeakerStyles) {
      (p.addSpeakerStyles as string[]).forEach((k: string, _) => {
        css.push(`<link href="${k}" rel="stylesheet" />`);
      });
    }

    if (p.addSpeakerScripts) {
      (p.addSpeakerScripts as string[]).forEach((k: string, _) => {
        js.push(`<script src="${k}"></script>`);
      });
    }
  });
  template = template.replace("#STYLES#", `${css.join("")}`);
  template = template.replace("#SCRIPTS#", `${js.join("")}`);
  return template;
};

export default getNotesView;
