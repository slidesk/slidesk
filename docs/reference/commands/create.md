# create

Scaffold a new talk directory.

```sh
slidesk create mytalk
```

Prompts for a title and optional custom CSS.

## Generated structure

```
mytalk/
├── main.md            # your slides in Markdown
├── slidesk.toml       # optional config file
├── custom.css         # optional, only if you answered yes
├── slides/            # slide fragments (referenced via !include)
├── themes/
│   └── default/
│       └── theme.css
└── templates/         # .sdt template files
```
