import { rmSync } from "node:fs";
import { Clipse } from "clipse";

export const templateRemove = async (name = "") => {
  if (name === "") {
    return "Please provide a name for the template";
  }
  const file = Bun.file(`templates/${name}/template.json`);
  const exists = await file.exists();
  if (!exists) {
    return "template not found";
  }
  rmSync(`templates/${name}`, {
    recursive: true,
    force: true,
  });
  return `template ${name} removed`;
};

const templateRemoveCmd = new Clipse("remove", "slidesk template remover");
templateRemoveCmd
  .addArguments([{ name: "name", description: "name of the template" }])
  .action(async (args) => {
    const res = await templateRemove(args.name ?? "");
    console.log(res);
    process.exit(0);
  });

export default templateRemoveCmd;
