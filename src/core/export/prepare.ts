import type { Page } from "../browser";

const EXPORT_CSS = (width: number, height: number) => `
@page {
  size: ${width}px ${height}px;
  margin: 0;
}
@media print {
  html, body, html .sd-app {
    height: auto !important;
    overflow: visible !important;
  }
  .sd-slide {
    position: relative !important;
    width: ${width}px !important;
    height: ${height}px !important;
    transform: none !important;
    transition: none !important;
    opacity: 1 !important;
    break-inside: avoid;
    break-after: page;
  }
  .sd-slide:last-of-type {
    break-after: auto;
    page-break-after: auto;
  }
}`;

const loadImages = `(async () => {
  document.querySelectorAll(".sd-img img").forEach((img) => {
    const src = img.getAttribute("data-src");
    if (src && !img.getAttribute("src")) img.setAttribute("src", src);
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
  return document.querySelectorAll(".sd-slide").length;
})()`;

const injectCSS = (css: string) => `(() => {
  const style = document.createElement("style");
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
})()`;

const prepare = async (page: Page, width: number, height: number) => {
  await page.evaluate(injectCSS(EXPORT_CSS(width, height)));
  const total = await page.evaluate<number>(loadImages);
  if (!total) throw new Error("no slide found in this presentation");
  return total;
};

export default prepare;
