export default async function checkVersion(currentVersion) {
  const { log } = console;
  try {
    const github = await fetch(
      "https://api.github.com/repos/slidesk/slidesk/releases/latest",
      {
        signal: AbortSignal.timeout(2000),
      },
    );
    if (github.ok) {
      const data = await github.json();
      if (data.tag_name !== currentVersion) {
        log(`SliDesk is out of date! Please update to ${data.tag_name}`);
      }
    }
  } catch (_) {
    // no connection
  }
}
