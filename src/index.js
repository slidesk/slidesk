#!/usr/bin/env bun
import { watch } from "fs";
import { program } from "commander";
import open from "open";
import Interpreter from "./core/Interpreter";
import Server from "./core/Server";

const flow = (talk, options = {}, init = false) => {
  Interpreter.convert(`./${talk}/main.sdf`, options)
    .then(async (html) => {
      if (options.save) {
        Object.entries(html).forEach(([key, value]) => {
          // eslint-disable-next-line no-undef
          Bun.write(`./${talk}/${key}.html`, value.html);
        });
      } else if (init) {
        Server.create(html, options, `${process.cwd()}/${talk}`);
        if (options.open) {
          if (options.notes)
            await open(`http://localhost:${options.port}/notes`);
          await open(`http://localhost:${options.port}`);
        }
      } else {
        Server.setHTML(html);
      }
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err));
};

program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .option("--open", "open the default browser")
  .option("--save", "save the html file")
  .option("--notes", "open with speakers notes")
  .option("--source", "add a button on slides to display its SDF code")
  .option(
    "--gamepad",
    "control your slide with a gamepad from the presentation",
  )
  .option(
    "--gamepad-sv",
    "control your slide with a gamepad from the speaker-view",
  )
  .option("--qrcode", "add a QRCode on each slide")
  .description("Convert & present a talk")
  .action((talk, options) => {
    flow(talk, options, true);
    if (!options.save) {
      watch(talk, { recursive: true }, (eventType, filename) => {
        // eslint-disable-next-line no-console
        console.log(`♻️  ${filename} is ${eventType}`);
        flow(talk, options);
      });
    }
  });

program.parse();
