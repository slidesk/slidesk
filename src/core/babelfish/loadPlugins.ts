import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { SliDeskEnv, SliDeskPlugin } from "../../types";
import commonDir from "../../utils/commonDir";
import { pluginFilePath, skipBrokenPlugin } from "../../utils/pluginFiles";

const loadExternalPlugins = async (
  pluginsDir: string,
  sdfPath: string,
  theme = "",
) => {
  if (!existsSync(pluginsDir)) return [];
  const loaded = await Promise.all(
    readdirSync(pluginsDir).map(
      async (plugin): Promise<SliDeskPlugin | undefined> => {
        const path = `${pluginsDir}/${plugin}/plugin.json`;
        const pluginFile = Bun.file(path);
        if (!(await pluginFile.exists())) return undefined;
        const json = await skipBrokenPlugin(path, async () => {
          const json: Omit<SliDeskPlugin, "name"> = await pluginFile.json();
          if (Array.isArray(json.addHTMLFromFiles)) {
            const p = `plugins/${plugin}/`;
            json.addHTMLFromFiles = Object.fromEntries(
              json.addHTMLFromFiles.map((s) => [
                s,
                readFileSync(
                  pluginFilePath(
                    pluginsDir,
                    sdfPath,
                    s.replaceAll(/plugins\/([^/]+)\//g, p),
                  ),
                  { encoding: "utf8" },
                ),
              ]),
            );
          }
          return json;
        });
        return json ? { ...json, name: plugin, theme } : undefined;
      },
    ),
  );
  return loaded.filter((p): p is SliDeskPlugin => p !== undefined);
};

const loadPlugins = async (sdfPath: string, env: SliDeskEnv) => {
  const common = commonDir(sdfPath, env);
  const themes = existsSync(`${sdfPath}/themes`)
    ? readdirSync(`${sdfPath}/themes`, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];
  // the talk, then its COMMON_DIR, then each theme: the order is kept
  const sources = [
    loadExternalPlugins(`${sdfPath}/plugins`, sdfPath),
    common ? loadExternalPlugins(`${common}/plugins`, sdfPath) : [],
    ...themes.map((t) =>
      loadExternalPlugins(
        `${sdfPath}/themes/${t}/plugins`,
        sdfPath,
        `/themes/${t}/`,
      ),
    ),
  ];
  return (await Promise.all(sources)).flat();
};

export default loadPlugins;
