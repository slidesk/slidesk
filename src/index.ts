#!/usr/bin/env bun
import { program } from "commander";
import packagejson from "../package.json";
import present from "./command/present";
import create from "./command/create";
import checkVersion from "./utils/checkLastVersion";
import component from "./command/component";
import plugin from "./command/plugin";

const { log } = console;

log(`\x1b[1m ____(•)${Date.now() % 2 ? "-" : "<"}
(\x1b[4mSliDesk\x1b[0m\x1b[1m) v:\x1b[36;49m${packagejson.version}\x1b[0m
`);

await checkVersion(packagejson.version);

program
  .name("slidesk")
  .description("Your presentation companion")
  .version(packagejson.version, "-v, --version");

// talk's creation command
program
  .command("create")
  .argument("<talk>")
  .option("--theme <string>", "theme", "none")
  .action(create);

// components
program
  .command("component")
  .argument("<action>")
  .argument("[name]")
  .action(component);

// plugins
program
  .command("plugin")
  .argument("<action>")
  .argument("[name]")
  .action(plugin);

// talk's presentation command
program
  .argument("[talk]", "the directory of your talk")
  .option("-d, --domain <string>", "domain", "localhost")
  .option("-p, --port <int>", "port", "1337")
  .option("-s, --save <path>", "save the presentation")
  .option("-n, --notes", "open with speakers notes")
  .option("-t, --timers", "add checkpoint and slide maximum time on notes view")
  .option("-a, --transition <int>", "transition timer", "300")
  .option("-w, --watch", "watch modification of files")
  .option("-g, --hidden", "remove help information")
  .option("-c, --conf <name>", "use a specific .env file", "")
  .option(
    "-i, --interactive",
    "allow your audience to see your presentation on another device synchronously",
    false,
  )
  .option("-o, --open", "open a browser with the presentation or notes view")
  .option(
    "-l, --lang <string>",
    "specify the language version (per default, it will use the .lang.json file with default information)",
    "",
  )
  .option("-x, --terminal", "present in a terminal window instead of a browser")
  .action(present);

program.parse();
