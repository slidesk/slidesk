import type { SliDeskEnv } from "../types";

const getByPath = (env: SliDeskEnv, path: string) =>
  path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc !== null && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      env,
    );

/**
 * Replaces `++KEY++` / `++section.KEY++` with its value from slidesk.toml.
 * Only a key name is replaced, so `C++ vs C++` or `i++; j++` stay as they are;
 * a key missing from the configuration is left visible, with a warning.
 */
const envVariables = (data: string, env: SliDeskEnv) =>
  data.replaceAll(/\+\+([A-Za-z_]\w*(?:\.\w+)*)\+\+/g, (match, key) => {
    const value = getByPath(env, key);
    if (value !== undefined) return String(value);
    console.warn(`⚠️  ${match} is not set in the configuration`);
    return match;
  });

export default envVariables;
