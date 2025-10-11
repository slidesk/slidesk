import { Clipse } from "clipse";
import templateInstallCmd from "./template/install";
import templatePushCmd from "./template/push";
import templateRemoveCmd from "./template/remove";
import templateSearchCmd from "./template/search";
import templateUpdateCmd from "./template/update";

const templateCmd = new Clipse("template", "slidesk template management");
templateCmd
  .addGlobalOptions({
    "slidesk-link-url": {
      type: "string",
      default: "https://slidesk.link",
    },
  })
  .addSubcommands([
    templateInstallCmd,
    templateRemoveCmd,
    templateUpdateCmd,
    templateSearchCmd,
    templatePushCmd,
  ]);

export default templateCmd;
