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
  /* the speaker notes of a slide: as many pages as they need */
  .sd-slide.sd-export-notes {
    display: block !important;
    height: auto !important;
    min-height: ${height}px;
    box-sizing: border-box;
    padding: 80px 120px;
    text-align: left;
    font-size: 32px;
    line-height: 1.5;
    break-inside: auto;
  }
  .sd-slide.sd-export-notes * {
    text-align: left !important;
  }
  /* what plugins add after the slides would be printed on extra pages */
  body > :not(.sd-slide) {
    display: none !important;
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
