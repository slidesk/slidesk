import { TOML } from "bun";
import type { SliDeskPresentOptions } from "../types";

const loadEnv = async (
  sdfPath: string,
  options: SliDeskPresentOptions,
): Promise<Record<string, unknown>> => {
  const slideskEnvFile = Bun.file(
    `${sdfPath}/${options.conf ?? "slidesk.toml"}`,
  );
  if (await slideskEnvFile.exists()) {
    const buf = await slideskEnvFile.text();
    return TOML.parse(buf) as Record<string, unknown>;
  }
  return {};
};

export default loadEnv;
