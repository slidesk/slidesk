/* eslint-disable no-undef */
import { existsSync, mkdirSync } from "node:fs";
import slugify from "../utils/slugify";
import { question } from "../utils/interactCLI";

const { log } = console;

const create = async (talk) => {
  log(`Creation of your talk: ${talk}`);
  let dirName = slugify(talk);
  if (dirName === "create") {
    dirName = `${dirName}_`;
  }
  const responseTitle = await question("What is the title of talk?");
  const responseCustom =
    (
      await question("Do you want to customize the presentation? [yN]")
    ).toLowerCase() === "y";
  if (!existsSync(`./${dirName}`)) mkdirSync(`./${dirName}`);
  const file = Bun.file(`./${dirName}/main.sdf`);
  const writer = file.writer();
  if (responseCustom) {
    writer.write(`/::\ncustom_css: custom.css\ncustom_js: custom.js\n::/\n\n`);
  }
  writer.write(`# ${responseTitle} \n\n## My first Slide`);
  writer.end();
  if (responseCustom) {
    Bun.write(
      `./${dirName}/custom.css`,
      `
:root {
--sd-heading1-size: 3.75em;
--sd-heading1-line-height: 1;
--sd-heading2-size: 2.25em;
--sd-heading2-line-height: 1;
--sd-heading3-size: 1.75em;
--sd-heading3-line-height: 1;
--sd-text-size: 40px;
--sd-text-line-height: 1.2;

--sd-background-color: #242424;
--sd-heading-color: rgba(255, 255, 255, 0.97);
--sd-text-color: rgba(255, 255, 255, 0.87);
--sd-primary-color: rgb(37, 186, 146);


/* SpeakerView */
--sd-sv-timer-size: 80px;
--sd-sv-text-size: 40px;
--sd-sv-text-line-height: 1.2;
--sd-sv-background-color: #242424;
--sd-sv-text-color: rgba(255, 255, 255, 0.87);
}`,
    );
    Bun.write(`./${dirName}/custom.js`, "");
  }
  process.exit();
};

export default create;
