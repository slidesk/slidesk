import { mkdirSync } from "node:fs";
import { Clipse } from "clipse";
import defaultThemeFiles from "../templates/default_theme";
import type { SliDeskCreateOptions } from "../types";
import { question } from "../utils/interactCLI";
import slugify from "../utils/slugify";

const { log, error } = console;

const createDefault = async (dirName: string, responseTitle: string) => {
  mkdirSync(dirName, { recursive: true });
  for await (const file of Object.keys(defaultThemeFiles)) {
    let content = defaultThemeFiles[file];
    if (file === "main.sdf")
      content = content.replace("# TITLE", ` ${responseTitle as string}`);
    await Bun.write(`${dirName}/${file}`, content, { createPath: true });
  }
};

const create = async (talk: string, options: SliDeskCreateOptions) => {
  log(`Creation of your talk: ${talk}`);
  let dirName = slugify(talk);
  if (dirName === "create") {
    dirName = `${dirName}_`;
  }
  const responseTitle = await question("What is the title of talk?");
  if (options.theme !== "none") {
    const list = await fetch(
      "https://raw.githubusercontent.com/slidesk/slidesk-extras/main/themes/list.json",
    );
    const json = await list.json();
    if ([...json].includes(options.theme)) {
      const files = await (
        await fetch(
          `https://raw.githubusercontent.com/slidesk/slidesk-extras/main/themes/${options.theme}/files.json`,
        )
      ).json();
      for await (const file of [...files]) {
        const content = await (
          await fetch(
            `https://raw.githubusercontent.com/slidesk/slidesk-extras/main/themes/${options.theme}/${file}`,
          )
        ).blob();
        await Bun.write(`${dirName}/${file}`, content, { createPath: true });
      }
      let mainContent = await Bun.file(`${dirName}/main.sdf`).text();
      mainContent = mainContent.replace(
        "# TITLE",
        ` ${responseTitle as string}`,
      );
      await Bun.write(`${dirName}/main.sdf`, mainContent);
    } else if (
      options.theme?.startsWith("http") &&
      options.theme?.endsWith("/files.json")
    ) {
      const files = await (await fetch(`${options.theme}`)).json();
      for await (const file of [...files]) {
        const content = await (
          await fetch(`${options.theme.replace("/files.json", "")}/${file}`)
        ).blob();
        await Bun.write(`${dirName}/${file}`, content, { createPath: true });
      }
      let mainContent = await Bun.file(`${dirName}/main.sdf`).text();
      mainContent = mainContent.replace(
        "# TITLE",
        ` ${responseTitle as string}`,
      );
      await Bun.write(`${dirName}/main.sdf`, mainContent);
    } else error("Theme not found");
  } else await createDefault(dirName, responseTitle as string);
  log("Presentation created");
  log();
  log(`cd ${dirName} && slidesk`);
};

const createCmd = new Clipse(
  "create",
  "tool to help you to instanciate a talk",
);
createCmd
  .addArguments([{ name: "talk", description: "name of your talk/directory" }])
  .addOptions({
    theme: {
      type: "string",
      description: "specify a theme from a catalog or url",
      default: "none",
    },
  })
  .action(async (args, options) => {
    await create(args.talk ?? "", options);
    process.exit(0);
  });

export default createCmd;
