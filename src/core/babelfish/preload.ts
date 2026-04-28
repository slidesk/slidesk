import loadComponents from "./loadComponents";
import loadFavicon from "./loadFavicon";
import loadPlugins from "./loadPlugins";
import loadTemplates from "./loadTemplates";

export default async (
  sdfPath: string,
  env: Record<string, unknown | Record<string, unknown>>,
) => {
  return {
    plugins: await loadPlugins(sdfPath, env),
    templates: await loadTemplates(sdfPath),
    favicon: await loadFavicon(sdfPath),
    components: loadComponents(sdfPath),
  };
};
