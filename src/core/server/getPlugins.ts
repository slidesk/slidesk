import { readdirSync } from "node:fs";
import type { SliDeskPlugin, SliDeskServerPlugin } from "../../types";
import { pluginFilePath, skipBrokenPlugin } from "../../utils/pluginFiles";

// a new query string on every import bypasses the module cache, so edited hooks are reloaded
let importCount = 0;

const getPlugins = async (pluginsDir: string, serverPath: string) => {
  const hook = (file: string) => pluginFilePath(pluginsDir, serverPath, file);
  const loaded = await Promise.all(
    readdirSync(pluginsDir).map(async (plugin) => {
      const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
      const pluginFile = Bun.file(pluginPath);
      if (!(await pluginFile.exists())) return undefined;
      return skipBrokenPlugin(pluginPath, async () => {
        const json: Partial<SliDeskPlugin> = await pluginFile.json();
        if (!json.addRoutes && !json.addWS) return undefined;
        const obj: SliDeskServerPlugin = { name: plugin };
        if (typeof json.addRoutes === "string")
          obj.addRoutes = (
            await import(`${hook(json.addRoutes)}?v=${++importCount}`)
          ).default;
        if (typeof json.addWS === "string")
          obj.addWS = (
            await import(`${hook(json.addWS)}?v=${++importCount}`)
          ).default;
        return obj;
      });
    }),
  );
  return loaded.filter((p): p is SliDeskServerPlugin => p !== undefined);
};

export default getPlugins;
