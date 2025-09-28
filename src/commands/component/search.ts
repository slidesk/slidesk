import { multiselect } from "@clack/prompts";
import { Clipse } from "clipse";
import { componentInstall } from "./install";

const { error } = console;

const componentSearchCmd = new Clipse("search", "slidesk component search");
componentSearchCmd
  .addArguments([
    {
      name: "search",
      description: "term to find in name or tags",
    },
  ])
  .action(async (args, opts) => {
    if (args.search) {
      const response = await fetch(
        `${opts["slidesk-link-url"]}/addons/search/component/${args.search}`,
      );
      console.log(
        `${opts["slidesk-link-url"]}/addons/search/component/${args.search}`,
      );
      if (response.status === 200) {
        const list = (await response.json()) as string[];
        const componentsToInstall = (await multiselect({
          message: "Select which components you want to install",
          options: list.map((l) => ({ value: l.replace("/", "__"), label: l })),
          required: false,
        })) as string[];
        if (componentsToInstall.length) {
          for await (const p of componentsToInstall) {
            await componentInstall(p, opts["slidesk-link-url"] as string);
          }
        }
        process.exit(0);
      } else {
        error("No component with this name is found");
        process.exit(1);
      }
    } else {
      error("Please provide a search term");
      process.exit(1);
    }
  });

export default componentSearchCmd;
