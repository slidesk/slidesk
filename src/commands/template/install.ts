import { rm } from "node:fs/promises";
import { Clipse } from "clipse";
import { extract } from "tar";

const { log, error } = console;

export const templateInstall = async (
  name = "",
  urlLink = "https://slidesk.link",
  update = false,
): Promise<string> => {
  if (name === "") {
    return "Please provide a name for the template";
  }
  name = name.replace(
    /\\u([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])/g,
    "",
  );
  const [user, ...template] = name.split("__");
  const templateTarballResponse = await fetch(
    `${urlLink}/addons/download/template/${user.replace("@", "")}/${template.join("__")}`,
  );
  if (templateTarballResponse.status === 404) {
    error(`template ${name.replace("__", "/")} not found`);
    return "";
  }
  const templateTarball = await templateTarballResponse.blob();
  const tmp = `${process.cwd()}/templates/${name}/link.tgz`;
  await Bun.write(tmp, templateTarball);
  await extract({
    file: tmp,
    C: `${process.cwd()}/templates/${name}`,
  });
  await Bun.file(tmp).unlink();
  const glob = new Bun.Glob("**/*");
  for await (const file of glob.scan(
    `${process.cwd()}/templates/${name}/${template.join("__")}`,
  )) {
    await Bun.write(
      `${process.cwd()}/templates/${name}/${file}`,
      await Bun.file(
        `${process.cwd()}/templates/${name}/${template.join("__")}/${file}`,
      ).arrayBuffer(),
    );
  }
  await rm(`${process.cwd()}/templates/${name}/${template.join("__")}`, {
    recursive: true,
  });
  return `template ${name.replace("__", "/")} ${update ? "updated" : "installed"}`;
};
const templateInstallCmd = new Clipse("install", "slidesk template installer");
templateInstallCmd
  .addArguments([{ name: "name", description: "name of the template" }])
  .action(async (args, opts) => {
    const res = await templateInstall(
      (args.name ?? "").replace("/", "__"),
      opts["slidesk-link-url"] as string,
      false,
    );
    log(res);
    process.exit(0);
  });

export default templateInstallCmd;
