import { watch, existsSync, rmSync, mkdirSync, readdirSync } from "fs";
import process from "process";
import path from "path";
import Interpreter from "../core/Interpreter";
import Server from "../core/Server";
import { question, removeCurrentLine } from "../utils/interactCLI";

const { log } = console;

const readAllFiles = (dir) => {
  const result = [];
  const files = readdirSync(dir, { withFileTypes: true });
  files.forEach((file) => {
    if (file.isDirectory()) {
      result.push(...readAllFiles(path.join(dir, file.name)));
    } else {
      result.push(path.join(dir, file.name));
    }
  });
  return result;
};

const flow = (talkdir, options = {}, init = false) => {
  Interpreter.convert(`${talkdir}/main.sdf`, options).then(async (files) => {
    if (files === null) {
      process.exit();
    }
    if (options.save) {
      const promises = [];
      // clean
      if (existsSync(options.save))
        rmSync(options.save, { recursive: true, force: true });
      mkdirSync(options.save);
      readAllFiles(talkdir).forEach((file) => {
        const nfile = file.replace(talkdir, "");
        if (
          !nfile.match(
            "(.sdf|/.env|.lang.json|/.DS_Store|/plugin.json|/README.md)$",
          ) &&
          !nfile.match("^/components/")
        ) {
          const filePath = `${options.save}/${nfile.substring(
            0,
            nfile.lastIndexOf("/"),
          )}`;
          mkdirSync(filePath, { recursive: true });
          // eslint-disable-next-line no-undef
          promises.push(Bun.write(`${options.save}/${nfile}`, Bun.file(file)));
          log(`📃 ${options.save}${nfile} generated`);
        }
      });
      const excludes = ["/notes", "/slidesk-notes.css", "/slidesk-notes.js"];
      Object.entries(files).forEach(([key, value]) => {
        if (!excludes.includes(key)) {
          const filePath = `${options.save}/${key.substring(
            0,
            key.lastIndexOf("/"),
          )}`;
          mkdirSync(filePath, { recursive: true });
          // eslint-disable-next-line no-undef
          promises.push(Bun.write(`${options.save}${key}`, value.content));
          log(`📃 ${options.save}${key} generated`);
        }
      });
      Promise.all(promises).then(() => {
        process.exit(0);
      });
    } else if (init) {
      Server.create(files, options, talkdir);
    } else {
      Server.setFiles(files);
    }
  });
};

const getAction = async () => {
  const answer = await question("");
  const i = answer.trim().toLowerCase();
  removeCurrentLine();
  if (i === "q") process.exit();
  else if (i === "p") Server.send("previous");
  else Server.send("next");
  getAction();
};

const present = (talk, options) => {
  const talkdir = `${process.cwd()}/${talk ?? ""}`;
  flow(talkdir, options, true);
  if (!options.save) {
    log(
      "\x1b[4mTake the control of your presentation direct from here.\x1b[24m",
      "\n",
      `\nPress \x1b[1mEnter\x1b[0m to go to the next slide.`,
      `\nPress \x1b[1mP + Enter\x1b[0m to go to the previous slide.`,
      `\nPress \x1b[1mQ\x1b[0m to quit the program.`,
      "\n",
    );
    watch(talkdir, { recursive: true }, (eventType, filename) => {
      if (!filename.startsWith(".git")) {
        log(
          `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
        );
        flow(talkdir, options);
      }
    });
    getAction();
    process.on("SIGINT", () => {
      process.exit(0);
    });
  }
};

export default present;
