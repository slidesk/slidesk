import type { SliDeskTemplate } from "../../types";

export default async (sdfPath: string) => {
  const templates: SliDeskTemplate = {};
  const glob = new Bun.Glob("**/*.sdt");
  try {
    for await (const file of glob.scan(`${sdfPath}templates`)) {
      templates[file.replace(".sdt", "")] = await Bun.file(
        `${sdfPath}/templates/${file}`,
      ).text();
    }
  } catch (_) {}
  return templates;
};
