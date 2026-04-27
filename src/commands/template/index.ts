import { Clipse } from "clipse";
import templateInstallCmd from "./install";
import templatePushCmd from "./push";
import templateRemoveCmd from "./remove";
import templateSearchCmd from "./search";
import templateUpdateCmd from "./update";

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
