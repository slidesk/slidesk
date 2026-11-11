# upgrade

Upgrade SliDesk to its latest [release](https://github.com/slidesk/slidesk/releases).

```sh
slidesk upgrade
```

- installed with Homebrew: runs `brew upgrade gouz/tools/slidesk`;
- a Linux or macOS binary (including the `.deb` one): downloads the release binary and replaces the running one. When it is not writable, as `/usr/bin/slidesk` is, run `sudo slidesk upgrade`;
- Windows: download `slidesk_windows.zip` from the release;
- `bunx slidesk` already runs the latest release with `bunx slidesk@latest`;
- Docker: `docker pull gouz/slidesk:latest`.

To update the addons of a talk, see [`update`](update.md).
