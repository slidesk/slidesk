const replaceAsync = async (
  str: string,
  regex: RegExp,
  asyncFn: (_: string, ...args: object[]) => Promise<string>,
): Promise<string> => {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
    return "";
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift() ?? "");
};

export default replaceAsync;
