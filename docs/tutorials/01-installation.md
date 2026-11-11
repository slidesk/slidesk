# Installation

SliDesk can be installed in several ways. Choose the one that suits you best.

## Homebrew (macOS / Linux)

```sh
brew tap gouz/tools && brew install slidesk
```

or

```sh
brew install gouz/tools/slidesk
```

## Bun (any platform)

SliDesk is built with [Bun](https://bun.sh). If you do not have Bun yet:

```sh
curl -fsSL https://bun.sh/install | bash
```

Then use SliDesk directly:

```sh
bunx slidesk
```

## Windows

Download `slidesk_windows.zip` from the [releases page](https://github.com/slidesk/slidesk/releases), unzip it and put `slidesk.exe` in a directory of your `PATH`.

## Debian / Ubuntu

Download the `.deb` file from the [releases page](https://github.com/slidesk/slidesk/releases).

## Docker

SliDesk is also available as a Docker image (`gouz/slidesk`):

```sh
# Present a talk from the current directory
docker run -it -v "$(pwd)"/:/slidesk/ -p 1337:1337 gouz/slidesk:latest slidesk

# Create a new talk
docker run -it -v "$(pwd)"/:/slidesk/ gouz/slidesk:latest slidesk create my-talk

# Export as static site
docker run -it -v "$(pwd)"/:/slidesk/ gouz/slidesk:latest slidesk save my-talk
```

SliDesk is now accessible at http://localhost:1337.

## Upgrade

SliDesk warns you when a newer release is out. To get it:

```sh
slidesk upgrade
```

It runs `brew upgrade` for Homebrew, and replaces the binary for Linux, macOS and the `.deb` one (`sudo slidesk upgrade` when it is in `/usr/bin`). With Bun, `bunx slidesk@latest` runs the latest release; with Docker, pull `gouz/slidesk:latest`; on Windows, download the new `slidesk_windows.zip`. See [`upgrade`](../reference/commands/upgrade.md).
