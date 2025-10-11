import { rmSync } from "node:fs";
import { Clipse } from "clipse";

export const themeRemove = async (name = "") => {
  if (name === "") {
    return "Please provide a name for the theme";
  }
  const file = Bun.file(`themes/${name}/theme.json`);
  const exists = await file.exists();
  if (!exists) {
    return "theme not found";
  }
  rmSync(`themes/${name}`, {
    recursive: true,
    force: true,
  });
  return `theme ${name} removed`;
};

const themeRemoveCmd = new Clipse("remove", "slidesk theme remover");
themeRemoveCmd
  .addArguments([{ name: "name", description: "name of the theme" }])
  .action(async (args) => {
    const res = await themeRemove(args.name ?? "");
    console.log(res);
    process.exit(0);
  });

export default themeRemoveCmd;
