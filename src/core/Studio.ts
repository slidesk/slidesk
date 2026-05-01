import layoutHTML from "../templates/studio/layout.html";
import defaultCSS from "../templates/present/styles.css" with { type: "text" };
import loadEnv from "../utils/loadEnv";
import preload from "./babelfish/preload";
import prepareSDF from "./babelfish/prepareSDF";
import getStyles from "./studio/getStyles";
import getSlides from "./studio/getSlides";

const { error } = console;

export async function startStudio(port: number, talkdir: string) {
  const sdfMainFile = Bun.file(`${talkdir}/main.sdf`);
  const mdMainFile = Bun.file(`${talkdir}/main.md`);
  let file = "";
  if (await sdfMainFile.exists()) file = `${talkdir}/main.sdf`;
  else if (await mdMainFile.exists()) file = `${talkdir}/main.md`;
  else {
    error("🤔 main.(sdf|md) was not found");
    process.exit(1);
  }
  const env = await loadEnv(talkdir, {});
  const { plugins, templates, favicon, components } = await preload(
    talkdir,
    env,
  );
  Bun.serve({
    //development: false,
    port,
    routes: {
      "/": layoutHTML,
      "/slidesk.css": () =>
        new Response(defaultCSS, {
          headers: { "Content-Type": "text/css" },
        }),
      "/api/styles": async () => {
        const { config } = await prepareSDF(file);
        return Response.json({
          css: await getStyles(config, plugins, talkdir),
        });
      },
      "/api/slides": async () => {
        return Response.json({
          slides: await getSlides(talkdir, env, components),
        });
      },
    },
    async fetch(req) {
      return new Response(
        await Bun.file(
          `${talkdir}/${req.url.replace(`http://localhost:${port}`, "")}`,
        ).text(),
        {
          headers: { "Content-Type": "text/css" },
        },
      );
    },
  });
}
