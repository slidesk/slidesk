export const decodeComments = (content) =>
  atob(content)
    .replaceAll(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .split("<br/>")
    .join("\n");

export const encodeComments = (content) =>
  btoa(
    encodeURIComponent(
      content
        .replaceAll(
          /[&<>"'` !@$%()=+{}[\]]/g,
          (match) => `&#${match.codePointAt(0)};`,
        )
        .split("\n")
        .join("<br/>"),
    ).replaceAll(/%([a-f0-9]{2})/gi, (_, $1) =>
      String.fromCodePoint(Number.parseInt($1, 16)),
    ),
  );
