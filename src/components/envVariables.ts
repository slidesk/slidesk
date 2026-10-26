import type { SliDeskEnv } from "../types";

const getByPath = (env: SliDeskEnv, path: string) => {
  const value = path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc !== null && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      env,
    );
  return value === undefined ? "" : String(value);
};

const envVariables = (data: string, env: SliDeskEnv) => {
  const splitted = data.split("++");
  if (splitted.length % 2 && splitted.length > 1)
    return splitted.map((t, i) => (i % 2 ? getByPath(env, t) : t)).join("");
  return data;
};

export default envVariables;
