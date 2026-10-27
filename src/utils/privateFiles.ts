import { join, resolve } from "node:path";
import type { SliDeskEnv } from "../types";

// hidden files (.git, .env, .npmrc), the configuration and TLS keys stay on
// the speaker's machine: present does not serve them, save does not export them
const HIDDEN = /(?:^|[/\\])\./;
const SECRET = /\.(?:toml|pem|key)$/i;

/** Whether `file`, a path relative to the talk, must stay private. */
const isPrivateFile = (file: string, talkdir: string, env: SliDeskEnv) => {
  if (HIDDEN.test(file) || SECRET.test(file)) return true;
  const path = resolve(join(talkdir, file));
  // KEY and CERT are read from the working directory, or set from the talk
  return [env.slidesk?.KEY, env.slidesk?.CERT].some(
    (f) =>
      f !== undefined && (resolve(f) === path || resolve(talkdir, f) === path),
  );
};

export default isPrivateFile;
