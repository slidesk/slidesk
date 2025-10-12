import type { SliDeskTemplate } from "../../types";

export default async (sdfPath: string) => {
  const templates: SliDeskTemplate = {};
  const glob = new Bun.Glob("**/*.sdt");
  try {
    for await (const file of glob.scan(`${sdfPath}templates`)) {
      templates[file.replace(".sdt", "")] = await Bun.file(
        `${sdfPath}/templates/${file}`,
      ).text();
      templates[file.substring(file.lastIndexOf("/") + 1).replace(".sdt", "")] =
        await Bun.file(`${sdfPath}/templates/${file}`).text();
    }
    for await (const file of glob.scan(`${sdfPath}themes`)) {
      templates[file.replace(".sdt", "")] = await Bun.file(
        `${sdfPath}/themes/${file}`,
      ).text();
      templates[file.substring(file.lastIndexOf("/") + 1).replace(".sdt", "")] =
        await Bun.file(`${sdfPath}/themes/${file}`).text();
    }
  } catch (_) {}
  return templates;
};
