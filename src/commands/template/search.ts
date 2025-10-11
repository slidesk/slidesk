import { multiselect } from "@clack/prompts";
import { Clipse } from "clipse";
import { templateInstall } from "./install";

const { error } = console;

const templateSearchCmd = new Clipse("search", "slidesk template search");
templateSearchCmd
  .addArguments([
    {
      name: "search",
      description: "term to find in name or tags",
    },
  ])
  .action(async (args, opts) => {
    if (args.search) {
      const response = await fetch(
        `${opts["slidesk-link-url"]}/addons/search/template/${args.search}`,
      );
      if (response.status === 200) {
        const list = (await response.json()) as string[];
        const templatesToInstall = (await multiselect({
          message: "Select which templates you want to install",
          options: list.map((l) => ({ value: l.replace("/", "__"), label: l })),
          required: false,
        })) as string[];
        if (templatesToInstall.length) {
          for await (const p of templatesToInstall) {
            await templateInstall(p, opts["slidesk-link-url"] as string);
          }
        }
        process.exit(0);
      } else {
        error("No template with this name is found");
        process.exit(1);
      }
    } else {
      error("Please provide a search term");
      process.exit(1);
    }
  });

export default templateSearchCmd;
