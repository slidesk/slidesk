# Create a talk

SliDesk needs a `main.sdf` or `main.md` file to present. Use the `create` command to scaffold a new talk directory.

```sh
slidesk create mytalk
```

SliDesk will prompt you:

> What is the title of talk?

Enter your talk title (e.g. "My Awesome Talk").

> Do you want to customize the presentation? [yN]

Answer **y** to also generate a `custom.css` file for styling.

## Generated structure

Running `slidesk create mytalk` produces:

```
mytalk/
├── main.sdf           # your slides in SliDesk Format (Markdown)
├── slidesk.toml       # optional config file
├── custom.css         # optional, only if you answered yes
├── slides/            # slide fragments (referenced via !include)
├── themes/
│   └── default/
│       └── theme.css
└── templates/         # .sdt template files
```

## Manual creation

You can also write `main.sdf` from scratch:

```markdown

## First Slide

# My Talk Title

Welcome to my presentation!

## Second Slide

- Point 1
- Point 2
```

Then run `slidesk` in that directory:

```sh
slidesk mytalk
```
