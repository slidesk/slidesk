#!/usr/bin/env bun
import { program } from "commander";
import open from "open";
import Interpreter from "../src/core/Interpreter";
import Server from "../src/core/Server";

let server;

const flow = (talk, options = {}, init = false) => {
  Interpreter.convert(`./${talk}/main.sdf`, options)
    .then(async (html) => {
      if (options.save) {
        Bun.write(`./${talk}/index.html`, html);
      } else if (init) {
        server = new Server(html, options, `${process.cwd()}/${talk}`);
        if (options.open) {
          if (options.notes)
            await open(`http://localhost:${options.port}/notes`);
          await open(`http://localhost:${options.port}`);
        }
      } else {
        server.setHTML(html);
      }
    })
    .catch((err) => console.error(err));
};

program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .option("--open", "open the default browser")
  .option("--save", "save the html file")
  .option("--notes", "open with speakers notes")
  .description("Convert & present a talk")
  .action((talk, options) => {
    flow(talk, options, true);
    // if (!options.save) {
    //   watch(talk, { recursive: true }, (eventType, filename) => {
    //     console.log(`♻️  ${filename} is ${eventType}`);
    //     flow(talk, options);
    //   });
    // }
  });

program.parse();
