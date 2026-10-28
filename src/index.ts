#!/usr/bin/env bun
import { Clipse } from "clipse";
import packagejson from "../package.json";
import componentCmd from "./commands/component";
import createCmd from "./commands/create";
import deployCmd from "./commands/deploy";
import designCmd from "./commands/design";
import exportCmd from "./commands/export";
import importCmd from "./commands/import";
import linkCmd from "./commands/link";
import pluginCmd from "./commands/plugin";
import presentCmd from "./commands/present";
import saveCmd from "./commands/save";
import skillsCmd from "./commands/skills";
import templateCmd from "./commands/template";
import themeCmd from "./commands/theme";
import updateCmd from "./commands/update";
import checkVersion from "./utils/checkLastVersion";
import { runCommand } from "./utils/cliError";

const { log } = console;

log(`\x1b[1m ____(•)${Date.now() % 2 ? "-" : "<"}
(\x1b[4mSliDesk\x1b[0m\x1b[1m) v:\x1b[36;49m${packagejson.version}\x1b[0m
`);

// runs alongside the command instead of delaying it, reported once it is done
const versionCheck = checkVersion(packagejson.version);

const slidesk = new Clipse(
  "slidesk",
  "Your presentation companion",
  packagejson.version,
);

slidesk
  .addSubcommands([
    createCmd,
    pluginCmd,
    componentCmd,
    linkCmd,
    templateCmd,
    themeCmd,
    designCmd,
    updateCmd,
    deployCmd,
    saveCmd,
    exportCmd,
    importCmd,
    presentCmd,
    skillsCmd,
  ])
  .defineDefaultCommand(presentCmd);

const code = await runCommand(() => slidesk.ready());
await versionCheck;
if (code) process.exit(code);
