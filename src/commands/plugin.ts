import { Clipse } from "clipse";
import pluginInstallCmd from "./plugin/install";
import pluginPushCmd from "./plugin/push";
import pluginRemoveCmd from "./plugin/remove";
import pluginSearchCmd from "./plugin/search";
import pluginUpdateCmd from "./plugin/update";

const pluginCmd = new Clipse("plugin", "slidesk plugin management");
pluginCmd
  .addGlobalOptions({
    "slidesk-link-url": {
      type: "string",
      default: "https://slidesk.link",
    },
  })
  .addSubcommands([
    pluginInstallCmd,
    pluginRemoveCmd,
    pluginUpdateCmd,
    pluginPushCmd,
    pluginSearchCmd,
  ]);

export default pluginCmd;
