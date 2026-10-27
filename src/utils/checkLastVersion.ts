export default async function checkVersion(currentVersion: string) {
  const { warn } = console;
  try {
    const github = await fetch(
      "https://api.github.com/repos/slidesk/slidesk/releases/latest",
      {
        signal: AbortSignal.timeout(500),
      },
    );
    if (github.ok) {
      const data = await github.json();
      // the tag comes from the network: keep version characters only
      const latest = String(data.tag_name ?? "").replaceAll(/[^\w.+-]/g, "");
      if (latest && Bun.semver.order(latest, currentVersion) > 0) {
        warn(`SliDesk is out of date! Please update to ${latest}`);
      }
    }
  } catch {
    // no connection
  }
}
