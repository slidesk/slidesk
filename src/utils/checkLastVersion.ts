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
      if (Bun.semver.order(data.tag_name, currentVersion) > 0) {
        const message = {
          version: `SliDesk is out of date! Please update to ${data.tag_name}`,
        };
        warn({ message });
      }
    }
  } catch {
    // no connection
  }
}
