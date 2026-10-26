import { Clipse } from "clipse";
import { templateInstall } from "./install";
import { templateRemove } from "./remove";

const templateUpdateCmd = new Clipse("update", "slidesk template updater");
templateUpdateCmd
  .addArguments([{ name: "name", description: "name of the template" }])
  .action(async (args, opts: { "slidesk-link-url"?: string }) => {
    await templateRemove(args.name ?? "");
    const res = await templateInstall(
      args.name ?? "",
      opts["slidesk-link-url"],
      true,
    );
    console.log(res);
  });

export default templateUpdateCmd;
