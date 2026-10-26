import type { SliDeskEnv } from "../../types";

const getFile = (req: Request, path: string, env: SliDeskEnv) => {
  const commonDir = env.slidesk?.COMMON_DIR ?? "";
  let fileurl = req.url.replaceAll(
    new RegExp(`^https?://${req.headers.get("host")}`, "g"),
    "",
  );
  if (fileurl.startsWith("/-=[COMMON]=-"))
    fileurl = fileurl.replace("-=[COMMON]=-", commonDir);
  let file = Bun.file(
    fileurl.match(/https?:\/\/(\S*)/g) ? fileurl : `${path}${fileurl}`,
  );
  if (fileurl.startsWith("/plugins") && file.size === 0 && commonDir) {
    fileurl = fileurl.replace("/plugins", `/${commonDir}/plugins`);
    file = Bun.file(`${path}${fileurl}`);
  }
  if (file.size !== 0)
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  return new Response(`${req.url} not found`, { status: 404 });
};

export default getFile;
