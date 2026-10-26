import type { SliDeskEnv } from "../types";
import envVariables from "./envVariables";

const formatting = (data: string, env: SliDeskEnv) =>
  data
    .split("\n")
    .map((l) => envVariables(l, env))
    .join("\n");

export default formatting;
