import { existsSync, readdirSync } from "node:fs";

export default (sdfPath: string) => {
  const componentsDir = `${sdfPath}/components`;
  const components: string[] = [];
  if (existsSync(componentsDir)) {
    components.push(
      ...readdirSync(componentsDir)
        .filter((item) => /.mjs$/gi.test(item))
        .map((c) => `${componentsDir}/${c}`),
    );
  }
  if (existsSync(`${sdfPath}themes`)) {
    const themes = readdirSync(`${sdfPath}themes`, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const t of themes) {
      if (existsSync(`${sdfPath}themes/${t}/components`))
        components.push(
          ...readdirSync(`${sdfPath}themes/${t}/components`)
            .filter((item) => /.mjs$/gi.test(item))
            .map((c) => `${sdfPath}themes/${t}/components/${c}`),
        );
    }
  }
  return components;
};
