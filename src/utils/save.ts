import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import type { SliDeskSaveOptions } from "../types";
import convert from "./convert";
import loadEnv from "./loadEnv";

const { log } = console;

const readAllFiles = (dir: string): string[] => {
  const result: string[] = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file, _) => {
    if (
      /(.sdf|.env|.lang.json|.ds_store|plugin.json|.md|.gitignore|.git|.toml|.sdt)$/.exec(
        file.name.toLowerCase(),
      ) === null &&
      /^\/components\//.exec(file.name) === null
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

export default async (
  talkdir: string,
  options: SliDeskSaveOptions,
  additionalEnv: Record<string, unknown | Record<string, unknown>> = {},
) => {
  const env = { ...(await loadEnv(talkdir, options)), ...additionalEnv };
  const files = await convert(talkdir, options, env);
  const promises: Promise<number>[] = [];
  if (options.target === "." || options.target === talkdir) {
    log(
      "=> It is not possible to save to the root of your talk. Try an other path",
    );
    process.exit(0);
  }
  if (options.target && existsSync(options.target))
    rmSync(options.target, { recursive: true, force: true });
  readAllFiles(talkdir).forEach((file, _) => {
    const nfile = file.replace(talkdir, "");
    promises.push(Bun.write(`${options.target}/${nfile}`, Bun.file(file)));
  });
  Object.entries(files).forEach(([key, value], _) => {
    promises.push(Bun.write(`${options.target}/${key}`, value.content ?? ""));
  });
  await Promise.all(promises);
};
