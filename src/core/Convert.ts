import { styles } from "../templates/notes";
import { manifest } from "../templates/present";
import type { SliDeskPlugin, SliDeskPresentOptions } from "../types";
import generateHTML from "./babelfish/generateHTML";
import getCSS from "./babelfish/getCSS";
import getJS from "./babelfish/getJS";
import getNotesJS from "./babelfish/getNotesJS";
import getNotesView from "./babelfish/getNotesView";
import getPresentation from "./babelfish/getPresentation";
import preload from "./babelfish/preload";
import prepareSDF from "./babelfish/prepareSDF";
import prepareTPL from "./babelfish/prepareTPL";

const commonContent = (
  env: Record<string, unknown>,
  plugins: SliDeskPlugin[],
  favicon:
    | {
        name: string;
        content: Uint8Array<ArrayBuffer>;
        type: string;
      }
    | {
        name: string;
        content: string;
        type: string;
      },
  options: SliDeskPresentOptions,
  config:
    | {
        css: never[];
        js: never[];
      }
    | {
        css: string[];
        js: string[];
      },
  sdfPath: string,
) => {
  return {
    "slidesk.css": {
      content: getCSS(env as { slidesk: { TRANSITION?: number } }),
      headers: { "Content-type": "text/css" },
    },
    "slidesk-notes.css": {
      content: styles,
      headers: { "Content-type": "text/css" },
    },
    "slidesk.js": {
      content: getJS(plugins, env),
      headers: { "Content-type": "application/javascript" },
    },
    "slidesk-notes.js": {
      content: getNotesJS(plugins),
      headers: { "Content-type": "application/javascript" },
    },
    [favicon.name]: {
      content: favicon.content,
      headers: { "Content-Type": favicon.type },
    },
    "manifest.json": {
      content: JSON.stringify(manifest),
      headers: { "Content-Type": "application/json" },
    },
    [`${options.notes ?? "notes.html"}`]: {
      content: getNotesView(config, plugins, sdfPath),
      headers: { "Content-Type": "text/html" },
    },
  };
};

export const errorContent = async (
  options: SliDeskPresentOptions,
  env: Record<string, unknown>,
) => {
  const sdfPath = `${process.cwd()}`;
  const { plugins, templates, favicon, components } = await preload(
    sdfPath,
    env,
  );
  const { config, content } = {
    config: { css: [], js: [] },
    content: "ERROR",
  };
  return {
    ...(await generateHTML(
      await getPresentation(content, env, components, templates),
      prepareTPL(config, plugins, favicon, sdfPath),
      sdfPath,
      options,
      env,
      plugins,
    )),
    ...commonContent(env, plugins, favicon, options, config, sdfPath),
  };
};

export const content = async (
  mainFile: string,
  options: SliDeskPresentOptions,
  env: Record<string, unknown>,
) => {
  const sdfPath = `${mainFile.substring(0, mainFile.lastIndexOf("/"))}`;
  const { plugins, templates, favicon, components } = await preload(
    sdfPath,
    env,
  );
  const { config, content } = await prepareSDF(mainFile);
  return {
    ...(await generateHTML(
      await getPresentation(content, env, components, templates),
      prepareTPL(config, plugins, favicon, sdfPath),
      sdfPath,
      options,
      env,
      plugins,
    )),
    ...commonContent(env, plugins, favicon, options, config, sdfPath),
  };
};
