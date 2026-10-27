import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SliDeskEnv } from "../../types";
import commonDir from "../../utils/commonDir";
import { fencedBlocks } from "../../utils/fences";

const COMMON = "-=[COMMON]=-/";

/** Warns about the `!image(...)` files that do not exist: they would show as broken images. */
const checkImages = (content: string, sdfPath: string, env: SliDeskEnv) => {
  const common = commonDir(sdfPath, env);
  // an image shown in a code block is only text
  const prose = fencedBlocks(content).reduceRight(
    (text, [start, end]) => text.slice(0, start) + text.slice(end),
    content,
  );
  for (const [, src] of prose.matchAll(/!image\(([^,)]*)/g)) {
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
