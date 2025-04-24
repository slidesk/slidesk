import { Clipse } from "clipse";
import { rmSync } from "node:fs";

export const pluginRemove = async (name = "") => {
  if (name === "") {
    return "Please provide a name for the plugin";
  }
  const file = Bun.file(`plugins/${name}/plugin.json`);
  const exists = await file.exists();
  if (!exists) {
    return "Plugin not found";
  }
  rmSync(`plugins/${name}`, {
    recursive: true,
    force: true,
  });
  return `Plugin ${name} removed`;
};

const pluginRemoveCmd = new Clipse("remove", "slidesk plugin remover");
pluginRemoveCmd
  .addArguments([{ name: "name", description: "name of the plugin" }])
  .action(async (args) => {
    const res = await pluginRemove(args.name ?? "");
    console.log(res);
    process.exit(0);
  });

export default pluginRemoveCmd;
