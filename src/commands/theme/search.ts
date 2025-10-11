import { multiselect } from "@clack/prompts";
import { Clipse } from "clipse";
import { themeInstall } from "./install";

const { error } = console;

const themeSearchCmd = new Clipse("search", "slidesk theme search");
themeSearchCmd
  .addArguments([
    {
      name: "search",
      description: "term to find in name or tags",
    },
  ])
  .action(async (args, opts) => {
    if (args.search) {
      const response = await fetch(
        `${opts["slidesk-link-url"]}/addons/search/theme/${args.search}`,
      );
      if (response.status === 200) {
        const list = (await response.json()) as string[];
        const themesToInstall = (await multiselect({
          message: "Select which themes you want to install",
          options: list.map((l) => ({ value: l.replace("/", "__"), label: l })),
          required: false,
        })) as string[];
        if (themesToInstall.length) {
          for await (const p of themesToInstall) {
            await themeInstall(p, opts["slidesk-link-url"] as string);
          }
        }
        process.exit(0);
      } else {
        error("No theme with this name is found");
        process.exit(1);
      }
    } else {
      error("Please provide a search term");
      process.exit(1);
    }
  });

export default themeSearchCmd;
