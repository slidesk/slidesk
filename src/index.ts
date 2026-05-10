#!/usr/bin/env bun
import { Clipse } from "clipse";
import packagejson from "../package.json";
import componentCmd from "./commands/component";
import createCmd from "./commands/create";
import deployCmd from "./commands/deploy";
import linkCmd from "./commands/link";
import pluginCmd from "./commands/plugin";
import presentCmd from "./commands/present";
import saveCmd from "./commands/save";
import studioCmd from "./commands/studio";
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
  .addSubcommands([
    presentCmd,
    createCmd,
    linkCmd,
    deployCmd,
    saveCmd,
    studioCmd,
    componentCmd,
    pluginCmd,
    templateCmd,
    themeCmd,
  ])
  .defineDefaultCommand(presentCmd)
  .ready();
