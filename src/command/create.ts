import slugify from "../utils/slugify";
import { question } from "../utils/interactCLI";
import { mkdirSync } from "node:fs";
import type { CreateOptions } from "../types";

const { log, error } = console;

const createDefault = async (dirName: string, responseTitle: string) => {
  mkdirSync(dirName, { recursive: true });
  const responseCustom =
    (
      (await question(
        "Do you want to customize the presentation? [yN]",
      )) as string
    ).toLowerCase() === "y";
  const file = Bun.file(`./${dirName}/main.sdf`);
  const writer = file.writer();
  if (responseCustom) {
    writer.write("/::\ncustom_css: custom.css\n::/\n\n");
  }
  writer.write(`# ${responseTitle} \n\n## My first Slide`);
  writer.end();
  if (responseCustom) {
    Bun.write(
      `./${dirName}/custom.css`,
      `
:root {
--sd-heading1-size: 8.5vw;
--sd-heading1-line-height: 1;
--sd-heading2-size: 5vw;
--sd-heading2-line-height: 1;
--sd-text-size: 2.2vw;
--sd-text-line-height: 1.2;
--sd-caption-font-size: 1vw;
--sd-caption-line-height: 1;

--sd-background-color: #242424;
--sd-heading-color: rgba(255, 255, 255, 0.97);
--sd-text-color: rgba(255, 255, 255, 0.87);
--sd-primary-color: rgb(37, 186, 146);
--sd-caption-color: rgba(0, 0, 0, 0.7);
--sd-caption-bgcolor: rgba(255, 255, 255, 0.7);

/* SpeakerView */
--sd-sv-timer-size: 80px;
--sd-sv-text-size: 40px;
--sd-sv-text-line-height: 1.2;
--sd-sv-background-color: #242424;
--sd-sv-text-color: rgba(255, 255, 255, 0.87);
}`,
    );
  }
};

const create = async (talk: string, options: CreateOptions) => {
  log(`Creation of your talk: ${talk}`);
  let dirName = slugify(talk);
  if (dirName === "create") {
    dirName = `${dirName}_`;
  }
  const responseTitle = await question("What is the title of talk?");
  console.log(options);
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
        let content = await (
          await fetch(
            `https://raw.githubusercontent.com/slidesk/slidesk-extras/main/themes/${options.theme}/${file}`,
          )
        ).text();
        if (file === "main.sdf")
          content = content.replace("# TITLE", responseTitle as string);
        await Bun.write(`${dirName}/${file}`, content, { createPath: true });
      }
    } else error("Theme not found");
  } else await createDefault(dirName, responseTitle as string);
  process.exit();
};

export default create;
