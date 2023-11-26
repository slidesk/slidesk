/* eslint-disable no-undef */
import dotenv from "dotenv";
import {
  langPage,
  defaultPage,
  favicon,
  notePage,
  webSockets,
  defaultAction,
} from "../utils/server";

const { log } = console;

export default class Server {
  static async create(html, options, path) {
    globalThis.html = html;
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
        if (url.pathname.match(/^\/--(\w+)--\/$/g))
          return langPage(url.pathname);
        switch (url.pathname) {
          case "/":
            return defaultPage();
          case "/favicon.svg":
            return favicon();
          case "/notes":
            return notePage(options, https);
          case "/ws":
            return webSockets(req);
          default:
            return defaultAction(req, options, https);
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
        passphrase: Bun.file(env.PASSPHRASE) || "",
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

  static setHTML(html) {
    globalThis.html = html;
    globalThis.server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }

  static send(action) {
    globalThis.server.publish("slidesk", JSON.stringify({ action }));
  }
}
