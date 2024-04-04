import envVariables from "./envVariables";
import grammar from "./grammar";
import links from "./links";

const formatting = (data) =>
  [...data.split("\n")].map((l) => grammar(envVariables(links(l)))).join("\n");

export default formatting;
