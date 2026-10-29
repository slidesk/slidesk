import { resolve } from "node:path";
import { Clipse } from "clipse";
import { startStudio } from "../../core/Studio";
import { CliError } from "../../utils/cliError";
import loadEnv from "../../utils/loadEnv";
import openUrl from "../../utils/openUrl";
import { present } from "../present";

const { log } = console;

const PORT = 57210;

const studioCmd = new Clipse("studio", "edit your slides in your browser");
studioCmd
  .addArguments([
    {
      name: "talk",
      description: "directory of your talk",
    },
  ])
  .action(async (args) => {
    const talkdir = resolve(args.talk ?? "");
    let main = `${talkdir}/main.sdf`;
    if (!(await Bun.file(main).exists())) main = `${talkdir}/main.md`;
    if (!(await Bun.file(main).exists()))
      throw new CliError("🤔 main.(sdf|md) was not found");
    const options = { hidden: true };
    const { slidesk = {} } = await loadEnv(talkdir, options);
    // the preview is the presentation itself, rebuilt on each change
    const preview = `http${slidesk.HTTPS ? "s" : ""}://localhost:${slidesk.PORT ?? 1337}`;
    // q stops the presentation: the studio does not keep slidesk running
    startStudio(PORT, talkdir, main, preview).unref();
    const url = `http://localhost:${PORT}`;
    log(`Your studio is available on: \x1b[1m\x1b[36;49m${url}\x1b[0m`);
    log("Press \x1b[1mQ\x1b[0m to quit the studio.\n");
    openUrl(url);
    await present(talkdir, options);
  });

export default studioCmd;
