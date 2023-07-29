const speakerViewHTML = await Bun.file(
  import.meta.resolveSync("../templates/notes/layout.html")
).text();
const speakerViewCSS = await Bun.file(
  import.meta.resolveSync("../templates/notes/styles.css")
).text();
const speakerViewJS = await Bun.file(
  import.meta.resolveSync("../templates/notes/script.js")
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
                "/* #SOCKETS# */",
                `window.slidesk.io = new WebSocket("ws://localhost:${options.port}/ws");`
              )
              .replace("/* #STYLES# */", themeCSS)
              .replace("/* #SV_STYLES# */", speakerViewCSS)
              .replace("/* #SV_SCRIPT# */", speakerViewJS),
            {
              headers: {
                "Content-Type": "text/html",
              },
            }
          );
        else if (url.pathname === "/ws")
          return globalThis.server.upgrade(req)
            ? undefined
            : new Response("WebSocket upgrade error", { status: 400 });
        const fileurl = req.url.replace(`http://localhost:${options.port}`, "");
        const file = Bun.file(
          fileurl.match(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
          )
            ? fileurl
            : `${globalThis.path}${fileurl}`
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

    console.log(`📽️\thttp://localhost:${options.port}`);
    if (options.notes)
      console.log(`📝\thttp://localhost:${options.port}/notes`);
  }

  setHTML(html) {
    globalThis.html = html;
    globalThis.server.publish("slidesk", { message: "reload" });
  }
}
