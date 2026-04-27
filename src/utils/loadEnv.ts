import { TOML } from "bun";
import type { SliDeskPresentOptions } from "../types";

export default async (
  sdfPath: string,
  options: SliDeskPresentOptions,
): Promise<object> => {
  const slideskEnvFile = Bun.file(
    `${sdfPath}/${options.conf ?? "slidesk.toml"}`,
  );
  if (await slideskEnvFile.exists()) {
    const buf = await slideskEnvFile.text();
    return TOML.parse(buf);
  }
  return {};
};
