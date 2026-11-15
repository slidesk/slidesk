import type { Page } from "../browser";

const STORE = "window.__slideskFrozen";

// plugins are free to tear down what they rendered when leaving a slide — abcjs
// drops its score, xterm its terminal — so each state of a slide is snapshotted
// while it is on screen, and every snapshot is put back before printing
const snapshot = (index: number, step: number) => `(() => {
  const slide = document.querySelectorAll(".sd-slide")[${index}];
  if (!slide) return;
  const clone = slide.cloneNode(true);
  // an item a step plugin has not revealed yet stays hidden on paper, where
  // the plugin's print styles would show it
  const live = [...slide.querySelectorAll("*")];
  clone.querySelectorAll("*").forEach((el, i) => {
    if (live[i] && getComputedStyle(live[i]).opacity === "0")
      el.style.setProperty("opacity", "0");
  });
  const canvases = slide.querySelectorAll("canvas");
  clone.querySelectorAll("canvas").forEach((canvas, i) => {
    let src;
    try {
      src = canvases[i].toDataURL();
    } catch (_) {
      return;
    }
    const img = document.createElement("img");
    for (const attr of canvas.attributes) img.setAttribute(attr.name, attr.value);
    img.setAttribute("src", src);
    canvas.replaceWith(img);
  });
  ${STORE} = ${STORE} ?? [];
  ${STORE}[${index}] = ${STORE}[${index}] ?? [];
  ${STORE}[${index}][${step}] = clone.innerHTML;
})()`;

const restore = `(async () => {
  const frozen = ${STORE} ?? [];
  document.querySelectorAll(".sd-slide").forEach((slide, i) => {
    const [first, ...steps] = frozen[i] ?? [];
    // an iframe cannot be re-created — putting it back would blank a frame
    // that had loaded its remote document — so such a slide stays as it is
    if (typeof first !== "string" || slide.querySelector("iframe")) return;
    // untouched slides are left alone: re-parsing costs more than it gives back
    if (slide.innerHTML !== first) slide.innerHTML = first;
    // each revealed step is a page of its own, right after its slide
    let last = slide;
    for (const html of steps) {
      const page = slide.cloneNode(false);
      page.innerHTML = html;
      // one bookmark per slide: the headings of its steps stay out of the outline
      page.dataset.sdStep = "";
      for (const h of page.querySelectorAll("h1, h2, h3, h4, h5, h6"))
        h.setAttribute("role", "none");
      last.after(page);
      last = page;
    }
  });
  await Promise.all(
    [...document.images].map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((done) => {
            img.addEventListener("load", done);
            img.addEventListener("error", done);
          }),
    ),
  );
  if (document.fonts) await document.fonts.ready;
})()`;

export const freeze = (page: Page, index: number, step = 0) =>
  page.evaluate(snapshot(index, step));

export const thaw = (page: Page) => page.evaluate(restore);
