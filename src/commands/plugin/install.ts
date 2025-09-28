import { rm } from "node:fs/promises";
import { Clipse } from "clipse";
import { extract } from "tar";

const { log, error } = console;

export const pluginInstall = async (
  name = "",
  urlLink = "https://slidesk.link",
  update = false,
): Promise<string> => {
  if (name === "") {
    return "Please provide a name for the plugin";
  }
  const [user, ...plugin] = name.split("__");
  const pluginTarballResponse = await fetch(
    `${urlLink}/addons/download/plugin/${user.replace("@", "")}/${plugin.join("__")}`,
  );
  if (pluginTarballResponse.status === 404) {
    error(`Plugin ${name.replace("__", "/")} not found`);
    return "";
  }
  const pluginTarball = await pluginTarballResponse.blob();
  const tmp = `${process.cwd()}/plugins/${name}/link.tgz`;
  await Bun.write(tmp, pluginTarball);
  await extract({
    file: tmp,
    C: `${process.cwd()}/plugins/${name}`,
  });
  const glob = new Bun.Glob("**/*");
  for await (const file of glob.scan(
    `${process.cwd()}/plugins/${name}/${plugin.join("__")}`,
  )) {
    await Bun.write(
      `${process.cwd()}/plugins/${name}/${file}`,
      await Bun.file(
        `${process.cwd()}/plugins/${name}/${plugin.join("__")}/${file}`,
      ).arrayBuffer(),
    );
  }
  await rm(`${process.cwd()}/plugins/${name}/${plugin.join("__")}`, {
    recursive: true,
  });
  await Bun.file(tmp).unlink();
  return `Plugin ${name.replace("__", "/")} ${update ? "updated" : "installed"}`;
};

const pluginInstallCmd = new Clipse("install", "slidesk plugin installer");
pluginInstallCmd
  .addArguments([{ name: "name", description: "name of the plugin" }])
  .action(async (args, opts) => {
    const res = await pluginInstall(
      args.name ?? "",
      opts["slidesk-link-url"] as string,
      false,
    );
    log(res);
    process.exit(0);
  });

export default pluginInstallCmd;
