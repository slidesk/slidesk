/* eslint-disable no-undef */
import slugify from "../utils/slugify";
import { question } from "../utils/interactCLI";
import { mkdirSync } from "fs";

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
  mkdirSync(dirName, { recursive: true });
  const file = Bun.file(`./${dirName}/main.sdf`);
  const writer = file.writer();
  if (responseCustom) {
    writer.write(`/::\ncustom_css: custom.css\n::/\n\n`);
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
  }
  process.exit();
};

export default create;
