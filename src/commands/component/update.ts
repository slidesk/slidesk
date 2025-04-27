import { Clipse } from "clipse";
import { componentRemove } from "./remove";
import { componentInstall } from "./install";

const componentUpdateCmd = new Clipse("update", "slidesk component updater");
componentUpdateCmd
  .addArguments([{ name: "name", description: "name of the component" }])
  .action(async (args) => {
    await componentRemove(args.name ?? "");
    const res = componentInstall(args.name ?? "", true);
    console.log(res);
    process.exit(0);
  });

export default componentUpdateCmd;
