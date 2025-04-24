import { Clipse } from "clipse";
import linkHostCmd from "./link/host";

const linkCmd = new Clipse("link", "command to interact with slidesk.link");
linkCmd.addSubcommands([linkHostCmd]);

export default linkCmd;
