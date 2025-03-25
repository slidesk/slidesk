import markdownIt from "markdown-it";
import slugify from "../../utils/slugify";
import toBinary from "../../utils/toBinary";
import type {
  SliDeskPlugin,
  SliDeskPresentOptions,
  SliDeskTemplate,
} from "../../types";
import replaceWithTemplate from "./replaceWithTemplate";

const md = markdownIt({
  html: true,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});

export default async (
  slide: string,
  cptSlide: number,
  options: SliDeskPresentOptions,
  templates: SliDeskTemplate,
  plugins: SliDeskPlugin[],
) => {
  if (slide.trim() === "") return "";
  let classes = "";
  let slug = "";
  let timerSlide = "";
  let timerCheckpoint = "";
  let content = md
    .render(
      `## ${slide
        .replace(/\\r/g, "")
        .split("\n")
        .map((p) => {
          if (p.trimStart().startsWith("//@")) {
            const timer = p.replace("//@", "").replaceAll(" ", "");
            if (timer.startsWith("[]")) timerSlide = timer.replace("[]", "");
            if (timer.startsWith("<")) timerCheckpoint = timer.replace("<", "");
            return "";
          }
          if (p.trimStart().startsWith("//")) {
            return "";
          }
          return p;
        })
        .join("\n")}`.replace("## #", "#"),
    )
    .toString()
    .replace("<h2> </h2>", "");
  const slideTitle = content.match("<h2>(.*)</h2>");
  if (slideTitle?.length) {
    const spl = slideTitle[1].toString().split(".[");
    if (spl.length !== 1) {
      classes = spl[1].replace("]", "").trim();
    }
    if (spl[0].trim() !== "") {
      slug = slugify(spl[0]);
    }
    // # in classes means template
    const tpl = (classes.split(" ").filter((c) => c.startsWith("#"))[0] ?? "")
      .replace(/.sdt$/g, "")
      .replace(/^#/g, "");
    if (tpl && templates[tpl])
      content = replaceWithTemplate(tpl, content, spl[0], templates);
    else content = content.replace(slideTitle[0], `<h2>${spl[0]}</h2>`);
  }
  const slideSlug = `!slide-${cptSlide}`;
  const datas = {
    num: cptSlide,
    slug: slug || slideSlug,
    source: "",
    "timer-slide": "",
    "timer-checkpoint": "",
  };
  if (plugins.filter((p) => p.name === "source").length)
    datas.source = toBinary(slide);
  if (options.timers) {
    if (timerSlide !== "") datas["timer-slide"] = timerSlide;
    if (timerCheckpoint !== "") datas["timer-checkpoint"] = timerCheckpoint;
  }
  const dataset: string[] = [];
  Object.entries(datas).forEach(([key, val], _) => {
    if (val !== "") dataset.push(`data-${key}="${val}"`);
  });
  return `<section class="sd-slide ${classes
    .split(" ")
    .filter((c) => !c.startsWith("#"))
    .join(" ")}" ${dataset.join(" ")}>${content}</section>`;
};
