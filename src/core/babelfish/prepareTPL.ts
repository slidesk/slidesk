import { view } from "../../templates/present";
import type { SliDeskPlugin, SliDeskConfig, SliDeskFavicon } from "../../types";

export default (
  config: SliDeskConfig,
  plugins: SliDeskPlugin[],
  favicon: SliDeskFavicon,
) => {
  let template = view;
  const css = [
    '<link rel="stylesheet" href="slidesk.css" />',
    ...config.customIncludes.css,
  ];
  const js = [
    ...config.customIncludes.js,
    '<script src="slidesk.js"></script>',
  ];
  plugins.forEach((p, _) => {
    if (p.addStyles) {
      (p.addStyles as string[]).forEach((k: string, _) =>
        css.push(`<link href="${k}" rel="stylesheet"/>`),
      );
    }
    if (p.addScripts) {
      (p.addScripts as string[]).forEach((k: string, _) =>
        js.push(
          `<script src="${k}" ${p.loadAsModule ? 'type="module"' : ""}></script>`,
        ),
      );
    }
  });
  template = template.replace("#STYLES#", `${css.join("")}${config.customCSS}`);
  template = template.replace("#SCRIPTS#", `${js.join("")}`);
  template = template.replace("#FAVICON#", favicon.name);
  template = template.replace("#FAVICON_TYPE#", favicon.type);
  return template;
};
