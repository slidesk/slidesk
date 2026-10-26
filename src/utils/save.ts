import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import type { SliDeskSaveOptions } from "../types";
import { CliError } from "./cliError";
import convert from "./convert";
import loadEnv from "./loadEnv";

// sources and tooling the exported presentation does not need
const SOURCES =
  /\.(sdf|sdt|md|toml|env)$|\.lang\.json$|plugin\.json$|^\.git(ignore)?$|^\.ds_store$/;

const readAllFiles = (dir: string): string[] => {
  const result: string[] = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file, _) => {
    if (
      !SOURCES.test(file.name.toLowerCase()) &&
      // components run at build time, their output is already in the html
      !(file.isDirectory() && file.name === "components")
    ) {
      if (file.isDirectory()) {
        result.push(...readAllFiles(path.join(dir, file.name)));
      } else {
        result.push(path.join(dir, file.name));
      }
    }
  });
  return result;
};

const save = async (
  talkdir: string,
  options: SliDeskSaveOptions,
  additionalEnv: Record<string, unknown> = {},
) => {
  const dir = talkdir === "." ? process.cwd() : talkdir;
  const env = { ...(await loadEnv(dir, options)), ...additionalEnv };
  const files = await convert(dir, options, env);
  const promises: Promise<number>[] = [];
  const target = path.resolve(options.target ?? "public");
  const fromTarget = path.relative(target, path.resolve(dir));
  // the target is wiped: it must be neither the talk nor one of its parents
  const outside =
    fromTarget === ".." ||
    fromTarget.startsWith(`..${path.sep}`) ||
    path.isAbsolute(fromTarget);
  if (!outside)
    throw new CliError(
      "=> It is not possible to save to the root of your talk or one of its parents. Try an other path",
    );
  if (existsSync(target)) {
    const previousExport =
      statSync(target).isDirectory() &&
      (readdirSync(target).length === 0 ||
        existsSync(path.join(target, "index.html")));
    if (!previousExport)
      throw new CliError(
        `=> ${options.target} is not empty and is not a SliDesk export. Try an other path`,
      );
    rmSync(target, { recursive: true, force: true });
  }
  readAllFiles(dir).forEach((file, _) => {
    const nfile = file.replace(dir, "");
    promises.push(Bun.write(`${target}/${nfile}`, Bun.file(file)));
  });
  Object.entries(files).forEach(([key, value], _) => {
    promises.push(Bun.write(`${target}/${key}`, value.content ?? ""));
  });
  await Promise.all(promises);
};

export default save;
