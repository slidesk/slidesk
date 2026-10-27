// the alt text and paths go into attributes: a quote must not end them
const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");

export default function image(data: string) {
  // up to the first ")": two images on one line stay two images; a function
  // replacement keeps "$$" or "$&" of the talk as written
  return data.replaceAll(/!image\(([^)\n]*)\)/g, (_, args: string) => {
    const [src, alt, width, height, optionals, caption] = args.split(",");
    let classc = "";
    if (
      optionals?.trim().indexOf("[") !== -1 ||
      optionals?.trim().indexOf(" ") === -1
    )
      classc = optionals?.trim().replace("[", "").replace("]", "") || "";
    const text = escapeHtml(alt?.trim() ?? "");
    return `<figure class="sd-img ${escapeHtml(classc)}"${
      optionals && classc === "" && optionals.trim() !== ""
        ? ` style="${escapeHtml(optionals)}"`
        : ""
    } >
        <img data-src="${escapeHtml(src.trim())}" alt="${text}"${
          width && width.trim() !== ""
            ? ` width="${escapeHtml(width.trim())}"`
            : ""
        }${height && height.trim() !== "" ? ` height="${escapeHtml(height.trim())}"` : ""} />
        <figcaption ${caption?.trim() === "true" ? "" : "style='display: none;'"}>${text}</figcaption>
      </figure>`;
  });
}
