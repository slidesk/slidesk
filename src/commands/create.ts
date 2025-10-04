import { mkdirSync } from "node:fs";
import { Clipse } from "clipse";
import defaultThemeFiles from "../templates/default_theme";
import { question } from "../utils/interactCLI";
import slugify from "../utils/slugify";

const { log } = console;

const createDefault = async (dirName: string, responseTitle: string) => {
  mkdirSync(dirName, { recursive: true });
  for await (const file of Object.keys(defaultThemeFiles)) {
    let content = defaultThemeFiles[file];
    if (file === "main.sdf")
      content = content.replace("# TITLE", ` ${responseTitle as string}`);
    await Bun.write(`${dirName}/${file}`, content, { createPath: true });
  }
};

const create = async (talk: string) => {
  log(`Creation of your talk: ${talk}`);
  let dirName = slugify(talk);
  if (dirName === "create") {
    dirName = `${dirName}_`;
  }
  const responseTitle = await question("What is the title of talk?");
  await createDefault(dirName, responseTitle as string);
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
  .action(async (args) => {
    await create(args.talk ?? "");
    process.exit(0);
  });

export default createCmd;
