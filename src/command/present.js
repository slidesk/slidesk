import { watch } from "fs";
import process from "process";
import Interpreter from "../core/Interpreter";
import Server from "../core/Server";
import { question, removeCurrentLine } from "../utils/interactCLI";

const { log } = console;

const flow = (talkdir, options = {}, init = false) => {
  Interpreter.convert(`${talkdir}/main.sdf`, options).then(async (html) => {
    if (html === null) {
      process.exit();
    }
    if (options.save) {
      Object.entries(html).forEach(([key, value]) => {
        // eslint-disable-next-line no-undef
        Bun.write(`${talkdir}/${key}.html`, value.html);
      });
    } else if (init) {
      Server.create(html, options, `${process.cwd()}/${talkdir}`);
    } else {
      Server.setHTML(html);
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
  log(
    "\n\n\x1b[4mTake the control of your presentation direct from here.\x1b[24m",
    "\n",
    `\nPress \x1b[1mEnter\x1b[0m to go to the next slide.`,
    `\nPress \x1b[1mP + Enter\x1b[0m to go to the previous slide.`,
    `\nPress \x1b[1mQ\x1b[0m to quit the program.`,
    "\n",
  );
  const talkdir = talk ? `./${talk}` : ".";
  flow(talkdir, options, true);
  if (!options.save) {
    watch(talkdir, { recursive: true }, (eventType, filename) => {
      if (!filename.startsWith(".git")) {
        log(
          `♻️  \x1b[4m${filename}\x1b[0m has "\x1b[1m${eventType}\x1b[0m" action`,
        );
        flow(talkdir, options);
      }
    });
  }
  getAction();
};

export default present;
