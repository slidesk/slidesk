import { Clipse } from "clipse";
import linkHostCmd from "./link/host";
import linkLoginCmd from "./link/login";

const linkCmd = new Clipse("link", "command to interact with slidesk.link");
linkCmd.addSubcommands([linkHostCmd, linkLoginCmd]);

export default linkCmd;
