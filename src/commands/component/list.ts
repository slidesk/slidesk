import { Clipse } from "clipse";

const componentList = async () => {
  const list = await fetch(
    "https://raw.githubusercontent.com/slidesk/slidesk-extras/main/components/list.json",
  );
  const json = (await list.json()).map((c: string) => `  ${c}`);
  return `Availables components:\n${json.join("\n")}`;
};

const componentListCmd = new Clipse("list", "slidesk component lister");
componentListCmd.action(async () => {
  const res = await componentList();
  console.log(res);
  process.exit(0);
});

export default componentListCmd;
