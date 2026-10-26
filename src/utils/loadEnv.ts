import { TOML } from "bun";
import type { SliDeskEnv, SliDeskPresentOptions } from "../types";
import { CliError } from "./cliError";

/** Reads slidesk.toml, or the file given with --conf, which must then exist. */
const loadEnv = async (
  sdfPath: string,
  options: SliDeskPresentOptions,
): Promise<SliDeskEnv> => {
  const name = options.conf || "slidesk.toml";
  const slideskEnvFile = Bun.file(`${sdfPath}/${name}`);
  if (!(await slideskEnvFile.exists())) {
    if (options.conf) throw new CliError(`${options.conf} not found`);
    return {};
  }
  try {
    return TOML.parse(await slideskEnvFile.text()) as SliDeskEnv;
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new CliError(`${name}: ${reason.replace(/^TOML Parse error: /, "")}`);
  }
};

export default loadEnv;
