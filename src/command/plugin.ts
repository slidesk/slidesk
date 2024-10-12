import { rmSync } from "node:fs";

const pluginInstall = async (name = "", update = false): Promise<string> => {
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

const pluginRemove = async (name = "") => {
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

const pluginList = async () => {
  const list = await fetch(
    "https://raw.githubusercontent.com/slidesk/slidesk-extras/main/plugins/list.json",
  );
  const json = (await list.json()).map((p: string) => `  ${p}`);
  return `Availables plugins:\n${json.join("\n")}`;
};

const plugin = (action: string, name = "") => {
  if (action === "install")
    pluginInstall(name).then((res) => {
      console.log(res);
      process.exit();
    });
  else if (action === "remove") {
    pluginRemove(name).then((res) => {
      console.log(res);
      process.exit();
    });
  } else if (action === "update") {
    pluginRemove(name).then(() => {
      pluginInstall(name, true).then((res) => {
        console.log(res);
        process.exit();
      });
    });
  } else if (action === "list") {
    pluginList().then((res) => {
      console.log(res);
      process.exit();
    });
  } else {
    console.log("Please provide a valid action");
    process.exit();
  }
};

export default plugin;
