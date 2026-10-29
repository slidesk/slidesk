// What of a slide can be typed on its rendering: the source lines each text
// on it comes from. The rest (code, images, templates blocks, html) is edited
// in the source.

const FENCE = /^\s*(```|~~~)/;
// lines that are not the text of a paragraph
const OTHER =
  /^\s*(!\w+\(|\[\[|<|\||>|\/\/|\/\*|#{1,6}\s|[-*+]\s|\d+[.)]\s|\$\$)/;
const TITLE = /^(## )(.*?)(\s*\.\[[^\]]*\])?\s*$/;
const ITEM = /^(\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)(\S.*)$/;
const HEADING = /^(#{1,6}\s+)(\S.*)$/;
const NOTES = /\/\*([\s\S]*?)\*\//;

/** For each line of a slide: whether it shows as written, not in a code block nor in the notes. */
const prose = (lines) => {
  let fence = false;
  let comment = false;
  return lines.map((line) => {
    if (FENCE.test(line)) fence = !fence;
    else if (fence) return false;
    else if (comment || line.trimStart().startsWith("/*"))
      comment = !line.includes("*/");
    else return true;
    return false;
  });
};

/** The texts of a slide: its title, headings, list items and paragraphs, with the lines they span. */
export const units = (text) => {
  const found = [];
  const lines = text.split("\n");
  const shown = prose(lines);
  lines.forEach((line, i) => {
    if (shown[i]) {
      const m =
        (i === 0 && TITLE.exec(line)) || ITEM.exec(line) || HEADING.exec(line);
      if (m?.[2]) {
        found.push({
          from: i,
          to: i,
          prefix: m[1],
          body: m[2],
          suffix: m[3] ?? "",
        });
        return;
      }
      if (!line.trim() || OTHER.test(line)) return;
      // the lines of a paragraph follow each other
      const last = found.at(-1);
      if (last?.paragraph && last.to === i - 1) {
        last.to = i;
        last.body += `\n${line}`;
      } else
        found.push({
          from: i,
          to: i,
          prefix: "",
          body: line,
          suffix: "",
          paragraph: true,
        });
    }
  });
  return found;
};

/** The text a piece of markdown shows, to find it on the rendering. */
export const plain = (md) =>
  md
    .replaceAll(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll(/\*\*|__|~~|[*_`]/g, "")
    .replaceAll(/\\(.)/g, "$1")
    .replaceAll(/\s+/g, " ")
    .trim();

/** The slide with the text of `unit` replaced; an emptied unit leaves its lines. */
export const setUnit = (text, unit, body) => {
  const lines = text.split("\n");
  const one = unit.paragraph ? body : body.replaceAll(/\s*\n\s*/g, " ");
  lines.splice(
    unit.from,
    unit.to - unit.from + 1,
    ...(body.trim() || (!unit.paragraph && unit.prefix === "## ")
      ? [`${unit.prefix}${one.trim()}${unit.suffix}`]
      : []),
  );
  return lines.join("\n");
};

/** The slide with a text added after `unit`, as another item of its list or another paragraph. */
export const insertUnit = (text, unit, body) => {
  const lines = text.split("\n");
  const one = body.replaceAll(/\s*\n\s*/g, " ").trim();
  lines.splice(
    unit.to + 1,
    0,
    ...(unit.paragraph
      ? ["", one]
      : [`${unit.prefix.replace(/\[[xX]\]/, "[ ]")}${one}`]),
  );
  return lines.join("\n");
};

const IMAGE = /!image\(([^)\n]*)\)/g;

/** The slide with each of its images replaced by `fn(image, its arguments, its rank)`. */
const eachImage = (text, fn) => {
  const lines = text.split("\n");
  const shown = prose(lines);
  let k = 0;
  return lines
    .map((line, i) =>
      shown[i]
        ? line.replaceAll(IMAGE, (all, args) => fn(all, args, k++))
        : line,
    )
    .join("\n");
};

/** The paths of the images of a slide, in their order. */
export const images = (text) => {
  const found = [];
  eachImage(text, (all, args) => {
    found.push(args.split(",")[0].trim());
    return all;
  });
  return found;
};

const PLACED = /^(position|left|top|margin)\s*:/;

/** The slide with its image `k` placed at `left`, `top`, in % of the slide; one styled by a class stays. */
export const placeImage = (text, k, left, top) =>
  eachImage(text, (all, args, i) => {
    const a = args.split(",");
    const style = a[4]?.trim() ?? "";
    // the image component reads a class there, not a style
    if (i !== k || style.includes("[") || (style && !style.includes(" ")))
      return all;
    while (a.length < 5) a.push("");
    a[4] = [
      ...style
        .split(";")
        .map((d) => d.trim())
        .filter((d) => d && !PLACED.test(d)),
      `position: absolute; left: ${left}%; top: ${top}%; margin: 0`,
    ].join("; ");
    return `!image(${a.join(",")})`;
  });

/** The slide with its image `k` `width` pixels wide, its height following. */
export const sizeImage = (text, k, width) =>
  eachImage(text, (all, args, i) => {
    if (i !== k) return all;
    const a = args.split(",");
    while (a.length < 4) a.push("");
    a[2] = String(width);
    a[3] = "";
    return `!image(${a.join(",")})`;
  });

export const notesOf = (text) => NOTES.exec(text)?.[1].trim() ?? "";

/** The slide with its speaker notes replaced, added or, empty, removed. */
export const withNotes = (text, notes) => {
  const block = notes.trim() ? `/*\n${notes.trim()}\n*/` : "";
  if (NOTES.test(text))
    return text.replace(NOTES, () => block).replace(/\n{3,}/g, "\n\n");
  return block ? `${text.trimEnd()}\n\n${block}\n` : text;
};

/** The markdown of what was typed on the rendering: text, bold, italic, code, links. */
export const toMarkdown = (node) =>
  [...node.childNodes]
    .map((n) => {
      if (n.nodeType === 3) return n.textContent;
      const inner = toMarkdown(n);
      switch (n.nodeName) {
        case "STRONG":
        case "B":
          return inner.trim() ? `**${inner}**` : inner;
        case "EM":
        case "I":
          return inner.trim() ? `_${inner}_` : inner;
        case "DEL":
        case "S":
          return `~~${inner}~~`;
        case "CODE":
          return `\`${n.textContent}\``;
        case "A":
          return `[${inner}](${n.getAttribute("href")})`;
        case "BR":
          return "\n";
        default:
          return inner;
      }
    })
    .join("");
