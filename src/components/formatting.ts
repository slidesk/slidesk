import envVariables from "./envVariables";

const formatting = (data: string, env: any) =>
  [...data.split("\n")].map((l) => envVariables(l, env)).join("\n");

export default formatting;
