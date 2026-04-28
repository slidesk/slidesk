import { existsSync } from "node:fs";
import type { Server, WebSocket } from "bun";
import type {
  SliDeskFile,
  SliDeskPlugin,
  SliDeskPluginAddWS,
  SliDeskServerEnv,
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
    env: object,
    path: string,
  ) {
    serverFiles = files;
    serverPath = path;
    const serverPlugins: SliDeskPlugin[] = [];
    const pluginsDir = `${path}/plugins`;
    if (existsSync(pluginsDir))
      serverPlugins.push(...(await getPlugins(pluginsDir, serverPath)));
    if (
      env.slidesk?.COMMON_DIR &&
      existsSync(`${path}/${env.slidesk?.COMMON_DIR}/plugins`)
    )
      serverPlugins.push(
        ...(await getPlugins(
          `${path}/${env.slidesk?.COMMON_DIR}/plugins`,
          serverPath,
        )),
      );
    server = Bun.serve({
      port: env.slidesk?.PORT ?? 1337,
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
        key: env.slidesk?.KEY ? Bun.file(env.slidesk?.KEY) : undefined,
        cert: env.slidesk?.CERT ? Bun.file(env.slidesk?.CERT) : undefined,
        passphrase: env.slidesk?.PASSPHRASE ?? undefined,
      },
    });
    await display(env.slidesk?.HTTPS ?? false, options);
  }

  setFiles(files: SliDeskFile) {
    serverFiles = files;
    server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }

  send(action: string, data?: object | number | string) {
    server.publish("slidesk", JSON.stringify({ action, data }));
  }
}
