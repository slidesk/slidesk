import { multiselect } from "@clack/prompts";
import { Clipse } from "clipse";

const { error } = console;

const addonSearchCmd = (
  kind: "plugin" | "template" | "component" | "theme",
  install: (name: string, urlLink?: string) => Promise<unknown>,
) => {
  const cmd = new Clipse("search", `slidesk ${kind} search`);
  cmd
    .addArguments([
      {
        name: "search",
        description: "term to find in name or tags",
      },
    ])
    .action(async (args, opts: { "slidesk-link-url"?: string }) => {
      if (args.search) {
        const response = await fetch(
          `${opts["slidesk-link-url"]}/addons/search/${kind}/${args.search}`,
        );
        if (response.status === 200) {
          const list: string[] = await response.json();
          const selection = await multiselect({
            message: `Select which ${kind}s you want to install`,
            options: list.map((l) => ({
              value: l.replace("/", "__"),
              label: l,
            })),
            required: false,
          });
          // multiselect returns a symbol when the prompt is cancelled
          if (Array.isArray(selection))
            for (const p of selection)
              await install(p, opts["slidesk-link-url"]);
          process.exit(0);
        } else {
          error(`No ${kind} with this name is found`);
          process.exit(1);
        }
      } else {
        error("Please provide a search term");
        process.exit(1);
      }
    });
  return cmd;
};

export default addonSearchCmd;
