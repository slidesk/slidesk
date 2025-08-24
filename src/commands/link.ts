import { Clipse } from "clipse";
import linkHostCmd from "./link/host";
import linkLoginCmd from "./link/login";
import linkPushCmd from "./link/push";

const linkCmd = new Clipse("link", "command to interact with slidesk.link");
linkCmd.addSubcommands([linkHostCmd, linkLoginCmd, linkPushCmd]);
linkCmd.addGlobalOptions({
  "slidesk-link-url": {
    type: "string",
    default: "slidesk.link",
  },
});

export default linkCmd;
