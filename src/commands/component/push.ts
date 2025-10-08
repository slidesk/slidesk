import { Clipse } from "clipse";
import { create } from "tar";
import getLinkToken from "../../utils/getLinkToken";
import slugify from "../../utils/slugify";

const { log, error } = console;

const componentPushCmd = new Clipse(
  "push",
  "push talk to your user page on slidesk.link",
);
componentPushCmd
  .addArguments([
    {
      name: "component",
      description: "component name",
    },
  ])
  .action(async (args, options) => {
    if (args.component) {
      const componentFile = `${process.cwd()}/${args.component}.mjs`;
      const slideskToken = await getLinkToken();
      await create({ gzip: true, file: "link.tgz" }, [`${args.component}.mjs`]);
      const file = Bun.file("link.tgz");
      const data = new FormData();
      data.set("file", file);
      data.set("type", "component");
      data.set("name", slugify(args.component));
      data.set("json", "{}");
      const readme = Bun.file(componentFile);
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
      if (response.status === 201) {
        log("Your component has been added or updated into the hub, thanks");
      } else {
        error(await response.text());
      }
      process.exit(0);
    } else {
      error("Please provide a component name");
      process.exit(1);
    }
  });

export default componentPushCmd;
