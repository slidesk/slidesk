import { Clipse } from "clipse";
import { templateInstall } from "./install";
import { templateRemove } from "./remove";

const templateUpdateCmd = new Clipse("update", "slidesk template updater");
templateUpdateCmd
  .addArguments([{ name: "name", description: "name of the template" }])
  .action(async (args, opts) => {
    await templateRemove(args.name ?? "");
    const res = templateInstall(
      args.name ?? "",
      opts["slidesk-link-url"] as string,
      true,
    );
    console.log(res);
    process.exit(0);
  });

export default templateUpdateCmd;
