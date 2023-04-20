#!/usr/bin/env node
import { program } from "commander";
import Interpreter from "#interpreter";
import Server from "#server";
import open from "open";

program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .description("Convert & present a talk")
  .action((talk, options) => {
    const babelfish = new Interpreter(`./${talk}/main.tfs`);
    babelfish
      .then(async (html) => {
        new Server(html, options.port);
        await open(`http://localhost:${options.port}`);
      })
      .catch((err) => console.error(err));
  });

program.parse();
