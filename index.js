#!/usr/bin/env node
import { program } from "commander";
import Interpreter from "#interpreter";
import Server from "#server";
import open from "open";
import fs from "fs";

program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .description("Convert & present a talk")
  .action((talk, options) => {
    let serve;
    new Interpreter(`./${talk}/main.tfs`)
      .then(async (html) => {
        serve = new Server(html, options.port);
        await open(`http://localhost:${options.port}`);
      })
      .catch((err) => console.error(err));
    fs.watch(talk, { recursive: true }, (eventType, filename) => {
      console.log(`♻️  ${filename} is ${eventType}`);
      new Interpreter(`./${talk}/main.tfs`)
        .then(async (html) => {
          serve.setHTML(html);
        })
        .catch((err) => console.error(err));
    });
  });

program.parse();
