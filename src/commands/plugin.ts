import { Clipse } from "clipse";
import pluginInstallCmd from "./plugin/install";
import pluginRemoveCmd from "./plugin/remove";
import pluginUpdateCmd from "./plugin/update";
import pluginListCmd from "./plugin/list";

const pluginCmd = new Clipse("plugin", "slidesk plugin management");
pluginCmd.addSubcommands([
  pluginInstallCmd,
  pluginRemoveCmd,
  pluginUpdateCmd,
  pluginListCmd,
]);

export default pluginCmd;
