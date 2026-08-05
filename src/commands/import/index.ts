import { Clipse } from "clipse";
import importTalk from "../../core/import";

const { error } = console;

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
    if (!args.source || args.source.trim() === "") {
      error("You must specify the presentation to import");
      process.exit(1);
    }
    try {
      await importTalk(args.source, {
        type: (options.type as string) || undefined,
        output: options.output as string,
        force: options.force as boolean,
      });
    } catch (e) {
      error((e as Error).message);
      process.exit(1);
    }
    process.exit(0);
  });

export default importCmd;
