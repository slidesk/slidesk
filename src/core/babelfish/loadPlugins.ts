import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import type { SliDeskEnv, SliDeskPlugin } from "../../types";
import commonDir from "../../utils/commonDir";
import { pluginFilePath } from "../server/getPlugins";

/**
 * A plugin being written (empty or half-typed plugin.json, a file it names
 * that does not exist yet) is skipped with a warning rather than stopping the
 * talk; the next save brings it back.
 */
export const skipBrokenPlugin = async <T>(
  pluginFile: string,
  load: () => Promise<T>,
) => {
  try {
    return await load();
  } catch (e) {
    console.warn(
      `⚠️  ${relative(process.cwd(), pluginFile)} skipped: ${e instanceof Error ? e.message : e}`,
    );
    return undefined;
  }
};

const loadExternalPlugins = async (
  pluginsDir: string,
  sdfPath: string,
  theme = "",
) => {
  const plugins: SliDeskPlugin[] = [];
  if (existsSync(pluginsDir))
    for (const plugin of readdirSync(pluginsDir)) {
      const path = `${pluginsDir}/${plugin}/plugin.json`;
      const pluginFile = Bun.file(path);
      const exists = await pluginFile.exists();
      if (exists) {
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
        if (json) plugins.push({ ...json, name: plugin, theme });
      }
    }
  return plugins;
};

const loadPlugins = async (sdfPath: string, env: SliDeskEnv) => {
  const plugins: SliDeskPlugin[] = [];
  plugins.push(...(await loadExternalPlugins(`${sdfPath}/plugins`, sdfPath)));
  const common = commonDir(sdfPath, env);
  if (common)
    plugins.push(...(await loadExternalPlugins(`${common}/plugins`, sdfPath)));
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
