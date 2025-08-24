import { existsSync } from "node:fs";
import type { Server } from "bun";
import type {
  SliDeskFile,
  SliDeskPlugin,
  SliDeskPluginAddWS,
  SliDeskServerOptions,
} from "../types";
import loadEnv from "../utils/loadEnv";
import display from "./server/display";
import fetch from "./server/fetch";
import getPlugins from "./server/getPlugins";

let serverFiles: SliDeskFile = {};
let serverPath = "";
let server: Server;

export default class SlideskServer {
  async create(
    files: SliDeskFile,
    options: SliDeskServerOptions,
    path: string,
  ) {
    serverFiles = files;
    serverPath = path;
    const serverPlugins: SliDeskPlugin[] = [];
    const env = await loadEnv(path, options);
    const pluginsDir = `${path}/plugins`;
    if (existsSync(pluginsDir))
      serverPlugins.push(...(await getPlugins(pluginsDir, serverPath)));
    if (env.COMMON_DIR && existsSync(`${path}/${env.COMMON_DIR}/plugins`))
      serverPlugins.push(
        ...(await getPlugins(`${path}/${env.COMMON_DIR}/plugins`, serverPath)),
      );
    server = Bun.serve({
      port: options.port,
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
        key: env.KEY ? Bun.file(env.KEY) : undefined,
        cert: env.CERT ? Bun.file(env.CERT) : undefined,
        passphrase: env.PASSPHRASE ?? undefined,
      },
    });
    await display(env.HTTPS === "true", options);
  }

  setFiles(files: SliDeskFile) {
    serverFiles = files;
    server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }

  send(action: string, data?: object | number | string) {
    server.publish("slidesk", JSON.stringify({ action, data }));
  }
}
