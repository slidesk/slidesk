import { platform } from "node:process";

const start = () => {
  switch (platform) {
    case "darwin":
      return "open";
    case "win32":
      return "start";
    default:
      return "xdg-open";
  }
};

export default start;
