import { TOML } from "bun";

const flattenKeys = (
  obj: Record<string, unknown>,
  prefix = "",
): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return path;
  });

export const getVariables = async (talkdir: string): Promise<string[]> => {
  const tomlFile = Bun.file(`${talkdir}/slidesk.toml`);
  if (!(await tomlFile.exists())) return [];
  const parsed = TOML.parse(await tomlFile.text()) as Record<string, unknown>;
  return flattenKeys(parsed);
};

export const saveVariable = async (talkdir: string, name: string) => {
  const tomlFile = Bun.file(`${talkdir}/slidesk.toml`);
  let content = "";
  if (await tomlFile.exists()) {
    content = await tomlFile.text();
    const parsed = TOML.parse(content) as Record<string, unknown>;
    if (name in parsed) return;
  }
  await Bun.write(tomlFile, `${content}\n${name}=""\n`);
};
