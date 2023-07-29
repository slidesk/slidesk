const speakerViewHTML = await Bun.file(
  import.meta.resolveSync("../templates/speaker-view.html")
).text();
const themeCSS = await Bun.file(
  import.meta.resolveSync("../templates/theme.css")
).text();
const faviconSVG = await Bun.file(
  import.meta.resolveSync("../templates/SD.svg")
).text();

export default class Server {
  constructor(html, options, path) {
    globalThis.html = html;
    globalThis.path = path;
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
        else if (url.pathname === "/favicon.svg")
          return new Response(faviconSVG, {
            headers: { "Content-Type": "image/svg+xml" },
          });
        else if (url.pathname === "/notes")
          return new Response(
            speakerViewHTML
              .replace(
                "#SOCKETS#",
                `window.slidesk.io = new WebSocket("ws://localhost:${options.port}");`
              )
              .replace("/* #STYLES# */", themeCSS),
            {
              headers: {
                "Content-Type": "text/html",
              },
            }
          );
        const file = Bun.file(
          req.url.match(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
          )
            ? req.url
            : `${globalThis.path}${req.url}`
        );
        if (file.size !== 0)
          return new Response(file, {
            headers: {
              "Content-Type": file.type,
            },
          });
        return new Response(`404!`);
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

    console.log(`📽️\thttp://localhost:${options.port}`);
    if (options.notes)
      console.log(`📝\thttp://localhost:${options.port}/notes`);
  }

  setHTML(html) {
    globalThis.html = html;
    globalThis.server.publish("slidesk", { message: "reload" });
  }
}
