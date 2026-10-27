export interface SlideEntry {
  num: number;
  content: string;
}

export interface SlideIndex {
  total: number;
  list: SlideEntry[];
}

export function parseSlides(html: string): SlideIndex {
  const list: SlideEntry[] = [];

  // each <section …> opens a slide that runs until the next one
  const openings = [...html.matchAll(/<section(\s[^>]*)>/gi)];
  openings.forEach((match, i) => {
    const attrs = match[1];
    if (!attrs.includes("sd-slide")) return;
    const start = match.index + match[0].length;
    const body = html.slice(start, openings[i + 1]?.index ?? html.length);

    const numMatch = /data-num\s*=\s*["']?(\d+)["']?/i.exec(attrs);
    const num = numMatch ? Number.parseInt(numMatch[1], 10) : list.length;

    list.push({
      num,
      content: `<section>${body
        .trim()
        .replace("<h2></h2>", "")
        .replace("</body></html>", "")
        .replaceAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        // the speaker notes are not for the audience
        .replaceAll(/<aside class="sd-notes">[\s\S]*?<\/aside>/gi, "")}`,
    });
  });

  list.sort((a, b) => a.num - b.num);

  return { total: list.length, list };
}
