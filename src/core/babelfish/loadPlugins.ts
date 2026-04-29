import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { SliDeskPlugin } from "../../types";

const loadExternalPlugins = async (
  pluginsDir: string,
  sdfPath: string,
  theme = "",
) => {
  const plugins: SliDeskPlugin[] = [];
  if (existsSync(pluginsDir))
    for (const plugin of readdirSync(pluginsDir)) {
      const pluginFile = Bun.file(`${pluginsDir}/${plugin}/plugin.json`);
      const exists = await pluginFile.exists();
      if (exists) {
        const json = await pluginFile.json();
        ["addHTMLFromFiles"].forEach((t, _) => {
          if (json[t]) {
            const files = json[t];
            json[t] = {};
            files.forEach((s: string, _: number) => {
              const p = `plugins/${plugin}/`;
              json[t][s] = readFileSync(
                `${sdfPath}/${s.replaceAll(/plugins\/([^/]+)\//g, p)}`,
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

const loadPlugins = async (sdfPath: string, env: Record<string, unknown>) => {
  const plugins: SliDeskPlugin[] = [];
  plugins.push(...(await loadExternalPlugins(`${sdfPath}/plugins`, sdfPath)));
  const slideskEnv = (env.slidesk ?? {}) as Record<string, unknown>;
  const commonDir = (slideskEnv.COMMON_DIR as string) ?? "";
  if (commonDir !== "")
    plugins.push(
      ...(await loadExternalPlugins(
        `${sdfPath}/${commonDir}/plugins`,
        sdfPath,
      )),
    );
  if (existsSync(`${sdfPath}/themes`)) {
    const themes = readdirSync(`${sdfPath}/themes`, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const t of themes) {
      if (existsSync(`${sdfPath}/themes/${t}/plugins`))
        plugins.push(
          ...(await loadExternalPlugins(
            `${sdfPath}/themes/${t}/plugins`,
            sdfPath,
            `/themes/${t}/`,
          )),
        );
    }
  }
  return plugins;
};

export default loadPlugins;
