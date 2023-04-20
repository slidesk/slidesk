#!/usr/bin/env node
const { program } = require("commander");
const Interpreter = require("./core/Interpreter");
const Server = require("./core/Server");

program
  .argument("<talk>")
  .description("Convert & present a talk")
  .action((talk) => {
    const babelfish = new Interpreter(`./${talk}/main.tfs`);
    babelfish
      .then((html) => new Server(html))
      .catch((err) => console.error(err));
  });

program.parse();
