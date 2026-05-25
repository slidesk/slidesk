import "@tailwindcss/browser";
import { fetchSlides, saveCurrentSlide } from "./slides.js";
import { addImageItem } from "./image.js";
import { addVariableItem } from "./variables.js";
import "./css-editor.js";

export const EDITABLE_SELECTORS = "h2, p, figure, pre";
export const $previews = document.getElementById("previews");
export const $workbench = document.getElementById("workbench");
export const $classes = document.getElementById("classes");
export let zoom = 0;

const addPresentationStyles = async () => {
  const styles = await (await fetch("/api/styles")).json();
  styles.css?.forEach((s) => { document.head.innerHTML += s; });
};

const bindButtonActions = () => {
  let notesVisible = false;
  document.getElementById("toggle-notes").addEventListener("click", () => {
    const $slide = $workbench.querySelector("article.sd-slide");
    const $notesTextarea = document.getElementById("speaker-notes");
    $slide.style.display = notesVisible ? "flex" : "none";
    $notesTextarea.style.display = notesVisible ? "none" : "block";
    notesVisible = !notesVisible;
  });
  const addTextItem = async (tag, text) => {
    const el = document.createElement(tag);
    el.textContent = text;
    $workbench.querySelector("article.sd-slide").appendChild(el);
    await saveCurrentSlide();
  };
  document.getElementById("add-heading").addEventListener("click", () => addTextItem("h2", "Slide Title"));
  document.getElementById("add-paragraph").addEventListener("click", () => addTextItem("p", "Slide Text"));
  document.getElementById("add-image").addEventListener("click", addImageItem);
  document.getElementById("add-variable").addEventListener("click", addVariableItem);
};

document.addEventListener("DOMContentLoaded", async () => {
  await addPresentationStyles();
  await fetchSlides();
  bindButtonActions();
  zoom = (100 * $workbench.clientWidth) / 1920;
});
