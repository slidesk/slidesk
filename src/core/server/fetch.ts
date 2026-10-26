import { networkInterfaces } from "node:os";
import type { Server } from "bun";
import type {
  SliDeskEnv,
  SliDeskFile,
  SliDeskServerPlugin,
  SliDeskSocketData,
} from "../../types";
import getFile from "./getFile";

/**
 * A page opened on the speaker's machine, or carrying the token of the speaker
 * view, may drive the talk; any other viewer only follows it.
 */
export const canSend = (
  ip: string | undefined,
  given: string | null,
  token: string | undefined,
) => {
  if (token !== undefined && given === token) return true;
  if (ip === undefined) return false;
  const local = Object.values(networkInterfaces())
    .flat()
    .map((i) => i?.address);
  return ["127.0.0.1", "::1", ...local].includes(ip.replace(/^::ffff:/, ""));
};

const fetch = async (
  req: Request,
  server: Server<SliDeskSocketData>,
  serverFiles: SliDeskFile,
  serverPlugins: SliDeskServerPlugin[],
  serverPath: string,
  env: SliDeskEnv,
  token?: string,
) => {
  const url = new URL(req.url);
  switch (url.pathname) {
    case "/ws":
      return server.upgrade(req, {
        data: {
          canSend: canSend(
            server.requestIP(req)?.address,
            url.searchParams.get("token"),
            token,
          ),
        },
      })
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    case "/":
      return new Response(serverFiles["index.html"].content, {
        headers: serverFiles["index.html"].headers,
      });
    default:
      if (
        Object.keys(serverFiles)
          .map((s) => `/${s}`)
          .includes(url.pathname)
      )
        return new Response(serverFiles[url.pathname.substring(1)].content, {
          headers: serverFiles[url.pathname.substring(1)].headers,
        });
      for (const plugin of serverPlugins) {
        const res = await plugin.addRoutes?.(req, env, serverPath);
        if (res) return res;
      }
      return getFile(req, serverPath, env);
  }
};

export default fetch;
