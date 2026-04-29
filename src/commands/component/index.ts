import { Clipse } from "clipse";
import componentInstallCmd from "./install";
import componentPushCmd from "./push";
import componentRemoveCmd from "./remove";
import componentSearchCmd from "./search";
import componentUpdateCmd from "./update";

const componentCmd = new Clipse("component", "slidesk component management");
componentCmd
  .addGlobalOptions({
    "slidesk-link-url": {
      type: "string",
      default: "https://slidesk.link",
    },
  })
  .addSubcommands([
    componentInstallCmd,
    componentRemoveCmd,
    componentUpdateCmd,
    componentSearchCmd,
    componentPushCmd,
  ]);

export default componentCmd;
