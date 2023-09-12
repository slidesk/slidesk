import speakerViewHTML from "../templates/notes/layout.html.txt";
import speakerViewCSS from "../templates/notes/styles.css.txt";
import speakerViewJS from "../templates/notes/script.js.txt";
import gamepadJS from "../templates/notes/gamepad.js.txt";
import themeCSS from "../templates/theme.css.txt";
import faviconSVG from "../templates/SD.svg.txt";

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
        if (url.pathname === "/")
          return new Response(globalThis.html.index.html, {
            headers: {
              "Content-Type": "text/html",
            },
          });
        if (url.pathname.match(/^\/--(\w+)--\/$/g))
          return new Response(
            globalThis.html[
              url.pathname.replaceAll("-", "").replaceAll("/", "")
            ].html,
            {
              headers: {
                "Content-Type": "text/html",
              },
            },
          );
        if (url.pathname === "/favicon.svg")
          return new Response(faviconSVG, {
            headers: { "Content-Type": "image/svg+xml" },
          });
        if (url.pathname === "/notes")
          return new Response(
            speakerViewHTML
              .replace(
                "/* #SOCKETS# */",
                `window.slidesk.io = new WebSocket("ws://localhost:${options.port}/ws");`,
              )
              .replace("/* #STYLES# */", themeCSS)
              .replace("/* #SV_STYLES# */", speakerViewCSS)
              .replace(
                "/* #SV_SCRIPT# */",
                speakerViewJS + (options.gamepadSv ? gamepadJS : ""),
              ),
            {
              headers: {
                "Content-Type": "text/html",
              },
            },
          );
        if (url.pathname === "/ws")
          return globalThis.server.upgrade(req)
            ? undefined
            : new Response("WebSocket upgrade error", { status: 400 });
        const fileurl = req.url.replace(`http://localhost:${options.port}`, "");
        // eslint-disable-next-line no-undef
        const file = Bun.file(
          fileurl.match(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
          )
            ? fileurl
            : `${globalThis.path}${fileurl}`,
        );
        if (file.size !== 0)
          return new Response(file, {
            headers: {
              "Content-Type": file.type,
            },
          });
        return new Response(`${req.url} not found`, { status: 404 });
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
        `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp://localhost:${options.port}/notes\x1b[0m`,
      );
    log(
      `Your presentation is available on: \x1b[1m\x1b[36;49mhttp://localhost:${options.port}\x1b[0m`,
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
