import { existsSync } from "node:fs";
import type { Server, WebSocket } from "bun";
import type {
  SliDeskFile,
  SliDeskPlugin,
  SliDeskPluginAddWS,
  SliDeskServerOptions,
} from "../types";
import display from "./server/display";
import fetch from "./server/fetch";
import getPlugins from "./server/getPlugins";

let serverFiles: SliDeskFile = {};
let serverPath = "";
let server: Server<WebSocket>;

export default class SlideskServer {
  async create(
    files: SliDeskFile,
    options: SliDeskServerOptions,
    env: Record<string, unknown>,
    path: string,
  ) {
    serverFiles = files;
    serverPath = path;
    const serverPlugins: SliDeskPlugin[] = [];
    const pluginsDir = `${path}/plugins`;
    const slideskEnv = (env.slidesk ?? {}) as Record<string, unknown>;
    if (existsSync(pluginsDir))
      serverPlugins.push(...(await getPlugins(pluginsDir, serverPath)));
    if (
      slideskEnv?.COMMON_DIR &&
      existsSync(`${path}/${slideskEnv?.COMMON_DIR as string}/plugins`)
    )
      serverPlugins.push(
        ...(await getPlugins(
          `${path}/${slideskEnv?.COMMON_DIR as string}/plugins`,
          serverPath,
        )),
      );
    server = Bun.serve({
      development: false,
      port: Number(slideskEnv?.PORT ?? 1337),
      async fetch(req) {
        return fetch(req, this, serverFiles, serverPlugins, serverPath, env);
      },
      websocket: {
        open(ws) {
          ws.subscribe("slidesk");
        },
        async message(ws, message: string) {
          const json = JSON.parse(message);
          if (
            json.plugin &&
            serverPlugins.find((p) => p.name === json.plugin)?.addWS
          ) {
            server.publish(
              "slidesk",
              JSON.stringify({
                action: `${json.plugin}_response`,
                response: await (
                  serverPlugins.find((p) => p.name === json.plugin)
                    ?.addWS as SliDeskPluginAddWS
                )(message, server),
              }),
            );
          } else {
            ws.publish("slidesk", message);
          }
        },
        close(ws) {
          ws.unsubscribe("slidesk");
        },
      },
      tls: {
        key:
          slideskEnv?.KEY === undefined
            ? undefined
            : Bun.file(slideskEnv.KEY as string),
        cert:
          slideskEnv?.CERT === undefined
            ? undefined
            : Bun.file(slideskEnv.CERT as string),
        passphrase:
          slideskEnv?.PASSPHRASE === undefined
            ? undefined
            : (slideskEnv?.PASSPHRASE as string),
      },
    });
    await display(slideskEnv, options);
  }

  setFiles(files: SliDeskFile) {
    serverFiles = files;
    server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }

  send(action: string, data?: object | number | string) {
    server.publish("slidesk", JSON.stringify({ action, data }));
  }
}
