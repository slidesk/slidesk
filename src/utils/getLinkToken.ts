import { homedir } from "node:os";
import { CliError } from "./cliError";

const getLinkToken = async () => {
  const slideskTokenFile = Bun.file(`${homedir()}/.slidesk`);
  if (!(await slideskTokenFile.exists()))
    throw new CliError("You must be logged, use 'slidesk link login' first.");
  const slideskToken = await slideskTokenFile.text();
  if (slideskToken === "")
    throw new CliError(
      "Your token is corrupted, use 'slidesk link login --force' first.",
    );
  return slideskToken;
};

export default getLinkToken;
