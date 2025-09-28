import { Clipse } from "clipse";
import { componentInstall } from "./install";
import { componentRemove } from "./remove";

const componentUpdateCmd = new Clipse("update", "slidesk component updater");
componentUpdateCmd
  .addArguments([{ name: "name", description: "name of the component" }])
  .action(async (args, opts) => {
    await componentRemove(args.name ?? "");
    const res = componentInstall(
      args.name ?? "",
      opts["slidesk-link-url"] as string,
      true,
    );
    console.log(res);
    process.exit(0);
  });

export default componentUpdateCmd;
