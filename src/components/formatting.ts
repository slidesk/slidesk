import envVariables from "./envVariables";
import grammar from "./grammar";
import links from "./links";

const formatting = (data: string, env: any) =>
  [...data.split("\n")]
    .map((l) => grammar(envVariables(links(l), env)))
    .join("\n");

export default formatting;
