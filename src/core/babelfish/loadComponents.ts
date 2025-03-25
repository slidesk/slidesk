import { existsSync, readdirSync } from "node:fs";

export default (sdfPath: string) => {
  const componentsDir = `${sdfPath}/components`;
  if (existsSync(componentsDir)) {
    return readdirSync(componentsDir)
      .filter((item) => /.mjs$/gi.test(item))
      .map((c) => `${componentsDir}/${c}`);
  }
  return [];
};
