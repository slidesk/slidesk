#!/usr/bin/env bun
import { program } from "commander";
import packagejson from "../package.json";
import present from "./command/present";
import create from "./command/create";

const { log } = console;

log(
  `\x1b[36;49m
░██████╗██╗░░░░░██╗██████╗░███████╗░██████╗██╗░░██╗
██╔════╝██║░░░░░╚═╝██╔══██╗██╔════╝██╔════╝██║░██╔╝
╚█████╗░██║░░░░░██║██║░░██║█████╗░░╚█████╗░█████═╝░
░╚═══██╗██║░░░░░██║██║░░██║██╔══╝░░░╚═══██╗██╔═██╗░
██████╔╝███████╗██║██████╔╝███████╗██████╔╝██║░╚██╗
╚═════╝░╚══════╝╚═╝╚═════╝░╚══════╝╚═════╝░╚═╝░░╚═╝
                                            v${packagejson.version}\x1b[0m
`,
);

program
  .name("slidesk")
  .description("Your presentation companion")
  .version(packagejson.version, "-v, --version");

// talk's creation command
program.command("create").argument("<talk>").action(create);

// talk's presentation command
program
  .argument("<talk>")
  .option("-p, --port <int>", "port", 1337)
  .option("-s, --save", "save the html file")
  .option("-n, --notes", "open with speakers notes")
  .option("-src, --source", "add a button on slides to display its SDF code")
  .option(
    "-g, -gamepad",
    "control your slide with a gamepad from the presentation",
  )
  .option(
    "--gamepad-sv",
    "control your slide with a gamepad from the speaker-view",
  )
  .option("-q, --qrcode", "add a QRCode on each slide")
  .option(
    "-t, --timers",
    "add checkpoint and slide's maximum time on notes view",
  )
  .action(present);

program.parse();
