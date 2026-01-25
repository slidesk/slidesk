import { Clipse } from "clipse";
import { extract } from "tar";

const { log, error } = console;

export const componentInstall = async (
  name = "",
  urlLink = "https://slidesk.link",
  update = false,
): Promise<string> => {
  if (name === "") {
    return "Please provide a name for the component";
  }
  const [user, ...component] = name.split("__");
  const componentTarballResponse = await fetch(
    `${urlLink}/addons/download/component/${user.replace("@", "")}/${component.join("__").replace(/\\u([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])/g, "")}`,
  );
  if (componentTarballResponse.status === 404) {
    error(`Component ${name.replace("__", "/")} not found`);
    return "";
  }
  const componentTarball = await componentTarballResponse.blob();
  const tmp = `${process.cwd()}/components/link.tgz`;
  await Bun.write(tmp, componentTarball);
  await extract({
    file: tmp,
    C: `${process.cwd()}/components/`,
  });
  await Bun.file(tmp).unlink();
  return `component ${name.replace("__", "/")} ${update ? "updated" : "installed"}`;
};

const componentInstallCmd = new Clipse(
  "install",
  "slidesk component installer",
);
componentInstallCmd
  .addArguments([{ name: "name", description: "name of the component" }])
  .action(async (args, opts) => {
    const res = await componentInstall(
      (args.name ?? "").replace("/", "__"),
      opts["slidesk-link-url"] as string,
      false,
    );
    log(res);
    process.exit(0);
  });

export default componentInstallCmd;
