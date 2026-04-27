#!/usr/bin/env bun
import { Clipse } from "clipse";
import packagejson from "../package.json";
import componentCmd from "./commands/component";
import createCmd from "./commands/create";
import deployCmd from "./commands/deploy";
import linkCmd from "./commands/link";
import pluginCmd from "./commands/plugin";
import present from "./commands/present";
import saveCmd from "./commands/save";
import templateCmd from "./commands/template";
import themeCmd from "./commands/theme";
import checkVersion from "./utils/checkLastVersion";

const { log } = console;

log(`\x1b[1m ____(•)${Date.now() % 2 ? "-" : "<"}
(\x1b[4mSliDesk\x1b[0m\x1b[1m) v:\x1b[36;49m${packagejson.version}\x1b[0m
`);

await checkVersion(packagejson.version);

const slidesk = new Clipse(
  "slidesk",
  "Your presentation companion",
  packagejson.version,
);

slidesk
  .addOptions({
    domain: {
      short: "d",
      type: "string",
      default: "localhost",
      description: "specify a custom domain",
    },
    port: {
      short: "p",
      type: "string",
      default: "1337",
      description: "specify a custom port",
    },
    notes: {
      short: "n",
      type: "string",
      description: "open with speakers notes",
      default: "notes.html",
      optional: true,
    },
    transition: {
      short: "a",
      type: "string",
      description: "transition timer",
      default: "300",
      optional: true,
    },
    watch: {
      short: "w",
      type: "boolean",
      description: "watch modification of files",
      default: false,
      optional: true,
    },
    hidden: {
      short: "g",
      type: "boolean",
      description: "remove help information",
      default: false,
      optional: true,
    },
    conf: {
      short: "c",
      type: "string",
      description: "use a specific .env file",
      default: "",
      optional: true,
    },
    open: {
      short: "o",
      type: "boolean",
      description: "open a browser with the presentation or notes view",
      default: false,
      optional: true,
    },
    lang: {
      short: "l",
      type: "string",
      description:
        "specify the language version (per default, it will use the .lang.json file with default information)",
      default: "",
      optional: true,
    },
    terminal: {
      short: "x",
      type: "boolean",
      description: "present in a terminal window instead of a browser",
      default: false,
      optional: true,
    },
  })
  .addArguments([
    {
      name: "talk",
      description: "directory of your talk",
    },
  ])
  .addSubcommands([
    createCmd,
    pluginCmd,
    componentCmd,
    linkCmd,
    templateCmd,
    themeCmd,
    deployCmd,
    saveCmd,
  ])
  .action(async (args, opts) => await present(args.talk ?? "", opts))
  .ready();
