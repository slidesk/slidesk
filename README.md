# SliDesk

<p align="center">
<img src="https://github.com/gouz/slidesk/assets/219936/5cdc9f5c-1b9c-4a9a-9a7f-124043dee8d5" />
</p>

<p align="center">A complete documentation is available here: https://slidesk.github.io/slidesk-doc/</p>

Write your talk/presentation in Markdown, generate it and visualize it in Web.

SliDesk is a new talk engine like RevealJS developped with [Bun](https://bun.sh).

The `example` rendering is visible on [slidesk.github.io/slidesk/](https://slidesk.github.io/slidesk/).

Plugins & Components can be found here : https://github.com/slidesk/slidesk-extras

A VSCode extension is available too : https://github.com/slidesk/vscode-sdf-language

## How to use?

### macOS with **Homebrew**

#### Installation

```sh
brew tap gouz/tools && brew install slidesk
```

or

```sh
brew install gouz/tools/slidesk
```

### Docker

Slidesk now has a DockerHub repository ! https://hub.docker.com/r/gouz/slidesk

To use it with your current working directory as your slidesk directory

```sh
docker run -it -v "$(pwd)"/:/slidesk/ -p 1337:1337 gouz/slidesk:latest
```

Slidesk is now accessible through http://localhost:1337. If you need additional arguments, specify them after specifying the slidesk binary.
Example :

```sh
docker run -it -v "$(pwd)"/:/slidesk/ -p 1337:1337 gouz/slidesk:latest slidesk -tn
```

### Other systems

If you want to compile **SliDesk**, you must have **Bun** installed on your computer.

If not, you can install it through:

```sh
curl -fsSL https://bun.sh/install | bash
```

Then you can use it through:

```sh
Usage: bunx slidesk [options] [command] <talk>

Your presentation companion

Arguments:
  talk                     the directory of your talk

Options:
  -v, --version            output the version number
  -d, --domain <string>    domain (default: "localhost")
  -p, --port <int>         port (default: 1337)
  -s, --save <path>        save the presentation
  -n, --notes              open with speakers notes
  -t, --timers             add checkpoint and slide maximum time on notes view
  -a, --transition <int>   transition timer (default: 300)
  -w, --watch              watch modification of files
  -g, --hidden             remove help information
  -c, --conf <name>        use a specific .env file (default: "")
  -o, --open               open a browser with the presentation or notes view
  -h, --help               display help for command

Commands:
  create <talk>
```

## How to build SliDesk?

Once you clone the repository, you can install the dependencies with:

```sh
bun install
```

And create the "exe" file with:

```sh
bun make:exe
```

Then you'll have a `exe/slidesk` file created.

You can also use Gitpod :

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/slidesk/slidesk/-/tree/main/)

## Why a new tool???

I decided to create my own tool for my talks, because:

- It's fun to create something
- I want to have a tool which do only the minimum
- I want a very tiny light tool
- I want it to be permissive a lot (you can add html tags in without any problem)
