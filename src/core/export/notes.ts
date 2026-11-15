import type { Page } from "../browser";

// the notes of a slide travel base64-encoded in its aside.sd-notes
const DECODE = String.raw`(aside) =>
  decodeURIComponent(
    atob(aside.innerHTML).replaceAll(
      /[\x80-￿]/g,
      (c) => "%" + c.codePointAt(0).toString(16).padStart(2, "0"),
    ),
  )`;

const extract = String.raw`(() => {
  const decode = ${DECODE};
  const box = document.createElement("div");
  box.setAttribute("style", "position:fixed;left:-99999px;top:0;width:800px");
  document.body.appendChild(box);
  const notes = [...document.querySelectorAll(".sd-slide")].map((slide) => {
    box.innerHTML = [...slide.querySelectorAll("aside.sd-notes")]
      .map(decode)
      .join("");
    box.querySelectorAll("li").forEach((li) => li.prepend("• "));
    return box.innerText.replaceAll(/\n{3,}/g, "\n\n").trim();
  });
  box.remove();
  return notes;
})()`;

// after the last page of each slide (its last step), a page with its notes
const pages = `(() => {
  const decode = ${DECODE};
  document.querySelectorAll(".sd-slide:not([data-sd-step])").forEach((slide) => {
    const html = [...slide.querySelectorAll("aside.sd-notes")]
      .map(decode)
      .join("");
    if (!html.trim()) return;
    let last = slide;
    while (last.nextElementSibling?.hasAttribute("data-sd-step"))
      last = last.nextElementSibling;
    const page = document.createElement("section");
    page.className = "sd-slide sd-export-notes";
    page.dataset.sdStep = "";
    page.innerHTML = html;
    last.after(page);
  });
})()`;

// the notes of each slide, as html
const html = `(() => {
  const decode = ${DECODE};
  return [...document.querySelectorAll(".sd-slide")].map((slide) =>
    [...slide.querySelectorAll("aside.sd-notes")].map(decode).join(""),
  );
})()`;

// webkit cannot print: the notes are laid over the slide and captured
const overlay = (notes: string) => `(() => {
  const box = document.createElement("div");
  box.id = "sd-export-notes";
  box.setAttribute(
    "style",
    "position:fixed;inset:0;z-index:2147483647;overflow:hidden;box-sizing:border-box;padding:80px 120px;font-size:32px;line-height:1.5;text-align:left;background:var(--sd-background-color);color:var(--sd-text-color)",
  );
  box.innerHTML = ${JSON.stringify(notes)};
  box.querySelectorAll("*").forEach((e) => (e.style.textAlign = "left"));
  document.body.append(box);
})()`;

const notes = async (page: Page) => page.evaluate<string[]>(extract);

export const addNotesPages = (page: Page) => page.evaluate(pages);

export const notesHtml = (page: Page) => page.evaluate<string[]>(html);

// ponytail: notes longer than one screen are cut, as on a slide
export const notesShot = async (page: Page, notes: string) => {
  await page.evaluate(overlay(notes));
  const image = await page.screenshot("jpeg");
  await page.evaluate(`document.getElementById("sd-export-notes").remove()`);
  return image;
};

export default notes;
