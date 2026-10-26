import { mkdirSync } from "node:fs";
import { Clipse } from "clipse";
import defaultThemeFiles from "../../templates/default_theme";
import { CliError } from "../../utils/cliError";
import { question } from "../../utils/interactCLI";
import slugify from "../../utils/slugify";
import { templateInstall } from "../template/install";

const { log } = console;

const createDefault = async (dirName: string, responseTitle: string) => {
  mkdirSync(dirName, { recursive: true });
  for (const file of Object.keys(defaultThemeFiles)) {
    let content = defaultThemeFiles[file];
    if (file === "main.md")
      content = content.replace("# TITLE", ` ${responseTitle}`);
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
  await createDefault(dirName, responseTitle);
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
    const talk = args.talk ?? "";
    if (talk.trim() === "")
      throw new CliError("You must specify an argument (talk directory)");
    await create(talk);
    await templateInstall(
      "@gouz__split",
      "https://slidesk.link",
      false,
      `${process.cwd()}/${talk}`,
    );
  });

export default createCmd;
