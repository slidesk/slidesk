import slugify from "../../utils/slugify";
import type { ImportedDeck, ImportedSlide } from "./types";

const asciify = (value: string) =>
  slugify(value.normalize("NFD").replaceAll(/\p{M}/gu, ""));

/** `\n## ` starts a new slide in SliDesk: no heading above level 3 may survive. */
const demoteHeadings = (content: string) =>
  content.replaceAll(/^(#{1,2})\s+/gm, "### ");

const safeNotes = (notes: string) => notes.replaceAll("*/", "* /");

const safeTitle = (title: string) =>
  title.replaceAll(".[", ". [").replaceAll("\n", " ").trim();

export const slideFile = (slide: ImportedSlide) => {
  const classes = slide.classes.filter((c) => c !== "").join(" ");
  // slides are cut on "\n## ": the trailing space matters on an untitled slide
  const head = [
    "##",
    safeTitle(slide.title),
    classes === "" ? "" : `.[${classes}]`,
  ]
    .filter((part) => part !== "")
    .join(" ");
  const parts = [head === "##" ? "## " : head];
  const body = demoteHeadings(slide.content).trim();
  if (body !== "") parts.push(body);
  if (slide.notes !== "")
    parts.push(`/*\n${safeNotes(slide.notes).trim()}\n*/`);
  return `${parts.join("\n\n")}\n`;
};

const files = (deck: ImportedDeck) => {
  const out: Record<string, string | Uint8Array> = {};
  const width = Math.max(2, String(deck.slides.length).length);

  deck.slides.forEach((slide, i) => {
    const num = String(i + 1).padStart(width, "0");
    const name = asciify(slide.title) || "slide";
    out[`slides/${num}-${name}.md`] = slideFile(slide);
  });

  // the leading blank line keeps the first chunk empty, so the include does not
  // add a cover slide on top of the ones coming from the source deck
  out["main.md"] = "\n!include(slides)\n";
  out["slidesk.toml"] =
    `[slidesk]\nTITLE="${deck.title.replaceAll('"', "'")}"\n`;
  Object.entries(deck.assets).forEach(([name, data]) => {
    out[`assets/${name}`] = data;
  });

  return out;
};

export default files;
