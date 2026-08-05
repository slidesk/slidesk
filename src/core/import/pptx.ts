import unzip from "../../utils/unzip";
import scan, { attr, unescapeXML } from "./scan";
import type { ImportedDeck, ImportedSlide } from "./types";

const TITLE_PH = ["title", "ctrTitle"];
const BULLET_PH = ["body", "subTitle", "outline"];

const decode = (data?: Uint8Array) =>
  data ? new TextDecoder().decode(data) : "";

const resolve = (base: string, target: string) => {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  target.split("/").forEach((part) => {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  });
  return parts.join("/");
};

const relsOf = (files: Record<string, Uint8Array>, part: string) => {
  const dir = part.split("/").slice(0, -1).join("/");
  const name = part.split("/").pop();
  const xml = decode(files[`${dir}/_rels/${name}.rels`]);
  const map: Record<string, string> = {};
  scan(xml, ["Relationship"]).forEach((rel) => {
    const id = attr(rel.attrs, "Id");
    const target = attr(rel.attrs, "Target");
    if (id && target && attr(rel.attrs, "TargetMode") !== "External")
      map[id] = resolve(part, target);
    else if (id && target) map[id] = target;
  });
  return map;
};

const runText = (run: string) => {
  const text = scan(run, ["a:t"])
    .map((t) => unescapeXML(t.inner))
    .join("");
  if (text === "") return "";
  const props = scan(run, ["a:rPr"])[0]?.attrs ?? "";
  const bold = attr(props, "b") === "1";
  const italic = attr(props, "i") === "1";
  let out = text;
  if (bold) out = `**${out.trim()}**`;
  if (italic) out = `*${out.trim()}*`;
  const link = scan(run, ["a:hlinkClick"])[0];
  return link ? `[${out}](${attr(link.attrs, "r:id") ?? ""})` : out;
};

const paragraphText = (paragraph: string, rels: Record<string, string>) =>
  scan(paragraph, ["a:r", "a:br", "a:fld"])
    .map((node) => {
      if (node.name === "a:br") return "\n";
      const text = runText(node.inner);
      const rId = scan(node.inner, ["a:hlinkClick"])[0]?.attrs;
      const href = rId ? attr(rId, "r:id") : null;
      return href && rels[href]
        ? text.replace(`(${href})`, `(${rels[href]})`)
        : text;
    })
    .join("")
    .replaceAll("\n", " ")
    .trim();

const tableMarkdown = (table: string, rels: Record<string, string>) => {
  const rows = scan(table, ["a:tr"]).map((row) =>
    scan(row.inner, ["a:tc"]).map((cell) =>
      scan(cell.inner, ["a:p"])
        .map((p) => paragraphText(p.inner, rels))
        .join(" ")
        .replaceAll("|", "\\|"),
    ),
  );
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

const shapeMarkdown = (shape: string, rels: Record<string, string>) => {
  const ph = scan(shape, ["p:ph"])[0];
  const phType = ph ? (attr(ph.attrs, "type") ?? "body") : null;
  if (phType && TITLE_PH.includes(phType)) return "";

  const table = scan(shape, ["a:tbl"])[0];
  if (table) return tableMarkdown(table.inner, rels);

  const bulleted = phType !== null && BULLET_PH.includes(phType);
  return scan(shape, ["a:p"])
    .map((paragraph) => {
      const text = paragraphText(paragraph.inner, rels);
      if (text === "") return "";
      const props = scan(paragraph.inner, ["a:pPr"])[0];
      const level = Number(props ? (attr(props.attrs, "lvl") ?? "0") : "0");
      const noBullet = props
        ? scan(props.inner, ["a:buNone"]).length > 0
        : false;
      if (!bulleted || noBullet) return text;
      return `${"  ".repeat(level)}- ${text}`;
    })
    .filter((line) => line !== "")
    .join("\n");
};

const shapeTitle = (shape: string, rels: Record<string, string>) => {
  const ph = scan(shape, ["p:ph"])[0];
  const phType = ph ? attr(ph.attrs, "type") : null;
  if (phType === null || !TITLE_PH.includes(phType)) return "";
  return scan(shape, ["a:p"])
    .map((p) => paragraphText(p.inner, rels))
    .filter((t) => t !== "")
    .join(" ");
};

const cleanAlt = (value: string) =>
  value.replaceAll(/[,()]/g, " ").replaceAll(/\s+/g, " ").trim();

const notesText = (
  files: Record<string, Uint8Array>,
  part: string,
  rels: Record<string, string>,
) => {
  const xml = decode(files[part]);
  const notesRels = relsOf(files, part);
  return scan(xml, ["p:sp"])
    .filter((shape) => {
      const ph = scan(shape.inner, ["p:ph"])[0];
      return ph !== undefined && attr(ph.attrs, "type") === "body";
    })
    .map((shape) =>
      scan(shape.inner, ["a:p"])
        .map((p) => paragraphText(p.inner, { ...rels, ...notesRels }))
        .join("\n"),
    )
    .join("\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
};

const readSlide = (
  files: Record<string, Uint8Array>,
  part: string,
  assets: Record<string, Uint8Array>,
): ImportedSlide => {
  const xml = decode(files[part]);
  const rels = relsOf(files, part);
  const tree = scan(xml, ["p:spTree"])[0]?.inner ?? "";

  let title = "";
  const blocks: string[] = [];
  scan(tree, ["p:sp", "p:pic", "p:graphicFrame"]).forEach((node) => {
    if (node.name === "p:pic") {
      const blip = scan(node.inner, ["a:blip"])[0];
      const rId = blip ? attr(blip.attrs, "r:embed") : null;
      const target = rId ? rels[rId] : null;
      if (target && files[target]) {
        const name = target.split("/").pop() as string;
        assets[name] = files[target];
        const props = scan(node.inner, ["p:cNvPr"])[0]?.attrs ?? "";
        const alt = cleanAlt(attr(props, "descr") ?? attr(props, "name") ?? "");
        blocks.push(`!image(assets/${name}, ${alt})`);
      }
      return;
    }
    const found = shapeTitle(node.inner, rels);
    if (found !== "" && title === "") title = found;
    const markdown = shapeMarkdown(node.inner, rels);
    if (markdown !== "") blocks.push(markdown);
  });

  const notesId = Object.entries(rels).find(([, target]) =>
    target.includes("notesSlides/"),
  );
  const notes =
    notesId && files[notesId[1]] ? notesText(files, notesId[1], rels) : "";

  return { title, content: blocks.join("\n\n"), notes, classes: [] };
};

const pptx = (data: Uint8Array): ImportedDeck => {
  const files = unzip(data);
  if (!files["ppt/presentation.xml"])
    throw new Error("this file does not look like a pptx presentation");

  const rels = relsOf(files, "ppt/presentation.xml");
  const parts = scan(decode(files["ppt/presentation.xml"]), ["p:sldId"])
    .map((sldId) => rels[attr(sldId.attrs, "r:id") ?? ""])
    .filter((part) => part && files[part]);

  const assets: Record<string, Uint8Array> = {};
  const slides = parts.map((part) => readSlide(files, part, assets));
  const core = decode(files["docProps/core.xml"]);
  const title =
    unescapeXML(scan(core, ["dc:title"])[0]?.inner ?? "").trim() ||
    slides.find((s) => s.title !== "")?.title ||
    "Imported presentation";

  return { title, slides, assets };
};

export default pptx;
