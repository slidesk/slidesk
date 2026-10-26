import { Clipse } from "clipse";
import importTalk from "../../core/import";
import { CliError } from "../../utils/cliError";

const importCmd = new Clipse(
  "import",
  "turn a pptx, Google Slides, slidev or reveal.js deck into a SliDesk talk",
);
importCmd
  .addArguments([
    {
      name: "source",
      description: "file, directory or URL of the presentation to import",
    },
  ])
  .addOptions({
    type: {
      short: "t",
      type: "string",
      description:
        "source format: pptx, gslides, slidev or revealjs (default: guessed)",
      default: "",
      optional: true,
    },
    output: {
      short: "o",
      type: "string",
      description:
        "target directory (default: the slugified title of the deck)",
      default: "",
      optional: true,
    },
    force: {
      short: "f",
      type: "boolean",
      description: "write into the target directory even if it is not empty",
      default: false,
      optional: true,
    },
  })
  .action(async (args, options) => {
    if (!args.source || args.source.trim() === "")
      throw new CliError("You must specify the presentation to import");
    try {
      await importTalk(args.source, {
        type: options.type || undefined,
        output: options.output,
        force: options.force,
      });
    } catch (e) {
      throw new CliError(e instanceof Error ? e.message : String(e));
    }
  });

export default importCmd;
