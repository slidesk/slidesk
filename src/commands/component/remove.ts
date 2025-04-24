import { Clipse } from "clipse";
import { unlinkSync } from "node:fs";

export const componentRemove = async (name = "") => {
  if (name === "") {
    return "Please provide a name for the component";
  }
  const file = Bun.file(`components/${name}.mjs`);
  const exists = await file.exists();
  if (!exists) {
    return "Component not found";
  }
  unlinkSync(`components/${name}.mjs`);
  return `Component ${name} removed`;
};

const componentRemoveCmd = new Clipse("remove", "slidesk component remover");
componentRemoveCmd
  .addArguments([{ name: "name", description: "name of the component" }])
  .action(async (args) => {
    const res = await componentRemove(args.name ?? "");
    console.log(res);
    process.exit(0);
  });

export default componentRemoveCmd;
