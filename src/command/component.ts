import { unlinkSync } from "node:fs";

const componentInstall = async (
  name: string = "",
  update: boolean = false,
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

const componentRemove = async (name: string = "") => {
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

const componentList = async () => {
  const list = await fetch(
    "https://raw.githubusercontent.com/slidesk/slidesk-extras/main/components/list.json",
  );
  const json = (await list.json()).map((c: string) => `  ${c}`);
  return `Availables components:\n${json.join("\n")}`;
};

const component = (action: string, name: string = "") => {
  if (action === "install")
    componentInstall(name).then((res) => {
      console.log(res);
      process.exit();
    });
  else if (action === "remove") {
    componentRemove(name).then((res) => {
      console.log(res);
      process.exit();
    });
  } else if (action === "update") {
    componentRemove(name).then(() => {
      componentInstall(name, true).then((res) => {
        console.log(res);
        process.exit();
      });
    });
  } else if (action === "list") {
    componentList().then((res) => {
      console.log(res);
      process.exit();
    });
  } else {
    console.log("Please provide a valid action");
    process.exit();
  }
};

export default component;
