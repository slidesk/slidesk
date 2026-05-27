# CLI overview

```
slidesk [options] [arguments]

Subcommands:
  create      scaffold a new talk
  plugin      plugin management
  component   component management
  link        interact with slidesk.link
  template    template management
  theme       theme management
  deploy      create CI/CD deploy files
  save        export presentation as HTML + assets
  present     serve your presentation (default)

Options:
  -h, --help                show help
  -v, --version             show version
  --slidesk-link-url <url>  custom hub URL (default: https://slidesk.link)

Arguments:
  talk  directory of your talk
```

The `talk` argument is a directory containing `main.sdf` or `main.md`. If omitted, SliDesk uses the current directory.

`present` is the default subcommand — you can omit it:

```sh
slidesk my-talk              # same as: slidesk present my-talk
slidesk -tn my-talk          # present with telnet + notes
```
