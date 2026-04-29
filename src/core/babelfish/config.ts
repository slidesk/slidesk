import type { SliDeskConfig } from "../../types";

const config = (data: string) => {
  const lines = data.split("\n").filter((l) => l.length);
  const config: SliDeskConfig = { css: [], js: [] };
  lines.forEach((line, _) => {
    if (line.startsWith("add_styles:"))
      config.css = line
        .replace("add_styles:", "")
        .split(",")
        .map((n) => `<link rel="stylesheet" href="${n.trim()}" />`);
    if (line.startsWith("add_scripts:"))
      config.js = line
        .replace("add_scripts:", "")
        .split(",")
        .map((n) => `<script src="${n.trim()}"></script>`);
  });
  return config;
};

export default config;
