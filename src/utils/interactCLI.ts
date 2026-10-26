import readline from "node:readline";
import type Server from "../core/Server";
import { CliError } from "./cliError";

export const removeCurrentLine = () => {
  readline.moveCursor(process.stdout, 0, -1);
  readline.clearScreenDown(process.stdout);
};

/** Asks on stdin; rejects when the prompt is closed without an answer (Ctrl-C, Ctrl-D). */
export const question = (query: string) =>
  new Promise<string>((resolve, reject) => {
    // closed after each answer so that stdin no longer keeps the process alive
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let answered = false;
    rl.on("close", () => {
      if (!answered) reject(new CliError("Interrupted"));
    });
    rl.question(query === "" ? "" : `\x1b[1m> ${query}\x1b[0m\n`, (anwser) => {
      answered = true;
      rl.close();
      resolve(anwser.trim());
    });
  });

/** Drives the slides from the terminal until q is typed or the prompt is interrupted. */
export const getAction = async (server: Server, present = false) => {
  for (;;) {
    const i = (await question("").catch(() => "q")).toLowerCase();
    removeCurrentLine();
    if (i === "q") return;
    if (i === "p" && present) server.send("previous");
    else if (/^\d+$/.exec(i) !== null && present)
      server.send("goto", Number(i) - 1);
    else if (present) server.send("next");
  }
};
