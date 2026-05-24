import TurndownService from "turndown";
import { decodeComments, encodeComments } from "./comments.js";

export const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});
turndownService.addRule("comments", {
  filter: ["aside"],
  replacement: (content, node) => {
    if (node.classList.contains("sd-notes"))
      return `/*\n${decodeComments(content)}\n*/`;
    return node.outerHTML;
  },
});
turndownService.addRule("image", {
  filter: ["figure"],
  replacement: (_content, node) => {
    const html = node.outerHTML;
    const figureRegex =
      /<figure class="sd-img([^"]*)"([^>]*)>\s*<img src="([^"]*)" alt="([^"]*)"(?:\s+width="([^"]*)")?(?:\s+height="([^"]*)")?[^>]*>\s*<figcaption([^>]*)>([^<]*)<\/figcaption>\s*<\/figure>/;
    const match = html.match(figureRegex);
    if (!match) return html;
    const [_full, classc, styleAttr, src, alt, width, height, figcaptionAttrs] =
      match;
    const trimmedClass = classc.trim();
    const styleMatch = styleAttr.match(/style="([^"]*)"/);
    const style = styleMatch ? styleMatch[1] : "";
    let optionals = "";
    if (trimmedClass !== "") {
      optionals = `[${trimmedClass}]`;
    } else if (style !== "") {
      optionals = style;
    }
    const captionHidden = figcaptionAttrs.includes("display: none");
    const caption = captionHidden ? "false" : "true";
    const parts = [src, alt, width ?? "", height ?? "", optionals, caption];
    let end = parts.length - 1;
    while (end > 1 && parts[end] === "") end--;
    return `!image(${parts.slice(0, end + 1).join(",")})`;
  },
});
turndownService.keep(["div", "iframe"]);

export const serializeSlide = (html, classes, notesValue) => {
  if (html.indexOf("position: absolute;") !== -1)
    return `## .[${classes}]\n${html.replace('contenteditable="true"', "")}\n/*\n${notesValue}\n*/`;
  return turndownService
    .turndown(
      `${html}<aside class="sd-notes">${encodeComments(notesValue)}</aside>`,
    )
    .split("\n")
    .map((l, i) => (i === 0 ? `${l} .[${classes}]` : l))
    .join("\n");
};
