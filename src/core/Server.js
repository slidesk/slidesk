/* eslint-disable no-undef */
import dotenv from "dotenv";
import { readdirSync, existsSync } from "node:fs";
import open, { apps } from "open";

const { log } = console;

const getFile = (req, options, https) => {
  const fileurl = req.url.replace(
    `http${https ? "s" : ""}://${options.domain}:${options.port}`,
    "",
  );
  const file = Bun.file(
    fileurl.match(/https?:\/\/(\S*)/g)
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
};

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
    globalThis.plugins = {};
    const pluginsDir = `${path}/plugins`;
    if (existsSync(pluginsDir))
      await Promise.all(
        readdirSync(pluginsDir).map(async (plugin) => {
          const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
          const pluginFile = Bun.file(pluginPath);
          const exists = await pluginFile.exists();
          if (exists) {
            const json = await pluginFile.json();
            if (json.addRoutes || json.addWS) {
              let obj = { type: "external", ...json };
              if (json.addRoutes) {
                const { default: addRoutes } = await import(
                  `${path}/${json.addRoutes}`
                );
                obj = { ...obj, addRoutes };
              }
              if (json.addWS) {
                const { default: addWS } = await import(
                  `${path}/${json.addWS}`
                );
                obj = { ...obj, addWS };
              }
              globalThis.plugins[plugin] = obj;
            }
          }
        }),
      );
    const https = env.HTTPS === "true";
    const serverOptions = {
      port: options.port,
      async fetch(req) {
        const url = new URL(req.url);
        let res = null;
        switch (url.pathname) {
          case "/ws":
            return globalThis.server.upgrade(req)
              ? undefined
              : new Response("WebSocket upgrade error", { status: 400 });
          case "/":
            return new Response(globalThis.files["/index.html"].content, {
              headers: globalThis.files["/index.html"].headers,
            });
          default:
            if (Object.keys(files).includes(url.pathname))
              return new Response(globalThis.files[url.pathname].content, {
                headers: globalThis.files[url.pathname].headers,
              });
            await Promise.all(
              [...Object.values(globalThis.plugins)].map(async (plugin) => {
                if (plugin.addRoutes) {
                  res = await plugin.addRoutes(req, env);
                }
              }),
            );
            if (res !== null) return res;
            return getFile(req, options, https);
        }
      },
      websocket: {
        open(ws) {
          ws.subscribe("slidesk");
        },
        async message(ws, message) {
          const json = JSON.parse(message);
          if (
            json.plugin &&
            globalThis.plugins[json.plugin] &&
            globalThis.plugins[json.plugin].addWS
          ) {
            globalThis.server.publish(
              "slidesk",
              JSON.stringify({
                action: `${json.plugin}_response`,
                response: await globalThis.plugins[json.plugin].addWS(message),
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
    };
    if (https) {
      serverOptions.tls = {
        key: Bun.file(env.KEY),
        cert: Bun.file(env.CERT),
        passphrase: env.PASSPHRASE ? Bun.file(env.PASSPHRASE) : "",
      };
    }
    globalThis.server = Bun.serve(serverOptions);
    if (options.notes) {
      log(
        `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp${
          https ? "s" : ""
        }://${options.domain}:${options.port}/notes.html\x1b[0m`,
      );
      if (options.open)
        await open(
          `http${https ? "s" : ""}://${options.domain}:${
            options.port
          }/notes.html`,
          { app: { name: apps[options.open] } },
        );
    }
    log(
      `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
        https ? "s" : ""
      }://${options.domain}:${options.port}\x1b[0m`,
    );
    if (options.open && !options.notes)
      await open(
        `http${https ? "s" : ""}://${options.domain}:${options.port}`,
        { app: { name: apps[options.open] } },
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
