/* eslint-disable no-undef */
import dotenv from "dotenv";
import { existsSync, readdirSync, readFileSync } from "fs";
import speakerViewHTML from "../templates/notes/layout.html.txt";
import speakerViewCSS from "../templates/notes/styles.css.txt";
import speakerViewJS from "../templates/notes/script.js.txt";
import themeCSS from "../templates/styles.css.txt";
import faviconSVG from "../templates/slidesk.svg.txt";
import pluginsJSON from "../plugins.json";

export const defaultPage = () =>
  new Response(globalThis.html.index.html, {
    headers: {
      "Content-Type": "text/html",
    },
  });

export const langPage = (pathname) =>
  new Response(
    globalThis.html[pathname.replaceAll("-", "").replaceAll("/", "")].html,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );

export const favicon = () =>
  new Response(faviconSVG, {
    headers: { "Content-Type": "image/svg+xml" },
  });

const getCustomCSS = async () => {
  let res = "";
  const fusion = await Bun.file(`${globalThis.path}/main.sdf`).text();
  // get Custom configuration
  const m = /\/::([\s\S]*)::\//m.exec(fusion);
  if (m !== null) {
    const lines = [...m[1].split("\n")].filter((l) => l.length);
    lines.forEach((line) => {
      if (line.startsWith("custom_css:"))
        res = `<link rel="stylesheet" href="${line
          .replace("custom_css:", "")
          .trim()}" />`;
    });
  }
  return res;
};

const getPlugins = async () => {
  const plugins = [];
  let env = {};
  const slideskEnvFile = Bun.file(`${globalThis.path}/.env`);
  if (slideskEnvFile.size !== 0) {
    const buf = await slideskEnvFile.text();
    env = dotenv.parse(buf);
  }
  if (env.PLUGINS) {
    [...env.PLUGINS.split(",")].forEach((p) => {
      const pl = p.trim();
      if (pluginsJSON[pl]) {
        plugins.push(pluginsJSON[p.trim()]);
      }
    });
  }
  if (existsSync(`${globalThis.path}/plugins`))
    await Promise.all(
      readdirSync(`${globalThis.path}/plugins`).map(async (plugin) => {
        const pluginPath = `${globalThis.path}/plugins/${plugin}/plugin.json`;
        const pluginFile = Bun.file(pluginPath);
        const exists = await pluginFile.exists();
        if (exists) {
          const json = await pluginFile.json();
          ["addSpeakerScripts", "addSpeakerStyles"].map(async (t) => {
            if (json[t]) {
              const files = json[t];
              json[t] = {};
              files.forEach((s) => {
                json[t][s] = readFileSync(`${globalThis.path}/${s}`, {
                  encoding: "utf8",
                });
              });
            }
            return true;
          });
          plugins.push(json);
        }
      }),
    );
  return plugins;
};

export const notePage = async (options) => {
  const plugins = await getPlugins();
  return new Response(
    speakerViewHTML
      .replace(
        "#SOCKETS#",
        `window.slidesk.io = new WebSocket("ws://${options.domain}:${options.port}/ws");`,
      )
      .replace("#STYLES#", themeCSS)
      .replace("#SV_STYLES#", speakerViewCSS)
      .replace(
        "#PLUGINSSTYLES#",
        plugins
          .map((p) =>
            p.addSpeakerStyles
              ? Object.keys(p.addSpeakerStyles)
                  .map(
                    (k) =>
                      `<style data-href="${k}">${p.addSpeakerStyles[k]}</style>`,
                  )
                  .join("")
              : "",
          )
          .join(""),
      )
      .replace("#CUSTOMCSS#", await getCustomCSS())
      .replace("#SV_SCRIPT#", speakerViewJS)
      .replace(
        "#PLUGINSSCRIPTS#",
        plugins
          .map((p) =>
            p.addSpeakerScripts
              ? Object.keys(p.addSpeakerScripts)
                  .map(
                    (k) =>
                      `<script data-src="${k}">${p.addSpeakerScripts[k]}</script>`,
                  )
                  .join("")
              : "",
          )
          .join(""),
      )
      .replace(
        "#SLIDE_CHANGE#",
        plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";"),
      ),
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
};

export const webSockets = (req) =>
  globalThis.server.upgrade(req)
    ? undefined
    : new Response("WebSocket upgrade error", { status: 400 });

export const defaultAction = (req, options) => {
  const fileurl = req.url.replace(
    `http://${options.domain}:${options.port}`,
    "",
  );
  // eslint-disable-next-line no-undef
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
