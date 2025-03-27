import { view } from "../../templates/notes";
import type { SliDeskConfig, SliDeskPlugin } from "../../types";

export default (config: SliDeskConfig, plugins: SliDeskPlugin[]) => {
  let template = view;
  const css = [
    '<link rel="stylesheet" href="slidesk.css" />',
    '<link rel="stylesheet" href="slidesk-notes.css" />',
    ...config.customIncludes.css,
  ];
  const js = ['<script src="slidesk-notes.js"></script>'];
  plugins.forEach((p, _) => {
    if (p.addSpeakerStyles) {
      (p.addSpeakerStyles as string[]).forEach((k: string, _) =>
        css.push(`<link href="${k}" rel="stylesheet" />`),
      );
    }

    if (p.addSpeakerScripts) {
      (p.addSpeakerScripts as string[]).forEach((k: string, _) =>
        js.push(`<script src="${k}"></script>`),
      );
    }
  });
  template = template.replace("#STYLES#", `${css.join("")}${config.customCSS}`);
  template = template.replace("#SCRIPTS#", `${js.join("")}`);
  return template;
};
