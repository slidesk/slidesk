import { rmSync } from "node:fs";
import { Clipse } from "clipse";
import { create } from "tar";
import type { SliDeskPublishOptions } from "../../types";
import { CliError } from "../../utils/cliError";
import getLinkToken from "../../utils/getLinkToken";
import save from "../../utils/save";

const { log } = console;

const sendToSlideskLink = async (
  talk: string,
  options: SliDeskPublishOptions,
) => {
  const slideskToken = await getLinkToken();
  await save(
    `${process.cwd()}/${talk ?? ""}`,
    {
      ...options,
      target: "__SLIDESKLINK__",
    },
    {
      slidesk: {
        deployed: true,
        DOMAIN: options["slidesk-link-url"]?.replace(
          /^https?:\/\/(www\.)?/,
          "",
        ),
      },
    },
  );
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
  if (uuid.startsWith("err:")) throw new CliError(uuid);
  if (uuid === "") {
    await file.unlink();
    throw new CliError("Your presentation is too large");
  }
  log("Your presentation is available for 72h:");
  log(`${options["slidesk-link-url"]}/s/${uuid}/`);
  if (options.notes)
    log(`${options["slidesk-link-url"]}/s/${uuid}/${options.notes}`);
  await file.unlink();
};

const linkHostCmd = new Clipse(
  "host",
  "host your presentation in slidesk.link",
);
linkHostCmd
  .addArguments([{ name: "talk", description: "directory of your talk" }])
  .addOptions({
    conf: {
      short: "c",
      type: "string",
      description: "use a specific slidesk.toml file",
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
