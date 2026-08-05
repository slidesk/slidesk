import htmlToMarkdown from "./html";
import { attr, type Node, parse } from "./scan";
import type { ImportedDeck, ImportedSlide } from "./types";

const isElement = (node: Node, name: string) =>
  node.type === "element" && node.name.toLowerCase() === name;

const find = (nodes: Node[], match: (node: Node) => boolean): Node | null => {
  for (const node of nodes) {
    if (match(node)) return node;
    if (node.type === "element") {
      const deep = find(node.children, match);
      if (deep) return deep;
    }
  }
  return null;
};

const rawText = (nodes: Node[]): string =>
  nodes
    .map((node) => (node.type === "text" ? node.value : rawText(node.children)))
    .join("");

const childrenOf = (node: Node | null) =>
  node !== null && node.type === "element" ? node.children : [];

const takeNotes = (node: Node) => {
  if (node.type !== "element") return { notes: "", rest: [] as Node[] };
  const notes: Node[] = [];
  const rest: Node[] = [];
  node.children.forEach((child) => {
    const aside =
      isElement(child, "aside") &&
      child.type === "element" &&
      (attr(child.attrs, "class") ?? "").includes("notes");
    if (aside) notes.push(child);
    else rest.push(child);
  });
  return {
    notes: notes
      .map((n) => (n.type === "element" ? htmlToMarkdown(n.children) : ""))
      .join("\n\n")
      .trim(),
    rest,
  };
};

const markdownSection = (node: Node) => {
  if (node.type !== "element") return null;
  if (attr(node.attrs, "data-markdown") === null) return null;
  const script = find(node.children, (child) => isElement(child, "script"));
  const source = script ? rawText(childrenOf(script)) : rawText(node.children);
  return source.replace(/^\s*\n/, "").trimEnd();
};

const splitTitle = (markdown: string) => {
  const lines = markdown.split("\n");
  const at = lines.findIndex((line) => /^#{1,6}\s+/.test(line));
  if (at === -1) return { title: "", body: markdown.trim() };
  const title = lines[at].replace(/^#{1,6}\s+/, "").trim();
  lines.splice(at, 1);
  return { title, body: lines.join("\n").trim() };
};

const toSlide = (node: Node): ImportedSlide => {
  const { notes, rest } = takeNotes(node);
  const fromMarkdown = markdownSection(node);
  const markdown = fromMarkdown ?? htmlToMarkdown(rest);
  const { title, body } = splitTitle(markdown);
  const classes = (
    node.type === "element" ? (attr(node.attrs, "class") ?? "") : ""
  )
    .split(/\s+/)
    .filter(
      (c) => c !== "" && c !== "present" && c !== "past" && c !== "future",
    );
  return { title, content: body, notes, classes };
};

const revealjs = (source: string): ImportedDeck => {
  const tree = parse(source);
  const container = find(
    tree,
    (node) =>
      node.type === "element" &&
      (attr(node.attrs, "class") ?? "").split(/\s+/).includes("slides"),
  );
  if (container === null || container.type !== "element")
    throw new Error(
      "no reveal.js slides container found (expected an element with class 'slides')",
    );

  const sections = container.children.filter((child) =>
    isElement(child, "section"),
  );
  if (!sections.length)
    throw new Error("the reveal.js slides container holds no <section>");

  const slides: ImportedSlide[] = [];
  sections.forEach((section) => {
    if (section.type !== "element") return;
    const nested = section.children.filter((child) =>
      isElement(child, "section"),
    );
    if (nested.length)
      nested.forEach((child) => {
        slides.push(toSlide(child));
      });
    else slides.push(toSlide(section));
  });

  const head = find(tree, (node) => isElement(node, "title"));
  const title =
    (head && head.type === "element" ? rawText(head.children).trim() : "") ||
    slides.find((s) => s.title !== "")?.title ||
    "Imported presentation";

  return { title, slides, assets: {} };
};

export default revealjs;
