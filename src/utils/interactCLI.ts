import readline from "node:readline";
import type Server from "../core/Server";

export const removeCurrentLine = () => {
  readline.moveCursor(process.stdout, 0, -1);
  readline.clearScreenDown(process.stdout);
};

export const question = (query: string) =>
  new Promise<string>((resolve) => {
    // closed after each answer so that stdin no longer keeps the process alive
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query === "" ? "" : `\x1b[1m> ${query}\x1b[0m\n`, (anwser) => {
      rl.close();
      resolve(anwser.trim());
    });
  });

export const getAction = async (server: Server, present = false) => {
  const answer = await question("");
  const i = answer.toLowerCase();
  removeCurrentLine();
  if (i === "q") process.exit();
  else if (i === "p" && present) server.send("previous");
  else if (/^\d+$/.exec(i) !== null && present)
    server.send("goto", Number(i) - 1);
  else if (present) server.send("next");
  getAction(server, present);
};
