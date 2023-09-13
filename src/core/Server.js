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
  static create(html, options, path) {
    globalThis.html = html;
    globalThis.path = path;
    // eslint-disable-next-line no-undef
    globalThis.server = Bun.serve({
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
            return notePage(options);
          case "/ws":
            return webSockets(req);
          default:
            return defaultAction(req, options);
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
    });
    if (options.notes)
      log(
        `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp://${options.domain}:${options.port}/notes\x1b[0m`,
      );
    log(
      `Your presentation is available on: \x1b[1m\x1b[36;49mhttp://${options.domain}:${options.port}\x1b[0m`,
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
