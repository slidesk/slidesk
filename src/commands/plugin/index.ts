import { Clipse } from "clipse";
import pluginInstallCmd from "./install";
import pluginPushCmd from "./push";
import pluginRemoveCmd from "./remove";
import pluginSearchCmd from "./search";
import pluginUpdateCmd from "./update";

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
