#!/usr/bin/env node
import { program } from "commander";
import Interpreter from "#interpreter";
import Server from "#server";
import open from "open";
import fs from "fs";

let server;

const flow = (talk, init = false, options = {}) => {
  new Interpreter(`./${talk}/main.tfs`)
    .then(async (html) => {
      if (init) {
        server = new Server(html, options.port);
        await open(`http://localhost:${options.port}`);
      } else {
        server.setHTML(html);
      }
    })
    .catch((err) => console.error(err));
};

program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .description("Convert & present a talk")
  .action((talk, options) => {
    flow(talk, true, options);
    fs.watch(talk, { recursive: true }, (eventType, filename) => {
      console.log(`♻️  ${filename} is ${eventType}`);
      flow(talk, false);
    });
  });

program.parse();
