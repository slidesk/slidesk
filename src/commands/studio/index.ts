import { Clipse } from "clipse";
import { getActionStudio } from "../../utils/interactCLI";
import start from "../../utils/start";
import { startStudio } from "../../core/Studio";

const { log } = console;

const studioCmd = new Clipse("studio", "wysiwyg");
studioCmd
  .addArguments([
    { name: "talk", description: "name of your talk/directory (default: .)" },
  ])
  .action(async (args) => {
    log("\tTo quit the studio, press \x1b[1mQ\x1b[0m.\x1b", "\n");
    const port = 57210;
    const talk = args.talk ?? "";
    const talkPath = talk === "" ? "" : `/${talk}`;
    const talkdir = `${process.cwd()}${talkPath}`;
    await startStudio(port, talkdir);
    Bun.spawn([start(), `http://localhost:${port}`]);
    getActionStudio();
    process.on("SIGINT", () => {
      process.exit(0);
    });
  });

export default studioCmd;
