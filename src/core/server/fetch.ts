import type { Server } from "bun";
import type {
  SliDeskFile,
  SliDeskPlugin,
  SliDeskPluginAddRoute,
} from "../../types";
import getFile from "./getFile";

export default async (
  req: Request,
  server: Server,
  serverFiles: SliDeskFile,
  serverPlugins: SliDeskPlugin[],
  serverPath: string,
  env: { [key: string]: string },
) => {
  const url = new URL(req.url);
  let res: Response | null = null;
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
      for await (const plugin of [...Object.values(serverPlugins)]) {
        if (plugin.addRoutes) {
          res = await (plugin.addRoutes as SliDeskPluginAddRoute)(
            req,
            env,
            serverPath,
          );
        }
      }
      if (res !== null) return res;
      return getFile(req, serverPath, env);
  }
};
