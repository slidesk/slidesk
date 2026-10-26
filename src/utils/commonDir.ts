import { resolve } from "node:path";
import type { SliDeskEnv } from "../types";

/** The COMMON_DIR of a talk as an absolute path: it may be set relative to the talk or absolute. */
const commonDir = (talkdir: string, env: SliDeskEnv) => {
  const dir = env.slidesk?.COMMON_DIR;
  return dir ? resolve(talkdir, dir) : undefined;
};

export default commonDir;
