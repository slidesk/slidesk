import { watch } from "node:fs";
import { networkInterfaces } from "node:os";
import process from "node:process";
import Convert from "../core/Convert";
import SlideskServer from "../core/Server";
import Terminal from "../core/Terminal";
import type { SliDeskPresentOptions } from "../types";
import { getAction } from "../utils/interactCLI";
import save from "../utils/save";

const { log } = console;

let server: SlideskServer | Terminal = new SlideskServer();

const flow = async (
  talkdir: string,
  options: SliDeskPresentOptions = {},
  init = false,
) => {
  const files = await Convert(`${talkdir}/main.sdf`, options);
  if (files === null) {
    process.exit();
  }
  if (options.save) {
    await save(options.save, talkdir, files);
    process.exit(0);
  }
  if (init) {
    await server.create(files, options, talkdir);
  } else {
    (server as SlideskServer).setFiles(files);
  }
};

const present = (talk: string, options: SliDeskPresentOptions) => {
  const nets = networkInterfaces();
  options.ip =
    Object.values(nets)
      .flat()
      .filter((e) => e?.family === "IPv4" && e?.address !== "127.0.0.1")
      .shift()?.address ?? "127.0.0.1";
  const talkdir = `${process.cwd()}/${talk}`;
  if (options.terminal) {
    server = new Terminal();
  }
  flow(talkdir, options, true);
  if (!options.save) {
    if (!options.hidden)
      log(
        "\x1b[4mTake the control of your presentation direct from here.\x1b[24m",
        "\n",
        "\nPress \x1b[1mEnter\x1b[0m to go to the next slide.",
        "\nWrite \x1b[1ma number\x1b[0m and Press \x1b[1mEnter\x1b[0m to go to a specific slide.",
        "\nPress \x1b[1mP + Enter\x1b[0m to go to the previous slide.",
        "\nPress \x1b[1mQ\x1b[0m to quit the program.",
        "\n",
      );
    if (options.watch)
      watch(talkdir, { recursive: true }, (eventType, filename) => {
        if (!filename?.startsWith(".git") && !filename?.endsWith("~")) {
          log(
            `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
          );
          flow(talkdir, options);
        }
      });
    getAction(server, true);
    process.on("SIGINT", () => {
      process.exit(0);
    });
  }
};

export default present;
