export default function image(data) {
  let newData = data;
  [...newData.matchAll(/!image\((.*)\)/g)].forEach((match) => {
    const opts = [...match[1].split("|")];
    const file = opts[0].trim();
    newData = newData.replace(
      match[0],
      `<img src="${file}" ${
        opts.length > 1 ? opts[1].trim() : ""
      } loading="lazy" ${
        file.toLowerCase().endsWith(".gif") ? 'data-gif="1"' : ""
      } />`,
    );
  });
  return newData;
}
