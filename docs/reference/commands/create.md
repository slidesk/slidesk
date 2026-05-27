# create

Scaffold a new talk directory.

```sh
slidesk create mytalk
```

Prompts for a title, then scaffolds the talk directory and auto-installs the `@gouz/split` template for multi-column layouts.

## Generated structure

```
mytalk/
├── main.md            # your slides in Markdown
├── slidesk.toml       # optional config file
├── slides/            # slide fragments (referenced via !include)
├── themes/
│   └── default/
│       └── theme.css
└── templates/         # .sdt template files
```
