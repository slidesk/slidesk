import envVariables from "./envVariables";
import grammar from "./grammar";
import links from "./links";

const formatting = (data) =>
  [...data.split("\n")]
    .map((l) => {
      let nl = l;
      nl = grammar(nl);
      nl = envVariables(nl);
      nl = links(nl);
      return nl;
    })
    .join("\n");

export default formatting;
