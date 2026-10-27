import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import type { SliDeskEnv, SliDeskSaveOptions } from "../types";
import { CliError } from "./cliError";
import commonDir from "./commonDir";
import convert from "./convert";
import loadEnv from "./loadEnv";
import isPrivateFile from "./privateFiles";

// sources and tooling the exported presentation does not need
const SOURCES = /\.(sdf|sdt|md)$|\.lang\.json$|plugin\.json$|^link\.yml$/;

/** The files of `root` to export: neither sources nor private files, which a deploy would publish. */
const readAllFiles = (root: string, env: SliDeskEnv, dir = root): string[] => {
  const result: string[] = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file, _) => {
    const full = path.join(dir, file.name);
    if (
      !SOURCES.test(file.name.toLowerCase()) &&
      !isPrivateFile(path.relative(root, full), root, env) &&
      // components run at build time, their output is already in the html
      !(file.isDirectory() && file.name === "components")
    ) {
      if (file.isDirectory()) {
        result.push(...readAllFiles(root, env, full));
      } else {
        result.push(full);
      }
    }
  });
  return result;
};

const save = async (
  talkdir: string,
  options: SliDeskSaveOptions,
  additionalEnv: SliDeskEnv = {},
) => {
  const dir = talkdir === "." ? process.cwd() : talkdir;
  const loaded = await loadEnv(dir, options);
  // the [slidesk] settings of the talk are completed, not replaced
  const env: SliDeskEnv = {
    ...loaded,
    ...additionalEnv,
    slidesk: { ...loaded.slidesk, ...additionalEnv.slidesk },
  };
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
  readAllFiles(dir, env).forEach((file, _) => {
    const nfile = file.replace(dir, "");
    promises.push(Bun.write(`${target}/${nfile}`, Bun.file(file)));
  });
  // the shared files are served at -=[COMMON]=-/ and its plugins at plugins/
  const common = commonDir(dir, env);
  if (common && existsSync(common))
    for (const file of readAllFiles(common, env)) {
      const shared = path.relative(common, file);
      promises.push(
        Bun.write(`${target}/-=[COMMON]=-/${shared}`, Bun.file(file)),
      );
      if (shared.startsWith(`plugins${path.sep}`))
        promises.push(Bun.write(`${target}/${shared}`, Bun.file(file)));
    }
  Object.entries(files).forEach(([key, value], _) => {
    promises.push(Bun.write(`${target}/${key}`, value.content ?? ""));
  });
  await Promise.all(promises);
};

export default save;
