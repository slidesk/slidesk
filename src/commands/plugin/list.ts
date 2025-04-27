import { Clipse } from "clipse";

const pluginList = async () => {
  const list = await fetch(
    "https://raw.githubusercontent.com/slidesk/slidesk-extras/main/plugins/list.json",
  );
  const json = (await list.json()).map((p: string) => `  ${p}`);
  return `Availables plugins:\n${json.join("\n")}`;
};

const pluginListCmd = new Clipse("list", "slidesk plugin lister");
pluginListCmd.action(async () => {
  const res = await pluginList();
  console.log(res);
  process.exit(0);
});

export default pluginListCmd;
