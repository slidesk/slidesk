import chalk from "chalk";

export default async (markdown: string) => {
  let conv = markdown;
  const replacer = (_: string, _p1: string, p2: string) => {
    return `::img::${btoa(p2)}::`;
  };
  conv = conv.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, replacer);
  conv = conv.replace(/# (.+)/g, chalk.bold.underline("$1"));
  conv = conv.replace(/_([^_]+)_/g, chalk.italic("$1"));
  conv = conv.replace(/\*\*(.+?)\*\*/g, chalk.bold("$1"));
  conv = conv.replace(/##/g, "");
  conv = conv.replace(/\\/g, "");
  return conv;
};
