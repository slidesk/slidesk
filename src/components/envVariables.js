const envVariables = (data) => {
  const splitted = [...data.split("++")];
  if (splitted.length % 2 && splitted.length > 1)
    return splitted
      .map((t, i) => {
        if (i % 2) return (globalThis.env && globalThis.env[t]) || "";
        return t;
      })
      .join("");
  return data;
};

export default envVariables;
