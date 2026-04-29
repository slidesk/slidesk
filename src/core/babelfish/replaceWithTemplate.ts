import type { SliDeskTemplate } from "../../types";
import parseText from "./parseText";

const replaceWithTemplate = (
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
    .replaceAll("<sd-title />", `<h2>${title}</h2>`)
    .replaceAll("<sd-content />", newContent.replaceAll(/<h2>(.*)<\/h2>/g, ""))
    .replaceAll(/<sd-[^>]+\s*\/>/g, "");
};

export default replaceWithTemplate;
