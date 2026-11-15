import { existsSync } from "node:fs";
import type { SliDeskEnv, SliDeskTemplate } from "../../types";
import commonDir from "../../utils/commonDir";

const loadTemplates = async (sdfPath: string, env: SliDeskEnv = {}) => {
  const templates: SliDeskTemplate = {};
  const glob = new Bun.Glob("**/*.sdt");
  const common = commonDir(sdfPath, env);
  // COMMON_DIR first: the talk, then its themes, override a template of the same name
  const dirs = [
    ...(common ? [`${common}/templates`] : []),
    `${sdfPath}/templates`,
    `${sdfPath}/themes`,
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for await (const file of glob.scan(dir)) {
      const text = await Bun.file(`${dir}/${file}`).text();
      templates[file.replace(".sdt", "")] = text;
      templates[file.substring(file.lastIndexOf("/") + 1).replace(".sdt", "")] =
        text;
    }
  }
  return templates;
};

export default loadTemplates;
