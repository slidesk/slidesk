import { Clipse } from "clipse";
import save from "../../utils/save";

const saveCmd = new Clipse(
  "save",
  "save your prensentation into a html & assets",
);
saveCmd
  .addArguments([
    { name: "talk", description: "name of your talk/directory (default: .)" },
  ])
  .addOptions({
    target: {
      optional: false,
      short: "t",
      description: "target directory",
      default: "public",
    },
    conf: {
      short: "c",
      type: "string",
      description: "use a specific .env file",
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
    await save(args.talk ?? process.cwd(), options, {
      slidesk: {
        deployed: true,
      },
    });
    process.exit(0);
  });

export default saveCmd;
