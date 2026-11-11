/** The tag of the latest SliDesk release on GitHub, "" when it cannot be read. */
export const latestVersion = async (timeout = 500) => {
  const github = await fetch(
    "https://api.github.com/repos/slidesk/slidesk/releases/latest",
    { signal: AbortSignal.timeout(timeout) },
  );
  if (!github.ok) return "";
  const data = await github.json();
  // the tag comes from the network: keep version characters only
  return String(data.tag_name ?? "").replaceAll(/[^\w.+-]/g, "");
};

export default async function checkVersion(currentVersion: string) {
  const { warn } = console;
  try {
    const latest = await latestVersion();
    if (latest && Bun.semver.order(latest, currentVersion) > 0) {
      warn(`SliDesk is out of date! Run \`slidesk upgrade\` to get ${latest}`);
    }
  } catch {
    // no connection
  }
}
