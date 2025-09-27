import { Clipse } from "clipse";
import pluginInstallCmd from "./plugin/install";
import pluginListCmd from "./plugin/list";
import pluginPushCmd from "./plugin/push";
import pluginRemoveCmd from "./plugin/remove";
import pluginUpdateCmd from "./plugin/update";

const pluginCmd = new Clipse("plugin", "slidesk plugin management");
pluginCmd.addSubcommands([
  pluginInstallCmd,
  pluginRemoveCmd,
  pluginUpdateCmd,
  pluginListCmd,
  pluginPushCmd,
]);

export default pluginCmd;
