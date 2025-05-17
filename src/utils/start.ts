import { platform } from "node:process";
const start = () =>
  platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";

export default start;
