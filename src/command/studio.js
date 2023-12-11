/* eslint-disable no-undef */
import BabelFish from "../core/BabelFish";
import { view, script, styles } from "../templates/studio";
import faviconSVG from "../templates/slidesk.svg.txt";
import { getAction } from "../utils/interactCLI";

const { log } = console;

const studio = (talk, options) => {
  const talkdir = `${process.cwd()}/${talk ?? ""}`;
  const https = false;

  // check if main.sdf file exists
  const mainFile = Bun.file(`${talkdir}/main.sdf`);
  if (!mainFile.size) {
    log(`🤔 ${talkdir}/main.sdf not exists`);
    return;
  }

  globalThis.BabelFish = new BabelFish(`${talkdir}/main.sdf`, {
    notes: false,
    timers: false,
  });

  globalThis.BabelFish.loadComponents();

  globalThis.server = Bun.serve({
    port: options.port,
    fetch(req) {
      const url = new URL(req.url);
      switch (url.pathname) {
        case "/ws":
          return globalThis.server.upgrade(req)
            ? undefined
            : new Response("WebSocket upgrade error", { status: 400 });
        case "/":
          return new Response(view, {
            headers: {
              "Content-Type": "text/html",
            },
          });
        case "/favicon.svg":
          return new Response(faviconSVG, {
            headers: {
              "Content-Type": "image/svg+xml",
            },
          });
        case "/styles.css":
          return new Response(styles, {
            headers: {
              "Content-Type": "text/css",
            },
          });
        case "/script.js":
          return new Response(
            [
              `window.slidesk = {
                https: "${https ?? "false"}",
                domain: "${options.domain}",
                port: "${options.port}",
                $action: document.querySelector("#sd-studio > main"),
                $film: document.getElementById("sd-film")
              };`,
              script,
            ].join(""),
            {
              headers: { "Content-Type": "application/javascript" },
            },
          );
        default:
          return "";
      }
    },
    websocket: {
      open(ws) {
        ws.subscribe("slidesk");
      },
      async message(ws, message) {
        const json = JSON.parse(message);
        switch (json.action) {
          case "let the music play!":
            globalThis.server.publish(
              "slidesk",
              JSON.stringify({
                action: "initialisation",
                "main.sdf": (
                  await globalThis.BabelFish.includes(`${talkdir}/main.sdf`)
                ).replace(/\/::([\s\S]*)::\//m, ""),
              }),
            );
            break;
          case "convert":
            globalThis.server.publish(
              "slidesk",
              JSON.stringify({
                action: "babelfished",
                html: await globalThis.BabelFish.getPresentation(json.sdf),
              }),
            );
            break;
          default:
            ws.publish("slidesk", message);
            break;
        }
      },
      close(ws) {
        ws.unsubscribe("slidesk");
      },
    },
  });

  log(
    `Your studio is available on: \x1b[1m\x1b[36;49mhttp${https ? "s" : ""}://${
      options.domain
    }:${options.port}\x1b[0m`,
  );
  log();
  getAction();
};

export default studio;
