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
  const pluginName = name.replace(
    /\\u([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])/g,
    "",
  );
  const [user, ...plugin] = pluginName.split("__");
  const pluginTarballResponse = await fetch(
    `${urlLink}/addons/download/plugin/${user.replace("@", "")}/${plugin.join("__")}`,
  );
  if (pluginTarballResponse.status === 404) {
    error(`Plugin ${pluginName.replace("__", "/")} not found`);
    return "";
  }
  const pluginTarball = await pluginTarballResponse.blob();
  const tmp = `${process.cwd()}/plugins/${pluginName}/link.tgz`;
  await Bun.write(tmp, pluginTarball);
  await extract({
    file: tmp,
    C: `${process.cwd()}/plugins/${pluginName}`,
  });
  await Bun.file(tmp).unlink();
  const glob = new Bun.Glob("**/*");
  for await (const file of glob.scan(
    `${process.cwd()}/plugins/${pluginName}/${plugin.join("__")}`,
  )) {
    await Bun.write(
      `${process.cwd()}/plugins/${pluginName}/${file}`,
      await Bun.file(
        `${process.cwd()}/plugins/${pluginName}/${plugin.join("__")}/${file}`,
      ).arrayBuffer(),
    );
  }
  await rm(`${process.cwd()}/plugins/${pluginName}/${plugin.join("__")}`, {
    recursive: true,
  });
  const pluginJSON = await Bun.file(
    `${process.cwd()}/plugins/${pluginName}/plugin.json`,
  ).json();
  ["addStyles", "addScripts", "addSpeakerScripts", "addSpeakerStyles"].forEach(
    (p, _) => {
      if (pluginJSON[p]) {
        pluginJSON[p] = pluginJSON[p].map((f: string) =>
          f.replace(`plugins/${plugin.join("__")}/`, `plugins/${pluginName}/`),
        );
      }
    },
  );
  if (pluginJSON.addWS) {
    pluginJSON.addWS = pluginJSON.addWS.replace(
      `plugins/${plugin.join("__")}/`,
      `plugins/${pluginName}/`,
    );
  }
  await Bun.write(
    `${process.cwd()}/plugins/${pluginName}/plugin.json`,
    JSON.stringify(pluginJSON),
  );
  return `Plugin ${pluginName.replace("__", "/")} ${update ? "updated" : "installed"}`;
};
const pluginInstallCmd = new Clipse("install", "slidesk plugin installer");
pluginInstallCmd
  .addArguments([{ name: "name", description: "name of the plugin" }])
  .action(async (args, opts) => {
    const res = await pluginInstall(
      (args.name ?? "").replace("/", "__"),
      opts["slidesk-link-url"] as string,
      false,
    );
    log(res);
    process.exit(0);
  });

export default pluginInstallCmd;
