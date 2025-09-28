import { Clipse } from "clipse";
import componentInstallCmd from "./component/install";
import componentPushCmd from "./component/push";
import componentRemoveCmd from "./component/remove";
import componentSearchCmd from "./component/search";
import componentUpdateCmd from "./component/update";

const componentCmd = new Clipse("component", "slidesk component management");
componentCmd.addSubcommands([
  componentInstallCmd,
  componentRemoveCmd,
  componentUpdateCmd,
  componentSearchCmd,
  componentPushCmd,
]);

export default componentCmd;
