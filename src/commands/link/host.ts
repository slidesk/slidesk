import { Clipse } from "clipse";
import type { SliDeskPublishOptions } from "../../types";
import { CliError } from "../../utils/cliError";
import getLinkToken from "../../utils/getLinkToken";
import { hubFetch, withTarball, withTempDir } from "../../utils/hub";
import save from "../../utils/save";

const { log } = console;

const sendToSlideskLink = async (
  talk: string,
  options: SliDeskPublishOptions,
) => {
  const slideskToken = await getLinkToken();
  // only pages opened with this token may drive the hosted talk
  const speakerToken = crypto.randomUUID();
  const uuid = await withTempDir(async (dir) => {
    await save(
      `${process.cwd()}/${talk ?? ""}`,
      { ...options, target: `${dir}/__SLIDESKLINK__` },
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
    return withTarball(dir, ["__SLIDESKLINK__"], async (file) => {
      const data = new FormData();
      data.set("file", file);
      data.set("token", speakerToken);
      const response = await hubFetch(`${options["slidesk-link-url"]}/upload`, {
        method: "POST",
        body: data,
        headers: { "x-slidesk": slideskToken },
      });
      const text = await response.text();
      if (!response.ok)
        throw new CliError(`Hosting failed (${response.status}): ${text}`);
      return text;
    });
  });
  if (uuid.startsWith("err:")) throw new CliError(uuid);
  if (uuid === "") throw new CliError("Your presentation is too large");
  const url = `${options["slidesk-link-url"]}/s/${uuid}/`;
  log("Your presentation is available for 72h:");
  log(`Share with your audience: ${url}`);
  log("Keep these ones for yourself:");
  log(`Present from: ${url}?token=${speakerToken}`);
  log(
    `Speaker view: ${url}${options.notes || "notes.html"}?token=${speakerToken}`,
  );
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
