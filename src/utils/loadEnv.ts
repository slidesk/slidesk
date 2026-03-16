import type { SliDeskEnv, SliDeskPresentOptions } from "../types";

const parse = (content: string) => {
  const lines = content.split("\n");
  const env: SliDeskEnv = {};
  for (const line of lines) {
    const [key, value] = line.split("=");
    if (key && value) {
      env[key.trim()] = value.trim().replace(/"/g, "");
    }
  }
  return env;
};

export default async (sdfPath: string, options: SliDeskPresentOptions) => {
  const slideskEnvFile = Bun.file(`${sdfPath}${options.conf ?? ""}/.env`);
  if (await slideskEnvFile.exists()) {
    const buf = await slideskEnvFile.text();
    return parse(buf);
  }
  return {};
};
