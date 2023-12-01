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
                                           v ${packagejson.version}\x1b[0m
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
  .argument("[talk]", "the directory of your talk")
  .option("-d, --domain <string>", "domain", "localhost")
  .option("-p, --port <int>", "port", 1337)
  .option("-s, --save <path>", "save the presentation")
  .option("-n, --notes", "open with speakers notes")
  .option("-t, --timers", "add checkpoint and slide maximum time on notes view")
  .option("-a, --transition <int>", "transition timer", 300)
  .action(present);

program.parse();
