import { existsSync, globSync, lstatSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { CliError } from "../../utils/cliError";
import replaceAsync from "../../utils/replaceAsync";

/** Expands the `!include(...)` directives of `file`; `chain` holds the files including it. */
const includes = async (
  file: string,
  chain: string[] = [],
): Promise<string> => {
  const path = resolve(file);
  // only files below the working directory are read (paths, not file:// urls,
  // so that it also holds on Windows)
  const fromCwd = relative(process.cwd(), path);
  if (fromCwd.startsWith("..") || isAbsolute(fromCwd)) return "";
  if (chain.includes(path))
    throw new CliError(
      `!include loop: ${[...chain, path].map((f) => relative(process.cwd(), f)).join(" → ")}`,
    );
  const including = [...chain, path];
  // CRLF files (Windows editors, git checkouts) would glue an included
  // "## " slide to the previous one: slides are split on "\n## "
  const data = (await Bun.file(file).text()).replaceAll("\r\n", "\n");
  return replaceAsync(`${data}\n`, /\n!include\(([^()]+)\)/g, async (_, p1) => {
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
      const res: string[] = [];
      for (const file of files) {
        res.push(await includes(file, including));
      }
      return res.join("\n");
    }
    return includes(realDirOrFile, including);
  });
};

export default includes;
