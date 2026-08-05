import type { Page } from "../browser";

const extract = `(() => {
  const box = document.createElement("div");
  box.setAttribute("style", "position:fixed;left:-99999px;top:0;width:800px");
  document.body.appendChild(box);
  const notes = [...document.querySelectorAll(".sd-slide")].map((slide) => {
    box.innerHTML = [...slide.querySelectorAll("aside.sd-notes")]
      .map((aside) =>
        decodeURIComponent(
          atob(aside.innerHTML).replaceAll(
            /[\\x80-\\uffff]/g,
            (c) => "%" + c.codePointAt(0).toString(16).padStart(2, "0"),
          ),
        ),
      )
      .join("");
    box.querySelectorAll("li").forEach((li) => li.prepend("• "));
    return box.innerText.replaceAll(/\\n{3,}/g, "\\n\\n").trim();
  });
  box.remove();
  return notes;
})()`;

const notes = async (page: Page) => page.evaluate<string[]>(extract);

export default notes;
