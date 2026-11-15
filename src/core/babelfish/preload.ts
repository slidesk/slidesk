import type { SliDeskEnv } from "../../types";
import loadComponents from "./loadComponents";
import loadFavicon from "./loadFavicon";
import loadPlugins from "./loadPlugins";
import loadTemplates from "./loadTemplates";

const preload = async (sdfPath: string, env: SliDeskEnv, theme?: string) => {
  return {
    plugins: await loadPlugins(sdfPath, env, theme),
    templates: await loadTemplates(sdfPath, env, theme),
    favicon: await loadFavicon(sdfPath),
    components: loadComponents(sdfPath, theme),
  };
};

export default preload;
