import { existsSync, statSync } from "node:fs";
import type { ImportKind } from "./types";

export const isURL = (source: string) => /^https?:\/\//.test(source);

const byExtension = (source: string): ImportKind | null => {
  const name = source.toLowerCase();
  if (name.endsWith(".pptx")) return "pptx";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "revealjs";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "slidev";
  return null;
};

export const entryOf = (source: string) => {
  if (!existsSync(source) || !statSync(source).isDirectory()) return source;
  const candidates = ["slides.md", "index.html", "slides.html", "main.md"];
  const found = candidates.find((name) => existsSync(`${source}/${name}`));
  if (found === undefined)
    throw new Error(`no slides.md or index.html found in ${source}`);
  return `${source}/${found}`;
};

const sniff = (data: Uint8Array): ImportKind => {
  if (data[0] === 0x50 && data[1] === 0x4b) return "pptx";
  const head = new TextDecoder().decode(data.subarray(0, 4096)).toLowerCase();
  if (head.includes("reveal") || head.includes('class="slides"'))
    return "revealjs";
  if (head.includes("<html")) return "revealjs";
  return "slidev";
};

const detect = (source: string, data: Uint8Array | null): ImportKind => {
  if (isURL(source))
    return source.includes("docs.google.com/presentation")
      ? "gslides"
      : "revealjs";
  return byExtension(source) ?? (data ? sniff(data) : "slidev");
};

export default detect;
