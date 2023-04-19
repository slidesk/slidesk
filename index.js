#!/usr/bin/env node
const { program } = require("commander");
const Interpreter = require("./core/Interpreter");

program
  .command("convert <talk>")
  .description("Convert & present a talk")
  .action((talk) => {
    const babelfish = new Interpreter(`./${talk}/main.tfs`);
  });

program.parse();
