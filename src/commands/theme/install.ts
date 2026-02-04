import { rm } from "node:fs/promises";
import { Clipse } from "clipse";
import { extract } from "tar";

const { log, error } = console;

export const themeInstall = async (
  name = "",
  urlLink = "https://slidesk.link",
  update = false,
): Promise<string> => {
  if (name === "") {
    return "Please provide a name for the theme";
  }
  name = name.replace(
    /\\u([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])([0-9]|[a-fA-F])/g,
    "",
  );
  const [user, ...theme] = name.split("__");
  const themeTarballResponse = await fetch(
    `${urlLink}/addons/download/theme/${user.replace("@", "")}/${theme.join("__")}`,
  );
  if (themeTarballResponse.status === 404) {
    error(`theme ${name.replace("__", "/")} not found`);
    return "";
  }
  const themeTarball = await themeTarballResponse.blob();
  const tmp = `${process.cwd()}/themes/${name}/link.tgz`;
  await Bun.write(tmp, themeTarball);
  await extract({
    file: tmp,
    C: `${process.cwd()}/themes/${name}`,
  });
  await Bun.file(tmp).unlink();
  const glob = new Bun.Glob("**/*");
  for await (const file of glob.scan(
    `${process.cwd()}/themes/${name}/${theme.join("__")}`,
  )) {
    await Bun.write(
      `${process.cwd()}/themes/${name}/${file}`,
      await Bun.file(
        `${process.cwd()}/themes/${name}/${theme.join("__")}/${file}`,
      ).arrayBuffer(),
    );
  }
  await rm(`${process.cwd()}/themes/${name}/${theme.join("__")}`, {
    recursive: true,
  });
  return `theme ${name.replace("__", "/")} ${update ? "updated" : "installed"}`;
};
const themeInstallCmd = new Clipse("install", "slidesk theme installer");
themeInstallCmd
  .addArguments([{ name: "name", description: "name of the theme" }])
  .action(async (args, opts) => {
    const res = await themeInstall(
      (args.name ?? "").replace("/", "__"),
      opts["slidesk-link-url"] as string,
      false,
    );
    log(res);
    process.exit(0);
  });

export default themeInstallCmd;
