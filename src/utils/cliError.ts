const { error } = console;

/** A failure to report to the user: its message is printed and the CLI exits with 1. */
export class CliError extends Error {}

/** Runs a command and returns its exit code, printing a CliError instead of throwing it. */
export const runCommand = async (command: () => Promise<void>) => {
  try {
    await command();
    return 0;
  } catch (e) {
    if (!(e instanceof CliError)) throw e;
    error(e.message);
    return 1;
  }
};
