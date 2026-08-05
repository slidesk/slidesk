import { existsSync, readdirSync } from "node:fs";
import slugify from "../../utils/slugify";
import detect, { entryOf, isURL } from "./detect";
import gslides from "./gslides";
import pptx from "./pptx";
import revealjs from "./revealjs";
import slidev from "./slidev";
import type { ImportedDeck, ImportKind } from "./types";
import files from "./write";

const { log } = console;

const KINDS: ImportKind[] = ["pptx", "gslides", "slidev", "revealjs"];

export type SliDeskImportOptions = {
  type?: string;
  output?: string;
  force?: boolean;
};

const read = async (source: string) => {
  if (isURL(source)) {
    const response = await fetch(source, { redirect: "follow" });
    if (!response.ok)
      throw new Error(`unable to download ${source} (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  }
  const file = Bun.file(source);
  if (!(await file.exists())) throw new Error(`${source} not found`);
  return new Uint8Array(await file.arrayBuffer());
};

const parse = async (
  kind: ImportKind,
  source: string,
  data: Uint8Array,
): Promise<ImportedDeck> => {
  if (kind === "gslides") return pptx(await gslides(source));
  if (kind === "pptx") return pptx(data);
  const text = new TextDecoder().decode(data);
  return kind === "revealjs" ? revealjs(text) : slidev(text);
};

const importTalk = async (source: string, options: SliDeskImportOptions) => {
  if (options.type && !KINDS.includes(options.type as ImportKind))
    throw new Error(
      `${options.type} is not a valid import type (${KINDS.join(", ")})`,
    );

  const entry = isURL(source) ? source : entryOf(source);
  const kind =
    (options.type as ImportKind) ??
    detect(entry, isURL(entry) ? null : await read(entry));
  const data = kind === "gslides" ? new Uint8Array() : await read(entry);

  log(`📥 importing as ${kind}`);
  const deck = await parse(kind, entry, data);
  if (!deck.slides.length)
    throw new Error("no slide found in this presentation");

  const target =
    options.output && options.output !== ""
      ? options.output
      : slugify(deck.title.normalize("NFD").replaceAll(/\p{M}/gu, "")) ||
        "imported-talk";
  if (existsSync(target) && readdirSync(target).length && !options.force)
    throw new Error(`${target} already exists and is not empty (use --force)`);

  const written = files(deck);
  await Promise.all(
    Object.entries(written).map(([name, content]) =>
      Bun.write(`${target}/${name}`, content, { createPath: true }),
    ),
  );

  const withNotes = deck.slides.filter((s) => s.notes !== "").length;
  log(
    `✅ ${target} — ${deck.slides.length} slides, ${Object.keys(deck.assets).length} assets, ${withNotes} with notes`,
  );
  log(`\n   cd ${target} && slidesk`);
};

export default importTalk;
