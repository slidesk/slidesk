import { existsSync, readdirSync } from "node:fs";
import { CliError } from "./cliError";

/** The themes of a talk, sorted, or only the one chosen with --theme, which must exist. */
export const themeNames = (sdfPath: string, theme?: string) => {
  const dir = `${sdfPath}/themes`;
  const all = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort((a, b) => a.localeCompare(b))
    : [];
  if (!theme) return all;
  if (!all.includes(theme))
    throw new CliError(
      `theme ${theme} not found${all.length ? ` (available: ${all.join(", ")})` : ""}`,
    );
  return [theme];
};

/** Whether `file`, relative to themes/, belongs to the chosen theme (all do without --theme). */
export const inTheme = (file: string, theme?: string) =>
  !theme || file.startsWith(`${theme}/`);
