import { join, resolve } from "node:path";
import type { SliDeskEnv } from "../../types";
import commonDir from "../../utils/commonDir";

const COMMON = "/-=[COMMON]=-/";

// hidden files (.git, .env), the configuration and TLS keys stay on the
// speaker's machine: the talk is served to everyone on the network
const HIDDEN = /(?:^|\/)\./;
const SECRET = /\.(?:toml|pem|key)$/i;

const isPrivate = (fileurl: string, path: string, env: SliDeskEnv) => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(fileurl);
  } catch {
    return true;
  }
  if (HIDDEN.test(decoded) || SECRET.test(decoded)) return true;
  const served = resolve(join(path, decoded));
  // KEY and CERT are read from the working directory, or set from the talk
  return [env.slidesk?.KEY, env.slidesk?.CERT].some(
    (f) =>
      f !== undefined && (resolve(f) === served || resolve(path, f) === served),
  );
};

const getFile = (req: Request, path: string, env: SliDeskEnv) => {
  const common = commonDir(path, env);
  const fileurl = new URL(req.url).pathname;
  if (isPrivate(fileurl, path, env))
    return new Response(`${req.url} not found`, { status: 404 });
  let file = Bun.file(
    common && fileurl.startsWith(COMMON)
      ? join(common, fileurl.slice(COMMON.length))
      : `${path}${fileurl}`,
  );
  // the plugins of COMMON_DIR are served as if they were in the talk
  if (fileurl.startsWith("/plugins/") && file.size === 0 && common)
    file = Bun.file(join(common, fileurl));
  if (file.size !== 0)
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  return new Response(`${req.url} not found`, { status: 404 });
};

export default getFile;
