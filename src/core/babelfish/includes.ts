import { existsSync, globSync, lstatSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { CliError } from "../../utils/cliError";
import replaceAsync from "../../utils/replaceAsync";

const FENCE = /^\s*(```|~~~)/;

/** Start and end offsets of the fenced code blocks of `data`. */
const fencedBlocks = (data: string) => {
  const blocks: [number, number][] = [];
  let open = -1;
  let marker = "";
  let at = 0;
  for (const line of data.split("\n")) {
    const fence = FENCE.exec(line)?.[1];
    if (fence && open === -1) {
      open = at;
      marker = fence;
    } else if (fence && line.trim().startsWith(marker)) {
      blocks.push([open, at + line.length]);
      open = -1;
    }
    at += line.length + 1;
  }
  if (open !== -1) blocks.push([open, data.length]);
  return blocks;
};

/** Expands the `!include(...)` directives of `file`; `chain` holds the files including it. */
const includes = async (
  file: string,
  chain: string[] = [],
): Promise<string> => {
  const path = resolve(file);
  // only files below the working directory or the talk (the directory of
  // its main file) are read
  const below = (dir: string) => {
    const from = relative(dir, path);
    return !from.startsWith("..") && !isAbsolute(from);
  };
  if (!below(process.cwd()) && !below(dirname(chain[0] ?? path))) return "";
  if (chain.includes(path))
    throw new CliError(
      `!include loop: ${[...chain, path].map((f) => relative(process.cwd(), f)).join(" → ")}`,
    );
  const including = [...chain, path];
  // CRLF files (Windows editors, git checkouts) would glue an included
  // "## " slide to the previous one: slides are split on "\n## "
  const data = `${(await Bun.file(file).text()).replaceAll("\r\n", "\n")}\n`;
  const blocks = fencedBlocks(data);
  return replaceAsync(
    data,
    /\n!include\(([^()]+)\)/g,
    async (match, p1, at) => {
      // a directive shown in a code block is text, not an include
      const line = Number(at) + 1;
      if (blocks.some(([start, end]) => line > start && line < end))
        return match;
      let [dirOrFile, ...exts] = `${p1}`.split(",");
      if (exts.length === 0) exts = ["sdf", "md"];
      const realDirOrFile = `${file.substring(0, file.lastIndexOf("/"))}/${dirOrFile}`;
      if (!existsSync(realDirOrFile))
        throw new CliError(
          `!include(${p1}) in ${relative(process.cwd(), path)}: ${dirOrFile} not found`,
        );
      if (lstatSync(realDirOrFile).isDirectory()) {
        const files = globSync(
          exts.map((ext) => `${realDirOrFile}/**/*.${ext}`),
        ).sort((a, b) => a.localeCompare(b));
        const res = await Promise.all(
          files.map((file) => includes(file, including)),
        );
        return res.join("\n");
      }
      return includes(realDirOrFile, including);
    },
  );
};

export default includes;
