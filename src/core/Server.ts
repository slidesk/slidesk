import dotenv from "dotenv";
import { existsSync } from "node:fs";
import type {
  SliDeskFile,
  ServerOptions,
  PluginsJSON,
  SlideskPluginAddWS,
} from "../types";
import type { Server } from "bun";
import getPlugins from "./server/getPlugins";
import display from "./server/display";
import fetch from "./server/fetch";

let serverFiles: SliDeskFile = {};
let serverPath = "";
let server: Server;
let env: { [key: string]: string } = {};

export default class SlideskServer {
  async create(files: SliDeskFile, options: ServerOptions, path: string) {
    serverFiles = files;
    serverPath = path;
    let serverPlugins: PluginsJSON = {};
    const slideskEnvFile = Bun.file(`${path}/.env`);
    if (slideskEnvFile.size !== 0) {
      const buf = await slideskEnvFile.text();
      env = dotenv.parse(buf);
    }
    const pluginsDir = `${path}/plugins`;
    if (existsSync(pluginsDir))
      serverPlugins = {
        ...serverPlugins,
        ...(await getPlugins(pluginsDir, serverPath)),
      };
    if (env.COMMON_DIR && existsSync(`${path}/${env.COMMON_DIR}/plugins`))
      serverPlugins = {
        ...serverPlugins,
        ...(await getPlugins(`${path}/${env.COMMON_DIR}/plugins`, serverPath)),
      };
    server = Bun.serve({
      port: options.port,
      async fetch(req) {
        return fetch(
          req,
          this,
          options,
          serverFiles,
          serverPlugins,
          serverPath,
          env,
        );
      },
      websocket: {
        open(ws) {
          ws.subscribe("slidesk");
        },
        async message(ws, message: string) {
          const json = JSON.parse(message);
          if (json.plugin && serverPlugins[json.plugin]?.addWS) {
            server.publish(
              "slidesk",
              JSON.stringify({
                action: `${json.plugin}_response`,
                response: await (
                  serverPlugins[json.plugin].addWS as SlideskPluginAddWS
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
