import readline from "readline";

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
