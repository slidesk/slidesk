import { Clipse } from "clipse";
import { CliError } from "../../utils/cliError";
import getLinkToken from "../../utils/getLinkToken";

const { log } = console;

const linkPushCmd = new Clipse(
  "push",
  "push talk to your user page on slidesk.link",
);
linkPushCmd.action(async (_, options: { "slidesk-link-url"?: string }) => {
  const linkYML = Bun.file(`${process.cwd()}/link.yml`);
  if (!(await linkYML.exists())) throw new CliError("link.yml not found");
  const slideskToken = await getLinkToken();
  const data = new FormData();
  data.set("file", linkYML);
  const response = await fetch(`${options["slidesk-link-url"]}/pushtotalk`, {
    method: "post",
    body: data,
    headers: {
      "x-slidesk": slideskToken,
    },
  });
  if (response.status !== 201) throw new CliError(await response.text());
  log("Your talk has been added to your page, thanks");
});

export default linkPushCmd;
