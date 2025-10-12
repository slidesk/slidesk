import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { DotenvParseOutput } from "dotenv";
import type { SliDeskPlugin } from "../../types";

const loadExternalPlugins = async (
  pluginsDir: string,
  sdfPath: string,
  theme = "",
) => {
  const plugins: SliDeskPlugin[] = [];
  if (existsSync(pluginsDir))
    for await (const plugin of readdirSync(pluginsDir)) {
      const pluginFile = Bun.file(`${pluginsDir}/${plugin}/plugin.json`);
      const exists = await pluginFile.exists();
      if (exists) {
        const json = await pluginFile.json();
        ["addHTMLFromFiles"].forEach((t, _) => {
          if (json[t]) {
            const files = json[t];
            json[t] = {};
            files.forEach((s: string, _: number) => {
              json[t][s] = readFileSync(
                `${sdfPath}/${s.replace(/plugins\/([^/]+)\//g, `plugins/${plugin}/`)}`,
                {
                  encoding: "utf8",
                },
              );
            });
          }
        });
        plugins.push({ ...json, name: plugin, theme });
      }
    }
  return plugins;
};

export default async (sdfPath: string, env: DotenvParseOutput) => {
  const plugins: SliDeskPlugin[] = [];
  plugins.push(...(await loadExternalPlugins(`${sdfPath}plugins`, sdfPath)));
  if (env.COMMON_DIR !== "")
    plugins.push(
      ...(await loadExternalPlugins(
        `${sdfPath}/${env.COMMON_DIR}/plugins`,
        sdfPath,
      )),
    );
  if (existsSync(`${sdfPath}themes`)) {
    const themes = readdirSync(`${sdfPath}themes`, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for await (const t of themes) {
      if (existsSync(`${sdfPath}themes/${t}/plugins`))
        plugins.push(
          ...(await loadExternalPlugins(
            `${sdfPath}themes/${t}/plugins`,
            sdfPath,
            `/themes/${t}/`,
          )),
        );
    }
  }
  return plugins;
};
