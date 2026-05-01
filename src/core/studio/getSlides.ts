import { globSync } from "node:fs";
import comments from "../../components/comments";
import image from "../../components/image";
import formatting from "../../components/formatting";

const getSlides = async (
  talkdir: string,
  env: Record<string, unknown>,
  components: string[],
) => {
  const files = globSync(["md", "sdf"].map((ext) => `${talkdir}/**/*.${ext}`))
    .sort((a, b) => a.localeCompare(b))
    .filter((n) => !n.toLowerCase().includes("/readme.md"));
  const res: { file: string; content: string; num: number }[] = [];
  for (const file of files) {
    const content = await Bun.file(file).text();
    let num = 0;
    const slides = content.split("## ").filter((s) => s.trim() !== "");
    for (const text of slides) {
      let fusion = text;
      fusion = comments(fusion);
      fusion = image(fusion).replace("data-src=", "src=");
      fusion = formatting(fusion, env);
      for (const c of components) {
        const { default: comp } = await import(c);
        fusion = await comp(fusion);
      }
      res.push({ file, content: `## ${fusion}`, num });
      num++;
    }
  }
  return res;
};

export default getSlides;
