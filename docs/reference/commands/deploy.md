# deploy

Generate CI/CD configuration files for publishing your presentation.

```sh
slidesk deploy -t github mytalk
slidesk deploy -t gitlab mytalk
slidesk deploy -t link mytalk
```

## Options

```
  -t, --target <param>      'github', 'gitlab' or 'link'
  -f, --force               overwrite the deploy file if it already exists
  -T, --theme <name>        build with only this theme, when the talk has several
```

With `--theme`, the generated GitHub or GitLab file builds the talk with `slidesk save -T <name>`, see [`--theme`](../options/theme.md). The theme must exist in `themes/`.

An existing `.github/workflows/slidesk.yml`, `.gitlab-ci.yml` or `link.yml` is kept unless you pass `--force`.
