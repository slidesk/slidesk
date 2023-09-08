/* eslint-disable no-undef */
import slugify from "slugify";
import { existsSync, mkdirSync } from "fs";
import displayHeader from "./_common";

const prompts = require("prompts");

const { log } = console;

const create = async (talk) => {
  log(displayHeader(), `Creation of your talk: ${talk}`);
  let dirName = slugify(talk);
  if (dirName === "create") {
    dirName = `${dirName}_`;
  }
  const response = await prompts([
    {
      type: "text",
      name: "title",
      message: "What is the title of talk?",
    },
    {
      type: "confirm",
      name: "custom",
      message: "Do you want to customize the presentation?",
      initial: false,
    },
  ]);
  if (!existsSync(`./${dirName}`)) mkdirSync(`./${dirName}`);
  const file = Bun.file(`./${dirName}/main.sdf`);
  const writer = file.writer();
  if (response.custom) {
    writer.write(`/::\ncustom_css: custom.css\ncustom_js: custom.js\n::/\n\n`);
  }
  writer.write(`# ${response.title} \n\n## My first Slide`);
  writer.end();
  if (response.custom) {
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
