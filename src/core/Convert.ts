import { styles } from "../templates/notes";
import { manifest } from "../templates/present";
import type { SliDeskPresentOptions } from "../types";
import generateHTML from "./babelfish/generateHTML";
import getCSS from "./babelfish/getCSS";
import getJS from "./babelfish/getJS";
import getNotesJS from "./babelfish/getNotesJS";
import getNotesView from "./babelfish/getNotesView";
import getPresentation from "./babelfish/getPresentation";
import preload from "./babelfish/preload";
import prepareSDF from "./babelfish/prepareSDF";
import prepareTPL from "./babelfish/prepareTPL";

export default async (mainFile: string, options: SliDeskPresentOptions) => {
  const { error } = console;
  const sdfMainFile = Bun.file(mainFile);
  if (!(await sdfMainFile.exists())) {
    error("🤔 main.sdf was not found");
    process.exit(1);
  }
  const sdfPath = `${mainFile.substring(0, mainFile.lastIndexOf("/"))}`;
  const { env, plugins, templates, favicon, components } = await preload(
    sdfPath,
    options,
  );
  const { config, content } = await prepareSDF(mainFile);
  return {
    ...(await generateHTML(
      await getPresentation(
        content,
        options,
        env,
        components,
        templates,
        plugins,
      ),
      prepareTPL(config, plugins, favicon),
      sdfPath,
      options,
      env,
      plugins,
    )),
    "slidesk.css": {
      content: getCSS(options, env),
      headers: { "Content-type": "text/css" },
    },
    "slidesk-notes.css": {
      content: styles,
      headers: { "Content-type": "text/css" },
    },
    "slidesk.js": {
      content: getJS(options, plugins, env),
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
    [`${options.notes === undefined ? "notes.html" : options.notes}`]: {
      content: getNotesView(config, plugins),
      headers: { "Content-Type": "text/html" },
    },
  };
};
