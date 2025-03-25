import envVariables from "./envVariables";

const formatting = (data: string, env: { [key: string]: string }) =>
  [...data.split("\n")].map((l) => envVariables(l, env)).join("\n");

export default formatting;
