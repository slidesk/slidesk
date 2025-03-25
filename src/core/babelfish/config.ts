import type { SliDeskConfig } from "../../types";

export default (data: string) => {
  const lines = [...data.split("\n")].filter((l) => l.length);
  const config: SliDeskConfig = {
    customCSS: "",
    customIncludes: { css: [], js: [] },
  };
  lines.forEach((line, _) => {
    if (line.startsWith("custom_css:"))
      config.customCSS = `<link rel="stylesheet" href="${line
        .replace("custom_css:", "")
        .trim()}" />`;
    if (line.startsWith("add_styles:"))
      config.customIncludes.css = [
        ...line.replace("add_styles:", "").split(","),
      ].map((n) => `<link rel="stylesheet" href="${n.trim()}" />`);
    if (line.startsWith("add_scripts:"))
      config.customIncludes.js = [
        ...line.replace("add_scripts:", "").split(","),
      ].map((n) => `<script src="${n.trim()}"></script>`);
  });
  return config;
};
