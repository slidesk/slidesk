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

const notes = async (page: Page) => page.evaluate<string[]>(extract);

export const addNotesPages = (page: Page) => page.evaluate(pages);

export default notes;
