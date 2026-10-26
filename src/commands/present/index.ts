import { watch } from "node:fs";
import { networkInterfaces } from "node:os";
import process from "node:process";
import { Clipse } from "clipse";
import SlideskServer from "../../core/Server";
import { startTelnetServer } from "../../core/TCPServer";
import type { SliDeskEnv, SliDeskPresentOptions } from "../../types";
import convert from "../../utils/convert";
import { getAction } from "../../utils/interactCLI";
import loadEnv from "../../utils/loadEnv";

const { log, error } = console;

const server: SlideskServer = new SlideskServer();
let telnet: Awaited<ReturnType<typeof startTelnetServer>> | undefined;
let lastBuild = 0;

const flow = async (
  talkdir: string,
  options: SliDeskPresentOptions,
  env: SliDeskEnv,
  init = false,
) => {
  const build = ++lastBuild;
  // keep presenting a broken talk: the browser shows the error until it is fixed
  const files = await convert(talkdir, options, env, true);
  // a slower, older build must not replace a newer one
  if (build !== lastBuild) return;
  if (init) {
    await server.create(files, options, env, talkdir);
    if (options.telnet) {
      telnet = await startTelnetServer(options, env);
    }
  } else {
    // addRoutes / addWS hooks may have been written or edited too
    await server.loadPlugins(env);
    server.setFiles(files);
  }
};

const present = async (talk: string, options: SliDeskPresentOptions) => {
  const nets = networkInterfaces();
  options.ip =
    Object.values(nets)
      .flat()
      .find((e) => e?.family === "IPv4" && e?.address !== "127.0.0.1")
      ?.address ?? "127.0.0.1";
  const talkPath = talk === "" ? "" : `/${talk}`;
  const talkdir = `${process.cwd()}${talkPath}`;
  const env = await loadEnv(talkdir, options);
  await flow(talkdir, options, env, true);

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
  let pending: Timer | undefined;
  const watcher =
    env.slidesk?.WATCH === false
      ? undefined
      : watch(talkdir, { recursive: true }, (eventType, filename) => {
          if (!filename?.startsWith(".git") && !filename?.endsWith("~")) {
            log(
              `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
            );
            // one save often fires several events: rebuild once they settle
            clearTimeout(pending);
            pending = setTimeout(() => {
              // slidesk.toml may have changed too; a file can briefly disappear
              // while an editor saves it: report and keep presenting
              loadEnv(talkdir, options)
                .then((latest) => flow(talkdir, options, latest))
                .catch((e) => error(e instanceof Error ? e.message : e));
            }, 100);
          }
        });
  // q or Ctrl-C: release everything so the process can end on its own
  getAction(server, true).then(() => {
    clearTimeout(pending);
    watcher?.close();
    telnet?.stop(true);
    server.stop();
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
      description: "use a specific slidesk.toml file",
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
    telnet: {
      short: "t",
      type: "boolean",
      description: "serve a telnet version",
      default: false,
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
