import type { SliDeskEnv } from "../../types";
import loadComponents from "./loadComponents";
import loadFavicon from "./loadFavicon";
import loadPlugins from "./loadPlugins";
import loadTemplates from "./loadTemplates";

const preload = async (sdfPath: string, env: SliDeskEnv) => {
  return {
    plugins: await loadPlugins(sdfPath, env),
    templates: await loadTemplates(sdfPath),
    favicon: await loadFavicon(sdfPath),
    components: loadComponents(sdfPath),
  };
};

export default preload;
