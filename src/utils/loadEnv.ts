import { parse } from "dotenv";
import type { SliDeskPresentOptions } from "../types";

export default async (sdfPath: string, options: SliDeskPresentOptions) => {
  const slideskEnvFile = Bun.file(`${sdfPath}${options.conf ?? ""}.env`);
  if (await slideskEnvFile.exists()) {
    const buf = await slideskEnvFile.text();
    return parse(buf);
  }
  return {};
};
