export default (text: string): { [key: string]: string } => {
  const result: { [key: string]: string } = {};
  const regex = /<p>\[\[(\w+)\]\]<\/p>(.|\n)*?<p>\[\[(\/\1)\]\]<\/p>/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  while ((m = regex.exec(text)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    result[m[1]] = m[0]
      .replace(`<p>[[${m[1]}]]</p>`, "")
      .replace(`<p>[[/${m[1]}]]</p>`, "");
  }
  return result;
};
