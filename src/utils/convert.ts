import { content, errorContent } from "../core/Convert";
import type {
  SliDeskEnv,
  SliDeskFile,
  SliDeskPresentOptions,
  SliDeskSaveOptions,
} from "../types";

const { error } = console;

const convert = async (
  talk: string,
  options: SliDeskSaveOptions | SliDeskPresentOptions,
  env: SliDeskEnv,
) => {
  let files: SliDeskFile = {};
  try {
    const sdfMainFile = Bun.file(`${talk}/main.sdf`);
    const mdMainFile = Bun.file(`${talk}/main.md`);
    if (await sdfMainFile.exists())
      files = await content(`${talk}/main.sdf`, options, env);
    else if (await mdMainFile.exists())
      files = await content(`${talk}/main.md`, options, env);
    else {
      error("🤔 main.(sdf|md) was not found");
      process.exit(1);
    }
  } catch (e) {
    files = await errorContent(options, env);
    error(e);
  }
  return files;
};

export default convert;
