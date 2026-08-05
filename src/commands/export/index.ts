import { Clipse } from "clipse";
import exportTalk from "../../core/export";

const { error } = console;

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
    const type = (options.type as string) || "pdf";
    if (!TYPES.includes(type)) {
      error(`${type} is not a valid export type (${TYPES.join(", ")})`);
      process.exit(1);
    }
    const talkPath = args.talk && args.talk !== "." ? `/${args.talk}` : "";
    try {
      await exportTalk(`${process.cwd()}${talkPath}`, { ...options, type });
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
    process.exit(0);
  });

export default exportCmd;
