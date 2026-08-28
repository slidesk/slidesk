import { Clipse } from "clipse";
import { themeInstall } from "./install";
import { themeRemove } from "./remove";

const themeUpdateCmd = new Clipse("update", "slidesk theme updater");
themeUpdateCmd
  .addArguments([{ name: "name", description: "name of the theme" }])
  .action(async (args, opts: { "slidesk-link-url"?: string }) => {
    await themeRemove(args.name ?? "");
    const res = await themeInstall(
      args.name ?? "",
      opts["slidesk-link-url"] as string,
      true,
    );
    console.log(res);
    process.exit(0);
  });

export default themeUpdateCmd;
