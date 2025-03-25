import { readdirSync } from "node:fs";
import type { PluginsJSON } from "../../types";

export default async (pluginsDir: string, serverPath: string) => {
  const serverPlugins: PluginsJSON = {};
  for await (const plugin of readdirSync(pluginsDir)) {
    const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
    const pluginFile = Bun.file(pluginPath);
    const exists = await pluginFile.exists();
    if (exists) {
      const json = await pluginFile.json();
      if (json.addRoutes || json.addWS) {
        let obj = { type: "external", ...json };
        if (json.addRoutes) {
          const { default: addRoutes } = await import(
            `${serverPath}/${json.addRoutes}`
          );
          obj = { ...obj, addRoutes };
        }
        if (json.addWS) {
          const { default: addWS } = await import(
            `${serverPath}/${json.addWS}`
          );
          obj = { ...obj, addWS };
        }
        serverPlugins[plugin] = obj;
      }
    }
  }
  return serverPlugins;
};
