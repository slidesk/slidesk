import { Clipse } from "clipse";
import { create } from "tar";
import { CliError } from "../../utils/cliError";
import getLinkToken from "../../utils/getLinkToken";
import slugify from "../../utils/slugify";

const { log } = console;

const pluginPushCmd = new Clipse(
  "push",
  "push plugin to your user page on slidesk.link",
);
pluginPushCmd
  .addArguments([
    {
      name: "plugin",
      description: "plugin name",
    },
  ])
  .action(async (args, options: { "slidesk-link-url"?: string }) => {
    if (args.plugin) {
      const pluginPath = `${process.cwd()}/${args.plugin}`;
      const pluginJSON = Bun.file(`${pluginPath}/plugin.json`);
      if (!(await pluginJSON.exists()))
        throw new CliError(
          "Plugin not found. Wrong name or plugin.json is missing",
        );
      const slideskToken = await getLinkToken();
      await create({ gzip: true, file: "link.tgz" }, [args.plugin]);
      const file = Bun.file("link.tgz");
      const data = new FormData();
      data.set("file", file);
      data.set("type", "plugin");
      data.set("name", slugify(args.plugin));
      data.set("json", JSON.stringify(await pluginJSON.json()));
      const readme = Bun.file(`${pluginPath}/README.md`);
      if (await readme.exists()) data.set("desc", await readme.text());
      else data.set("desc", "");
      const response = await fetch(`${options["slidesk-link-url"]}/addons`, {
        method: "post",
        body: data,
        headers: {
          "x-slidesk": slideskToken,
        },
      });
      await file.unlink();
      if (response.status !== 201) throw new CliError(await response.text());
      log("Your plugin has been added or updated into the hub, thanks");
    } else throw new CliError("Please provide a plugin name");
  });

export default pluginPushCmd;
