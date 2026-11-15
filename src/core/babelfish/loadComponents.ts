import { existsSync, readdirSync } from "node:fs";
import { themeNames } from "../../utils/themes";

const loadComponents = (sdfPath: string, theme?: string) => {
  const componentsDir = `${sdfPath}/components`;
  const components: string[] = [];
  if (existsSync(componentsDir)) {
    components.push(
      ...readdirSync(componentsDir)
        .filter((item) => /.mjs$/gi.test(item))
        .map((c) => `${componentsDir}/${c}`),
    );
  }
  for (const t of themeNames(sdfPath, theme)) {
    if (existsSync(`${sdfPath}/themes/${t}/components`))
      components.push(
        ...readdirSync(`${sdfPath}/themes/${t}/components`)
          .filter((item) => /.mjs$/gi.test(item))
          .map((c) => `${sdfPath}/themes/${t}/components/${c}`),
      );
  }
  return components;
};

export default loadComponents;
