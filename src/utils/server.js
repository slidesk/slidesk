import { existsSync, readdirSync } from "fs";
import speakerViewHTML from "../templates/notes/layout.html.txt";
import speakerViewCSS from "../templates/notes/styles.css.txt";
import speakerViewJS from "../templates/notes/script.js.txt";
import themeCSS from "../templates/styles.css.txt";
import faviconSVG from "../templates/SD.svg.txt";

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

export const notePage = async (options) => {
  const onSpeakerViewSlideChange = [];
  if (existsSync(`${globalThis.path}/plugins`))
    await Promise.all(
      readdirSync(`${globalThis.path}/plugins`).map(async (plugin) => {
        const pluginPath = `${globalThis.path}/plugins/${plugin}/plugin.json`;
        const pluginFile = Bun.file(pluginPath);
        const exists = await pluginFile.exists();
        if (exists) {
          const json = await pluginFile.json();
          if (json.onSpeakerViewSlideChange)
            onSpeakerViewSlideChange.push(json.onSpeakerViewSlideChange);
        }
      }),
    );
  return new Response(
    speakerViewHTML
      .replace(
        "/* #SOCKETS# */",
        `window.slidesk.io = new WebSocket("ws://${options.domain}:${options.port}/ws");`,
      )
      .replace("/* #STYLES# */", themeCSS)
      .replace("/* #SV_STYLES# */", speakerViewCSS)
      .replace("/* #SV_SCRIPT# */", speakerViewJS)
      .replace("/* #SLIDE_CHANGE# */", onSpeakerViewSlideChange.join(";")),
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
