import { attr, type Node } from "./scan";

const BLOCKS = new Set([
  "p",
  "div",
  "section",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "blockquote",
  "pre",
  "table",
  "hr",
  "figure",
]);

const collapse = (value: string) => value.replaceAll(/\s+/g, " ");

const rawText = (nodes: Node[]): string =>
  nodes
    .map((node) =>
      node.type === "text"
        ? node.value
        : node.name.toLowerCase() === "br"
          ? "\n"
          : rawText(node.children),
    )
    .join("");

const inline = (nodes: Node[]): string =>
  nodes
    .map((node) => {
      if (node.type === "text") return collapse(node.value);
      const name = node.name.toLowerCase();
      const inner = inline(node.children);
      switch (name) {
        case "br":
          return "\n";
        case "strong":
        case "b":
          return inner.trim() === "" ? "" : `**${inner.trim()}**`;
        case "em":
        case "i":
          return inner.trim() === "" ? "" : `*${inner.trim()}*`;
        case "del":
        case "s":
          return inner.trim() === "" ? "" : `~~${inner.trim()}~~`;
        case "code":
          return inner.trim() === "" ? "" : `\`${inner.trim()}\``;
        case "a": {
          const href = attr(node.attrs, "href");
          return href ? `[${inner.trim()}](${href})` : inner;
        }
        case "img":
          return image(node);
        default:
          return inner;
      }
    })
    .join("");

const image = (node: Node) => {
  if (node.type !== "element") return "";
  const src = attr(node.attrs, "src");
  if (!src) return "";
  const alt = (attr(node.attrs, "alt") ?? "").replaceAll(/[,()]/g, " ").trim();
  return `!image(${src}, ${alt})`;
};

const rawClass = (node: Node) => {
  if (node.type !== "element") return "";
  const code = node.children.find(
    (child) => child.type === "element" && child.name.toLowerCase() === "code",
  );
  return code && code.type === "element"
    ? (attr(code.attrs, "class") ?? "")
    : "";
};

const list = (node: Node, ordered: boolean, depth: number): string => {
  if (node.type !== "element") return "";
  let index = 0;
  return node.children
    .filter(
      (child) => child.type === "element" && child.name.toLowerCase() === "li",
    )
    .map((item) => {
      index += 1;
      const marker = ordered ? `${index}. ` : "- ";
      const own = item.type === "element" ? item.children : [];
      const nested = own.filter(
        (child) =>
          child.type === "element" &&
          ["ul", "ol"].includes(child.name.toLowerCase()),
      );
      const rest = own.filter((child) => !nested.includes(child));
      const lines = [`${"  ".repeat(depth)}${marker}${inline(rest).trim()}`];
      nested.forEach((child) => {
        if (child.type === "element")
          lines.push(list(child, child.name.toLowerCase() === "ol", depth + 1));
      });
      return lines.filter((l) => l.trim() !== "").join("\n");
    })
    .join("\n");
};

const table = (node: Node): string => {
  if (node.type !== "element") return "";
  const rows: string[][] = [];
  const walk = (nodes: Node[]) => {
    nodes.forEach((child) => {
      if (child.type !== "element") return;
      const name = child.name.toLowerCase();
      if (name === "tr")
        rows.push(
          child.children
            .filter(
              (cell) =>
                cell.type === "element" &&
                ["td", "th"].includes(cell.name.toLowerCase()),
            )
            .map((cell) =>
              cell.type === "element"
                ? inline(cell.children).trim().replaceAll("|", "\\|")
                : "",
            ),
        );
      else walk(child.children);
    });
  };
  walk(node.children);
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const line = (cells: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => cells[i] ?? "").join(" | ")} |`;
  return [
    line(rows[0]),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...rows.slice(1).map(line),
  ].join("\n");
};

const block = (nodes: Node[]): string[] => {
  const out: string[] = [];
  let buffer: Node[] = [];
  const flush = () => {
    const text = inline(buffer).trim();
    if (text !== "") out.push(text);
    buffer = [];
  };

  nodes.forEach((node) => {
    if (node.type === "text") {
      buffer.push(node);
      return;
    }
    const name = node.name.toLowerCase();
    if (!BLOCKS.has(name)) {
      buffer.push(node);
      return;
    }
    flush();
    if (/^h[1-6]$/.test(name)) {
      // h1/h2 would start a new SliDesk slide, clamp them without touching the rest
      const level = Math.max(3, Number(name[1]));
      out.push(`${"#".repeat(level)} ${inline(node.children).trim()}`);
    } else if (name === "ul" || name === "ol") {
      out.push(list(node, name === "ol", 0));
    } else if (name === "pre") {
      const lang =
        (attr(node.attrs, "class") ?? rawClass(node)).match(
          /language-([\w+-]+)/,
        )?.[1] ?? "";
      out.push(
        `\`\`\`${lang}\n${rawText(node.children).replace(/^\n+|\s+$/g, "")}\n\`\`\``,
      );
    } else if (name === "blockquote") {
      out.push(
        block(node.children)
          .join("\n")
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n"),
      );
    } else if (name === "table") {
      out.push(table(node));
    } else if (name === "hr") {
      out.push("---");
    } else {
      out.push(...block(node.children));
    }
  });
  flush();
  return out.filter((line) => line.trim() !== "");
};

const htmlToMarkdown = (nodes: Node[]) =>
  block(nodes)
    .join("\n\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();

export default htmlToMarkdown;
