import { TOML } from "bun";
import type { SliDeskEnv, SliDeskPresentOptions } from "../types";

const loadEnv = async (
  sdfPath: string,
  options: SliDeskPresentOptions,
): Promise<SliDeskEnv> => {
  const slideskEnvFile = Bun.file(
    `${sdfPath}/${options.conf ?? "slidesk.toml"}`,
  );
  if (await slideskEnvFile.exists()) {
    const buf = await slideskEnvFile.text();
    return TOML.parse(buf) as SliDeskEnv;
  }
  return {};
};

export default loadEnv;
