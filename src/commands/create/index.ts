import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Clipse } from "clipse";
import defaultThemeFiles from "../../templates/default_theme";
import { addonInstall } from "../../utils/addon";
import { CliError } from "../../utils/cliError";
import { question } from "../../utils/interactCLI";
import slugify from "../../utils/slugify";

const { log } = console;

const createDefault = async (dirName: string, responseTitle: string) => {
  mkdirSync(dirName, { recursive: true });
  await Promise.all(
    Object.keys(defaultThemeFiles).map((file) => {
      let content = defaultThemeFiles[file];
      if (file === "main.md")
        content = content.replace("# TITLE", () => ` ${responseTitle}`);
      return Bun.write(`${dirName}/${file}`, content, { createPath: true });
    }),
  );
};

const create = async (talk: string) => {
  // the template, the message and the files all go to this one directory
  const slug = slugify(talk);
  const dirName = slug === "create" ? "create_" : slug;
  if (existsSync(dirName) && readdirSync(dirName).length > 0)
    throw new CliError(
      `${dirName} already exists and is not empty, choose another name`,
    );
  log(`Creation of your talk: ${talk}`);
  const responseTitle = await question("What is the title of talk?");
  await createDefault(dirName, responseTitle);
  try {
    await addonInstall(
      "template",
      "@gouz__split",
      "https://slidesk.link",
      false,
      resolve(dirName),
    );
  } catch (e) {
    // the talk is there: the template can be added later
    log(
      `⚠️  The split template was not installed (${e instanceof Error ? e.message : e}), add it later with: slidesk template install @gouz/split`,
    );
  }
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
  });

export default createCmd;
