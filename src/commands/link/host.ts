import { rmSync } from "node:fs";
import { Clipse } from "clipse";
import { create } from "tar";
import Convert from "../../core/Convert";
import type { SliDeskPublishOptions } from "../../types";
import getLinkToken from "../../utils/getLinkToken";
import save from "../../utils/save";

const { log, error } = console;

const sendToSlideskLink = async (
  talk: string,
  options: SliDeskPublishOptions,
) => {
  const slideskToken = await getLinkToken();
  const talkdir = `${process.cwd()}/${talk ?? ""}`;
  const files = await Convert(`${talkdir}/main.sdf`, {
    ...options,
    domain: options["slidesk-link-url"],
  });
  if (files === null) {
    process.exit();
  }
  await save("__SLIDESKLINK__", talkdir, files);
  await create({ gzip: true, file: "link.tgz" }, ["__SLIDESKLINK__"]);
  rmSync("__SLIDESKLINK__", {
    recursive: true,
    force: true,
  });
  const file = Bun.file("link.tgz");
  const data = new FormData();
  data.set("file", file);
  const response = await fetch(`${options["slidesk-link-url"]}/upload`, {
    method: "POST",
    body: data,
    headers: {
      "x-slidesk": slideskToken,
    },
  });
  const uuid = await response.text();
  if (uuid.startsWith("err:")) {
    error(uuid);
    process.exit(1);
  }
  log("Your presentation is available for 72h:");
  log(`${options["slidesk-link-url"]}/s/${uuid}/`);
  if (options.notes)
    log(`${options["slidesk-link-url"]}/s/${uuid}/${options.notes}`);
  await file.unlink();
  process.exit(0);
};

const linkHostCmd = new Clipse(
  "host",
  "host your presentation in slidesk.link",
);
linkHostCmd
  .addArguments([{ name: "talk", description: "directory of your talk" }])
  .addOptions({
    notes: {
      short: "n",
      type: "string",
      description: "open with speakers notes",
      default: "notes.html",
    },
    timers: {
      short: "t",
      type: "boolean",
      description: "add checkpoint and slide maximum time on notes view",
      default: false,
    },
    transition: {
      short: "a",
      type: "string",
      description: "transition timer",
      default: "300",
    },
    conf: {
      short: "c",
      type: "string",
      description: "use a specific .env file",
      default: "",
    },
    lang: {
      short: "l",
      type: "string",
      description:
        "specify the language version (per default, it will use the .lang.json file with default information)",
      default: "",
    },
  })
  .action(async (a, o) => {
    await sendToSlideskLink(a.talk ?? "", o);
  });

export default linkHostCmd;
