import { multiselect } from "@clack/prompts";
import { Clipse } from "clipse";
import { pluginInstall } from "./install";

const { error } = console;

const pluginSearchCmd = new Clipse("search", "slidesk plugin search");
pluginSearchCmd
  .addArguments([
    {
      name: "search",
      description: "term to find in name or tags",
    },
  ])
  .action(async (args, opts) => {
    if (args.search) {
      const response = await fetch(
        `${opts["slidesk-link-url"]}/addons/search/plugin/${args.search}`,
      );
      if (response.status === 200) {
        const list = (await response.json()) as string[];
        const pluginsToInstall = (await multiselect({
          message: "Select which plugins you want to install",
          options: list.map((l) => ({ value: l.replace("/", "__"), label: l })),
          required: false,
        })) as string[];
        if (pluginsToInstall.length) {
          for await (const p of pluginsToInstall) {
            await pluginInstall(p, opts["slidesk-link-url"] as string);
          }
        }
        process.exit(0);
      } else {
        error("No plugin with this name is found");
        process.exit(1);
      }
    } else {
      error("Please provide a search term");
      process.exit(1);
    }
  });

export default pluginSearchCmd;
