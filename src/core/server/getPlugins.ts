import { readdirSync } from "node:fs";
import type { SliDeskPlugin, SliDeskServerPlugin } from "../../types";
import { skipBrokenPlugin } from "../babelfish/loadPlugins";

// a new query string on every import bypasses the module cache, so edited hooks are reloaded
let importCount = 0;

const getPlugins = async (pluginsDir: string, serverPath: string) => {
  const serverPlugins: SliDeskServerPlugin[] = [];
  for (const plugin of readdirSync(pluginsDir)) {
    const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
    const pluginFile = Bun.file(pluginPath);
    const exists = await pluginFile.exists();
    if (exists) {
      const obj = await skipBrokenPlugin(pluginPath, async () => {
        const json: Partial<SliDeskPlugin> = await pluginFile.json();
        if (!json.addRoutes && !json.addWS) return undefined;
        const obj: SliDeskServerPlugin = { name: plugin };
        if (typeof json.addRoutes === "string")
          obj.addRoutes = (
            await import(`${serverPath}/${json.addRoutes}?v=${++importCount}`)
          ).default;
        if (typeof json.addWS === "string")
          obj.addWS = (
            await import(`${serverPath}/${json.addWS}?v=${++importCount}`)
          ).default;
        return obj;
      });
      if (obj) serverPlugins.push(obj);
    }
  }
  return serverPlugins;
};

export default getPlugins;
