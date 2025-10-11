import { Clipse } from "clipse";
import { create } from "tar";
import getLinkToken from "../../utils/getLinkToken";
import slugify from "../../utils/slugify";

const { log, error } = console;

const themePushCmd = new Clipse(
  "push",
  "push theme to your user page on slidesk.link",
);
themePushCmd
  .addArguments([
    {
      name: "theme",
      description: "theme name",
    },
  ])
  .action(async (args, options) => {
    if (args.theme) {
      const themePath = `${process.cwd()}/${args.theme}`;
      const slideskToken = await getLinkToken();
      await create({ gzip: true, file: "link.tgz" }, [args.theme]);
      const file = Bun.file("link.tgz");
      const data = new FormData();
      data.set("file", file);
      data.set("type", "theme");
      data.set("name", slugify(args.theme));
      const images: string[] = [];
      const globImages = new Bun.Glob("*.webp");
      try {
        for await (const img of globImages.scan(`${themePath}/preview`)) {
          images.push(
            Buffer.from(
              await Bun.file(`${themePath}/preview/${img}`).arrayBuffer(),
            ).toString("base64"),
          );
        }
      } catch (_) {}
      data.set("json", JSON.stringify(images));
      const readme = Bun.file(`${themePath}/README.md`);
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
        log("Your theme has been added or updated into the hub, thanks");
      } else {
        error(await response.text());
      }
      process.exit(0);
    } else {
      error("Please provide a theme name");
      process.exit(1);
    }
  });

export default themePushCmd;
