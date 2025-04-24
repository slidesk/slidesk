import { existsSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import type { SliDeskFile } from "../types";

const { log } = console;

const readAllFiles = (dir: string): string[] => {
  const result: string[] = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file, _) => {
    if (
      /(.sdf|.env|.lang.json|.ds_store|plugin.json|readme.md|.gitignore|.git)$/.exec(
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
  savePath: string,
  talkdir: string,
  files: SliDeskFile,
) => {
  const promises: Promise<number>[] = [];
  if (savePath === "." || savePath === talkdir) {
    log(
      "=> It is not possible to save to the root of your talk. Try an other path",
    );
    process.exit(0);
  }
  // clean
  if (savePath && existsSync(savePath))
    rmSync(savePath, { recursive: true, force: true });
  readAllFiles(talkdir).forEach((file, _) => {
    const nfile = file.replace(talkdir, "");
    // eslint-disable-next-line no-undef
    promises.push(Bun.write(`${savePath}/${nfile}`, Bun.file(file)));
  });
  Object.entries(files).forEach(([key, value], _) => {
    // eslint-disable-next-line no-undef
    promises.push(Bun.write(`${savePath}${key}`, value.content ?? ""));
  });
  await Promise.all(promises);
};
