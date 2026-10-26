import type { Server } from "bun";
import type { SliDeskEnv, SliDeskFile, SliDeskServerPlugin } from "../../types";
import getFile from "./getFile";

const fetch = async (
  req: Request,
  server: Server<undefined>,
  serverFiles: SliDeskFile,
  serverPlugins: SliDeskServerPlugin[],
  serverPath: string,
  env: SliDeskEnv,
) => {
  const url = new URL(req.url);
  switch (url.pathname) {
    case "/ws":
      return server.upgrade(req)
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
