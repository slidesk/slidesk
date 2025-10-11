import { Clipse } from "clipse";
import { create } from "tar";
import getLinkToken from "../../utils/getLinkToken";
import slugify from "../../utils/slugify";

const { log, error } = console;

const templatePushCmd = new Clipse(
  "push",
  "push template to your user page on slidesk.link",
);
templatePushCmd
  .addArguments([
    {
      name: "template",
      description: "template name",
    },
  ])
  .action(async (args, options) => {
    if (args.template) {
      const templatePath = `${process.cwd()}/${args.template}`;
      const slideskToken = await getLinkToken();
      await create({ gzip: true, file: "link.tgz" }, [args.template]);
      const file = Bun.file("link.tgz");
      const data = new FormData();
      data.set("file", file);
      data.set("type", "template");
      data.set("name", slugify(args.template));
      data.set("json", "{}");
      const readme = Bun.file(`${templatePath}/README.md`);
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
        log("Your template has been added or updated into the hub, thanks");
      } else {
        error(await response.text());
      }
      process.exit(0);
    } else {
      error("Please provide a template name");
      process.exit(1);
    }
  });

export default templatePushCmd;
