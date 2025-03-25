import { parse } from "dotenv";
import type { SliDeskPresentOptions } from "../../types";

export default async (sdfPath: string, options: SliDeskPresentOptions) => {
  const slideskEnvFile = Bun.file(`${sdfPath}/${options.conf}.env`);
  if (slideskEnvFile.size !== 0) {
    const buf = await slideskEnvFile.text();
    return parse(buf);
  }
  return {};
};
