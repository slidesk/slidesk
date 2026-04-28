import Convert, { errorContent } from "../core/Convert";
import type { SliDeskPresentOptions, SliDeskSaveOptions } from "../types";

const { error } = console;

export default async (
  talk: string,
  options: SliDeskSaveOptions | SliDeskPresentOptions,
  env: Record<string, unknown | Record<string, unknown>>,
) => {
  let files: { [key: string]: { content: string } } = {};
  try {
    const sdfMainFile = Bun.file(`${talk}/main.sdf`);
    const mdMainFile = Bun.file(`${talk}/main.md`);
    if (await sdfMainFile.exists())
      files = await Convert(`${talk}/main.sdf`, options, env);
    else if (await mdMainFile.exists())
      files = await Convert(`${talk}/main.md`, options, env);
    else {
      error("🤔 main.(sdf|md) was not found");
      process.exit(1);
    }
  } catch (e) {
    files = await errorContent(options, env);
    error(e);
  }
  if (files === null) {
    process.exit();
  }
  return files;
};
