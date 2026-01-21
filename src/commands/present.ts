import { watch } from "node:fs";
import { networkInterfaces } from "node:os";
import process from "node:process";
import Convert, { errorContent } from "../core/Convert";
import SlideskServer from "../core/Server";
import Terminal from "../core/Terminal";
import gitlabYML from "../templates/ci/gitlab-ci.yml" with { type: "text" };
import githubYML from "../templates/ci/github.yml" with { type: "text" };
import linkYML from "../templates/ci/link.yml" with { type: "text" };
import type { SliDeskPresentOptions } from "../types";
import { getAction } from "../utils/interactCLI";
import save from "../utils/save";

const { log, error } = console;

let server: SlideskServer | Terminal = new SlideskServer();

const flow = async (
  talkdir: string,
  options: SliDeskPresentOptions = {},
  init = false,
) => {
  let files = {};
  try {
    files = await Convert(`${talkdir}/main.sdf`, options);
  } catch (_) {
    files = await errorContent(options);
  }
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

const present = async (talk: string, options: SliDeskPresentOptions) => {
  const nets = networkInterfaces();
  options.ip =
    Object.values(nets)
      .flat()
      .filter((e) => e?.family === "IPv4" && e?.address !== "127.0.0.1")
      .shift()?.address ?? "127.0.0.1";
  const talkdir = `${process.cwd()}/${talk}`;
  if (options.deploy) {
    const depls = ["github", "gitlab", "link"];
    if (!depls.includes(options.deploy)) {
      error(
        `${options.deploy} is not a valid deploy option (${depls.join(", ")})`,
      );
      process.exit(1);
    } else {
      switch (options.deploy) {
        case "github":
          await Bun.write(
            `${talkdir}/.github/workflows/slidesk.yml`,
            githubYML,
          );
          break;
        case "gitlab":
          await Bun.write(`${talkdir}/.gitlab-ci.yml`, gitlabYML);
          break;
        case "link":
          await Bun.write(`${talkdir}/link.yml`, linkYML);
          break;
      }
      process.exit(0);
    }
  }
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
    if (options.watch) {
      watch(talkdir, { recursive: true }, (eventType, filename) => {
        if (!filename?.startsWith(".git") && !filename?.endsWith("~")) {
          log(
            `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
          );
          flow(talkdir, options);
        }
      });
    }
    getAction(server, true);
    process.on("SIGINT", () => {
      process.exit(0);
    });
  }
};

export default present;
