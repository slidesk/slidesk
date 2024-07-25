import dotenv from "dotenv";
import { readdirSync, existsSync } from "node:fs";
import open, { apps } from "open";
import type {
  SliDeskFile,
  ServerOptions,
  SliDeskPlugin,
  PluginsJSON,
  SlideskPluginAddRoute,
  SlideskPluginAddWS,
} from "../types";
import type { Server } from "bun";

const { log } = console;

const getFile = (req: Request, path: string) => {
  const fileurl = req.url.replace(
    new RegExp(`^https?://${req.headers.get("host")}`, "g"),
    ""
  );
  const file = Bun.file(
    fileurl.match(/https?:\/\/(\S*)/g) ? fileurl : `${path}${fileurl}`
  );
  if (file.size !== 0)
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  return new Response(`${req.url} not found`, { status: 404 });
};

let serverFiles: SliDeskFile = {};
const serverPlugins: PluginsJSON = {};
let serverPath = "";
let server: Server;

const getPlugins = async (pluginsDir: string) => {
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
              `${serverPath}/${json.addRoutes}`
            );
            obj = { ...obj, addRoutes };
          }
          if (json.addWS) {
            const { default: addWS } = await import(
              `${serverPath}/${json.addWS}`
            );
            obj = { ...obj, addWS };
          }
          serverPlugins[plugin] = obj;
        }
      }
    })
  );
};

export default class SlideskServer {
  async create(files: SliDeskFile, options: ServerOptions, path: string) {
    serverFiles = files;
    serverPath = path;
    const slideskEnvFile = Bun.file(`${path}/.env`);
    let env: { [key: string]: string } = {};
    if (slideskEnvFile.size !== 0) {
      const buf = await slideskEnvFile.text();
      env = dotenv.parse(buf);
    }
    const pluginsDir = `${path}/plugins`;
    if (existsSync(pluginsDir)) await getPlugins(pluginsDir);
    server = Bun.serve({
      port: options.port,
      async fetch(req) {
        const url = new URL(req.url);
        let res: Response | null = null;
        switch (url.pathname) {
          case "/ws":
            return this.upgrade(req)
              ? undefined
              : new Response("WebSocket upgrade error", { status: 400 });
          case "/":
            if (
              !req.headers.get("host")?.startsWith("localhost") &&
              req.headers.get("host") === `${options.domain}:${options.port}` &&
              !options.interactive
            )
              return new Response("");
            return new Response(serverFiles["/index.html"].content, {
              headers: serverFiles["/index.html"].headers,
            });
          default:
            if (Object.keys(serverFiles).includes(url.pathname))
              return new Response(serverFiles[url.pathname].content, {
                headers: serverFiles[url.pathname].headers,
              });
            await Promise.all(
              [...Object.values(serverPlugins)].map(async (plugin) => {
                if ((plugin as SliDeskPlugin).addRoutes) {
                  res = await (
                    (plugin as SliDeskPlugin).addRoutes as SlideskPluginAddRoute
                  )(req, env, serverPath);
                }
              })
            );
            if (res !== null) return res;
            return getFile(req, serverPath);
        }
      },
      websocket: {
        open(ws) {
          ws.subscribe("slidesk");
        },
        async message(ws, message: string) {
          const json = JSON.parse(message);
          if (json.plugin && serverPlugins[json.plugin]?.addWS) {
            server.publish(
              "slidesk",
              JSON.stringify({
                action: `${json.plugin}_response`,
                response: await (
                  serverPlugins[json.plugin].addWS as SlideskPluginAddWS
                )(message),
              })
            );
          } else {
            ws.publish("slidesk", message);
          }
        },
        close(ws) {
          ws.unsubscribe("slidesk");
        },
      },
      tls: {
        key: env.KEY ? Bun.file(env.KEY) : undefined,
        cert: env.CERT ? Bun.file(env.CERT) : undefined,
        passphrase: env.PASSPHRASE ?? undefined,
      },
    });
    await this.#display(env.HTTPS === "true", options);
  }

  async #display(https: boolean, options: ServerOptions) {
    if (options.notes) {
      log(
        `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp${
          https ? "s" : ""
        }://${options.domain}:${options.port}/notes.html\x1b[0m`
      );
      if (options.open)
        await open(
          `http${https ? "s" : ""}://${options.domain}:${
            options.port
          }/notes.html`,
          { app: { name: apps[options.open] } }
        );
    }
    log(
      `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
        https ? "s" : ""
      }://${options.domain}:${options.port}\x1b[0m`
    );
    if (options.open && !options.notes)
      await open(
        `http${https ? "s" : ""}://${options.domain}:${options.port}`,
        { app: { name: apps[options.open] } }
      );
    log();
  }

  setFiles(files: SliDeskFile) {
    serverFiles = files;
    server.publish("slidesk", JSON.stringify({ action: "reload" }));
  }

  send(action: string, data?: object | number | string) {
    server.publish("slidesk", JSON.stringify({ action, data }));
  }
}
