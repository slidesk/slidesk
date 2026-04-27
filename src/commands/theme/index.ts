import { Clipse } from "clipse";
import themeInstallCmd from "./install";
import themePushCmd from "./push";
import themeRemoveCmd from "./remove";
import themeSearchCmd from "./search";
import themeUpdateCmd from "./update";

const themeCmd = new Clipse("theme", "slidesk theme management");
themeCmd
  .addGlobalOptions({
    "slidesk-link-url": {
      type: "string",
      default: "https://slidesk.link",
    },
  })
  .addSubcommands([
    themeInstallCmd,
    themeRemoveCmd,
    themeUpdateCmd,
    themeSearchCmd,
    themePushCmd,
  ]);

export default themeCmd;
