/* eslint-disable no-undef */
import Interpreter from "../core/Interpreter";
import layoutHTML from "../templates/studio/layout.html.txt";
import scriptJS from "../templates/studio/script.js.txt";
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
          return new Response(layoutHTML, {
            headers: {
              "Content-Type": "text/html",
            },
          });
        case "/script.js":
          return new Response(
            [
              `window.slidesk = {
                https: "${https ?? "false"}",
                domain: "${options.domain}",
                port: "${options.port}"
              };`,
              scriptJS,
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

        ws.publish("slidesk", message);
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

  // generate html
  //   const files = Interpreter.convert(mainFile, {
  //     notes: false,
  //     transition: 0,
  //     save: false,
  //     domain: "localhost",
  //     port: 1337,
  //     timers: false,
  //   });
};

export default studio;
