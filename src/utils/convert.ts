import { content, errorContent } from "../core/Convert";
import type {
  SliDeskEnv,
  SliDeskPresentOptions,
  SliDeskSaveOptions,
} from "../types";
import { CliError } from "./cliError";

const { error } = console;

const convert = async (
  talk: string,
  options: SliDeskSaveOptions | SliDeskPresentOptions,
  env: SliDeskEnv,
) => {
  let mainFile = `${talk}/main.sdf`;
  if (!(await Bun.file(mainFile).exists())) mainFile = `${talk}/main.md`;
  if (!(await Bun.file(mainFile).exists()))
    throw new CliError("🤔 main.(sdf|md) was not found");
  try {
    return await content(mainFile, options, env);
  } catch (e) {
    error(e);
    return errorContent(options, env);
  }
};

export default convert;
