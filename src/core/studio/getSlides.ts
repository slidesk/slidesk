import { globSync } from "node:fs";
import comments from "../../components/comments";
import image from "../../components/image";
import formatting from "../../components/formatting";
import type { SliDeskStudioSlide, SliDeskTemplate } from "../../types";
import MarkdownIt from "markdown-it";
import { prepareHTML, treatTitle } from "../babelfish/treatSlide";

const getSlides = async (
  talkdir: string,
  env: Record<string, unknown>,
  templates: SliDeskTemplate,
) => {
  const md = MarkdownIt({
    html: true,
    xhtmlOut: true,
    linkify: true,
    typographer: true,
  });

  const files = globSync(["md", "sdf"].map((ext) => `${talkdir}/**/*.${ext}`))
    .sort((a, b) => a.localeCompare(b))
    .filter((n) => !n.toLowerCase().includes("/readme.md"));
  const res: SliDeskStudioSlide[] = [];
  for (const file of files) {
    const original = await Bun.file(file).text();
    let num = 0;
    const slides = original.split("## ").filter((s) => s.trim() !== "");
    for (const text of slides) {
      let fusion = text;
      fusion = comments(fusion);
      fusion = image(fusion).replace("data-src=", "src=");
      fusion = formatting(fusion, env);
      const html = md.render(prepareHTML(fusion).content);
      const { content, classes } = treatTitle(html, templates);
      res.push({
        file: file.replace(process.cwd(), ""),
        original: `## ${text}`,
        content: content.replace("<h2></h2>", ""),
        num,
        classes: classes
          .split(" ")
          .filter((c) => !c.startsWith("#"))
          .join(" "),
      });
      num++;
    }
  }
  return res;
};

export default getSlides;
