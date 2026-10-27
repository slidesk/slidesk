import { resolve } from "node:path";
import { Clipse } from "clipse";
import exportTalk from "../../core/export";
import { CliError } from "../../utils/cliError";

const TYPES = ["pdf", "pptx"];

const exportCmd = new Clipse(
  "export",
  "export your presentation as a pdf or a pptx file",
);
exportCmd
  .addArguments([
    { name: "talk", description: "name of your talk/directory (default: .)" },
  ])
  .addOptions({
    type: {
      short: "t",
      type: "string",
      description: `export format: ${TYPES.join(" or ")}`,
      default: "pdf",
      optional: true,
    },
    output: {
      short: "o",
      type: "string",
      description: "output file (default: the slugified title of your talk)",
      default: "",
      optional: true,
    },
    conf: {
      short: "c",
      type: "string",
      description: "use a specific slidesk.toml file",
      default: "",
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
  })
  .action(async (args, options) => {
    const type = options.type || "pdf";
    if (!TYPES.includes(type))
      throw new CliError(
        `${type} is not a valid export type (${TYPES.join(", ")})`,
      );
    try {
      await exportTalk(resolve(args.talk ?? ""), { ...options, type });
    } catch (e) {
      throw new CliError(e instanceof Error ? e.message : String(e));
    }
  });

export default exportCmd;
