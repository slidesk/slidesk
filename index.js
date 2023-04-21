#!/usr/bin/env node
import { program } from "commander";
import Interpreter from "#interpreter";
import Server from "#server";
import open from "open";
import { watch, writeFileSync } from "fs";

let server;

const flow = (talk, init = false, options = {}) => {
  new Interpreter(`./${talk}/main.tfs`, options)
    .then(async (html) => {
      if (options.save) {
        writeFileSync(`./${talk}/index.html`, html);
      } else {
        if (init) {
          server = new Server(html, options.port, `${process.env.PWD}/${talk}`);
          if (options.open) await open(`http://localhost:${options.port}`);
        } else {
          server.setHTML(html);
        }
      }
    })
    .catch((err) => console.error(err));
};

program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .option("--open", "open the default browser")
  .option("--save", "save the html file")
  .description("Convert & present a talk")
  .action((talk, options) => {
    flow(talk, true, options);
    if (!options.save) {
      watch(talk, { recursive: true }, (eventType, filename) => {
        console.log(`♻️  ${filename} is ${eventType}`);
        flow(talk, false);
      });
    }
  });

program.parse();
