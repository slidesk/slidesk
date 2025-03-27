import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { SliDeskTemplate } from "../../types";

export default async (sdfPath: string) => {
  const templates: SliDeskTemplate = {};
  if (existsSync(`${sdfPath}/templates`))
    for await (const template of readdirSync(`${sdfPath}/templates`)) {
      if (template.endsWith(".sdt")) {
        templates[template.replace(".sdt", "")] = readFileSync(
          `${sdfPath}/templates/${template}`,
          {
            encoding: "utf-8",
          },
        );
      }
    }
  return templates;
};
