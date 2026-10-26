import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SliDeskEnv } from "../../types";
import commonDir from "../../utils/commonDir";

const COMMON = "-=[COMMON]=-/";

/** Warns about the `!image(...)` files that do not exist: they would show as broken images. */
const checkImages = (content: string, sdfPath: string, env: SliDeskEnv) => {
  const common = commonDir(sdfPath, env);
  for (const [, src] of content.matchAll(/!image\(([^,)]*)/g)) {
    // urls and data are not checked
    if (/^([a-z][a-z\d+.-]*:|\/\/)/i.test(src.trim())) continue;
    const file = src.trim().replace(/^\.?\//, "");
    if (file === "") continue;
    const path =
      common && file.startsWith(COMMON)
        ? join(common, file.slice(COMMON.length))
        : join(sdfPath, file);
    if (!existsSync(path)) console.warn(`⚠️  image not found: ${src.trim()}`);
  }
};

export default checkImages;
