import { watch, existsSync, rmSync, readdirSync } from "node:fs";
import process from "node:process";
import path from "node:path";
import { networkInterfaces } from "node:os";
import { getAction } from "../utils/interactCLI";
import type { SliDeskPresentOptions, SliDeskFile } from "../types";
import SlideskServer from "../core/Server";
import Terminal from "../core/Terminal";
import Convert from "../core/Convert";

const { log } = console;

const readAllFiles = (dir: string): string[] => {
  const result: string[] = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file, _) => {
    if (
      /(.sdf|.env|.lang.json|.ds_store|plugin.json|readme.md|.gitignore|.git)$/.exec(
        file.name.toLowerCase(),
      ) === null &&
      /^\/components\//.exec(file.name) === null
    ) {
      if (file.isDirectory()) {
        result.push(...readAllFiles(path.join(dir, file.name)));
      } else {
        result.push(path.join(dir, file.name));
      }
    }
  });
  return result;
};

const save = (
  options: SliDeskPresentOptions,
  talkdir: string,
  files: SliDeskFile,
) => {
  const promises: Promise<number>[] = [];
  if (options.save === "." || options.save === talkdir) {
    log(
      "=> It is not possible to save to the root of your talk. Try an other path",
    );
    process.exit(0);
  }
  // clean
  if (options.save && existsSync(options.save))
    rmSync(options.save, { recursive: true, force: true });
  readAllFiles(talkdir).forEach((file, _) => {
    const nfile = file.replace(talkdir, "");
    // eslint-disable-next-line no-undef
    promises.push(Bun.write(`${options.save}/${nfile}`, Bun.file(file)));
    if (options.save)
      log(
        `📃 ${[...options.save.split("/"), ...nfile.split("/")]
          .filter((p) => p !== "")
          .join("/")} generated`,
      );
  });
  const excludes = ["/notes.html", "/slidesk-notes.css", "/slidesk-notes.js"];
  Object.entries(files).forEach(([key, value], _) => {
    if (!excludes.includes(key)) {
      // eslint-disable-next-line no-undef
      promises.push(Bun.write(`${options.save}${key}`, value.content ?? ""));
      log(`📃 ${options.save}${key} generated`);
    }
  });
  Promise.all(promises).then(() => {
    process.exit(0);
  });
};

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
    save(options, talkdir, files);
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
  const talkdir = `${process.cwd()}/${talk ?? ""}`;
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
