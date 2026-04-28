import { watch } from "node:fs";
import { networkInterfaces } from "node:os";
import process from "node:process";
import SlideskServer from "../../core/Server";
import type { SliDeskPresentOptions } from "../../types";
import { getAction } from "../../utils/interactCLI";
import convert from "../../utils/convert";
import { Clipse } from "clipse";
import loadEnv from "../../utils/loadEnv";

const { log } = console;

let server: SlideskServer = new SlideskServer();

const flow = async (
  talkdir: string,
  options: SliDeskPresentOptions = {},
  env: object,
  init = false,
) => {
  const files = await convert(talkdir, options, env);
  if (init) {
    await server.create(files, options, env, talkdir);
  } else {
    server.setFiles(files);
  }
};

const present = async (talk: string, options: SliDeskPresentOptions) => {
  const nets = networkInterfaces();
  options.ip =
    Object.values(nets)
      .flat()
      .filter((e) => e?.family === "IPv4" && e?.address !== "127.0.0.1")
      .shift()?.address ?? "127.0.0.1";
  const talkdir = `${process.cwd()}/${talk}`;
  const env = await loadEnv(talkdir, options);
  flow(talkdir, options, env, true);

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
  if (env.slidesk?.WATCH) {
    watch(talkdir, { recursive: true }, (eventType, filename) => {
      if (!filename?.startsWith(".git") && !filename?.endsWith("~")) {
        log(
          `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
        );
        flow(talkdir, options, env);
      }
    });
  }
  getAction(server, true);
  process.on("SIGINT", () => {
    process.exit(0);
  });
};

const presentCmd = new Clipse("present", "serve your presentation");
presentCmd
  .addOptions({
    notes: {
      short: "n",
      type: "string",
      description: "open with speakers notes",
      default: "notes.html",
      optional: true,
    },
    hidden: {
      short: "g",
      type: "boolean",
      description: "remove help information",
      default: false,
      optional: true,
    },
    conf: {
      short: "c",
      type: "string",
      description: "use a specific .env file",
      default: "",
      optional: true,
    },
    open: {
      short: "o",
      type: "boolean",
      description: "open a browser with the presentation or notes view",
      default: false,
      optional: true,
    },
    lang: {
      short: "l",
      type: "string",
      description:
        "specify the language version (per default, it will use the .lang.json file with default information)",
      default: "",
      optional: true,
    },
  })
  .addArguments([
    {
      name: "talk",
      description: "directory of your talk",
    },
  ])
  .action(async (args, opts) => await present(args.talk ?? "", opts));

export default presentCmd;
