import comments from "../../components/comments";
import formatting from "../../components/formatting";
import image from "../../components/image";
import type { SliDeskTemplate } from "../../types";
import treatSlide from "./treatSlide";

const getPresentation = async (
  sdf: string,
  env: Record<string, unknown>,
  components: string[],
  templates: SliDeskTemplate,
) => {
  let fusion = sdf;
  // comments
  fusion = comments(fusion);
  // image
  fusion = image(fusion);
  // format text
  fusion = formatting(fusion, env);
  // custom components
  for (const c of components) {
    const { default: comp } = await import(c);
    fusion = await comp(fusion);
  }
  // slice & treatment
  const slides: string[] = [];
  let cpt = 0;
  for (const slide of fusion.split("\n## "))
    slides.push(await treatSlide(slide, cpt++, templates));
  return slides.join("");
};

export default getPresentation;
