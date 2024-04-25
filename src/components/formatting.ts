import envVariables from "./envVariables";
import links from "./links";

const formatting = (data: string, env: any) =>
  [...data.split("\n")].map((l) => envVariables(links(l), env)).join("\n");

export default formatting;
