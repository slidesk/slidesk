import { resolve } from "node:path";
import { content, errorContent } from "../core/Convert";
import type {
  SliDeskEnv,
  SliDeskPresentOptions,
  SliDeskSaveOptions,
} from "../types";
import { CliError } from "./cliError";

const { error } = console;

/** Builds the talk; with `errorPage`, a broken talk renders an ERROR page instead of failing. */
const convert = async (
  talk: string,
  options: SliDeskSaveOptions | SliDeskPresentOptions,
  env: SliDeskEnv,
  errorPage = false,
) => {
  // a relative talk would make its components relative imports of slidesk
  const dir = resolve(talk);
  let mainFile = `${dir}/main.sdf`;
  if (!(await Bun.file(mainFile).exists())) mainFile = `${dir}/main.md`;
  if (!(await Bun.file(mainFile).exists()))
    throw new CliError("🤔 main.(sdf|md) was not found");
  try {
    return await content(mainFile, options, env);
  } catch (e) {
    if (!errorPage) throw e;
    error(e instanceof CliError ? e.message : e);
    return errorContent(options, env);
  }
};

export default convert;
