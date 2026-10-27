import comments from "../../components/comments";
import formatting from "../../components/formatting";
import image from "../../components/image";
import type { SliDeskEnv, SliDeskTemplate } from "../../types";
import treatSlide from "./treatSlide";

let importCount = 0;

const getPresentation = async (
  sdf: string,
  env: SliDeskEnv,
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
    // a fresh query defeats the module cache, so an edited component is picked up while watching
    // sequential on purpose: each component transforms the previous output
    const { default: comp } = await import(`${c}?v=${++importCount}`); // NOSONAR
    fusion = await comp(fusion); // NOSONAR
  }
  // slice & treatment
  const slides: string[] = [];
  let cpt = 0;
  for (const slide of fusion.split("\n## "))
    slides.push(treatSlide(slide, cpt++, templates));
  return slides.join("");
};

export default getPresentation;
