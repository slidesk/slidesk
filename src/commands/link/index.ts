import { Clipse } from "clipse";
import linkHostCmd from "./host";
import linkLoginCmd from "./login";
import linkPushCmd from "./push";

const linkCmd = new Clipse("link", "command to interact with slidesk.link");
linkCmd
  .addGlobalOptions({
    "slidesk-link-url": {
      type: "string",
      default: "https://slidesk.link",
    },
  })
  .addSubcommands([linkHostCmd, linkLoginCmd, linkPushCmd]);

export default linkCmd;
