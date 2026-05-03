import layoutHTML from "../templates/studio/layout.html";
import defaultCSS from "../templates/present/styles.css" with { type: "text" };
import loadEnv from "../utils/loadEnv";
import preload from "./babelfish/preload";
import prepareSDF from "./babelfish/prepareSDF";
import getStyles from "./studio/getStyles";
import getSlides from "./studio/getSlides";
import updateSlide from "./studio/updateSlide";
import type { SliDeskStudioSlide } from "../types";

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
  const { plugins, templates } = await preload(talkdir, env);
  const { config } = await prepareSDF(file);
  let slides: SliDeskStudioSlide[] = [];
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
        return Response.json({
          css: await getStyles(config, plugins, talkdir),
        });
      },
      "/api/slides": async () => {
        slides = await getSlides(talkdir, env, templates);
        return Response.json({
          slides,
        });
      },
      "/api/slide/edit": {
        POST: async (req) => {
          const body = await req.json();
          await updateSlide(slides, body);
          return new Response("", { status: 200 });
        },
      },
    },
    async fetch(req) {
      const file = Bun.file(
        `${talkdir}/${req.url.replace(`http://localhost:${port}`, "")}`,
      );
      return new Response(await file.arrayBuffer(), {
        headers: { "Content-Type": file.type },
      });
    },
  });
}
