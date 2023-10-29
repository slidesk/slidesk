export default function list(data, level) {
  const lists = [];
  const subs = [];
  [...data.split("\n")].forEach((line) => {
    const reg = new RegExp(`^[-]{${level}} `, "m");
    if (line.match(reg)) {
      if (subs.length) {
        lists.push(list(subs.join("\n"), level + 1));
        subs.splice(0, subs.length);
      }
      lists.push(`<li>${line.replace(reg, "")} </li>`);
    } else if (line !== "") subs.push(line);
  });
  if (subs.length) {
    lists.push(list(subs.join("\n"), level + 1));
  }
  return `<ul>${lists.join("")}</ul>`;
}
