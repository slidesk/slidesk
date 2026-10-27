import { platform } from "node:process";

const { log } = console;

// `start` is a cmd builtin, not a program Bun can spawn
export const opener = (os: string = platform) => {
  switch (os) {
    case "darwin":
      return ["open"];
    case "win32":
      return ["rundll32", "url.dll,FileProtocolHandler"];
    default:
      return ["xdg-open"];
  }
};

/** Opens `url` in the default browser; without one (a server, SSH), says where to go. */
const openUrl = (url: string) => {
  try {
    Bun.spawn([...opener(), url], { stdout: "ignore", stderr: "ignore" });
  } catch {
    log(`Open ${url} in your browser`);
  }
};

export default openUrl;
