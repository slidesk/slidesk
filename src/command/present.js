import { watch, existsSync, rmSync, readdirSync } from "fs";
import process from "process";
import path from "path";
import BabelFish from "../core/BabelFish";
import Server from "../core/Server";
import { getAction } from "../utils/interactCLI";

const { log } = console;

const readAllFiles = (dir) => {
  const result = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file) => {
    if (
      !file.name
        .toLowerCase()
        .match(
          "(.sdf|.env|.lang.json|.ds_store|plugin.json|readme.md|.gitignore|.git)$",
        ) &&
      !file.name.match("^/components/")
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

const save = (options, talkdir, files) => {
  const promises = [];
  if (options.save === "." || options.save === talkdir) {
    log(
      "=> It is not possible to save to the root of your talk. Try an other path",
    );
    process.exit(0);
  }
  // clean
  if (existsSync(options.save))
    rmSync(options.save, { recursive: true, force: true });
  readAllFiles(talkdir).forEach((file) => {
    const nfile = file.replace(talkdir, "");
    // eslint-disable-next-line no-undef
    promises.push(Bun.write(`${options.save}/${nfile}`, Bun.file(file)));
    log(
      `📃 ${[...options.save.split("/"), ...nfile.split("/")]
        .filter((p) => p !== "")
        .join("/")} generated`,
    );
  });
  const excludes = ["/notes.html", "/slidesk-notes.css", "/slidesk-notes.js"];
  Object.entries(files).forEach(([key, value]) => {
    if (!excludes.includes(key)) {
      // eslint-disable-next-line no-undef
      promises.push(Bun.write(`${options.save}${key}`, value.content));
      log(`📃 ${options.save}${key} generated`);
    }
  });
  Promise.all(promises).then(() => {
    process.exit(0);
  });
};

const flow = async (talkdir, options = {}, init = false) => {
  globalThis.BabelFish = new BabelFish(`${talkdir}/main.sdf`, options);
  const files = await globalThis.BabelFish.convert();
  if (files === null) {
    process.exit();
  }
  if (options.save) {
    save(options, talkdir, files);
  } else if (init) {
    Server.create(files, options, talkdir);
  } else {
    Server.setFiles(files);
  }
};

const present = (talk, options) => {
  const talkdir = `${process.cwd()}/${talk ?? ""}`;
  globalThis.talkdir = talkdir;
  flow(talkdir, options, true);
  if (!options.save) {
    if (!options.hidden)
      log(
        "\x1b[4mTake the control of your presentation direct from here.\x1b[24m",
        "\n",
        `\nPress \x1b[1mEnter\x1b[0m to go to the next slide.`,
        `\nPress \x1b[1mP + Enter\x1b[0m to go to the previous slide.`,
        `\nPress \x1b[1mQ\x1b[0m to quit the program.`,
        "\n",
      );
    if (options.watch)
      watch(talkdir, { recursive: true }, (eventType, filename) => {
        if (!filename.startsWith(".git")) {
          log(
            `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
          );
          flow(talkdir, options);
        }
      });
    getAction(true);
    process.on("SIGINT", () => {
      process.exit(0);
    });
  }
};

export default present;
