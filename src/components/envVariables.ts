const getByPath = (obj: Record<string, unknown>, path: string): string => {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  if (value === undefined) return "";
  return value as string;
};

const envVariables = (data: string, env: object) => {
  const splitted = data.split("++");
  if (splitted.length % 2 && splitted.length > 1)
    return splitted
      .map((t, i) => {
        if (i % 2) return getByPath(env as Record<string, unknown>, t);
        return t;
      })
      .join("");
  return data;
};

export default envVariables;
