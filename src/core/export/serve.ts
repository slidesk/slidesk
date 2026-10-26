import { existsSync } from "node:fs";
import type { Server } from "bun";
import type { SliDeskEnv, SliDeskFile, SliDeskServerPlugin } from "../../types";
import fetch from "../server/fetch";
import getPlugins from "../server/getPlugins";

const serve = async (files: SliDeskFile, env: SliDeskEnv, talkdir: string) => {
  const plugins: SliDeskServerPlugin[] = [];
  const slideskEnv = env.slidesk ?? {};
  if (existsSync(`${talkdir}/plugins`))
    plugins.push(...(await getPlugins(`${talkdir}/plugins`, talkdir)));
  if (
    slideskEnv?.COMMON_DIR &&
    existsSync(`${talkdir}/${slideskEnv.COMMON_DIR}/plugins`)
  )
    plugins.push(
      ...(await getPlugins(
        `${talkdir}/${slideskEnv.COMMON_DIR}/plugins`,
        talkdir,
      )),
    );

  const server: Server<undefined> = Bun.serve({
    port: 0,
    async fetch(req) {
      return fetch(req, this, files, plugins, talkdir, env);
    },
    websocket: {
      open(ws) {
        ws.subscribe("slidesk");
      },
      message(ws, message: string) {
        ws.publish("slidesk", message);
      },
      close(ws) {
        ws.unsubscribe("slidesk");
      },
    },
  });

  return {
    url: `http://localhost:${server.port}/`,
    stop: () => server.stop(true),
  };
};

export default serve;
