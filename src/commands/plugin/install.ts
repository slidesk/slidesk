import { Clipse } from "clipse";

export const pluginInstall = async (
  name = "",
  update = false,
): Promise<string> => {
  if (name === "") {
    return "Please provide a name for the plugin";
  }
  // fetch on github if the plugin is available
  const result = await fetch(
    `https://raw.githubusercontent.com/slidesk/slidesk-extras/main/plugins/${name}/plugin.json`,
  );
  if (result.status !== 200) {
    return "Plugin not found";
  }
  const json = await result.json();
  const files: string[] = ["plugin.json"];
  files.push(...(json.files || []));
  const promises: Promise<void>[] = [];
  for (const file of files) {
    promises.push(
      new Promise((resolve) => {
        fetch(
          `https://raw.githubusercontent.com/slidesk/slidesk-extras/main/plugins/${name}/${file}`,
        )
          .then((response) => response.blob())
          .then((text) =>
            Bun.write(`plugins/${name}/${file}`, text, {
              createPath: true,
            }),
          )
          .then(() => {
            resolve();
          });
      }),
    );
  }
  await Promise.all(promises);
  return `Plugin ${name} ${update ? "updated" : "installed"}`;
};

const pluginInstallCmd = new Clipse("install", "slidesk plugin installer");
pluginInstallCmd
  .addArguments([{ name: "name", description: "name of the plugin" }])
  .action(async (args) => {
    const res = await pluginInstall(args.name ?? "", false);
    console.log(res);
    process.exit(0);
  });

export default pluginInstallCmd;
