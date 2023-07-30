import speakerViewHTML from "../templates/notes/layout.html.txt";
import speakerViewCSS from "../templates/notes/styles.css.txt";
import speakerViewJS from "../templates/notes/script.js.txt";
import themeCSS from "../templates/theme.css.txt";
import faviconSVG from "../templates/SD.svg.txt";

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
          return new Response(globalThis.html, {
            headers: {
              "Content-Type": "text/html",
            },
          });
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
              .replace("/* #SV_SCRIPT# */", speakerViewJS),
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

    // eslint-disable-next-line no-console
    console.log(`📽️\thttp://localhost:${options.port}`);
    if (options.notes)
      // eslint-disable-next-line no-console
      console.log(`📝\thttp://localhost:${options.port}/notes`);
  }

  static setHTML(html) {
    globalThis.html = html;
    globalThis.server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }
}
