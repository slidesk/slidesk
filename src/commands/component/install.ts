import { Clipse } from "clipse";

export const componentInstall = async (
  name = "",
  update = false,
): Promise<string> => {
  if (name === "") {
    return "Please provide a name for the component";
  }
  // fetch on github if the component is available
  const result = await fetch(
    `https://raw.githubusercontent.com/slidesk/slidesk-extras/main/components/${name}.mjs`,
  );
  if (result.status !== 200) {
    return "Component not found";
  }
  const text = await result.text();
  await Bun.write(`components/${name}.mjs`, text, {
    createPath: true,
  });
  return `Component ${name} ${update ? "updated" : "installed"}`;
};

const componentInstallCmd = new Clipse(
  "install",
  "slidesk component installer",
);
componentInstallCmd
  .addArguments([{ name: "name", description: "name of the component" }])
  .action(async (args) => {
    const res = await componentInstall(args.name ?? "", false);
    console.log(res);
    process.exit(0);
  });

export default componentInstallCmd;
