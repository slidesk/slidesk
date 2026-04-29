import { preprocessImages } from "./image";

export interface SlideEntry {
  num: number;
  content: string;
}

export interface SlideIndex {
  total: number;
  list: SlideEntry[];
}

export async function parseSlides(html: string): Promise<SlideIndex> {
  const list: SlideEntry[] = [];

  const sectionRe =
    /<section([^>]*class\s*=\s*["']?[^"'>]*sd-slide[^"'>]*["']?[^>]*)>([\s\S]*?)(?=<section\s|$)/gi;

  for (const match of html.matchAll(sectionRe)) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";

    const numMatch = /data-num\s*=\s*["']?(\d+)["']?/i.exec(attrs);
    const num = numMatch ? Number.parseInt(numMatch[1], 10) : list.length;

    list.push({
      num,
      content: await preprocessImages(
        `<section>${body
          .trim()
          .replace("<h2></h2>", "")
          .replace("</body></html>", "")
          .replaceAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")}`,
        {
          cols: 80,
          mode: "block",
          fallbackToAlt: true,
        },
      ),
    });
  }

  list.sort((a, b) => a.num - b.num);

  return { total: list.length, list };
}
