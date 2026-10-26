import { readdirSync } from "node:fs";
import type { SliDeskPlugin, SliDeskServerPlugin } from "../../types";

const getPlugins = async (pluginsDir: string, serverPath: string) => {
  const serverPlugins: SliDeskServerPlugin[] = [];
  for (const plugin of readdirSync(pluginsDir)) {
    const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
    const pluginFile = Bun.file(pluginPath);
    const exists = await pluginFile.exists();
    if (exists) {
      const json: Partial<SliDeskPlugin> = await pluginFile.json();
      if (json.addRoutes || json.addWS) {
        const obj: SliDeskServerPlugin = { name: plugin };
        if (typeof json.addRoutes === "string")
          obj.addRoutes = (
            await import(`${serverPath}/${json.addRoutes}`)
          ).default;
        if (typeof json.addWS === "string")
          obj.addWS = (await import(`${serverPath}/${json.addWS}`)).default;
        serverPlugins.push(obj);
      }
    }
  }
  return serverPlugins;
};

export default getPlugins;
