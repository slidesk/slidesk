import { Clipse } from "clipse";
import themeInstallCmd from "./theme/install";
import themePushCmd from "./theme/push";
import themeRemoveCmd from "./theme/remove";
import themeSearchCmd from "./theme/search";
import themeUpdateCmd from "./theme/update";

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
