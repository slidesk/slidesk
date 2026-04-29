export default async function checkVersion(currentVersion: string) {
  const { warn, error } = console;
  try {
    const github = await fetch(
      "https://api.github.com/repos/slidesk/slidesk/releases/latest",
      {
        signal: AbortSignal.timeout(2000), // wait at least 2 seconds before aborting
      },
    );
    if (github.ok) {
      const data = await github.json();
      if (data.tag_name !== currentVersion) {
        const message = {
          version: `SliDesk is out of date! Please update to ${data.tag_name}`,
        };
        warn({ message });
      }
    }
  } catch (e) {
    // no connection
    error(e);
  }
}
