#!/usr/bin/env node
import { program } from "commander";
import Interpreter from "#interpreter";
import Server from "#server";
import open from "open";

const port = 1337;

program
  .argument("<talk>")
  .description("Convert & present a talk")
  .action((talk) => {
    const babelfish = new Interpreter(`./${talk}/main.tfs`);
    babelfish
      .then(async (html) => {
        new Server(html, port);
        await open(`http://localhost:${port}`);
      })
      .catch((err) => console.error(err));
  });

program.parse();
