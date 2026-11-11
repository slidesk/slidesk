export default function comments(data: string) {
  let newData = data;
  [...newData.matchAll(/\n\/\*([^*]|(\*+[^*/]))*\n\*\//gm)].forEach(
    (match, _) => {
      newData = newData.replace(
        match[0],
        // base64 of the UTF-8 html, decoded by the speaker view
        `<aside class="sd-notes">${Buffer.from(
          Bun.markdown.html(match[0].replace("/*", "").replace("*/", ""), {
            tables: true,
            strikethrough: true,
            tasklists: true,
            autolinks: true,
            headings: true,
            underline: true,
            latexMath: true,
          }),
        ).toString("base64")}</aside>`,
      );
    },
  );
  return newData;
}
