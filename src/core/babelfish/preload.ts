import type { SliDeskPresentOptions } from "../../types";
import loadComponents from "./loadComponents";
import loadEnv from "../../utils/loadEnv";
import loadFavicon from "./loadFavicon";
import loadPlugins from "./loadPlugins";
import loadTemplates from "./loadTemplates";

export default async (sdfPath: string, options: SliDeskPresentOptions) => {
  const env = await loadEnv(sdfPath, options);
  return {
    env,
    plugins: await loadPlugins(sdfPath, env),
    templates: await loadTemplates(sdfPath),
    favicon: await loadFavicon(sdfPath),
    components: loadComponents(sdfPath),
  };
};
