import readline from "readline";
import Server from "../core/Server";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const removeCurrentLine = () => {
  readline.moveCursor(process.stdout, 0, -1);
  readline.clearScreenDown(process.stdout);
};

export const question = (query) =>
  new Promise((resolve) => {
    rl.question(query !== "" ? `\x1b[1m> ${query}\x1b[0m\n` : "", (anwser) =>
      resolve(anwser.trim()),
    );
  });

export const getAction = async (present = false) => {
  const answer = await question("");
  const i = answer.trim().toLowerCase();
  removeCurrentLine();
  if (i === "q") process.exit();
  else if (i === "p" && present) Server.send("previous");
  else if (present) Server.send("next");
  getAction(present);
};
