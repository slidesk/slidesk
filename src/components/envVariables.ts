const envVariables = (data: string, env: { [key: string]: string }) => {
  const splitted = [...data.split("++")];
  if (splitted.length % 2 && splitted.length > 1)
    return splitted
      .map((t, i) => {
        if (i % 2) return env[t] ?? "";
        return t;
      })
      .join("");
  return data;
};

export default envVariables;
