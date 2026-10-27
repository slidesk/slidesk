import comments from "../../components/comments";
import formatting from "../../components/formatting";
import image from "../../components/image";
import type { SliDeskEnv, SliDeskTemplate } from "../../types";
import { outsideFences, splitOutsideFences } from "../../utils/fences";
import treatSlide from "./treatSlide";

let importCount = 0;

const getPresentation = async (
  sdf: string,
  env: SliDeskEnv,
  components: string[],
  templates: SliDeskTemplate,
  dir = process.cwd(),
) => {
  let fusion = sdf;
  // notes and images; a code block shows them as written
  fusion = outsideFences(fusion, comments);
  fusion = outsideFences(fusion, image);
  // format text
  fusion = formatting(fusion, env);
  // custom components run from the talk, so their process.cwd() paths hold
  // when slidesk is launched from another directory
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    for (const c of components) {
      // a fresh query defeats the module cache, so an edited component is picked up while watching
      // sequential on purpose: each component transforms the previous output
      const { default: comp } = await import(`${c}?v=${++importCount}`); // NOSONAR
      fusion = await comp(fusion); // NOSONAR
    }
  } finally {
    process.chdir(cwd);
  }
  // slice & treatment
  const slides: string[] = [];
  let cpt = 0;
  for (const slide of splitOutsideFences(fusion, "\n## "))
    slides.push(treatSlide(slide, cpt++, templates));
  return slides.join("");
};

export default getPresentation;
