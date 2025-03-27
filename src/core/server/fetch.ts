import type { Server } from "bun";
import getFile from "./getFile";
import type {
  PluginsJSON,
  ServerOptions,
  SliDeskFile,
  SlideskPluginAddRoute,
} from "../../types";

export default async (
  req: Request,
  server: Server,
  options: ServerOptions,
  serverFiles: SliDeskFile,
  serverPlugins: PluginsJSON,
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
      if (
        !req.headers.get("host")?.startsWith("localhost") &&
        req.headers.get("host") === `${options.domain}:${options.port}` &&
        !options.interactive
      )
        return new Response("");
      return new Response(serverFiles["/index.html"].content, {
        headers: serverFiles["/index.html"].headers,
      });
    default:
      if (Object.keys(serverFiles).includes(url.pathname))
        return new Response(serverFiles[url.pathname].content, {
          headers: serverFiles[url.pathname].headers,
        });
      for await (const plugin of [...Object.values(serverPlugins)]) {
        if (plugin.addRoutes) {
          res = await (plugin.addRoutes as SlideskPluginAddRoute)(
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
