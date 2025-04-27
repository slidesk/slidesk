import { Clipse } from "clipse";
import componentInstallCmd from "./component/install";
import componentRemoveCmd from "./component/remove";
import componentUpdateCmd from "./component/update";
import componentListCmd from "./component/list";

const componentCmd = new Clipse("component", "slidesk component management");
componentCmd.addSubcommands([
  componentInstallCmd,
  componentRemoveCmd,
  componentUpdateCmd,
  componentListCmd,
]);

export default componentCmd;
