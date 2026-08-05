import type { ImportedDeck, ImportedSlide } from "./types";

const SEPARATOR = /^---\s*$/;
const FENCE = /^\s*(```|~~~)/;
const YAML_LINE = /^\s*(?:[\w.$-]+\s*:|-\s+)/;
const HEADING = /^#{1,6}\s/;

type Chunk = { front: Record<string, unknown>; body: string };

const parseYAML = (source: string): Record<string, unknown> => {
  if (source.trim() === "") return {};
  try {
    return (Bun.YAML.parse(source) as Record<string, unknown>) ?? {};
  } catch (_) {
    return {};
  }
};

const looksLikeYAML = (lines: string[]) =>
  lines.some((line) => line.trim() !== "") &&
  !lines.some((line) => HEADING.test(line)) &&
  lines.every((line) => line.trim() === "" || YAML_LINE.test(line));

/**
 * Slidev separates slides with a bare `---`; a slide may open with its own
 * frontmatter, closed by a second `---`. Fenced code blocks are left alone.
 */
const split = (source: string): Chunk[] => {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const chunks: Chunk[] = [];
  let front: Record<string, unknown> = {};
  let body: string[] = [];
  let fence = "";
  let i = 0;

  const flush = () => {
    chunks.push({ front, body: body.join("\n").trim() });
    front = {};
    body = [];
  };

  const readFrontmatter = () => {
    const start = i + 1;
    let end = start;
    while (end < lines.length && !SEPARATOR.test(lines[end])) end += 1;
    if (end >= lines.length) return false;
    const block = lines.slice(start, end);
    if (!looksLikeYAML(block)) return false;
    front = parseYAML(block.join("\n"));
    i = end + 1;
    return true;
  };

  if (SEPARATOR.test(lines[0] ?? "")) {
    if (!readFrontmatter()) i = 1;
  }

  while (i < lines.length) {
    const line = lines[i];
    const fenceMatch = line.match(FENCE);
    if (fenceMatch) {
      if (fence === "") fence = fenceMatch[1];
      else if (line.trim().startsWith(fence)) fence = "";
      body.push(line);
      i += 1;
    } else if (fence === "" && SEPARATOR.test(line)) {
      flush();
      if (!readFrontmatter()) i += 1;
    } else {
      body.push(line);
      i += 1;
    }
  }
  flush();
  return chunks;
};

const takeNotes = (body: string) => {
  const match = body.match(/<!--([\s\S]*?)-->\s*$/);
  if (!match) return { notes: "", rest: body.trim() };
  return {
    notes: match[1].trim(),
    rest: body.slice(0, match.index).trim(),
  };
};

const splitTitle = (markdown: string) => {
  const lines = markdown.split("\n");
  const at = lines.findIndex((line) => /^#{1,6}\s+/.test(line));
  if (at === -1) return { title: "", body: markdown.trim() };
  const title = lines[at].replace(/^#{1,6}\s+/, "").trim();
  lines.splice(at, 1);
  return { title, body: lines.join("\n").trim() };
};

const classesOf = (front: Record<string, unknown>) => {
  const out: string[] = [];
  const layout = front.layout;
  if (typeof layout === "string" && layout !== "") out.push(layout);
  const extra = front.class;
  if (typeof extra === "string")
    out.push(...extra.split(/\s+/).filter(Boolean));
  else if (Array.isArray(extra)) out.push(...extra.map(String));
  return [...new Set(out)];
};

const slidev = (source: string): ImportedDeck => {
  const chunks = split(source);
  const global = chunks[0]?.front ?? {};
  const slides: ImportedSlide[] = chunks
    .filter((chunk, i) => i > 0 || chunk.body !== "")
    .map((chunk) => {
      const { notes, rest } = takeNotes(chunk.body);
      const { title, body } = splitTitle(rest);
      return { title, content: body, notes, classes: classesOf(chunk.front) };
    })
    .filter(
      (slide) =>
        slide.title !== "" || slide.content !== "" || slide.notes !== "",
    );
  if (!slides.length) throw new Error("no slide found in this slidev file");

  const title =
    (typeof global.title === "string" ? global.title : "") ||
    slides.find((s) => s.title !== "")?.title ||
    "Imported presentation";

  return { title, slides, assets: {} };
};

export default slidev;
