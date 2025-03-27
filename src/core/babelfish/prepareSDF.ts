import type { SliDeskConfig } from "../../types";
import config from "./config";
import includes from "./includes";

export default async (mainFile: string) => {
  let fusion = await includes(mainFile);
  let configuration: SliDeskConfig = {
    customCSS: "",
    customIncludes: { css: [], js: [] },
  };
  // get Custom configuration
  const m = /\/::([\s\S]*)::\//m.exec(fusion);
  if (m !== null) {
    fusion = fusion.replace(m[0], "");
    configuration = config(m[1]);
  }
  return { config: configuration, content: fusion };
};
