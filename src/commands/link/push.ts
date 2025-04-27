import { Clipse } from "clipse";
import getLinkToken from "../../utils/getLinkToken";

const { log, error } = console;

const linkPushCmd = new Clipse(
  "push",
  "push talk to your user page on slidesk.link",
);
linkPushCmd.action(async () => {
  const linkYML = Bun.file(`${process.cwd()}/link.yml`);
  if (!(await linkYML.exists())) {
    error("link.yml not found");
    process.exit(1);
  }
  const slideskToken = await getLinkToken();
  const data = new FormData();
  data.set("file", linkYML);
  const response = await fetch("https://slidesk.link/pushtotalk", {
    method: "post",
    body: data,
    headers: {
      "x-slidesk": slideskToken,
    },
  });
  if (response.status === 201) {
    log("Your talk has been added to your page, thanks");
  } else {
    error(await response.text());
  }
  process.exit(0);
});

export default linkPushCmd;
