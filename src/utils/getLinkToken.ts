import { homedir } from "node:os";

const { error } = console;

export default async () => {
  const slideskTokenFile = Bun.file(`${homedir()}/.slidesk`);
  if (!(await slideskTokenFile.exists())) {
    error("You must be logged, use 'slidesk link login' first.");
    process.exit(1);
  }
  const slideskToken = await slideskTokenFile.text();
  if (slideskToken === "") {
    error("Your token is corrupted, use 'slidesk link login --force' first.");
    process.exit(1);
  }
  return slideskToken;
};
