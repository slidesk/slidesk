import { Clipse } from "clipse";
import { create } from "tar";
import getLinkToken from "../../utils/getLinkToken";
import slugify from "../../utils/slugify";

const { log, error } = console;

const pluginPushCmd = new Clipse(
  "push",
  "push talk to your user page on slidesk.link",
);
pluginPushCmd
  .addArguments([
    {
      name: "plugin",
      description: "plugin name",
    },
  ])
  .action(async (args, options) => {
    if (args.plugin) {
      const pluginPath = `${process.cwd()}/${args.plugin}`;
      const pluginJSON = Bun.file(`${pluginPath}/plugin.json`);
      if (!(await pluginJSON.exists())) {
        error("Plugin not found. Wrong name or plugin.json is missing");
        process.exit(1);
      }
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
      console.log(`${options["slidesk-link-url"]}/addons`);
      const response = await fetch(`${options["slidesk-link-url"]}/addons`, {
        method: "post",
        body: data,
        headers: {
          "x-slidesk": slideskToken,
        },
      });
      await file.unlink();
      if (response.status === 201) {
        log("Your plugin has been added or updated into the hub, thanks");
      } else {
        error(await response.text());
      }
      process.exit(0);
    } else {
      error("Please provide a plugin name");
      process.exit(1);
    }
  });

export default pluginPushCmd;
