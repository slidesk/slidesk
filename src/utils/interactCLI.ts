import readline from "node:readline";
import type Server from "../core/Server";
import type Terminal from "../core/Terminal";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const removeCurrentLine = () => {
  readline.moveCursor(process.stdout, 0, -1);
  readline.clearScreenDown(process.stdout);
};

export const question = (query: string) =>
  new Promise((resolve) => {
    rl.question(query !== "" ? `\x1b[1m> ${query}\x1b[0m\n` : "", (anwser) =>
      resolve(anwser.trim()),
    );
  });

export const getAction = async (server: Server | Terminal, present = false) => {
  const answer = await question("");
  const i = (answer as string).trim().toLowerCase();
  removeCurrentLine();
  if (i === "q") process.exit();
  else if (i === "p" && present) server.send("previous");
  else if (i.match(/^\d+$/) && present) server.send("goto", Number(i) - 1);
  else if (present) server.send("next");
  getAction(server, present);
};
