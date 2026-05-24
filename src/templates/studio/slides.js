import { $previews, $workbench, $classes, zoom, EDITABLE_SELECTORS } from "./script.js";
import { serializeSlide } from "./editor.js";
import { decodeComments } from "./comments.js";
import { makeDraggable, makeResizable, makeRemovable } from "./actions.js";

export const saveCurrentSlide = async () => {
  const $notesTextarea = document.getElementById("speaker-notes");
  const $slide = $workbench.querySelector("article.sd-slide");
  [...$slide.querySelectorAll(
    ".studio-drag-handle, .studio-resize-handle, .studio-remove-handle",
  )].forEach((e) => e.remove());
  const html = $slide.innerHTML.replace(/>\s+</g, "><").trim();
  const content = serializeSlide(html, $classes.value, $notesTextarea?.value || "");
  await fetch("/api/slide/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: $slide.dataset.file,
      classes: $slide.dataset.classes,
      num: $slide.dataset.num,
      content,
    }),
  });
  await fetchSlides();
  const next = [...$previews.querySelectorAll("article")].find(
    (a) =>
      a.dataset.file === $slide.dataset.file &&
      a.dataset.num === $slide.dataset.num,
  );
  setTimeout(() => next?.click(), 10);
};

const loadSlide = (art) => {
  $previews.querySelectorAll("article").forEach((a) => a.classList.remove("studio-selected"));
  art.classList.add("studio-selected");
  $classes.value = art.dataset.classes;
  [...document.querySelectorAll("button")].forEach((b) => b.removeAttribute("disabled"));
  $workbench.innerHTML = `
    <article
      class="sd-slide ${art.dataset.classes} shadow-lg"
      data-file="${art.dataset.file}"
      data-num="${art.dataset.num}"
      data-classes="${art.dataset.classes}"
      style="zoom: ${zoom - 3}%">
      ${art.innerHTML}
    </article>
    <textarea id="speaker-notes" style="zoom: ${zoom - 3}%"></textarea>
  `;
  $classes.textContent = art.dataset.classes;
  const $slide = $workbench.querySelector("article.sd-slide");
  const $notesTextarea = document.getElementById("speaker-notes");
  $notesTextarea.value = [...art.querySelectorAll("aside.sd-notes")]
    .map((n) => decodeComments(n.textContent))
    .join("\n");
  $notesTextarea.addEventListener("blur", async () => { await saveCurrentSlide(); });
  [...$workbench.querySelectorAll("aside.sd-notes")].forEach((n) => n.remove());
  $workbench.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
    el.setAttribute("contenteditable", "true");
    el.addEventListener("blur", async () => { await saveCurrentSlide(); });
    makeDraggable(el, $slide);
    makeResizable(el, $slide);
    makeRemovable(el);
  });
};

const createSlide = async () => {
  const prev = [...$previews.querySelectorAll("article")].at(-2);
  await fetch("/api/slide/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: prev.dataset.file, classes: "", num: -1, content: "## .[]\n" }),
  });
  await fetchSlides();
  setTimeout(() => [...$previews.querySelectorAll("article")].at(-2)?.click(), 10);
};

const makeSlidePreview = (slide, editable = false) => {
  const art = document.createElement("article");
  art.classList.add("sd-slide", "shadow-lg");
  if (slide.classes !== "") art.classList.add(slide.classes.split(" "));
  art.dataset.file = slide.file;
  art.dataset.num = slide.num;
  art.dataset.classes = slide.classes;
  art.innerHTML = slide.content;
  art.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    event.preventDefault();
    if (editable) loadSlide(art);
    else createSlide();
  });
  $previews.append(art);
};

export const fetchSlides = async () => {
  $previews.innerHTML = "";
  const { slides } = await (await fetch("/api/slides")).json();
  let lastNum = 0;
  let file = "";
  slides.forEach((slide) => {
    if (file === "") file = slide.file;
    if (slide.file === file) lastNum = slide.num;
    makeSlidePreview(slide, true);
  });
  makeSlidePreview({
    file,
    content: `<div class="studio-add-slide">+</div>`,
    num: lastNum + 1,
    classes: "",
  });
};
