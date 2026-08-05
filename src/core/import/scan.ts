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
    attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`))?.[1] ??
    attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*'([^']*)'`))?.[1];
  if (quoted !== undefined) return quoted;
  // valueless html attribute, e.g. <section data-markdown>
  return new RegExp(`(?:^|\\s)${name}(?=\\s|$)`).test(attrs) ? "" : null;
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
  const name = raw.match(/^[^\s/>]+/)?.[0] ?? "";
  return {
    name,
    attrs: raw.slice(name.length).replace(/\/$/, ""),
    selfClosing: raw.endsWith("/") || VOID_TAGS.has(name.toLowerCase()),
    end,
  };
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
      if (source.slice(next + 2, end).trim() === name) {
        depth -= 1;
        if (depth === 0) return next;
      }
      i = end + 1;
    } else if (source.startsWith("<!--", next)) {
      const end = source.indexOf("-->", next);
      i = end === -1 ? source.length : end + 3;
    } else {
      const tag = tagAt(source, next);
      if (tag === null) return -1;
      if (tag.name === name && !tag.selfClosing) depth += 1;
      i = tag.end + 1;
    }
  }
  return -1;
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
    if (source.startsWith("<!--", next)) {
      const end = source.indexOf("-->", next);
      i = end === -1 ? source.length : end + 3;
    } else if (source.startsWith("<![CDATA[", next)) {
      const end = source.indexOf("]]>", next);
      i = end === -1 ? source.length : end + 3;
    } else if (source.startsWith("</", next) || source.startsWith("<?", next)) {
      const end = source.indexOf(">", next);
      i = end === -1 ? source.length : end + 1;
    } else {
      const tag = tagAt(source, next);
      if (tag === null) break;
      const match = wanted.has(tag.name);
      if (match && tag.selfClosing) {
        found.push({ name: tag.name, attrs: tag.attrs, inner: "" });
        i = tag.end + 1;
      } else if (match) {
        const close = closeOf(source, tag.name, tag.end + 1);
        if (close === -1) {
          i = tag.end + 1;
        } else {
          found.push({
            name: tag.name,
            attrs: tag.attrs,
            inner: source.slice(tag.end + 1, close),
          });
          i = close + tag.name.length + 3;
        }
      } else {
        i = tag.end + 1;
      }
    }
  }
  return found;
};

export type Node =
  | { type: "text"; value: string }
  | { type: "element"; name: string; attrs: string; children: Node[] };

const RAW_TAGS = new Set(["script", "style"]);

export const parse = (source: string): Node[] => {
  const roots: Node[] = [];
  const stack: Node[] = [];
  const push = (node: Node) => {
    const parent = stack[stack.length - 1];
    if (parent && parent.type === "element") parent.children.push(node);
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
      const end = source.indexOf("-->", next);
      i = end === -1 ? source.length : end + 3;
    } else if (source.startsWith("<![CDATA[", next)) {
      const end = source.indexOf("]]>", next);
      text(source.slice(next + 9, end === -1 ? source.length : end));
      i = end === -1 ? source.length : end + 3;
    } else if (source.startsWith("<!", next) || source.startsWith("<?", next)) {
      const end = source.indexOf(">", next);
      i = end === -1 ? source.length : end + 1;
    } else if (source.startsWith("</", next)) {
      const end = source.indexOf(">", next);
      const name = source
        .slice(next + 2, end === -1 ? source.length : end)
        .trim();
      const at = stack.findLastIndex(
        (node) => node.type === "element" && node.name === name,
      );
      if (at !== -1) stack.length = at;
      i = end === -1 ? source.length : end + 1;
    } else {
      const tag = tagAt(source, next);
      if (tag === null) {
        text(source.slice(next));
        break;
      }
      const node: Node = {
        type: "element",
        name: tag.name,
        attrs: tag.attrs,
        children: [],
      };
      push(node);
      if (RAW_TAGS.has(tag.name.toLowerCase())) {
        const close = source.indexOf(`</${tag.name}`, tag.end + 1);
        const end = close === -1 ? source.length : close;
        node.children.push({
          type: "text",
          value: source.slice(tag.end + 1, end),
        });
        const after = source.indexOf(">", end);
        i = close === -1 || after === -1 ? source.length : after + 1;
      } else {
        if (!tag.selfClosing) stack.push(node);
        i = tag.end + 1;
      }
    }
  }
  return roots;
};

export default scan;
