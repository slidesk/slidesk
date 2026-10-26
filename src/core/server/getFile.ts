import { join } from "node:path";
import type { SliDeskEnv } from "../../types";
import commonDir from "../../utils/commonDir";

const COMMON = "/-=[COMMON]=-/";

const getFile = (req: Request, path: string, env: SliDeskEnv) => {
  const common = commonDir(path, env);
  const fileurl = new URL(req.url).pathname;
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
