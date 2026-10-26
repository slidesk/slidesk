import { existsSync } from "node:fs";
import type { Server } from "bun";
import type {
  SliDeskEnv,
  SliDeskFile,
  SliDeskServerOptions,
  SliDeskServerPlugin,
} from "../types";
import display from "./server/display";
import fetch from "./server/fetch";
import getPlugins from "./server/getPlugins";

let serverFiles: SliDeskFile = {};
let serverPath = "";
let server: Server<undefined>;

export default class SlideskServer {
  async create(
    files: SliDeskFile,
    options: SliDeskServerOptions,
    env: SliDeskEnv,
    path: string,
  ) {
    serverFiles = files;
    serverPath = path;
    const serverPlugins: SliDeskServerPlugin[] = [];
    const pluginsDir = `${path}/plugins`;
    const slideskEnv = env.slidesk ?? {};
    if (existsSync(pluginsDir))
      serverPlugins.push(...(await getPlugins(pluginsDir, serverPath)));
    if (
      slideskEnv?.COMMON_DIR &&
      existsSync(`${path}/${slideskEnv.COMMON_DIR}/plugins`)
    )
      serverPlugins.push(
        ...(await getPlugins(
          `${path}/${slideskEnv.COMMON_DIR}/plugins`,
          serverPath,
        )),
      );
    server = Bun.serve({
      port: Number(slideskEnv?.PORT ?? 1337),
      async fetch(req) {
        return fetch(req, this, serverFiles, serverPlugins, serverPath, env);
      },
      websocket: {
        open(ws) {
          ws.subscribe("slidesk");
        },
        async message(ws, message: string) {
          let json: { plugin?: string };
          try {
            json = JSON.parse(message);
          } catch {
            return;
          }
          const addWS = serverPlugins.find(
            (p) => p.name === json.plugin,
          )?.addWS;
          if (json.plugin && addWS) {
            server.publish(
              "slidesk",
              JSON.stringify({
                action: `${json.plugin}_response`,
                response: await addWS(message, server),
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
          slideskEnv?.KEY === undefined ? undefined : Bun.file(slideskEnv.KEY),
        cert:
          slideskEnv?.CERT === undefined
            ? undefined
            : Bun.file(slideskEnv.CERT),
        passphrase:
          slideskEnv?.PASSPHRASE === undefined
            ? undefined
            : slideskEnv.PASSPHRASE,
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
