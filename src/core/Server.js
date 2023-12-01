/* eslint-disable no-undef */
import dotenv from "dotenv";
import { webSockets, getFile } from "../utils/server";

const { log } = console;

export default class Server {
  static async create(files, options, path) {
    globalThis.files = files;
    globalThis.path = path;
    const slideskEnvFile = Bun.file(`${path}/.env`);
    let env = {};
    if (slideskEnvFile.size !== 0) {
      const buf = await slideskEnvFile.text();
      env = dotenv.parse(buf);
    }
    const https = env.HTTPS === "true";
    const serverOptions = {
      port: options.port,
      fetch(req) {
        const url = new URL(req.url);
        switch (url.pathname) {
          case "/ws":
            return webSockets(req);
          case "/":
            return new Response(globalThis.files["index.html"].content, {
              headers: globalThis.files["index.html"].headers,
            });
          default:
            if (Object.keys(files).indexOf(url.pathname) !== -1)
              return new Response(globalThis.files[url.pathname].content, {
                headers: globalThis.files[url.pathname].headers,
              });
            return getFile(req, options, https);
        }
      },
      websocket: {
        open(ws) {
          ws.subscribe("slidesk");
        },
        message(ws, message) {
          ws.publish("slidesk", message);
        },
        close(ws) {
          ws.unsubscribe("slidesk");
        },
      },
    };
    if (https) {
      serverOptions.tls = {
        key: Bun.file(env.KEY),
        cert: Bun.file(env.CERT),
        passphrase: env.PASSPHRASE ? Bun.file(env.PASSPHRASE) : "",
      };
    }
    globalThis.server = Bun.serve(serverOptions);
    if (options.notes)
      log(
        `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp${
          https ? "s" : ""
        }://${options.domain}:${options.port}/notes\x1b[0m`,
      );
    log(
      `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
        https ? "s" : ""
      }://${options.domain}:${options.port}\x1b[0m`,
    );
    log();
  }

  static setFiles(files) {
    globalThis.files = files;
    globalThis.server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }

  static send(action) {
    globalThis.server.publish("slidesk", JSON.stringify({ action }));
  }
}
