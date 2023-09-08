import chalk from "chalk";
import packagejson from "../../package.json";

const joliTitle = chalk.hex("#16cedd");

const displayHeader = () =>
  joliTitle(`
░██████╗██╗░░░░░██╗██████╗░███████╗░██████╗██╗░░██╗
██╔════╝██║░░░░░╚═╝██╔══██╗██╔════╝██╔════╝██║░██╔╝
╚█████╗░██║░░░░░██║██║░░██║█████╗░░╚█████╗░█████═╝░
░╚═══██╗██║░░░░░██║██║░░██║██╔══╝░░░╚═══██╗██╔═██╗░
██████╔╝███████╗██║██████╔╝███████╗██████╔╝██║░╚██╗
╚═════╝░╚══════╝╚═╝╚═════╝░╚══════╝╚═════╝░╚═╝░░╚═╝
                                            v${packagejson.version}
`);

export default displayHeader;
