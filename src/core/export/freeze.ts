import type { Page } from "../browser";

const STORE = "window.__slideskFrozen";

// plugins are free to tear down what they rendered when leaving a slide — abcjs
// drops its score, xterm its terminal — so a slide is snapshotted while it is
// still the current one, and every snapshot is put back before printing
const snapshot = (index: number) => `(() => {
  const slide = document.querySelectorAll(".sd-slide")[${index}];
  if (!slide) return;
  const clone = slide.cloneNode(true);
  const live = slide.querySelectorAll("canvas");
  clone.querySelectorAll("canvas").forEach((canvas, i) => {
    let src;
    try {
      src = live[i].toDataURL();
    } catch (_) {
      return;
    }
    const img = document.createElement("img");
    for (const attr of canvas.attributes) img.setAttribute(attr.name, attr.value);
    img.setAttribute("src", src);
    canvas.replaceWith(img);
  });
  ${STORE} = ${STORE} ?? [];
  ${STORE}[${index}] = clone.innerHTML;
})()`;

const restore = `(async () => {
  const frozen = ${STORE} ?? [];
  document.querySelectorAll(".sd-slide").forEach((slide, i) => {
    const html = frozen[i];
    // untouched slides are left alone: re-parsing costs more than it gives back,
    // and an iframe cannot be re-created — putting it back would blank a frame
    // that had loaded its remote document
    if (typeof html !== "string" || slide.innerHTML === html) return;
    if (slide.querySelector("iframe")) return;
    slide.innerHTML = html;
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

export const freeze = (page: Page, index: number) =>
  page.evaluate(snapshot(index));

export const thaw = (page: Page) => page.evaluate(restore);
