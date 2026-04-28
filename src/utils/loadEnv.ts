import { TOML } from "bun";
import type { SliDeskPresentOptions } from "../types";

export default async (
  sdfPath: string,
  options: SliDeskPresentOptions,
): Promise<Record<string, unknown | Record<string, unknown>>> => {
  const slideskEnvFile = Bun.file(
    `${sdfPath}/${options.conf ?? "slidesk.toml"}`,
  );
  if (await slideskEnvFile.exists()) {
    const buf = await slideskEnvFile.text();
    return TOML.parse(buf) as Record<string, unknown | Record<string, unknown>>;
  }
  return {};
};
