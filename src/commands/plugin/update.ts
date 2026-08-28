import { Clipse } from "clipse";
import { pluginInstall } from "./install";
import { pluginRemove } from "./remove";

const pluginUpdateCmd = new Clipse("update", "slidesk plugin updater");
pluginUpdateCmd
  .addArguments([{ name: "name", description: "name of the plugin" }])
  .action(async (args, opts: { "slidesk-link-url"?: string }) => {
    await pluginRemove(args.name ?? "");
    const res = await pluginInstall(
      args.name ?? "",
      opts["slidesk-link-url"] as string,
      true,
    );
    console.log(res);
    process.exit(0);
  });

export default pluginUpdateCmd;
