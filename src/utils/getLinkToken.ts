import { chmod } from "node:fs/promises";
import { homedir } from "node:os";
import { CliError } from "./cliError";

const tokenFile = () => `${homedir()}/.slidesk`;

/** Stores the slidesk.link token, readable by its owner only. */
export const saveLinkToken = async (token: string, path = tokenFile()) => {
  await Bun.write(path, token);
  await chmod(path, 0o600);
};

const getLinkToken = async (path = tokenFile()) => {
  const slideskTokenFile = Bun.file(path);
  if (!(await slideskTokenFile.exists()))
    throw new CliError("You must be logged, use 'slidesk link login' first.");
  // tokens stored by older versions were readable by every user
  await chmod(path, 0o600);
  const slideskToken = await slideskTokenFile.text();
  if (slideskToken === "")
    throw new CliError(
      "Your token is corrupted, use 'slidesk link login --force' first.",
    );
  return slideskToken;
};

export default getLinkToken;
