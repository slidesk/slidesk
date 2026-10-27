export type Element = {
  name: string;
  attrs: string;
  inner: string;
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export const unescapeXML = (value: string) =>
  value.replaceAll(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X"))
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#"))
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return ENTITIES[code.toLowerCase()] ?? whole;
  });

export const attr = (attrs: string, name: string) => {
  const quoted =
    new RegExp(String.raw`(?:^|\s)${name}\s*=\s*"([^"]*)"`).exec(attrs)?.[1] ??
    new RegExp(String.raw`(?:^|\s)${name}\s*=\s*'([^']*)'`).exec(attrs)?.[1];
  if (quoted !== undefined) return quoted;
  // valueless html attribute, e.g. <section data-markdown>
  return new RegExp(String.raw`(?:^|\s)${name}(?=\s|$)`).test(attrs)
    ? ""
    : null;
};

const skipQuoted = (source: string, from: number) => {
  let i = from;
  let quote = "";
  while (i < source.length) {
    const c = source[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ">") return i;
    i += 1;
  }
  return -1;
};

const tagAt = (source: string, start: number) => {
  const end = skipQuoted(source, start + 1);
  if (end === -1) return null;
  const raw = source.slice(start + 1, end);
  const name = /^[^\s/>]+/.exec(raw)?.[0] ?? "";
  return {
    name,
    attrs: raw.slice(name.length).replace(/\/$/, ""),
    selfClosing: raw.endsWith("/") || VOID_TAGS.has(name.toLowerCase()),
    end,
  };
};

/** Index just after `marker` searched from `from`, or the end of `source`. */
const after = (source: string, from: number, marker: string) => {
  const end = source.indexOf(marker, from);
  return end === -1 ? source.length : end + marker.length;
};

const closeOf = (source: string, name: string, from: number) => {
  let depth = 1;
  let i = from;
  while (i < source.length) {
    const next = source.indexOf("<", i);
    if (next === -1) return -1;
    if (source.startsWith("</", next)) {
      const end = source.indexOf(">", next);
      if (end === -1) return -1;
      if (source.slice(next + 2, end).trim() === name) depth -= 1;
      if (depth === 0) return next;
      i = end + 1;
    } else if (source.startsWith("<!--", next)) {
      i = after(source, next, "-->");
    } else {
      const tag = tagAt(source, next);
      if (tag === null) return -1;
      if (tag.name === name && !tag.selfClosing) depth += 1;
      i = tag.end + 1;
    }
  }
  return -1;
};

/** Where scanning resumes after a comment, CDATA, closing tag or declaration at `at`; -1 for an opening tag. */
const skipMarkup = (source: string, at: number) => {
  if (source.startsWith("<!--", at)) return after(source, at, "-->");
  if (source.startsWith("<![CDATA[", at)) return after(source, at, "]]>");
  if (source.startsWith("</", at) || source.startsWith("<?", at))
    return after(source, at, ">");
  return -1;
};

type Tag = NonNullable<ReturnType<typeof tagAt>>;

/** Records the element opened by `tag` and returns where scanning resumes. */
const collect = (source: string, tag: Tag, found: Element[]) => {
  if (tag.selfClosing) {
    found.push({ name: tag.name, attrs: tag.attrs, inner: "" });
    return tag.end + 1;
  }
  const close = closeOf(source, tag.name, tag.end + 1);
  if (close === -1) return tag.end + 1;
  found.push({
    name: tag.name,
    attrs: tag.attrs,
    inner: source.slice(tag.end + 1, close),
  });
  return close + tag.name.length + 3;
};

/**
 * Collect every element whose name is in `names`, in document order,
 * descending into elements that do not match.
 */
const scan = (source: string, names: string[]): Element[] => {
  const wanted = new Set(names);
  const found: Element[] = [];
  let i = 0;
  while (i < source.length) {
    const next = source.indexOf("<", i);
    if (next === -1) break;
    const skipped = skipMarkup(source, next);
    if (skipped !== -1) {
      i = skipped;
      continue;
    }
    const tag = tagAt(source, next);
    if (tag === null) break;
    i = wanted.has(tag.name) ? collect(source, tag, found) : tag.end + 1;
  }
  return found;
};

export type Node =
  | { type: "text"; value: string }
  | { type: "element"; name: string; attrs: string; children: Node[] };

const RAW_TAGS = new Set(["script", "style"]);

/** Closes the element named by the closing tag at `at`; returns where parsing resumes. */
const closeElement = (source: string, at: number, stack: Node[]) => {
  const end = source.indexOf(">", at);
  const name = source.slice(at + 2, end === -1 ? source.length : end).trim();
  const open = stack.findLastIndex(
    (node) => node.type === "element" && node.name === name,
  );
  if (open !== -1) stack.length = open;
  return end === -1 ? source.length : end + 1;
};

/** Opens `tag` as a child of the current element; returns where parsing resumes. */
const openElement = (
  source: string,
  tag: Tag,
  push: (node: Node) => void,
  stack: Node[],
) => {
  const node: Node = {
    type: "element",
    name: tag.name,
    attrs: tag.attrs,
    children: [],
  };
  push(node);
  if (!RAW_TAGS.has(tag.name.toLowerCase())) {
    if (!tag.selfClosing) stack.push(node);
    return tag.end + 1;
  }
  // script and style hold raw text up to their closing tag
  const close = source.indexOf(`</${tag.name}`, tag.end + 1);
  const end = close === -1 ? source.length : close;
  node.children.push({ type: "text", value: source.slice(tag.end + 1, end) });
  const afterClose = source.indexOf(">", end);
  return close === -1 || afterClose === -1 ? source.length : afterClose + 1;
};

export const parse = (source: string): Node[] => {
  const roots: Node[] = [];
  const stack: Node[] = [];
  const push = (node: Node) => {
    const parent = stack.at(-1);
    if (parent?.type === "element") parent.children.push(node);
    else roots.push(node);
  };
  const text = (value: string) => {
    if (value !== "") push({ type: "text", value: unescapeXML(value) });
  };

  let i = 0;
  while (i < source.length) {
    const next = source.indexOf("<", i);
    if (next === -1) {
      text(source.slice(i));
      break;
    }
    text(source.slice(i, next));
    if (source.startsWith("<!--", next)) {
      i = after(source, next, "-->");
    } else if (source.startsWith("<![CDATA[", next)) {
      const end = source.indexOf("]]>", next);
      text(source.slice(next + 9, end === -1 ? source.length : end));
      i = after(source, next, "]]>");
    } else if (source.startsWith("<!", next) || source.startsWith("<?", next)) {
      i = after(source, next, ">");
    } else if (source.startsWith("</", next)) {
      i = closeElement(source, next, stack);
    } else {
      const tag = tagAt(source, next);
      if (tag === null) {
        text(source.slice(next));
        break;
      }
      i = openElement(source, tag, push, stack);
    }
  }
  return roots;
};

export default scan;
