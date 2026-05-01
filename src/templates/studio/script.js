import markdownIt from "markdown-it";
import { prepareHTML, treatTitle } from "../../core/babelfish/treatSlide";

const md = markdownIt({
  html: true,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});
let zoom = 0;
const $previews = document.getElementById("previews");
const $workbench = document.getElementById("workbench");

const addPresentationStyles = async () => {
  const styles = await (await fetch("/api/styles")).json();
  styles.css?.forEach((s) => {
    document.head.innerHTML += s;
  });
};

const makeSlidePreview = (slide) => {
  const art = document.createElement("article");
  art.classList.add("sd-slide");
  const html = md.render(prepareHTML(slide.content).content);
  const { content, classes } = treatTitle(html);
  if (classes) art.classList.add(classes);
  art.dataset.file = slide.file;
  art.dataset.num = slide.num;
  art.dataset.classes = classes;
  art.innerHTML = content;
  art.addEventListener("click", (event) => {
    const el = event.target;
    $workbench.innerHTML = `
      <article
        class="sd-slide ${el.dataset.classes}"
        data-file="${el.dataset.file}"
        data-num="${el.dataset.num}"
        data-classes="${el.dataset.classes}"
        style="zoom: ${zoom - 3}%">
        ${el.innerHTML}
      </article>
    `;
  });
  $previews.append(art);
};

const fetchSlides = async () => {
  const slides = await (await fetch("/api/slides")).json();
  let lastNum = 0;
  let file = "";
  slides.slides.forEach((slide) => {
    if (file === "") file = slide.file;
    if (slide.file === file) lastNum = slide.num;
    makeSlidePreview(slide);
  });
  makeSlidePreview({
    file,
    content: `<div class="studio-add-slide">+</div>`,
    num: lastNum + 1,
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  await addPresentationStyles();
  await fetchSlides();
  zoom = (100 * $workbench.clientWidth) / 1920;
});
