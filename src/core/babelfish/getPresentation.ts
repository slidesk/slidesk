import type { DotenvParseOutput } from "dotenv";
import comments from "../../components/comments";
import formatting from "../../components/formatting";
import image from "../../components/image";
import treatSlide from "./treatSlide";
import type {
  SliDeskPlugin,
  SliDeskPresentOptions,
  SliDeskTemplate,
} from "../../types";

export default async (
  sdf: string,
  options: SliDeskPresentOptions,
  env: DotenvParseOutput,
  components: string[],
  templates: SliDeskTemplate,
  plugins: SliDeskPlugin[],
) => {
  let fusion = sdf;
  // comments
  fusion = comments(fusion);
  // image
  fusion = image(fusion);
  // format text
  fusion = formatting(fusion, env);
  // custom components
  for await (const c of components) {
    const { default: comp } = await import(c);
    fusion = await comp(fusion);
  }
  // slice & treatment
  const slides: string[] = [];
  let cpt = 0;
  for await (const slide of [...fusion.split("\n## ")])
    slides.push(await treatSlide(slide, cpt++, options, templates, plugins));
  return slides.join("");
};
