# Usage

SliDesk has many subcommands and options.

```sh
slidesk -h
```

will render something like:

```
 ____(•)<
(SliDesk) v:2.16.5

slidesk 2.16.5
Your presentation companion

Usage: slidesk [options] [arguments]

Subcommands:
  create      tool to help you to instanciate a talk
  plugin      slidesk plugin management
  component   slidesk component management
  link        command to interact with slidesk.link
  template    slidesk template management
  theme       slidesk theme management
  deploy      create a deploy file for your presentation
  save        save your prensentation into a html & assets
  present     serve your presentation

Options:
  -h, --help                show help
  -v, --version             show version

Arguments:
  talk  directory of your talk
```

The `talk` argument is a directory containing your `main.sdf` or `main.md` file. If not specified, SliDesk uses the current directory.

## Subcommands overview

| Command | Description |
|---------|-------------|
| `present` (default) | Convert and serve your presentation with live reload |
| `create` | Scaffold a new talk directory |
| `save` | Export presentation as static HTML + assets |
| `deploy` | Generate CI/CD files for GitHub, GitLab, or slidesk.link |
| `link` | Interact with the slidesk.link hub (login, host, push) |
| `plugin` | Install, update, remove, search, and push plugins |
| `component` | Install, update, remove, search, and push components |
| `template` | Install, update, remove, search, and push templates |
| `theme` | Install, update, remove, search, and push themes |

## Present options

```bash
slidesk present -h

Options:
  -h, --help           show help
  -v, --version        show version
  -n, --notes <param>  open with speakers notes  (default: notes.html)
  -g, --hidden         remove help information  (default: false)
  -c, --conf <param>   use a specific slidesk.toml file  (default: )
  -o, --open           open a browser with the presentation or notes view  (default: false)
  -l, --lang <param>   specify the language version (per default, it will use the .lang.json file with default information)  (default: )
  -t, --telnet         serve a telnet version  (default: false)

Arguments:
  talk  directory of your talk
```

## Common option patterns

The most frequently used option is `-n`, which enables the Speaker view. Combined with `-t`, you get both the speaker view and a telnet server:

```sh
slidesk -tn my-talk
```

This combines `-t` (telnet) and `-n` (notes).

Since `present` is the default subcommand, you can omit it:

```sh
slidesk -tn my-talk         # same as: slidesk present -tn my-talk
slidesk -no my-talk         # speaker notes + auto-open browser
slidesk -g my-talk          # hide terminal help info
slidesk -l fr my-talk       # present in French
slidesk -c custom.toml my-talk  # use a custom config file
```
