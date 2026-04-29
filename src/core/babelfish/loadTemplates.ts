import { existsSync } from "node:fs";
import type { SliDeskTemplate } from "../../types";

const loadTemplates = async (sdfPath: string) => {
  const templates: SliDeskTemplate = {};
  const glob = new Bun.Glob("**/*.sdt");
  if (existsSync(`${sdfPath}/templates`))
    for await (const file of glob.scan(`${sdfPath}/templates`)) {
      templates[file.replace(".sdt", "")] = await Bun.file(
        `${sdfPath}/templates/${file}`,
      ).text();
      templates[file.substring(file.lastIndexOf("/") + 1).replace(".sdt", "")] =
        await Bun.file(`${sdfPath}/templates/${file}`).text();
    }
  if (existsSync(`${sdfPath}/themes`))
    for await (const file of glob.scan(`${sdfPath}/themes`)) {
      templates[file.replace(".sdt", "")] = await Bun.file(
        `${sdfPath}/themes/${file}`,
      ).text();
      templates[file.substring(file.lastIndexOf("/") + 1).replace(".sdt", "")] =
        await Bun.file(`${sdfPath}/themes/${file}`).text();
    }
  return templates;
};

export default loadTemplates;
