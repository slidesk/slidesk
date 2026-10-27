import { existsSync } from "node:fs";
import type { Server } from "bun";
import type {
  SliDeskEnv,
  SliDeskFile,
  SliDeskServerPlugin,
  SliDeskSocketData,
} from "../../types";
import commonDir from "../../utils/commonDir";
import fetch from "../server/fetch";
import getPlugins from "../server/getPlugins";

const serve = async (files: SliDeskFile, env: SliDeskEnv, talkdir: string) => {
  const common = commonDir(talkdir, env);
  const plugins: SliDeskServerPlugin[] = (
    await Promise.all(
      [`${talkdir}/plugins`, common ? `${common}/plugins` : ""]
        .filter((dir) => dir && existsSync(dir))
        .map((dir) => getPlugins(dir, talkdir)),
    )
  ).flat();

  const server: Server<SliDeskSocketData> = Bun.serve<SliDeskSocketData>({
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
