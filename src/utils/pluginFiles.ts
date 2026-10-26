import { existsSync } from "node:fs";
import { dirname, relative } from "node:path";

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

/**
 * A plugin file is looked up next to the directory holding the plugins (the
 * talk, its COMMON_DIR or a theme), then, as before, in the talk itself.
 */
export const pluginFilePath = (
  pluginsDir: string,
  talkdir: string,
  file: string,
) => {
  const own = `${dirname(pluginsDir)}/${file}`;
  return existsSync(own) ? own : `${talkdir}/${file}`;
};
