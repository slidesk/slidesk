import type { SliDeskTemplate } from "../../types";
import parseText from "./parseText";

export default (
  tpl: string,
  content: string,
  title: string,
  templates: SliDeskTemplate,
) => {
  let text = templates[tpl];
  let newContent = content;
  const blocs = parseText(content);
  Object.keys(blocs).forEach((key, _) => {
    text = text.replace(`<sd-${key} />`, blocs[key]);
    newContent = newContent.replace(
      `<p>[[${key}]]</p>${blocs[key]}<p>[[/${key}]]</p>`,
      "",
    );
  });
  return text
    .replace(/<sd\-title \/>/g, `<h2>${title}</h2>`)
    .replace(/<sd\-content \/>/g, newContent.replace(/<h2>(.*)<\/h2>/g, ""));
};
